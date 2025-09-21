// --------------------------
// Base helper for GH Pages vs local
// --------------------------
function withBase(path) {
  const BASE = window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "";
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path; // external links untouched
  return `${BASE}${path.startsWith("/") ? path : "/" + path}`;
}

// --------------------------
// Temporary Character Usage Data
// --------------------------
const charTempData = [
  { character: "Yoshimitsu", count: 259 },
  { character: "Random", count: 0 },
  { character: "Random", count: 0 },
  { character: "Random", count: 0 },
  { character: "Random", count: 0 },
  { character: "Random", count: 0 },
  { character: "Random", count: 0 },
  { character: "Random", count: 0 }
];

// --------------------------
// Load Character Usage Table
// --------------------------
function loadCharacterUsage(limit = 5, containerId = "char-usage-body") {
  let stats = [...charTempData];
  stats.sort((a, b) => b.count - a.count);
  if (limit) stats = stats.slice(0, limit);

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  stats.forEach((c, i) => {
    const totalCount = charTempData.reduce((t, v) => t + v.count, 0) || 1;
    const percent = ((c.count / totalCount) * 100).toFixed(1);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>
        <img src="${withBase(`/images/games/tk8/characters/characters_select/select_${c.character}.png`)}" 
             alt="${c.character}" width="30" height="30" style="vertical-align:middle; margin-right:6px;">
        ${c.character}
      </td>
      <td>${c.count}</td>
      <td>${percent}%</td>
    `;
    container.appendChild(row);
  });
}

// --------------------------
// Temporary Global Leaderboard Data
// --------------------------
const globalTempData = [
  { name: "PND | Strykie", character: "Yoshimitsu", wins: 85, losses: 2, year: 2025, region: "eu" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2025, region: "Random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2025, region: "Random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2025, region: "Random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2025, region: "Random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2024, region: "Random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2024, region: "Random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2024, region: "Random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2024, region: "Random" }
];

// --------------------------
// Load Global Leaderboard Table
// --------------------------
function loadGlobalLeaderboard(filters = {}, tbodyId = "global-standings-body") {
  const { year = "all", character = "all", region = "all", limit = null } = filters;
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  let standings = [...globalTempData];

  // Apply filters
  standings = standings.filter(p =>
    (year === "all" || p.year.toString() === year.toString()) &&
    (character === "all" || p.character.toLowerCase() === character.toLowerCase()) &&
    (region === "all" || p.region.toLowerCase() === region.toLowerCase())
  );

  // Sort by win% descending
  standings.sort((a, b) => {
    const aPct = a.wins / ((a.wins + a.losses) || 1);
    const bPct = b.wins / ((b.wins + b.losses) || 1);
    return bPct - aPct;
  });

  if (limit) standings = standings.slice(0, limit);

  tbody.innerHTML = "";
  standings.forEach((p, i) => {
    const safeChar = p.character ? p.character.toLowerCase() : "";
    const charImg = safeChar
      ? `<img src="${withBase(`/images/games/tk8/characters/characters_select/select_${p.character}.png`)}" 
               alt="${p.character}" width="30" height="30" style="vertical-align:middle; margin-right:6px;">`
      : "";

  const regionImg = p.region
    ? `<img src="${withBase(`/images/games/tk7/regions/${p.region.toLowerCase()}.png`)}" 
            alt="${p.region}" width="35" height="24" style="vertical-align:middle; margin-right:6px;">`
    : "";


    const winPct = (p.wins + p.losses) > 0
      ? ((p.wins / (p.wins + p.losses)) * 100).toFixed(1)
      : "0.0";

    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${charImg}${p.name}</td>
        <td>${p.wins}</td>
        <td>${p.losses}</td>
        <td>${winPct}%</td>
        <td>${regionImg}</td>
      </tr>
    `;
  });
}

// --------------------------
// Populate Global Leaderboard Filters
// --------------------------
function populateLeaderboardFilters() {
  const yearFilter = document.getElementById("yearFilter");
  const characterFilter = document.getElementById("characterFilter");
  const regionFilter = document.getElementById("regionFilter");
  if (!yearFilter || !characterFilter || !regionFilter) return;

  const years = ["all", ...new Set(globalTempData.map(p => p.year).sort((a,b)=>b-a))];
  yearFilter.innerHTML = years.map(y => `<option value="${y}">${y==="all"?"All Time":y}</option>`).join("");

  const chars = ["all", ...new Set(globalTempData.map(p => p.character).filter(Boolean))];
  characterFilter.innerHTML = chars.map(c => `<option value="${c}">${c==="all"?"All Characters":c}</option>`).join("");

  const regions = ["all", ...new Set(globalTempData.map(p => p.region).filter(Boolean))];
  regionFilter.innerHTML = regions.map(r => `<option value="${r}">${r==="all"?"All Regions":r.toUpperCase()}</option>`).join("");

  [yearFilter, characterFilter, regionFilter].forEach(sel => {
    sel.addEventListener("change", () => {
      loadGlobalLeaderboard({
        year: yearFilter.value,
        character: characterFilter.value,
        region: regionFilter.value
      });
    });
  });
}

// --------------------------
// DOM Ready
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  // --------------------------
  // Character Usage Table
  // --------------------------
  if (path.includes("global-statistics.html")) {
    // On stats page: show all and add dropdown for limit
    loadCharacterUsage(null, "char-usage-body"); // Show all characters initially

    const limitSelect = document.getElementById("charLimitSelect");
    if (limitSelect) {
      limitSelect.addEventListener("change", () => {
        const limit = parseInt(limitSelect.value) || null;
        loadCharacterUsage(limit, "char-usage-body");
      });
    }
  } else {
    // On index page: show top 5 only
    loadCharacterUsage(5, "char-usage-body");
  }

  // --------------------------
  // Global Leaderboard
  // --------------------------
  const isGlobalPage = path.includes("global-leaderboard.html");
  if (isGlobalPage) {
    populateLeaderboardFilters();
    loadGlobalLeaderboard({ year: "all", character: "all", region: "all" });
  } else {
    loadGlobalLeaderboard({ limit: 5 });
  }
});

