using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace StartGgFetcher
{
    public class ExtractedPlayer
    {
        public string name { get; set; } = "";
        public string slug { get; set; } = "";
        /// <summary>start.gg user id, when the entrant has a linked account.</summary>
        public string? userId { get; set; }
        public string team { get; set; } = "";
        public string country { get; set; } = "";
        public string avatar { get; set; } = "";
        public PlayerSocials socials { get; set; } = new PlayerSocials();
    }

    public class PlayerSocials
    {
        public string? twitter { get; set; }
        public string? twitch { get; set; }
        public string? youtube { get; set; }
        public string? discord { get; set; }
    }

    /// <summary>Thrown when start.gg rejects the API key; aborts the run without writing files.</summary>
    public class AuthException : Exception
    {
        public AuthException(string message) : base(message) { }
    }

    public static class Slugs
    {
        /// <summary>
        /// The ONE slug rule for players. The UI never computes its own slug when one
        /// is present in the data (players.json "slug", entrant "playerSlug").
        /// Strips the sponsor prefix ("PND | Strykie" -> "Strykie"), removes accents,
        /// keeps a-z 0-9 _ -, collapses spaces/dashes. Mirrored in shared/utils/player-slug.js.
        /// </summary>
        public static string ForPlayer(string? name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "";
            string tag = name.Contains('|') ? name.Split('|').Last() : name;
            string folded = RemoveDiacritics(tag.Trim().ToLowerInvariant());
            string cleaned = Regex.Replace(folded, @"[^a-z0-9_\s-]", "");
            cleaned = Regex.Replace(cleaned, @"\s+", "-");
            cleaned = Regex.Replace(cleaned, @"-+", "-");
            return cleaned.Trim('-');
        }

        private static string RemoveDiacritics(string s)
        {
            var sb = new StringBuilder(s.Length);
            foreach (var c in s.Normalize(NormalizationForm.FormD))
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark) sb.Append(c);
            return sb.ToString().Normalize(NormalizationForm.FormC);
        }
    }

    class Program
    {
        private static readonly HttpClient HttpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(60) };
        private const string StartGgApiUrl = "https://api.start.gg/gql/alpha";

        // ---------------------------------------------------------------------
        // Tournament discovery. A tournament is fetched if it is found by ANY of:
        //   1. TargetTournamentSlugs  - fixed list, for third-party events whose names
        //                               contain none of the search terms (e.g. Drowning Pools)
        //   2. NameSearchTerms        - start.gg tournament-name search (every page)
        //   3. OrganizerOwnerIds      - every tournament owned by these start.gg accounts
        // Which events are kept is decided by IsCommunityTournament / ShouldKeepEvent.
        // ---------------------------------------------------------------------

        private static readonly string[] TargetTournamentSlugs = new[]
        {
            "tournament/vsfighting-xiv",
            "tournament/vsfighting-xiii",
            "tournament/vsfighting-xii",
            "tournament/tekken-ball-vsfighting-xi",
            "tournament/drowning-pools-2024",
            "tournament/iron-pride-may-day-tournament",
            "tournament/elfm-may-the-final-fight",
            "tournament/tekken-tag-tournament-vs-fighting-xii-srkade",
            "tournament/dqretro-tekken-8-ball-pre-vsf-tournament-7-online-edition",
            "tournament/dq-retro-tekken-ball-bi-monthly-tournament-2",
        };

        // start.gg matches these against tournament names. Avoid spaced variants such as
        // "DQ Retro" or "VS Fighting": start.gg matches them per word and returns
        // thousands of unrelated tournaments ("retro", "fighting").
        private static readonly string[] NameSearchTerms = new[]
        {
            "DQRetro",
            "SRKade",
            "VSFighting",
            "VSF",
        };

        // start.gg owner ids of DQRetro / SRKade organisers. Finds their events even when
        // the tournament name has no search term in it.
        private static readonly Dictionary<string, string> OrganizerOwnerIds = new()
        {
            ["1711391"] = "ProtonicCobra",
            ["404585"] = "SlawPro",
        };

        // Names that mark DQRetro / SRKade: in a tournament name/slug (community tournament)
        // or in an event's name or rules text (event hosted by DQRetro / SRKade).
        private static readonly string[] CommunityBrandKeywords = new[] { "dqretro", "srkade" };

        // Tournament name/slug fragments that identify VSFighting (and VSF-branded events).
        // Matched with spaces, dashes and underscores removed.
        private static readonly string[] VsFightingKeywords = new[] { "vsf", "vsfighting" };

        // Looser rule for the hand-listed third-party locals in TargetTournamentSlugs (their
        // events are named e.g. "Tekken Ball" with no host): event name matches one of these
        // AND the game is supported. Never used for VSF / VSFighting or for tournaments found
        // only by search.
        private static readonly string[] AllowedEventKeywords = new[]
        {
            "dqretro",
            "srkade",
            "tekken 8 ball",
            "tekken 3 ball",
            "tekken tag",
            "tekken ball",
            "def jam"
        };

        // start.gg videogame names the site has assets for (see game-config.js).
        // Matched case-insensitively as substrings of the event's videogame name.
        private static readonly string[] SupportedGameKeywords = new[]
        {
            "tekken",              // Tekken 1-8, Tekken Tag Tournament 1/2, Tekken 5: DR
            "def jam",             // Def Jam: Fight for NY
            "bloody roar 2",
            "dead or alive 5",
            "dead or alive 6",
            "virtua fighter 2",
            "virtua fighter 5",
            "virtua fighter 6",
        };

        // Players keyed by "user_<id>" when linked to a start.gg account, else by slug.
        private static readonly Dictionary<string, ExtractedPlayer> TrackedPlayers = new(StringComparer.OrdinalIgnoreCase);

        // entrant id -> player lookup key (filled while reading standings/entrants)
        private static readonly Dictionary<string, string> EntrantToPlayerKey = new();

        static async Task<int> Main(string[] args)
        {
            try
            {
                string rootPath = FindRepositoryRoot();
                string projectFolder = Path.Combine(rootPath, "src", "DQRetro.TournamentTracker.Startgg");

                int fromIdx = Array.FindIndex(args, a => a.Equals("--from-file", StringComparison.OrdinalIgnoreCase));
                if (fromIdx >= 0)
                {
                    if (fromIdx + 1 >= args.Length) { Console.WriteLine("❌ --from-file needs a path to brackets.json"); return 1; }
                    return ReprocessFromFile(Path.GetFullPath(args[fromIdx + 1]), ResolveOutputDir(args, rootPath));
                }

                string? apiKey = ResolveApiKey(projectFolder);
                if (string.IsNullOrWhiteSpace(apiKey))
                {
                    Console.WriteLine("❌ Error: Start.gg API key could not be located.");
                    Console.WriteLine("   Set STARTGG_API_KEY using one of:");
                    Console.WriteLine("     - .NET user-secrets (local):  dotnet user-secrets set STARTGG_API_KEY \"<key>\" --project src/DQRetro.TournamentTracker.Startgg");
                    Console.WriteLine("     - Environment variable:       $env:STARTGG_API_KEY = \"<key>\"");
                    Console.WriteLine("     - GitHub Actions secret:      STARTGG_API_KEY (exposed to the job as an env var)");
                    return 1;
                }

                apiKey = apiKey.Trim();
                if (apiKey.IndexOfAny(new[] { '<', '>', '"', '\'', ' ' }) >= 0)
                {
                    Console.WriteLine("❌ Error: STARTGG_API_KEY contains <, >, quotes or spaces.");
                    Console.WriteLine("   Store only the key itself, e.g. dotnet user-secrets set STARTGG_API_KEY abc123... (no angle brackets).");
                    return 4;
                }

                HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                HttpClient.DefaultRequestHeaders.UserAgent.Clear();
                HttpClient.DefaultRequestHeaders.UserAgent.ParseAdd("DQRetroBracketsFetcher/1.1");

                string uiDataPath = ResolveOutputDir(args, rootPath);
                bool force = args.Contains("--force", StringComparer.OrdinalIgnoreCase);
                Console.WriteLine($"Output folder: {uiDataPath}");

                Console.WriteLine("Step 1: Collecting tournament slugs...");
                // slug -> how it was found (for the log)
                var discovered = new Dictionary<string, SortedSet<string>>(StringComparer.OrdinalIgnoreCase);
                void AddFound(string slug, string source)
                {
                    if (!discovered.TryGetValue(slug, out var set)) discovered[slug] = set = new SortedSet<string>();
                    set.Add(source);
                }

                foreach (var slug in TargetTournamentSlugs)
                    AddFound(slug, "list");

                foreach (var term in NameSearchTerms)
                {
                    Console.WriteLine($"  Searching tournament names for \"{term}\"...");
                    foreach (var s in await SearchTournamentsAsync("name", term)) AddFound(s, $"name:{term}");
                }

                foreach (var (ownerId, ownerName) in OrganizerOwnerIds)
                {
                    Console.WriteLine($"  Listing tournaments owned by {ownerName} ({ownerId})...");
                    foreach (var s in await SearchTournamentsAsync("owner", ownerId)) AddFound(s, $"owner:{ownerName}");
                }

                Console.WriteLine($"  Total unique slugs to fetch: {discovered.Count}");
                var slugsToFetch = discovered.Keys.ToList();

                Console.WriteLine("\nStep 2: Fetching tournament details...");
                var hydratedTournaments = new List<JsonElement>();
                var seenTournamentIds = new HashSet<string>();
                int idx = 0;

                foreach (var slug in slugsToFetch)
                {
                    idx++;
                    Console.WriteLine($"  [{idx}/{slugsToFetch.Count}] {slug}  (found by {string.Join(", ", discovered[slug])})");

                    var tourneyData = await FetchTournamentDetailsAsync(slug, seenTournamentIds);
                    if (!tourneyData.HasValue)
                        continue;

                    var element = tourneyData.Value;

                    if (!HasEvents(element))
                    {
                        string name = GetString(element, "name") ?? slug;
                        Console.WriteLine($"    ℹ️  Skipping '{name}' — no matching events.");
                        continue;
                    }

                    hydratedTournaments.Add(element);
                    await Task.Delay(500);
                }

                // Safety net for automation: never replace good data with an empty/broken fetch.
                string bracketsFilePath = Path.Combine(uiDataPath, "brackets.json");
                int previousCount = CountExistingTournaments(bracketsFilePath);
                if (hydratedTournaments.Count == 0)
                {
                    Console.WriteLine("❌ No tournaments fetched — refusing to overwrite existing data.");
                    return 2;
                }
                if (!force && previousCount > 0 && hydratedTournaments.Count < previousCount / 2)
                {
                    Console.WriteLine($"❌ Fetched {hydratedTournaments.Count} tournaments vs {previousCount} previously — looks like a partial outage.");
                    Console.WriteLine("   Refusing to overwrite. Re-run with --force if this drop is expected.");
                    return 3;
                }

                // Players: merge duplicates, assign unique slugs, then stamp slugs onto entrants.
                var playerList = FinalizePlayers();
                var slugByKey = TrackedPlayers.ToDictionary(kv => kv.Key, kv => kv.Value.slug, StringComparer.OrdinalIgnoreCase);
                var finalTournaments = hydratedTournaments.Select(t => StampPlayerSlugs(t, slugByKey)).ToList();

                var outputBrackets = new
                {
                    data = new
                    {
                        currentUser = new
                        {
                            tournaments = new
                            {
                                nodes = finalTournaments
                            }
                        }
                    }
                };

                var jsonOptions = new JsonSerializerOptions { WriteIndented = true };
                SafeWriteFile(bracketsFilePath, JsonSerializer.Serialize(outputBrackets, jsonOptions));

                string playersFilePath = Path.Combine(uiDataPath, "players.json");
                SafeWriteFile(playersFilePath, JsonSerializer.Serialize(playerList, jsonOptions));

                Console.WriteLine($"\n✅ Done! Fetched {hydratedTournaments.Count} tournaments.");
                Console.WriteLine($"   Brackets Output: {bracketsFilePath}");
                Console.WriteLine($"   Players Output:  {playersFilePath} ({playerList.Count} players exported)");
                return 0;
            }
            catch (AuthException ex)
            {
                Console.WriteLine($"❌ {ex.Message}");
                return 4;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 Fatal Exception: {ex.Message}\n{ex.StackTrace}");
                return 5;
            }
        }

        /// <summary>
        /// Offline mode (no API key / no network): re-derives players.json, de-duplicates
        /// tournaments by id and stamps player slugs onto an existing brackets.json.
        /// Usage: --from-file &lt;brackets.json&gt; [--out &lt;dir&gt;]
        /// </summary>
        private static int ReprocessFromFile(string inputPath, string outDir)
        {
            Console.WriteLine($"Offline reprocess: {inputPath} -> {outDir}");
            using var doc = JsonDocument.Parse(File.ReadAllText(inputPath));
            var nodes = doc.RootElement.GetProperty("data").GetProperty("currentUser")
                           .GetProperty("tournaments").GetProperty("nodes");

            var seen = new HashSet<string>();
            var kept = new List<JsonElement>();
            foreach (var t in nodes.EnumerateArray())
            {
                string id = GetString(t, "id") ?? "";
                if (!string.IsNullOrEmpty(id) && !seen.Add(id))
                {
                    Console.WriteLine($"  Duplicate tournament id {id} ({GetString(t, "slug")}) removed.");
                    continue;
                }
                if (t.TryGetProperty("events", out var evs) && evs.ValueKind == JsonValueKind.Array)
                {
                    foreach (var ev in evs.EnumerateArray())
                    {
                        if (ev.TryGetProperty("standings", out var st) && st.ValueKind == JsonValueKind.Object &&
                            st.TryGetProperty("nodes", out var sn) && sn.ValueKind == JsonValueKind.Array)
                            foreach (var n in sn.EnumerateArray())
                                if (n.TryGetProperty("entrant", out var ent)) RegisterPlayerFromEntrant(ent);

                        if (ev.TryGetProperty("entrants", out var en) && en.ValueKind == JsonValueKind.Object &&
                            en.TryGetProperty("nodes", out var enn) && enn.ValueKind == JsonValueKind.Array)
                            foreach (var n in enn.EnumerateArray()) RegisterPlayerFromEntrant(n);
                    }
                }
                kept.Add(t.Clone());
            }

            var playerList = FinalizePlayers();
            var slugByKey = TrackedPlayers.ToDictionary(kv => kv.Key, kv => kv.Value.slug, StringComparer.OrdinalIgnoreCase);
            var finalTournaments = kept.Select(t => StampPlayerSlugs(t, slugByKey)).ToList();

            var output = new { data = new { currentUser = new { tournaments = new { nodes = finalTournaments } } } };
            var opts = new JsonSerializerOptions { WriteIndented = true };
            SafeWriteFile(Path.Combine(outDir, "brackets.json"), JsonSerializer.Serialize(output, opts));
            SafeWriteFile(Path.Combine(outDir, "players.json"), JsonSerializer.Serialize(playerList, opts));
            Console.WriteLine($"✅ {kept.Count} tournaments, {playerList.Count} players written to {outDir}");
            return 0;
        }

        // -------------------------------------------------------------------
        // start.gg queries
        // -------------------------------------------------------------------

        /// <summary>
        /// Lists tournament slugs from start.gg, following every page.
        /// kind "name": filter by tournament name; kind "owner": filter by owner (user) id.
        /// </summary>
        private static async Task<List<string>> SearchTournamentsAsync(string kind, string value)
        {
            const int perPage = 50;
            const int maxPages = 10; // safety cap: 500 tournaments per search
            var slugs = new List<string>();

            string filter = kind == "owner" ? "ownerId: $value" : "name: $value";
            string valueType = kind == "owner" ? "ID!" : "String!";
            var query = $@"
            query SearchTournaments($value: {valueType}, $page: Int!, $perPage: Int!) {{
              tournaments(query: {{
                page: $page
                perPage: $perPage
                sortBy: ""startAt desc""
                filter: {{ {filter} }}
              }}) {{
                pageInfo {{ total totalPages }}
                nodes {{ slug name }}
              }}
            }}";

            for (int page = 1; page <= maxPages; page++)
            {
                using var doc = await SendGraphQLQueryAsync(query, new { value, page, perPage });
                if (doc == null) break;
                if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Object ||
                    !data.TryGetProperty("tournaments", out var tournaments) || tournaments.ValueKind != JsonValueKind.Object ||
                    !tournaments.TryGetProperty("nodes", out var nodes) || nodes.ValueKind != JsonValueKind.Array)
                    break;

                foreach (var node in nodes.EnumerateArray())
                {
                    var slug = GetString(node, "slug");
                    if (string.IsNullOrEmpty(slug)) continue;
                    slugs.Add(slug);
                    Console.WriteLine($"    Found: {GetString(node, "name")} ({slug})");
                }

                int totalPages = tournaments.TryGetProperty("pageInfo", out var pi) && pi.ValueKind == JsonValueKind.Object &&
                                 pi.TryGetProperty("totalPages", out var tp) && tp.ValueKind == JsonValueKind.Number ? tp.GetInt32() : page;
                if (page >= totalPages) break;
                if (page == maxPages)
                    Console.WriteLine($"    ⚠️  More than {maxPages * perPage} results for {kind} \"{value}\" — only the newest {maxPages * perPage} were used.");
                await Task.Delay(500);
            }

            return slugs;
        }

        /// <summary>DQRetro / SRKade tournament: owned by a known organiser, or branded in its name/slug.</summary>
        private static bool IsCommunityTournament(string? ownerId, string name, string slug) =>
            (ownerId != null && OrganizerOwnerIds.ContainsKey(ownerId)) ||
            CommunityBrandKeywords.Any(k => name.Contains(k, StringComparison.OrdinalIgnoreCase) ||
                                            slug.Contains(k, StringComparison.OrdinalIgnoreCase));

        private static bool IsSupportedGame(string? videogameName) =>
            !string.IsNullOrEmpty(videogameName) &&
            SupportedGameKeywords.Any(k => videogameName.Contains(k, StringComparison.OrdinalIgnoreCase));

        private static bool IsVsFightingTournament(string name, string slug)
        {
            static string Squash(string s) => new string(s.Where(char.IsLetterOrDigit).ToArray());
            string n = Squash(name), sl = Squash(slug);
            return VsFightingKeywords.Any(k => n.Contains(k, StringComparison.OrdinalIgnoreCase) ||
                                               sl.Contains(k, StringComparison.OrdinalIgnoreCase));
        }

        private static bool MentionsCommunity(string? text) =>
            !string.IsNullOrEmpty(text) &&
            CommunityBrandKeywords.Any(k => text.Contains(k, StringComparison.OrdinalIgnoreCase));

        /// <summary>How a tournament's events are filtered.</summary>
        private enum EventRule
        {
            /// <summary>DQRetro / SRKade tournament: keep every event.</summary>
            All,
            /// <summary>VSF / VSFighting, or found only by search: event name or rules text must
            /// mention DQRetro / SRKade, and the game must be supported.</summary>
            CommunityHostedOnly,
            /// <summary>Hand-listed third-party local: event name matches AllowedEventKeywords,
            /// and the game must be supported.</summary>
            Keywords,
        }

        private static EventRule GetEventRule(bool community, string name, string slug, string requestedSlug)
        {
            if (community) return EventRule.All;
            if (IsVsFightingTournament(name, slug)) return EventRule.CommunityHostedOnly;
            bool handListed = TargetTournamentSlugs.Contains(requestedSlug, StringComparer.OrdinalIgnoreCase) ||
                              TargetTournamentSlugs.Contains(slug, StringComparer.OrdinalIgnoreCase);
            return handListed ? EventRule.Keywords : EventRule.CommunityHostedOnly;
        }

        /// <summary>
        /// Decides whether an event is imported. Outside DQRetro / SRKade's own tournaments the
        /// game must be supported, and at VSF / VSFighting the event itself must name DQRetro or
        /// SRKade, so other organisers' brackets (e.g. VSFighting's main Tekken 8 event) are skipped.
        /// </summary>
        private static bool ShouldKeepEvent(EventRule rule, string eventName, string? rulesText, string? videogameName) => rule switch
        {
            EventRule.All => true,
            EventRule.CommunityHostedOnly =>
                (MentionsCommunity(eventName) || MentionsCommunity(rulesText)) && IsSupportedGame(videogameName),
            _ => AllowedEventKeywords.Any(k => eventName.Contains(k, StringComparison.OrdinalIgnoreCase)) && IsSupportedGame(videogameName),
        };

        private static async Task<JsonElement?> FetchTournamentDetailsAsync(string slug, HashSet<string> seenTournamentIds)
        {
            var query = @"
            query GetTournament($slug: String!) {
              tournament(slug: $slug) {
                id
                name
                slug
                state
                startAt
                hasOfflineEvents
                numAttendees
                owner { id }
                images { url type }
                events {
                  id
                  name
                  slug
                  state
                  numEntrants
                  rulesMarkdown
                  videogame { id name }
                  images { url type }
                }
              }
            }";

            using var doc = await SendGraphQLQueryAsync(query, new { slug });
            if (doc == null) { Console.WriteLine("    ⚠️  No data returned — skipping."); return null; }

            if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Object) return null;
            if (!data.TryGetProperty("tournament", out var tournament)) return null;
            if (tournament.ValueKind != JsonValueKind.Object) { Console.WriteLine("    ⚠️  Tournament not found — skipping."); return null; }

            // De-duplicate: different slugs (aliases/redirects) can resolve to the same tournament.
            string tournamentId = GetString(tournament, "id") ?? "";
            if (!string.IsNullOrEmpty(tournamentId) && !seenTournamentIds.Add(tournamentId))
            {
                Console.WriteLine($"    ℹ️  Duplicate of tournament id {tournamentId} ({GetString(tournament, "slug")}) — skipping.");
                return null;
            }

            var tournamentDict = JsonElementToDict(tournament);
            tournamentDict.Remove("owner"); // only used for the event filter; keeps the output format unchanged
            string tournamentName = GetString(tournament, "name") ?? "";
            string canonicalSlug = GetString(tournament, "slug") ?? slug;
            string? ownerId = tournament.TryGetProperty("owner", out var ownerEl) && ownerEl.ValueKind == JsonValueKind.Object
                ? GetString(ownerEl, "id") : null;
            bool community = IsCommunityTournament(ownerId, tournamentName, canonicalSlug);
            EventRule rule = GetEventRule(community, tournamentName, canonicalSlug, slug);

            if (tournament.TryGetProperty("events", out var eventsEl) && eventsEl.ValueKind == JsonValueKind.Array)
            {
                var eventsToProcess = eventsEl.EnumerateArray().Where(ev =>
                {
                    string eventName = GetString(ev, "name") ?? "";
                    string? rulesText = GetString(ev, "rulesMarkdown");
                    string? game = ev.TryGetProperty("videogame", out var vg) && vg.ValueKind == JsonValueKind.Object
                        ? GetString(vg, "name") : null;
                    return ShouldKeepEvent(rule, eventName, rulesText, game);
                }).ToList();

                if (rule != EventRule.All)
                {
                    string why = rule == EventRule.CommunityHostedOnly
                        ? "event name/rules mention DQRetro or SRKade, supported game"
                        : "hand-listed local: Tekken Ball / Def Jam style event, supported game";
                    Console.WriteLine($"    Third-party tournament: keeping {eventsToProcess.Count} of {eventsEl.GetArrayLength()} events ({why}).");
                }

                var hydratedEvents = new List<Dictionary<string, object?>>();
                foreach (var ev in eventsToProcess)
                {
                    var eventId = GetString(ev, "id");
                    Dictionary<string, object?> eventDict;
                    if (string.IsNullOrEmpty(eventId))
                    {
                        eventDict = JsonElementToDict(ev);
                    }
                    else
                    {
                        Console.WriteLine($"    Fetching details for event: {GetString(ev, "name")}...");
                        eventDict = await FetchEventDetailsAsync(eventId, ev);
                        await Task.Delay(700);
                    }
                    eventDict.Remove("rulesMarkdown"); // only used for the event filter; keeps the output format unchanged
                    hydratedEvents.Add(eventDict);
                }

                tournamentDict["events"] = hydratedEvents;
            }

            string json = JsonSerializer.Serialize(tournamentDict);
            using var outDoc = JsonDocument.Parse(json);
            return outDoc.RootElement.Clone();
        }

        private static async Task<Dictionary<string, object?>> FetchEventDetailsAsync(string eventId, JsonElement baseEvent)
        {
            var eventDict = JsonElementToDict(baseEvent);

            // ---- Standings (paginated; rich player data) ----
            var standingsQuery = @"
            query GetEventStandings($eventId: ID!, $page: Int!, $perPage: Int!) {
              event(id: $eventId) {
                standings(query: { perPage: $perPage, page: $page }) {
                  pageInfo { total totalPages }
                  nodes {
                    placement
                    isFinal
                    entrant {
                      id
                      name
                      participants {
                        id
                        gamerTag
                        prefix
                        user {
                          id
                          images { url type }
                          location { city state country }
                          authorizations {
                            type
                            externalUsername
                          }
                        }
                      }
                    }
                  }
                }
              }
            }";

            var standings = await FetchAllPagesAsync(standingsQuery, eventId, "standings", 40, "standings");
            if (standings != null)
            {
                foreach (var node in standings.Value.Nodes)
                    if (node.TryGetProperty("entrant", out var ent)) RegisterPlayerFromEntrant(ent);
                eventDict["standings"] = standings.Value.ToOutput();
            }

            await Task.Delay(300);

            // ---- Entrants (paginated; catches players in events without standings) ----
            var entrantsQuery = @"
            query GetEventEntrants($eventId: ID!, $page: Int!, $perPage: Int!) {
              event(id: $eventId) {
                entrants(query: { perPage: $perPage, page: $page }) {
                  pageInfo { total totalPages }
                  nodes {
                    id
                    name
                    participants {
                      id
                      gamerTag
                      prefix
                      user { id }
                    }
                  }
                }
              }
            }";

            var entrants = await FetchAllPagesAsync(entrantsQuery, eventId, "entrants", 60, "entrants");
            if (entrants != null)
            {
                foreach (var node in entrants.Value.Nodes) RegisterPlayerFromEntrant(node);
                eventDict["entrants"] = entrants.Value.ToOutput();
            }

            await Task.Delay(300);

            // ---- Phases and phase groups (pools / top cut) ----
            var phasesQuery = @"
            query GetEventPhases($eventId: ID!) {
              event(id: $eventId) {
                phases {
                  id
                  name
                  state
                  bracketType
                  groupCount
                  numSeeds
                  phaseOrder
                  phaseGroups(query: { page: 1, perPage: 100 }) {
                    pageInfo { total totalPages }
                    nodes {
                      id
                      displayIdentifier
                      bracketType
                      state
                    }
                  }
                }
              }
            }";

            using (var phasesDoc = await SendGraphQLQueryAsync(phasesQuery, new { eventId }))
            {
                if (phasesDoc != null &&
                    phasesDoc.RootElement.TryGetProperty("data", out var pData) && pData.ValueKind == JsonValueKind.Object &&
                    pData.TryGetProperty("event", out var pEvent) && pEvent.ValueKind == JsonValueKind.Object &&
                    pEvent.TryGetProperty("phases", out var phases) && phases.ValueKind == JsonValueKind.Array)
                {
                    eventDict["phases"] = JsonElementToObject(phases);
                    Console.WriteLine($"      Phases: {phases.GetArrayLength()}");
                }
            }

            await Task.Delay(300);

            // ---- Sets (paginated; with round + phase group) ----
            var setsQuery = @"
            query GetEventSets($eventId: ID!, $page: Int!, $perPage: Int!) {
              event(id: $eventId) {
                sets(perPage: $perPage, page: $page) {
                  pageInfo { total totalPages }
                  nodes {
                    id
                    fullRoundText
                    round
                    identifier
                    state
                    winnerId
                    phaseGroup {
                      id
                      displayIdentifier
                      phase { id name }
                    }
                    slots {
                      slotIndex
                      entrant { id name }
                      standing { stats { score { value } } }
                    }
                    games {
                      id
                      selections {
                        selectionType
                        selectionValue
                        entrant { id name }
                      }
                    }
                  }
                }
              }
            }";

            var sets = await FetchAllPagesAsync(setsQuery, eventId, "sets", 25, "sets");
            var setNodes = new List<object?>();
            if (sets != null)
            {
                foreach (var node in sets.Value.Nodes)
                {
                    var setDict = JsonElementToDict(node);
                    // Flat id for the bracket viewer (bracket/script.js reads set.phaseGroupId)
                    if (node.TryGetProperty("phaseGroup", out var pg) && pg.ValueKind == JsonValueKind.Object)
                        setDict["phaseGroupId"] = GetString(pg, "id");
                    setNodes.Add(setDict);
                }
            }
            eventDict["sets"] = new Dictionary<string, object?> { ["nodes"] = setNodes };
            Console.WriteLine($"      Total sets fetched: {setNodes.Count}");

            return eventDict;
        }

        private readonly struct PagedResult
        {
            public PagedResult(List<JsonElement> nodes, int total) { Nodes = nodes; Total = total; }
            public List<JsonElement> Nodes { get; }
            public int Total { get; }
            public Dictionary<string, object?> ToOutput() => new()
            {
                ["pageInfo"] = new Dictionary<string, object?> { ["total"] = Total },
                ["nodes"] = Nodes.Select(JsonElementToObject).ToList()
            };
        }

        /// <summary>
        /// Fetches every page of event.{field}. Halves perPage and retries the same page if
        /// start.gg reports the query is too complex (1000-object limit). Returns null only
        /// if the very first page fails.
        /// </summary>
        private static async Task<PagedResult?> FetchAllPagesAsync(string query, string eventId, string field, int perPage, string label)
        {
            var all = new List<JsonElement>();
            int page = 1, totalPages = 1, total = 0;
            // Pages are numbered by perPage; once we shrink perPage we restart from page 1 at the new size.
            while (page <= totalPages)
            {
                using var doc = await SendGraphQLQueryAsync(query, new { eventId, page, perPage });
                if (doc == null) return page == 1 && all.Count == 0 ? null : new PagedResult(all, Math.Max(total, all.Count));

                if (IsComplexityError(doc) && perPage > 5)
                {
                    perPage = Math.Max(5, perPage / 2);
                    Console.WriteLine($"      ↘ {label}: query too complex, retrying with perPage={perPage}");
                    all.Clear(); page = 1; totalPages = 1;
                    await Task.Delay(700);
                    continue;
                }

                if (!(doc.RootElement.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object &&
                      data.TryGetProperty("event", out var ev) && ev.ValueKind == JsonValueKind.Object &&
                      ev.TryGetProperty(field, out var conn) && conn.ValueKind == JsonValueKind.Object))
                    break;

                if (conn.TryGetProperty("nodes", out var nodes) && nodes.ValueKind == JsonValueKind.Array)
                    foreach (var n in nodes.EnumerateArray()) all.Add(n.Clone());

                if (conn.TryGetProperty("pageInfo", out var pi) && pi.ValueKind == JsonValueKind.Object)
                {
                    if (pi.TryGetProperty("totalPages", out var tp) && tp.ValueKind == JsonValueKind.Number) totalPages = tp.GetInt32();
                    if (pi.TryGetProperty("total", out var tt) && tt.ValueKind == JsonValueKind.Number) total = tt.GetInt32();
                }

                if (totalPages > 1) Console.WriteLine($"      {label} page {page}/{totalPages} — {all.Count}/{total}");
                page++;
                if (page <= totalPages) await Task.Delay(700);
            }

            if (total > 0 && all.Count < total)
                Console.WriteLine($"      ⚠️  {label}: got {all.Count} of {total}");
            return new PagedResult(all, Math.Max(total, all.Count));
        }

        private static bool IsComplexityError(JsonDocument doc)
        {
            if (!doc.RootElement.TryGetProperty("errors", out var errors) || errors.ValueKind != JsonValueKind.Array) return false;
            foreach (var e in errors.EnumerateArray())
            {
                var msg = GetString(e, "message") ?? "";
                if (msg.Contains("complexity", StringComparison.OrdinalIgnoreCase) ||
                    msg.Contains("1000 objects", StringComparison.OrdinalIgnoreCase)) return true;
            }
            return false;
        }

        // -------------------------------------------------------------------
        // Players
        // -------------------------------------------------------------------

        /// <summary>Records/updates a player from an entrant object (standings or entrants node).</summary>
        private static void RegisterPlayerFromEntrant(JsonElement entrant)
        {
            if (entrant.ValueKind != JsonValueKind.Object) return;

            string entrantId = GetString(entrant, "id") ?? "";
            string entrantName = GetString(entrant, "name") ?? "";
            if (string.IsNullOrWhiteSpace(entrantName)) return;

            string gamerTag = "", prefix = "", userId = "";
            JsonElement? userObj = null;

            if (entrant.TryGetProperty("participants", out var pArr) && pArr.ValueKind == JsonValueKind.Array)
            {
                // Singles events: one participant. (Doubles would need per-participant players.)
                foreach (var p in pArr.EnumerateArray())
                {
                    string tag = GetString(p, "gamerTag") ?? "";
                    if (!string.IsNullOrWhiteSpace(tag)) gamerTag = tag.Trim();

                    string pre = GetString(p, "prefix") ?? "";
                    if (!string.IsNullOrWhiteSpace(pre)) prefix = pre.Trim();

                    if (p.TryGetProperty("user", out var usr) && usr.ValueKind == JsonValueKind.Object)
                    {
                        userId = GetString(usr, "id") ?? "";
                        userObj = usr;
                    }
                }
            }

            string canonicalName = !string.IsNullOrWhiteSpace(gamerTag) ? gamerTag : CleanEntrantName(entrantName);
            if (string.IsNullOrWhiteSpace(canonicalName)) return;

            string baseSlug = Slugs.ForPlayer(canonicalName);
            if (string.IsNullOrEmpty(baseSlug)) baseSlug = "player";
            string lookupKey = !string.IsNullOrWhiteSpace(userId) ? $"user_{userId}" : $"name_{baseSlug}";

            if (!TrackedPlayers.TryGetValue(lookupKey, out var player))
            {
                player = new ExtractedPlayer { name = canonicalName, slug = baseSlug };
                TrackedPlayers[lookupKey] = player;
            }

            player.name = canonicalName;
            player.slug = baseSlug;
            if (!string.IsNullOrWhiteSpace(userId)) player.userId = userId;
            if (!string.IsNullOrEmpty(prefix)) player.team = prefix;
            if (!string.IsNullOrEmpty(entrantId)) EntrantToPlayerKey[entrantId] = lookupKey;

            if (userObj.HasValue)
            {
                var usr = userObj.Value;
                if (usr.TryGetProperty("images", out var imgs) && imgs.ValueKind == JsonValueKind.Array)
                {
                    foreach (var img in imgs.EnumerateArray())
                    {
                        if (GetString(img, "type") == "profile")
                        {
                            player.avatar = GetString(img, "url") ?? player.avatar;
                            break;
                        }
                    }
                }

                if (usr.TryGetProperty("location", out var loc) && loc.ValueKind == JsonValueKind.Object)
                {
                    var locParts = new List<string>();
                    string city = GetString(loc, "city") ?? "";
                    string country = GetString(loc, "country") ?? "";
                    if (!string.IsNullOrEmpty(city)) locParts.Add(city);
                    if (!string.IsNullOrEmpty(country)) locParts.Add(country);
                    if (locParts.Count > 0) player.country = string.Join(", ", locParts);
                }

                if (usr.TryGetProperty("authorizations", out var auths) && auths.ValueKind == JsonValueKind.Array)
                {
                    foreach (var auth in auths.EnumerateArray())
                    {
                        string type = (GetString(auth, "type") ?? "").ToUpperInvariant();
                        string handle = GetString(auth, "externalUsername") ?? "";
                        if (string.IsNullOrEmpty(handle)) continue;

                        if (type.Contains("TWITTER")) player.socials.twitter = handle;
                        if (type.Contains("TWITCH")) player.socials.twitch = handle;
                        if (type.Contains("YOUTUBE")) player.socials.youtube = handle;
                        if (type.Contains("DISCORD")) player.socials.discord = handle;
                    }
                }
            }
        }

        /// <summary>
        /// Merges name-only players into the account with the same slug, then makes slugs
        /// unique: if two different start.gg accounts share a slug, the lowest user id keeps
        /// it and the others get "-2", "-3"... (stable across runs).
        /// </summary>
        private static List<ExtractedPlayer> FinalizePlayers()
        {
            // 1. Merge name-only entries into an account player with the same slug.
            var accountBySlug = TrackedPlayers
                .Where(kv => kv.Key.StartsWith("user_"))
                .GroupBy(kv => kv.Value.slug)
                .ToDictionary(g => g.Key, g => g.OrderBy(kv => NumericId(kv.Value.userId)).First().Key);

            foreach (var key in TrackedPlayers.Keys.Where(k => k.StartsWith("name_")).ToList())
            {
                var namePlayer = TrackedPlayers[key];
                if (!accountBySlug.TryGetValue(namePlayer.slug, out var accountKey)) continue;

                var target = TrackedPlayers[accountKey];
                if (string.IsNullOrEmpty(target.team)) target.team = namePlayer.team;
                if (string.IsNullOrEmpty(target.country)) target.country = namePlayer.country;
                if (string.IsNullOrEmpty(target.avatar)) target.avatar = namePlayer.avatar;

                foreach (var e in EntrantToPlayerKey.Where(e => e.Value == key).Select(e => e.Key).ToList())
                    EntrantToPlayerKey[e] = accountKey;
                TrackedPlayers.Remove(key);
            }

            // 2. Disambiguate remaining slug collisions deterministically.
            foreach (var group in TrackedPlayers.GroupBy(kv => kv.Value.slug).Where(g => g.Count() > 1))
            {
                int n = 1;
                foreach (var kv in group.OrderBy(kv => kv.Value.userId == null ? 1 : 0).ThenBy(kv => NumericId(kv.Value.userId)))
                {
                    if (n > 1) kv.Value.slug = $"{group.Key}-{n}";
                    n++;
                }
            }

            return TrackedPlayers.Values.OrderBy(p => p.name, StringComparer.OrdinalIgnoreCase).ThenBy(p => p.slug).ToList();
        }

        private static long NumericId(string? id) => long.TryParse(id, out var v) ? v : long.MaxValue;

        /// <summary>Adds "playerSlug" to every entrant object (standings, entrants, set slots, selections).</summary>
        private static JsonElement StampPlayerSlugs(JsonElement tournament, Dictionary<string, string> slugByKey)
        {
            var obj = JsonElementToObject(tournament);
            Stamp(obj, slugByKey);
            var json = JsonSerializer.Serialize(obj);
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.Clone();
        }

        private static void Stamp(object? node, Dictionary<string, string> slugByKey)
        {
            if (node is Dictionary<string, object?> dict)
            {
                if (dict.TryGetValue("entrant", out var ent) && ent is Dictionary<string, object?> entDict)
                    StampEntrant(entDict, slugByKey);
                foreach (var v in dict.Values) Stamp(v, slugByKey);
                // entrants.nodes are entrant objects themselves
                if (dict.TryGetValue("participants", out _) && dict.ContainsKey("id") && dict.ContainsKey("name"))
                    StampEntrant(dict, slugByKey);
            }
            else if (node is List<object?> list)
            {
                foreach (var v in list) Stamp(v, slugByKey);
            }
        }

        private static void StampEntrant(Dictionary<string, object?> ent, Dictionary<string, string> slugByKey)
        {
            var id = ent.TryGetValue("id", out var v) ? v?.ToString() : null;
            if (id != null && EntrantToPlayerKey.TryGetValue(id, out var key) && slugByKey.TryGetValue(key, out var slug))
                ent["playerSlug"] = slug;
        }

        private static string CleanEntrantName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "";
            var parts = name.Split('|', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length == 0 ? "" : parts.Last().Trim();
        }

        // -------------------------------------------------------------------
        // Helpers
        // -------------------------------------------------------------------

        private static bool HasEvents(JsonElement element)
        {
            if (element.TryGetProperty("events", out var ev) && ev.ValueKind == JsonValueKind.Array)
                return ev.GetArrayLength() > 0;
            return false;
        }

        private static async Task<JsonDocument?> SendGraphQLQueryAsync(string query, object? variables = null, int maxRetries = 5)
        {
            var payload = JsonSerializer.Serialize(new { query, variables });

            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    using var content = new StringContent(payload, Encoding.UTF8, "application/json");
                    using var response = await HttpClient.PostAsync(StartGgApiUrl, content);

                    if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden)
                        throw new AuthException($"start.gg rejected the API key (HTTP {(int)response.StatusCode}). Check STARTGG_API_KEY.");

                    if ((int)response.StatusCode == 429)
                    {
                        Console.WriteLine($"    ⏳ Rate limited (429). Waiting 12s... (attempt {attempt}/{maxRetries})");
                        await Task.Delay(12000);
                        continue;
                    }

                    if (response.IsSuccessStatusCode)
                    {
                        var body = await response.Content.ReadAsStringAsync();
                        var doc = JsonDocument.Parse(body);

                        if (doc.RootElement.TryGetProperty("errors", out var errors))
                            Console.WriteLine($"    ⚠️  GraphQL errors: {errors}");

                        return doc;
                    }

                    var errorBody = await response.Content.ReadAsStringAsync();
                    if ((int)response.StatusCode == 400 && errorBody.Contains("authentication token", StringComparison.OrdinalIgnoreCase))
                        throw new AuthException("start.gg rejected the API key (HTTP 400: invalid authentication token). Check STARTGG_API_KEY.");

                    var snippet = errorBody.Length > 300 ? errorBody[..300] : errorBody;
                    Console.WriteLine($"    ⚠️  HTTP {(int)response.StatusCode} on attempt {attempt}/{maxRetries}: {snippet}");
                }
                catch (AuthException) { throw; }
                catch (Exception ex)
                {
                    Console.WriteLine($"    ⚠️  Exception on attempt {attempt}/{maxRetries}: {ex.Message}");
                }

                if (attempt < maxRetries)
                    await Task.Delay(2500 * attempt);
            }

            return null;
        }

        private static Dictionary<string, object?> JsonElementToDict(JsonElement element)
        {
            var dict = new Dictionary<string, object?>();
            foreach (var prop in element.EnumerateObject())
                dict[prop.Name] = JsonElementToObject(prop.Value);
            return dict;
        }

        private static object? JsonElementToObject(JsonElement el)
        {
            return el.ValueKind switch
            {
                JsonValueKind.Object => JsonElementToDict(el),
                JsonValueKind.Array => el.EnumerateArray().Select(JsonElementToObject).ToList(),
                JsonValueKind.String => el.GetString(),
                JsonValueKind.Number => el.TryGetInt64(out long l) ? (object)l : el.GetDouble(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                _ => null
            };
        }

        private static string? GetString(JsonElement el, string prop)
        {
            if (el.ValueKind != JsonValueKind.Object || !el.TryGetProperty(prop, out var v)) return null;
            return v.ValueKind switch
            {
                JsonValueKind.String => v.GetString(),
                JsonValueKind.Number => v.GetRawText(),
                JsonValueKind.True   => "true",
                JsonValueKind.False  => "false",
                _                    => null
            };
        }

        private static int CountExistingTournaments(string bracketsFilePath)
        {
            try
            {
                if (!File.Exists(bracketsFilePath)) return 0;
                using var doc = JsonDocument.Parse(File.ReadAllText(bracketsFilePath));
                return doc.RootElement.GetProperty("data").GetProperty("currentUser")
                          .GetProperty("tournaments").GetProperty("nodes").GetArrayLength();
            }
            catch { return 0; }
        }

        /// <summary>--out &lt;dir&gt; overrides the default src/DQRetro.TournamentTracker.Ui/public/data.</summary>
        private static string ResolveOutputDir(string[] args, string rootPath)
        {
            int i = Array.FindIndex(args, a => a.Equals("--out", StringComparison.OrdinalIgnoreCase));
            if (i >= 0 && i + 1 < args.Length) return Path.GetFullPath(args[i + 1]);

            string uiDataPath = Path.Combine(rootPath, "src", "DQRetro.TournamentTracker.Ui", "public", "data");
            if (!Directory.Exists(uiDataPath))
            {
                string altPath = Path.Combine(rootPath, "DQRetro.TournamentTracker.Ui", "public", "data");
                if (Directory.Exists(altPath)) uiDataPath = altPath;
            }
            return uiDataPath;
        }

        private static string FindRepositoryRoot()
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null)
            {
                if (Directory.Exists(Path.Combine(dir.FullName, ".git")) ||
                    Directory.GetFiles(dir.FullName, "*.sln").Length > 0)
                    return dir.FullName;
                dir = dir.Parent;
            }
            return Directory.GetCurrentDirectory();
        }

        /// <summary>
        /// Resolves the start.gg key. Canonical name everywhere is STARTGG_API_KEY
        /// (env var locally, .NET user-secrets locally, GitHub Actions secret in CI).
        /// Later sources win: appsettings files -> user-secrets -> environment variables.
        /// The legacy "StartGg:ApiKey" name (env: StartGg__ApiKey) is still accepted.
        /// Never put a real key in appsettings*.json; those files are for non-secret settings.
        /// </summary>
        private static string? ResolveApiKey(string projectFolder)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(AppContext.BaseDirectory)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
                .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: false)
                .AddJsonFile(Path.Combine(projectFolder, "appsettings.json"), optional: true, reloadOnChange: false)
                .AddJsonFile(Path.Combine(projectFolder, "appsettings.Development.json"), optional: true, reloadOnChange: false)
                .AddUserSecrets(typeof(Program).Assembly, optional: true)
                .AddEnvironmentVariables();

            IConfiguration config = builder.Build();

            foreach (var name in new[] { "STARTGG_API_KEY", "StartGg:ApiKey" })
            {
                var value = config[name];
                if (!string.IsNullOrWhiteSpace(value)) return value;
            }
            return null;
        }

        private static void SafeWriteFile(string filePath, string content)
        {
            var dir = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                Directory.CreateDirectory(dir);

            var temp = filePath + ".tmp";
            File.WriteAllText(temp, content, new UTF8Encoding(false));
            File.Move(temp, filePath, overwrite: true);
        }
    }
}
