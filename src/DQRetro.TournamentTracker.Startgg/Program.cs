using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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
        public string slug => CreateSlug(name);
        public string team { get; set; } = "";
        public string country { get; set; } = "";
        public string avatar { get; set; } = "";
        public PlayerSocials socials { get; set; } = new PlayerSocials();

        public static string CreateSlug(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "";
            string cleaned = name.ToLower();
            cleaned = Regex.Replace(cleaned, @"[^\w\s-]", ""); // Remove symbols (], [, ., etc.)
            cleaned = Regex.Replace(cleaned, @"\s+", "-");     // Convert spaces to hyphens
            cleaned = Regex.Replace(cleaned, @"-+", "-");      // Collapse multiple hyphens
            return cleaned.Trim('-');                         // Trim leading/trailing hyphens
        }
    }

    public class PlayerSocials
    {
        public string? twitter { get; set; }
        public string? twitch { get; set; }
        public string? youtube { get; set; }
        public string? discord { get; set; }
    }

    class Program
    {
        private static readonly HttpClient HttpClient = new HttpClient();
        private const string StartGgApiUrl = "https://api.start.gg/gql/alpha";

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

        private static readonly string[] BrandSearchTerms = new[]
        {
            "DQRetro",
            "SRKade"
        };

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

        private static readonly Dictionary<string, ExtractedPlayer> TrackedPlayers = new(StringComparer.OrdinalIgnoreCase);

        static async Task Main(string[] args)
        {
            try
            {
                string rootPath = FindRepositoryRoot();
                string projectFolder = Path.Combine(rootPath, "src", "DQRetro.TournamentTracker.Startgg");

                string? apiKey = ResolveApiKey(projectFolder);
                if (string.IsNullOrWhiteSpace(apiKey))
                {
                    Console.WriteLine("❌ Error: Start.gg API key could not be located.");
                    Console.WriteLine("   Set STARTGG_API_KEY using one of:");
                    Console.WriteLine("     - .NET user-secrets (local):  dotnet user-secrets set STARTGG_API_KEY \"<key>\" --project src/DQRetro.TournamentTracker.Startgg");
                    Console.WriteLine("     - Environment variable:       $env:STARTGG_API_KEY = \"<key>\"");
                    Console.WriteLine("     - GitHub Actions secret:      STARTGG_API_KEY (exposed to the job as an env var)");
                    Environment.ExitCode = 1;
                    return;
                }

                HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim());
                HttpClient.DefaultRequestHeaders.UserAgent.Clear();
                HttpClient.DefaultRequestHeaders.UserAgent.ParseAdd("DQRetroBracketsFetcher/1.0");

                Console.WriteLine("Step 1: Collecting tournament slugs...");
                var slugsToFetch = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var slug in TargetTournamentSlugs)
                    slugsToFetch.Add(slug);

                foreach (var term in BrandSearchTerms)
                {
                    Console.WriteLine($"  Searching for \"{term}\" tournaments...");
                    var found = await SearchTournamentsByNameAsync(term);
                    foreach (var s in found) slugsToFetch.Add(s);
                }

                Console.WriteLine($"  Total unique tournaments to fetch: {slugsToFetch.Count}");

                Console.WriteLine("\nStep 2: Fetching tournament details...");
                var hydratedTournaments = new List<JsonElement>();
                int idx = 0;

                foreach (var slug in slugsToFetch)
                {
                    idx++;
                    Console.WriteLine($"  [{idx}/{slugsToFetch.Count}] {slug}");

                    var tourneyData = await FetchTournamentDetailsAsync(slug);
                    if (!tourneyData.HasValue)
                    {
                        Console.WriteLine($"    ⚠️  No data returned — skipping.");
                        continue;
                    }

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

                var outputBrackets = new
                {
                    data = new
                    {
                        currentUser = new
                        {
                            tournaments = new
                            {
                                nodes = hydratedTournaments
                            }
                        }
                    }
                };

                string uiDataPath = Path.Combine(rootPath, "src", "DQRetro.TournamentTracker.Ui", "public", "data");
                if (!Directory.Exists(uiDataPath))
                {
                    string altPath = Path.Combine(rootPath, "DQRetro.TournamentTracker.Ui", "public", "data");
                    if (Directory.Exists(altPath)) uiDataPath = altPath;
                }

                string bracketsJson = JsonSerializer.Serialize(outputBrackets, new JsonSerializerOptions { WriteIndented = true });
                string bracketsFilePath = Path.Combine(uiDataPath, "brackets.json");
                SafeWriteFile(bracketsFilePath, bracketsJson);

                var playerList = TrackedPlayers.Values.OrderBy(p => p.name).ToList();
                string playersJson = JsonSerializer.Serialize(playerList, new JsonSerializerOptions { WriteIndented = true });
                string playersFilePath = Path.Combine(uiDataPath, "players.json");
                SafeWriteFile(playersFilePath, playersJson);

                Console.WriteLine($"\n✅ Done! Fetched {hydratedTournaments.Count} tournaments.");
                Console.WriteLine($"   Brackets Output: {bracketsFilePath}");
                Console.WriteLine($"   Players Output:  {playersFilePath} ({playerList.Count} players exported)");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 Fatal Exception: {ex.Message}\n{ex.StackTrace}");
            }
        }

        private static async Task<List<string>> SearchTournamentsByNameAsync(string brandName)
        {
            var slugs = new List<string>();

            var query = @"
            query SearchTournaments($name: String!) {
              tournaments(query: {
                perPage: 50
                filter: { name: $name }
              }) {
                nodes {
                  slug
                  name
                  hasOfflineEvents
                  numAttendees
                }
              }
            }";

            using var doc = await SendGraphQLQueryAsync(query, new { name = brandName });
            if (doc == null) return slugs;

            if (doc.RootElement.TryGetProperty("data", out var data) &&
                data.TryGetProperty("tournaments", out var tournaments) &&
                tournaments.TryGetProperty("nodes", out var nodes) &&
                nodes.ValueKind == JsonValueKind.Array)
            {
                foreach (var node in nodes.EnumerateArray())
                {
                    var slug = GetString(node, "slug");
                    if (!string.IsNullOrEmpty(slug))
                    {
                        slugs.Add(slug);
                        Console.WriteLine($"    Found: {GetString(node, "name")} ({slug})");
                    }
                }
            }

            return slugs;
        }

        private static async Task<JsonElement?> FetchTournamentDetailsAsync(string slug)
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
                images { url type }
                events {
                  id
                  name
                  slug
                  state
                  numEntrants
                  videogame { id name }
                  images { url type }
                }
              }
            }";

            using var doc = await SendGraphQLQueryAsync(query, new { slug });
            if (doc == null) return null;

            if (!doc.RootElement.TryGetProperty("data", out var data)) return null;
            if (!data.TryGetProperty("tournament", out var tournament)) return null;
            if (tournament.ValueKind != JsonValueKind.Object) return null;

            var tournamentDict = JsonElementToDict(tournament);
            string tournamentName = GetString(tournament, "name") ?? "";

            if (tournament.TryGetProperty("events", out var eventsEl) && eventsEl.ValueKind == JsonValueKind.Array)
            {
                var eventsToProcess = eventsEl.EnumerateArray().Where(ev => 
                {
                    string eventName = GetString(ev, "name") ?? "";
                    bool isMajor = TargetTournamentSlugs.Contains(slug, StringComparer.OrdinalIgnoreCase);
                    
                    if (isMajor)
                    {
                        bool isDedicatedCommunityTournament = 
                            slug.Contains("srkade", StringComparison.OrdinalIgnoreCase) ||
                            slug.Contains("dqretro", StringComparison.OrdinalIgnoreCase) ||
                            tournamentName.Contains("srkade", StringComparison.OrdinalIgnoreCase) ||
                            tournamentName.Contains("dqretro", StringComparison.OrdinalIgnoreCase);

                        if (isDedicatedCommunityTournament) return true;

                        return AllowedEventKeywords.Any(keyword => 
                            eventName.Contains(keyword, StringComparison.OrdinalIgnoreCase));
                    }
                    
                    return true;
                }).ToList();

                var hydratedEvents = new List<Dictionary<string, object?>>();
                foreach (var ev in eventsToProcess)
                {
                    var eventId = GetString(ev, "id");
                    if (string.IsNullOrEmpty(eventId))
                    {
                        hydratedEvents.Add(JsonElementToDict(ev));
                        continue;
                    }

                    Console.WriteLine($"    Fetching details for event: {GetString(ev, "name")}...");
                    var hydratedEvent = await FetchEventDetailsAsync(eventId, ev);
                    hydratedEvents.Add(hydratedEvent);
                    await Task.Delay(700);
                }

                tournamentDict["events"] = hydratedEvents;
            }

            string json = JsonSerializer.Serialize(tournamentDict);
            return JsonDocument.Parse(json).RootElement.Clone();
        }

        private static async Task<Dictionary<string, object?>> FetchEventDetailsAsync(string eventId, JsonElement baseEvent)
        {
            var eventDict = JsonElementToDict(baseEvent);

            var standingsQuery = @"
            query GetEventStandings($eventId: ID!) {
              event(id: $eventId) {
                standings(query: { perPage: 64, page: 1 }) {
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

            using var standingsDoc = await SendGraphQLQueryAsync(standingsQuery, new { eventId });
            if (standingsDoc != null &&
                standingsDoc.RootElement.TryGetProperty("data", out var sData) &&
                sData.TryGetProperty("event", out var sEvent) &&
                sEvent.ValueKind == JsonValueKind.Object)
            {
                if (sEvent.TryGetProperty("standings", out var standings))
                {
                    eventDict["standings"] = JsonElementToObject(standings);
                    ExtractPlayersFromStandings(standings);
                }
            }

            await Task.Delay(300);

            var entrantsQuery = @"
            query GetEventEntrants($eventId: ID!) {
              event(id: $eventId) {
                entrants(query: { perPage: 50, page: 1 }) {
                  nodes {
                    id
                    name
                    participants {
                      id
                      gamerTag
                    }
                  }
                }
              }
            }";

            using var entrantsDoc = await SendGraphQLQueryAsync(entrantsQuery, new { eventId });
            if (entrantsDoc != null &&
                entrantsDoc.RootElement.TryGetProperty("data", out var eData) &&
                eData.TryGetProperty("event", out var eEvent) &&
                eEvent.ValueKind == JsonValueKind.Object)
            {
                if (eEvent.TryGetProperty("entrants", out var entrants))
                    eventDict["entrants"] = JsonElementToObject(entrants);
            }

            await Task.Delay(300);

            var allSetNodes = new List<object?>();
            int setsPage = 1;
            bool moreSets = true;

            while (moreSets)
            {
                var setsQuery = @"
                query GetEventSets($eventId: ID!, $page: Int!) {
                  event(id: $eventId) {
                    sets(perPage: 25, page: $page) {
                      pageInfo { total totalPages }
                      nodes {
                        id
                        fullRoundText
                        state
                        winnerId
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

                using var setsDoc = await SendGraphQLQueryAsync(setsQuery, new { eventId, page = setsPage });
                if (setsDoc == null) break;

                if (setsDoc.RootElement.TryGetProperty("data", out var setData) &&
                    setData.TryGetProperty("event", out var setEvent) &&
                    setEvent.ValueKind == JsonValueKind.Object &&
                    setEvent.TryGetProperty("sets", out var setsEl))
                {
                    if (setsEl.TryGetProperty("nodes", out var nodes) && nodes.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var node in nodes.EnumerateArray())
                            allSetNodes.Add(JsonElementToObject(node));
                    }

                    int totalPages = 1;
                    if (setsEl.TryGetProperty("pageInfo", out var pageInfo) &&
                        pageInfo.TryGetProperty("totalPages", out var tp))
                        totalPages = tp.ValueKind == JsonValueKind.Number ? tp.GetInt32() : 1;

                    Console.WriteLine($"      Sets page {setsPage}/{totalPages} — {allSetNodes.Count} sets so far");
                    moreSets = setsPage < totalPages;
                    setsPage++;
                }
                else
                {
                    break;
                }

                if (moreSets) await Task.Delay(700);
            }

            eventDict["sets"] = new Dictionary<string, object?> { ["nodes"] = allSetNodes };
            Console.WriteLine($"      Total sets fetched: {allSetNodes.Count}");

            return eventDict;
        }

        private static void ExtractPlayersFromStandings(JsonElement standings)
        {
            if (!standings.TryGetProperty("nodes", out var nodes) || nodes.ValueKind != JsonValueKind.Array)
                return;

            foreach (var node in nodes.EnumerateArray())
            {
                if (!node.TryGetProperty("entrant", out var entrant) || entrant.ValueKind != JsonValueKind.Object)
                    continue;

                string entrantName = GetString(entrant, "name") ?? "";
                if (string.IsNullOrWhiteSpace(entrantName)) continue;

                string gamerTag = "";
                string prefix = "";
                string userId = "";
                JsonElement? userObj = null;

                if (entrant.TryGetProperty("participants", out var pArr) && pArr.ValueKind == JsonValueKind.Array)
                {
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

                // Canonical gamer tag or cleaned entrant name
                string canonicalName = !string.IsNullOrWhiteSpace(gamerTag) 
                    ? gamerTag 
                    : CleanEntrantName(entrantName);

                if (string.IsNullOrWhiteSpace(canonicalName)) continue;

                // Key by Start.gg user ID if available, otherwise fallback to canonical name
                string lookupKey = !string.IsNullOrWhiteSpace(userId) 
                    ? $"user_{userId}" 
                    : canonicalName;

                var player = TrackedPlayers.TryGetValue(lookupKey, out var existing)
                    ? existing
                    : new ExtractedPlayer { name = canonicalName };

                player.name = canonicalName;
                if (!string.IsNullOrEmpty(prefix)) player.team = prefix;

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
                        string city = GetString(loc, "city") ?? "";
                        string country = GetString(loc, "country") ?? "";
                        List<string> locParts = new List<string>();
                        if (!string.IsNullOrEmpty(city)) locParts.Add(city);
                        if (!string.IsNullOrEmpty(country)) locParts.Add(country);
                        if (locParts.Count > 0) player.country = string.Join(", ", locParts);
                    }

                    if (usr.TryGetProperty("authorizations", out var auths) && auths.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var auth in auths.EnumerateArray())
                        {
                            string type = (GetString(auth, "type") ?? "").ToUpper();
                            string handle = GetString(auth, "externalUsername") ?? "";
                            if (string.IsNullOrEmpty(handle)) continue;

                            if (type.Contains("TWITTER")) player.socials.twitter = handle;
                            if (type.Contains("TWITCH")) player.socials.twitch = handle;
                            if (type.Contains("YOUTUBE")) player.socials.youtube = handle;
                            if (type.Contains("DISCORD")) player.socials.discord = handle;
                        }
                    }
                }

                TrackedPlayers[lookupKey] = player;
            }
        }

        private static string CleanEntrantName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "";
            var parts = name.Split('|', StringSplitOptions.RemoveEmptyEntries);
            return parts.Last().Trim();
        }

        private static bool HasEvents(JsonElement element)
        {
            if (element.TryGetProperty("events", out var ev))
            {
                if (ev.ValueKind == JsonValueKind.Array)
                    return ev.GetArrayLength() > 0;
            }
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
                    var response = await HttpClient.PostAsync(StartGgApiUrl, content);

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
                        {
                            Console.WriteLine($"    ⚠️  GraphQL errors: {errors}");
                        }

                        return doc;
                    }

                    Console.WriteLine($"    ⚠️  HTTP {(int)response.StatusCode} on attempt {attempt}/{maxRetries}");
                }
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
            if (!el.TryGetProperty(prop, out var v)) return null;
            return v.ValueKind switch
            {
                JsonValueKind.String => v.GetString(),
                JsonValueKind.Number => v.GetRawText(),
                JsonValueKind.True   => "true",
                JsonValueKind.False  => "false",
                JsonValueKind.Null   => null,
                _                    => null
            };
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
            File.WriteAllText(temp, content);
            if (File.Exists(filePath)) File.Delete(filePath);
            File.Move(temp, filePath);
        }
    }
}