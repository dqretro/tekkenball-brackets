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
  { character: "Yoshimitsu", count: 85 },
  { character: "Random", count: 0 },
  { character: "Random", count: 0 },
  { character: "Random", count: 0 },
  { character: "Random", count: 0 },
  { character: "Random", count: 0 },
  { character: "Random", count: 0 },
  { character: "Random", count: 0 }
];

// --------------------------
// Temporary Global Leaderboard Data
// --------------------------
const globalTempData = [
  { name: "PND | Strykie", character: "Yoshimitsu", wins: 85, losses: 2, year: 2025, region: "eu" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2025, region: "random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2025, region: "random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2025, region: "random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2025, region: "random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2024, region: "random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2024, region: "random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2024, region: "random" },
  { name: "Random", character: "Random", wins: 0, losses: 0, year: 2024, region: "random" }
];

// --------------------------
// Character Usage Table
// --------------------------
function loadCharacterUsage(data = charTempData, limit = null, containerId = "char-usage-body") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const stats = [...data].sort((a, b) => b.count - a.count);
  const displayed = limit ? stats.slice(0, limit) : stats;

  const totalCount = stats.reduce((t, c) => t + c.count, 0) || 1;
  container.innerHTML = "";

  displayed.forEach((c, i) => {
    const percent = ((c.count / totalCount) * 100).toFixed(1);
    const safeChar = c.character.toLowerCase();
    const row = `
      <tr>
        <td>${i + 1}</td>
        <td>
          <img src="${withBase(`/images/games/tk8/characters/characters_select/select_${safeChar}.png`)}"
               alt="${c.character}" width="30" height="30"
               style="vertical-align:middle; margin-right:6px;">
          ${c.character}
        </td>
        <td>${c.count}</td>
        <td>${percent}%</td>
      </tr>
    `;
    container.insertAdjacentHTML("beforeend", row);
  });
}

// --------------------------
// Global Leaderboard Table
// --------------------------
function loadGlobalLeaderboard(filters = {}, limit = null, tbodyId = "global-standings-body") {
  const { year = "all", character = "all", region = "all" } = filters;
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  let standings = [...globalTempData];

  standings = standings.filter(p =>
    (year === "all" || p.year.toString() === year.toString()) &&
    (character === "all" || p.character.toLowerCase() === character.toLowerCase()) &&
    (region === "all" || p.region.toLowerCase() === region.toLowerCase())
  );

  standings.sort((a, b) => {
    const aPct = a.wins / ((a.wins + a.losses) || 1);
    const bPct = b.wins / ((b.wins + b.losses) || 1);
    return bPct - aPct;
  });

  if (limit) standings = standings.slice(0, limit);

  tbody.innerHTML = "";
  standings.forEach((p, i) => {
    const safeChar = p.character.toLowerCase();
    const safeRegion = p.region.toLowerCase();
    const setWinPct = ((p.wins / ((p.wins + p.losses) || 1)) * 100).toFixed(1) + "%";

    const row = `
      <tr>
        <td>${i + 1}</td>
        <td>
          <img src="${withBase(`/images/games/tk8/characters/characters_select/select_${safeChar}.png`)}"
               alt="${p.character}" width="30" height="30" style="vertical-align:middle; margin-right:6px;">
          ${p.name}
        </td>
        <td>${p.wins}</td>
        <td>${p.losses}</td>
        <td>${setWinPct}</td>
        <td>
          <img src="${withBase(`/images/games/tk7/regions/${safeRegion}.png`)}"
               alt="${p.region}" width="35" height="24" style="vertical-align:middle; margin-right:6px;">
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", row);
  });
}

// --------------------------
// Populate Filters (optional)
// --------------------------
function populateFilters(yearId, charId, regionId, onChange) {
  const yearFilter = document.getElementById(yearId);
  const charFilter = document.getElementById(charId);
  const regionFilter = document.getElementById(regionId);

  if (yearFilter) {
    const years = ["all", ...new Set(globalTempData.map(p => p.year).sort((a, b) => b - a))];
    yearFilter.innerHTML = years
      .map(y => `<option value="${y}">${y === "all" ? "All Time" : y}</option>`)
      .join("");
    yearFilter.addEventListener("change", onChange);
  }

  if (charFilter) {
    const chars = ["all", ...new Set(charTempData.map(c => c.character))];
    charFilter.innerHTML = chars
      .map(c => `<option value="${c}">${c === "all" ? "All Characters" : c}</option>`)
      .join("");
    charFilter.addEventListener("change", onChange);
  }

  if (regionFilter) {
    const regions = ["all", ...new Set(globalTempData.map(p => p.region))];
    regionFilter.innerHTML = regions
      .map(r => `<option value="${r}">${r === "all" ? "All Regions" : r.toUpperCase()}</option>`)
      .join("");
    regionFilter.addEventListener("change", onChange);
  }
}

// --------------------------
// Update Filter Summary
// --------------------------
function updateFilterSummary() {
  const year = document.getElementById("yearFilter")?.value || "all";
  const character = document.getElementById("characterFilter")?.value || "all";
  const region = document.getElementById("regionFilter")?.value || "all";

  const parts = [];
  if (year !== "all") parts.push(year);
  if (character !== "all") parts.push(character);
  if (region !== "all") parts.push(region.toUpperCase());

  const summaryEl = document.getElementById("filter-summary");
  if (summaryEl) {
    summaryEl.textContent = parts.length
      ? `Tekken Ball Tournaments — Showing ${parts.join(", ")}`
      : `Tekken Ball Tournaments — Showing all data`;
  }
}

// --------------------------
// Filter Data (safe for optional region)
// --------------------------
function filterData() {
  const yearFilter = document.getElementById("yearFilter");
  const charFilter = document.getElementById("characterFilter");
  const regionFilter = document.getElementById("regionFilter");

  return globalTempData.filter(item => {
    const yearMatch = yearFilter ? (yearFilter.value === "all" || item.year == yearFilter.value) : true;
    const charMatch = charFilter ? (charFilter.value === "all" || item.character == charFilter.value) : true;
    const regionMatch = regionFilter ? (regionFilter.value === "all" || item.region == regionFilter.value) : true;
    return yearMatch && charMatch && regionMatch;
  });
}

// --------------------------
// Reset Filters
// --------------------------
function setupResetButton() {
  const resetBtn = document.getElementById("reset-filters");
  if (!resetBtn) return;

  resetBtn.addEventListener("click", () => {
    ["yearFilter", "characterFilter", "regionFilter"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "all";
    });

    updateFilterSummary();

    loadGlobalLeaderboard({
      year: "all",
      character: "all",
      region: "all"
    });

    const filteredData = charTempData.map(c => {
      const count = globalTempData
        .filter(p => p.character.toLowerCase() === c.character.toLowerCase())
        .reduce((sum, p) => sum + p.wins + p.losses, 0);
      return { ...c, count };
    });
    loadCharacterUsage(filteredData);
  });
}

// --------------------------
// DOM Ready
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  const isIndex = path.endsWith("/") || path.endsWith("index.html");
  const tbodyLeaderboard = document.getElementById("global-standings-body");
  const tbodyCharUsage = document.getElementById("char-usage-body");

  // --- Leaderboard ---
  if (tbodyLeaderboard) {
    const limit = isIndex ? 5 : null;

    const updateLeaderboard = () => {
      updateFilterSummary();
      loadGlobalLeaderboard({
        year: document.getElementById("yearFilter")?.value || "all",
        character: document.getElementById("characterFilter")?.value || "all",
        region: document.getElementById("regionFilter")?.value || "all"
      }, limit);
    };

    if (document.getElementById("yearFilter")) {
      populateFilters("yearFilter", "characterFilter", "regionFilter", updateLeaderboard);
    }

    updateLeaderboard();
  }

  // --- Character Usage ---
  if (tbodyCharUsage) {
    const limit = isIndex ? 5 : null;

    const updateStats = () => {
      const year = document.getElementById("yearFilter")?.value || "all";
      const character = document.getElementById("characterFilter")?.value || "all";
      const region = document.getElementById("regionFilter")?.value || "all";

      const filteredData = charTempData.map(c => {
        const count = globalTempData
          .filter(p =>
            (year === "all" || p.year.toString() === year.toString()) &&
            (region === "all" || p.region.toLowerCase() === region.toLowerCase()) &&
            (character === "all" || p.character.toLowerCase() === character.toLowerCase()) &&
            p.character.toLowerCase() === c.character.toLowerCase()
          )
          .reduce((sum, p) => sum + p.wins + p.losses, 0);
        return { ...c, count };
      });

      loadCharacterUsage(filteredData, limit, "char-usage-body");
    };

    if (document.getElementById("yearFilter")) {
      populateFilters("yearFilter", "characterFilter", "regionFilter", updateStats);
    }

    updateStats();
  }

  // --- Setup Reset Button ---
  setupResetButton();
});
