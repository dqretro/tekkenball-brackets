// ===========================
// global.js
// Depends on: game-config.js loaded before this file
// Powers: global-leaderboard.html, global-statistics.html, index.html homepage
// ===========================

let charData        = [];
let leaderboardData = [];
let localEventData  = {};   // keyed by event slug → { playerCharacters: {} }
let usageChart      = null;

const isHomepage  = window.location.pathname.endsWith("index.html") ||
                    window.location.pathname.endsWith("/") ||
                    window.location.pathname.split("/").pop() === "";

const TABLE_LIMIT = isHomepage ? 3 : 100;
const CHART_TOP_N = isHomepage ? 3 : 10;

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
function withBase(path) {
  const BASE = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  path = path.replace(/^\/+/, "");
  return `${BASE}/${path}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function interpretRegion(countryCode) {
  const code = (countryCode || "").trim().toUpperCase();
  const map = {
    GB: "eu", UK: "eu", FR: "eu", DE: "eu", ES: "eu", IT: "eu", NL: "eu",
    SE: "eu", PL: "eu", BE: "eu", AT: "eu", CH: "eu", IE: "eu", NO: "eu",
    DK: "eu", FI: "eu", PT: "eu", GR: "eu", CZ: "eu", RO: "eu", HU: "eu",
    SK: "eu", UA: "eu", EU: "eu",
    US: "na", CA: "na", MX: "na",
    JP: "as", KR: "as", CN: "as", TW: "as", SG: "as", HK: "as",
    PH: "as", TH: "as", VN: "as", MY: "as", ID: "as",
    AE: "me", SA: "me", QA: "me", BH: "me", OM: "me", KW: "me",
    AU: "oc", NZ: "oc",
  };
  return map[code] || "eu";
}

// Map videogame name → display game label
function classifyGame(videogameName, eventName, tournamentName) {
  const txt = `${(videogameName||"")} ${(eventName||"")} ${(tournamentName||"")}`.toLowerCase();
  if (txt.includes("tekken 8") && txt.includes("ball"))    return "Tekken 8 Ball";
  if (txt.includes("tekken 3") && txt.includes("ball"))    return "Tekken 3 Ball";
  if (txt.includes("tekken ball"))                          return "Tekken 3 Ball";
  if (txt.includes("def jam") || txt.includes("ffny"))     return "Def Jam FFNY";
  if (txt.includes("tekken tag tournament 2"))              return "Tekken Tag Tournament 2";
  if (txt.includes("tekken tag tournament"))                return "Tekken Tag Tournament";
  if (txt.includes("tekken tag"))                           return "Tekken Tag Tournament";
  if (txt.includes("tekken 8"))                             return "Tekken 8";
  if (txt.includes("tekken 5: dark resurrection"))          return "Tekken 5 DR";
  if (txt.includes("tekken 5 dr"))                          return "Tekken 5 DR";
  if (txt.includes("tekken 5"))                             return "Tekken 5";
  if (txt.includes("tekken 4"))                             return "Tekken 4";
  if (txt.includes("tekken 3"))                             return "Tekken 3";
  if (txt.includes("tekken 2"))                             return "Tekken 2";
  if (txt.includes("soulcalibur"))                          return "Soulcalibur";
  if (txt.includes("bloody roar"))                          return "Bloody Roar";
  return "Tekken 8 Ball"; // default
}

// -------------------------------------------------------
// Load brackets-local.json
// -------------------------------------------------------
async function loadLocalData() {
  try {
    const res = await fetch(withBase("/data/brackets-local.json"));
    if (res.ok) {
      const json = await res.json();
      localEventData = json.events || {};
      console.log(`📁 brackets-local.json loaded — ${Object.keys(localEventData).length} event overrides`);
    }
  } catch (err) {
    console.warn("brackets-local.json not found:", err);
    localEventData = {};
  }
}

// -------------------------------------------------------
// Get characters for a player from brackets-local.json
// -------------------------------------------------------
function getLocalCharactersForPlayer(eventSlug, entrantName) {
  if (!eventSlug || !entrantName) return [];

  // Try exact slug, then partial match
  const eventData = localEventData[eventSlug]
    || Object.entries(localEventData).find(([k]) =>
        eventSlug.includes(k) || k.includes(eventSlug)
      )?.[1];

  if (!eventData?.playerCharacters) return [];

  const lower = entrantName.toLowerCase();
  for (const [key, chars] of Object.entries(eventData.playerCharacters)) {
    if (
      key.toLowerCase() === lower ||
      lower.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(lower)
    ) return chars;
  }
  return [];
}

// -------------------------------------------------------
// Resolve characters for a player in a set
// -------------------------------------------------------
function resolvePlayerChars(set, entrantId, entrantName, gameLabel, eventSlug) {
  const chars = new Set();
  const videogameName = gameLabel; // pass through to game-config

  // 1. start.gg reported selections (skip for Def Jam — never reported there)
  const isDefJam = gameLabel.toLowerCase().includes("def jam");
  if (!isDefJam) {
    (set.games || []).forEach(game => {
      (game.selections || []).forEach(sel => {
        const selId = sel.entrant?.id?.toString();
        if (entrantId && selId === entrantId.toString()) {
          const resolved = typeof resolveCharacterSlug === "function"
            ? resolveCharacterSlug(sel.selectionValue, sel.character, videogameName)
            : null;
          if (resolved) chars.add(resolved);
        }
      });
    });
  }

  // 2. brackets-local.json per-event overrides
  if (chars.size === 0) {
    getLocalCharactersForPlayer(eventSlug, entrantName).forEach(c => chars.add(c));
  }

  // 3. Global manual fallback (game-config.js)
  if (chars.size === 0 && typeof getManualCharacters === "function") {
    getManualCharacters(entrantName).forEach(c => chars.add(c));
  }

  return Array.from(chars);
}

// -------------------------------------------------------
// Load and process all data from brackets.json
// -------------------------------------------------------
async function loadGlobalData() {
  await loadLocalData();

  let rawTournaments = [];
  try {
    const res = await fetch(withBase("/data/brackets.json"));
    if (res.ok) {
      const json = await res.json();
      rawTournaments = json?.data?.currentUser?.tournaments?.nodes || [];
      console.log(`📁 brackets.json loaded — ${rawTournaments.length} tournaments`);
    }
  } catch (err) {
    console.warn("brackets.json load failed:", err);
  }

  const playerStats    = {}; // key: `cleanName_game`
  let totalSets        = 0;
  let totalEvents      = 0;

  rawTournaments.forEach(t => {
    const tournamentYear = t.startAt ? new Date(t.startAt * 1000).getFullYear() : new Date().getFullYear();

    (t.events || []).forEach(ev => {
      totalEvents++;
      const gameLabel  = classifyGame(ev.videogame?.name, ev.name, t.name);
      const eventSlug  = ev.slug || "";
      const sets       = ev.sets?.nodes || [];
      totalSets       += sets.length;

      sets.forEach(set => {
        if (!set?.slots?.length) return;

        const winnerId = set.winnerId;
        if (!winnerId) return; // skip unreported sets

        // Skip full DQ sets
        const isDQ = set.slots.some(sl => sl.standing?.stats?.score?.value === -1);
        if (isDQ) return;

        set.slots.forEach(slot => {
          if (!slot?.entrant) return;

          const rawName   = slot.entrant.name || "";
          const cleanName = rawName.includes("|")
            ? rawName.split("|").pop().trim().toLowerCase()
            : rawName.toLowerCase().trim();

          const entrantId = slot.entrant.id;
          // Prefer the sync tool's unique slug; fall back to the cleaned name for older data.
          const slug      = slot.entrant.playerSlug || null;
          const key       = `${slug || cleanName}_${gameLabel}`;

          const countryCode  = slot.entrant.participants?.[0]?.user?.location?.country
                            || slot.entrant.participants?.[0]?.countryCode
                            || "";
          const region       = interpretRegion(countryCode);

          const chars       = resolvePlayerChars(set, entrantId, rawName, gameLabel, eventSlug);
          const primaryChar = chars[0] || "Unspecified";

          if (!playerStats[key]) {
            playerStats[key] = {
              name: rawName, cleanName, slug, game: gameLabel,
              year: tournamentYear, region,
              wins: 0, losses: 0,
              charCounts: {}
            };
          } else {
            // Prefer name with team tag
            if (rawName.includes("|") && !playerStats[key].name.includes("|"))
              playerStats[key].name = rawName;
            // Prefer non-EU if we get a real country later
            if (playerStats[key].region === "eu" && region !== "eu")
              playerStats[key].region = region;
          }

          if (primaryChar) {
            playerStats[key].charCounts[primaryChar] =
              (playerStats[key].charCounts[primaryChar] || 0) + 1;
          }

          if (String(winnerId) === String(entrantId)) {
            playerStats[key].wins++;
          } else {
            playerStats[key].losses++;
          }
        });
      });
    });
  });

  // Pick most-used character per player per game (ignoring "Unspecified" unless it's the only option)
  const gameRecords = Object.values(playerStats).map(p => {
    const validChars = Object.keys(p.charCounts).filter(c => c.toLowerCase() !== "unspecified");
    validChars.sort((a, b) => p.charCounts[b] - p.charCounts[a]);
    return { ...p, character: validChars[0] || "Unspecified" };
  });

  // Aggregate across all games → "All Games" record
  const globalMap = {};
  gameRecords.forEach(p => {
    const k = p.slug || p.cleanName;
    if (!globalMap[k]) {
      globalMap[k] = { ...p, game: "All Games", primaryGame: p.game, charCounts: { ...p.charCounts } };
    } else {
      globalMap[k].wins   += p.wins;
      globalMap[k].losses += p.losses;
      if (p.name.includes("|") && !globalMap[k].name.includes("|"))
        globalMap[k].name = p.name;
      Object.entries(p.charCounts).forEach(([c, n]) => {
        globalMap[k].charCounts[c] = (globalMap[k].charCounts[c] || 0) + n;
      });
    }
  });

  // Pick primary character across all games (ignoring "Unspecified" unless it's the only option)
  Object.values(globalMap).forEach(p => {
    const validChars = Object.keys(p.charCounts).filter(c => c.toLowerCase() !== "unspecified");
    validChars.sort((a, b) => p.charCounts[b] - p.charCounts[a]);
    p.character = validChars[0] || "Unspecified";
  });

  leaderboardData = [...gameRecords, ...Object.values(globalMap)];
  charData        = buildCharData(50);

  console.log(`📊 Done — ${rawTournaments.length} tournaments, ${totalEvents} events, ${totalSets} sets → ${leaderboardData.length} records`);
}

// -------------------------------------------------------
// Build character usage data from leaderboard
// -------------------------------------------------------
function buildCharData(limit = CHART_TOP_N) {
  const counts = {};
  const charGames = {};
  leaderboardData.filter(p => p.game === "All Games").forEach(p => {
    const c = p.character || "Unspecified";
    counts[c] = (counts[c] || 0) + (p.wins + p.losses || 1);
    if (!charGames[c]) charGames[c] = p.primaryGame || "Tekken 8 Ball";
  });
  return Object.entries(counts)
    .map(([character, count]) => ({ character, count, game: charGames[character] || "Tekken 8 Ball" }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// -------------------------------------------------------
// Render leaderboard table
// -------------------------------------------------------
function updateLeaderboard() {
  const tbody = document.getElementById("global-standings-body");
  if (!tbody) return;

  const gameFilter   = document.getElementById("gameFilter")?.value   || "all";
  const yearFilter   = document.getElementById("yearFilter")?.value   || "all";
  const charFilter   = document.getElementById("characterFilter")?.value || "all";
  const regionFilter = document.getElementById("regionFilter")?.value || "all";

  const filtered = leaderboardData
    .filter(p => {
      if (gameFilter === "all") { if (p.game !== "All Games") return false; }
      else { if (p.game !== gameFilter) return false; }
      if (yearFilter !== "all"   && p.year.toString() !== yearFilter) return false;
      if (charFilter !== "all"   && p.character.toLowerCase() !== charFilter.toLowerCase()) return false;
      if (regionFilter !== "all" && p.region.toLowerCase() !== regionFilter.toLowerCase()) return false;
      return true;
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const rA = a.wins / ((a.wins + a.losses) || 1);
      const rB = b.wins / ((b.wins + b.losses) || 1);
      if (rB !== rA) return rB - rA;
      return a.losses - b.losses;
    });

  tbody.innerHTML = "";
  filtered.slice(0, TABLE_LIMIT).forEach((p, i) => {
    const total  = (p.wins + p.losses) || 1;
    const pct    = ((p.wins / total) * 100).toFixed(1);
    const config = typeof getGameConfig === "function"
      ? getGameConfig(p.game === "All Games" ? (p.primaryGame || "Tekken 8 Ball") : p.game)
      : { folder: "tk8", imgExt: "png", selectPrefix: "select_", fallback: "select_random.png" };

    const isUnspecified = p.character.toLowerCase() === "unspecified";
    const charSlug      = isUnspecified ? null : p.character;
    const charIcon      = typeof buildCharacterIconHtml === "function"
      ? buildCharacterIconHtml(charSlug, config, 0)
      : "";
    const regionIcon    = `<img src="${withBase(`/images/games/tk7/regions/${p.region}.png`)}"
       alt="${p.region.toUpperCase()}" width="30" height="20"
       style="vertical-align:middle;"
       onerror="this.style.display='none'"
       title="${p.region.toUpperCase()}">`;

    const profileUrl = withBase(`/pages/player-profiles/players/players.html?player=${encodeURIComponent(p.slug || p.cleanName)}`);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td style="display:flex; align-items:center; gap:8px;">
        ${charIcon}
        <a href="${profileUrl}" style="color:inherit; text-decoration:underline; font-weight:bold;">${escapeHtml(p.name)}</a>
        ${!isUnspecified ? `<span style="color:var(--muted);font-size:0.8em;">(${escapeHtml(p.character)})</span>` : ""}
      </td>
      <td>${p.wins}</td>
      <td>${p.losses}</td>
      <td>${pct}%</td>
      <td>${regionIcon}</td>`;
    tbody.appendChild(row);
  });
}

// -------------------------------------------------------
// Render character usage table
// -------------------------------------------------------
function loadCharacterUsage(data, customLimit = null) {
  const tbody = document.getElementById("char-usage-body");
  if (!tbody) return;

  const limit   = customLimit !== null ? customLimit : (isHomepage ? 3 : data.length);
  const total   = data.reduce((s, x) => s + x.count, 0) || 1;
  tbody.innerHTML = "";
  data.slice(0, limit).forEach((c, i) => {
    const pct          = ((c.count / total) * 100).toFixed(1);
    const isUnspecified = c.character.toLowerCase() === "unspecified";
    const charSlug     = isUnspecified ? null : c.character;
    // Use game-specific config if available on the data entry, else default
    const config = typeof getGameConfig === "function"
      ? getGameConfig(c.game && c.game !== "All Games" ? c.game : "Tekken 8 Ball")
      : { folder: "tk8", imgExt: "png", selectPrefix: "select_", fallback: "select_random.png" };
    const icon         = typeof buildCharacterIconHtml === "function"
      ? buildCharacterIconHtml(charSlug, config, 0)
      : "";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td style="display:flex; align-items:center; gap:8px;">
        ${icon}
        <span>${escapeHtml(c.character)}</span>
      </td>
      <td>${c.count}</td>
      <td>${pct}%</td>`;
    tbody.appendChild(row);
  });
}

// -------------------------------------------------------
// Render chart
// -------------------------------------------------------
function renderCharacterUsageChart(data) {
  const ctx = document.getElementById("characterUsageChart");
  if (!ctx || typeof Chart === "undefined") return;
  if (usageChart) { usageChart.destroy(); usageChart = null; }
  if (!data.length) return;

  const colors = data.map((_, i) =>
    `hsl(${Math.floor((i / data.length) * 300 + 240)}, 70%, 55%)`);

  usageChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(c => c.character),
      datasets: [{
        label: "Usage",
        data: data.map(c => c.count),
        backgroundColor: colors,
        borderColor: "rgba(255,255,255,0.2)",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#ccc" }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: { ticks: { color: "#ccc", stepSize: 1 }, grid: { color: "rgba(255,255,255,0.05)" }, beginAtZero: true }
      }
    }
  });
}

// -------------------------------------------------------
// Filter stats update
// -------------------------------------------------------
function updateStats() {
  const gameFilter   = document.getElementById("gameFilter")?.value   || "all";
  const yearFilter   = document.getElementById("yearFilter")?.value   || "all";
  const charFilter   = document.getElementById("characterFilter")?.value || "all";
  const regionFilter = document.getElementById("regionFilter")?.value || "all";

  const counts = {};
  // Track game per character for correct icon folder
  const charGames = {};

  leaderboardData
    .filter(p => {
      if (gameFilter === "all") { if (p.game !== "All Games") return false; }
      else { if (p.game !== gameFilter) return false; }
      if (yearFilter !== "all"   && p.year.toString() !== yearFilter) return false;
      if (regionFilter !== "all" && p.region.toLowerCase() !== regionFilter.toLowerCase()) return false;
      if (charFilter !== "all"   && p.character.toLowerCase() !== charFilter.toLowerCase()) return false;
      return true;
    })
    .forEach(p => {
      const c = p.character || "Unspecified";
      counts[c] = (counts[c] || 0) + (p.wins + p.losses || 1);
      // Store the actual game for this character (primaryGame for All Games records)
      if (!charGames[c]) charGames[c] = p.primaryGame || p.game;
    });

  const aggregated = Object.entries(counts)
    .map(([character, count]) => ({ character, count, game: charGames[character] || "Tekken 8 Ball" }))
    .sort((a, b) => b.count - a.count);

  loadCharacterUsage(aggregated, isHomepage ? 3 : null);
  renderCharacterUsageChart(aggregated.slice(0, CHART_TOP_N));
}

// -------------------------------------------------------
// Filter summary label
// -------------------------------------------------------
function updateFilterSummary() {
  const game   = document.getElementById("gameFilter")?.value   || "all";
  const year   = document.getElementById("yearFilter")?.value   || "all";
  const char   = document.getElementById("characterFilter")?.value || "all";
  const region = document.getElementById("regionFilter")?.value || "all";

  const parts = [];
  if (game   !== "all") parts.push(game);
  if (year   !== "all") parts.push(year);
  if (char   !== "all") parts.push(char);
  if (region !== "all") parts.push(region.toUpperCase());

  const el = document.getElementById("filter-summary");
  if (el) el.textContent = parts.length
    ? `Tournaments — Showing ${parts.join(" | ")}`
    : "Tournaments — Showing all data";
}

// -------------------------------------------------------
// Populate filter dropdowns
// -------------------------------------------------------
function populateFilters() {
  const gameFilter   = document.getElementById("gameFilter");
  const yearFilter   = document.getElementById("yearFilter");
  const charFilter   = document.getElementById("characterFilter");
  const regionFilter = document.getElementById("regionFilter");

  const refresh = () => { updateStats(); updateLeaderboard(); updateFilterSummary(); };

  if (gameFilter) {
    const games = ["all", ...Array.from(new Set(
      leaderboardData.filter(p => p.game !== "All Games").map(p => p.game)
    )).sort()];
    gameFilter.innerHTML = games.map(g =>
      `<option value="${g}">${g === "all" ? "All Games" : g}</option>`).join("");
    gameFilter.addEventListener("change", refresh);
  }

  if (yearFilter) {
    const years = ["all", ...Array.from(new Set(leaderboardData.map(p => p.year))).sort((a,b) => b-a)];
    yearFilter.innerHTML = years.map(y =>
      `<option value="${y}">${y === "all" ? "All Time" : y}</option>`).join("");
    yearFilter.addEventListener("change", refresh);
  }

  if (charFilter) {
    const chars = ["all", ...Array.from(new Set(leaderboardData.map(p => p.character))).sort((a,b) => {
      if (a.toLowerCase() === "unspecified") return 1;
      if (b.toLowerCase() === "unspecified") return -1;
      return a.localeCompare(b);
    })];
    charFilter.innerHTML = chars.map(c =>
      `<option value="${c}">${c === "all" ? "All Characters" : c}</option>`).join("");
    charFilter.addEventListener("change", refresh);
  }

  if (regionFilter) {
    const regions = ["all", ...Array.from(new Set(leaderboardData.map(p => p.region))).sort()];
    regionFilter.innerHTML = regions.map(r =>
      `<option value="${r}">${r === "all" ? "All Regions" : r.toUpperCase()}</option>`).join("");
    regionFilter.addEventListener("change", refresh);
  }
}

// -------------------------------------------------------
// Reset button
// -------------------------------------------------------
function setupResetButton() {
  const btn = document.getElementById("reset-filters");
  if (!btn) return;
  btn.addEventListener("click", () => {
    ["gameFilter","yearFilter","characterFilter","regionFilter"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "all";
    });
    updateFilterSummary();
    updateStats();
    updateLeaderboard();
  });
}

// -------------------------------------------------------
// Homepage helper (called from index.html)
// -------------------------------------------------------
async function loadHomepageStats() {
  await loadGlobalData();
  loadCharacterUsage(charData, 3);
  updateLeaderboard();
}

// -------------------------------------------------------
// Init
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // Homepage uses loadHomepageStats() called from index.html instead
  if (isHomepage) return;

  await loadGlobalData();
  populateFilters();
  updateFilterSummary();
  updateStats();
  updateLeaderboard();
  setupResetButton();
});