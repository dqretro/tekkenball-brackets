// ===========================
// Global Stats & Chart Logic
// ===========================

let charData = [];
let leaderboardData = [];
let usageChart = null;
const limit = 20;       // Table limit
const chartTopN = 10;   // Top N characters for chart

// ---------------------------
// Base helper for GH Pages vs local
// ---------------------------
function withBase(path) {
  const BASE = window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "";
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? path : "/" + path}`;
}

// ---------------------------
// Small helper to slugify character/region names for filenames
// ---------------------------
function slugify(name) {
  return (name || "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");
}

// ---------------------------
// Generate charData dynamically from leaderboard
// ---------------------------
function generateCharDataFromLeaderboard(maxSlots = chartTopN) {
  const charCounts = {};

  leaderboardData.forEach(p => {
    const char = p.character || "Random";
    if (!charCounts[char]) charCounts[char] = 0;
    charCounts[char]++;
  });

  const sortedChars = Object.keys(charCounts)
    .map(c => ({ character: c, count: charCounts[c] }))
    .sort((a, b) => b.count - a.count);

  return sortedChars.slice(0, maxSlots);
}

// ---------------------------
// Load JSON data
// ---------------------------
async function loadGlobalData() {
  try {
    const res = await fetch(withBase("pages/showcase/global-placeholders.json"));
    if (!res.ok) throw new Error("Network response not ok");
    const data = await res.json();
    leaderboardData = data.globalTempData || [];
    charData = generateCharDataFromLeaderboard(chartTopN);
    console.log("✅ Loaded global data and generated charData dynamically");
  } catch (err) {
    console.warn("⚠️ Could not load JSON, using fallback:", err.message);
    leaderboardData = [{ name: "Fallback Player", character: "Fallback", wins: 0, losses: 0, year: 2025, region: "unknown" }];
    charData = [{ character: "Fallback", count: 1 }];
  }
}

// ---------------------------
// Character Usage Table
// ---------------------------
function loadCharacterUsage(data, limit = null, tbodyId = "char-usage-body") {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  tbody.innerHTML = "";
  const displayed = limit ? data.slice(0, limit) : data;

  const total = data.reduce((sum, x) => sum + x.count, 0) || 1;

  displayed.forEach((c, i) => {
    const percent = ((c.count / total) * 100).toFixed(1);
    const imgName = slugify(c.character);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>
        <img src="${withBase(`/images/games/tk8/characters/characters_select/select_${imgName}.png`)}"
             alt="${c.character}" width="30" height="30" style="vertical-align:middle; margin-right:6px;">
        ${c.character}
      </td>
      <td>${c.count}</td>
      <td>${percent}%</td>
    `;
    tbody.appendChild(row);
  });
}

// ---------------------------
// Character Usage Chart
// ---------------------------
function renderCharacterUsageChart(data) {
  const ctx = document.getElementById("characterUsageChart");
  if (!ctx) return;
  if (usageChart) usageChart.destroy();

  // Generate distinct colors for each character using HSL
  const barColors = data.map((_, i) => {
    const hue = Math.floor((i / data.length) * 360);
    return `hsl(${hue}, 70%, 50%)`;
  });

  usageChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(c => c.character),
      datasets: [{
        label: "Character Usage",
        data: data.map(c => c.count),
        backgroundColor: barColors,
        borderColor: "#fff",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#fff" }, grid: { color: "#444" } },
        y: { ticks: { color: "#fff" }, grid: { color: "#444" } }
      }
    }
  });
}

// ---------------------------
// Leaderboard Table
// ---------------------------
function updateLeaderboard() {
  const tbody = document.getElementById("global-standings-body");
  if (!tbody) return;

  const year = document.getElementById("yearFilter")?.value || "all";
  const character = document.getElementById("characterFilter")?.value || "all";
  const region = document.getElementById("regionFilter")?.value || "all";

  const filtered = leaderboardData
    .filter(p =>
      (year === "all" || p.year.toString() === year.toString()) &&
      (character === "all" || p.character.toLowerCase() === character.toLowerCase()) &&
      (region === "all" || p.region.toLowerCase() === region.toLowerCase())
    )
    .sort((a, b) => (b.wins / ((b.wins + b.losses) || 1)) - (a.wins / ((a.wins + a.losses) || 1)));

  tbody.innerHTML = "";

  filtered.slice(0, limit).forEach((p, i) => {
    const sets = (p.wins + p.losses) || 1;
    const pct = ((p.wins / sets) * 100).toFixed(1);
    const charImg = slugify(p.character);
    const regionImg = slugify(p.region);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>
        <img src="${withBase(`/images/games/tk8/characters/characters_select/select_${charImg}.png`)}"
             alt="${p.character}" width="30" height="30" style="vertical-align:middle; margin-right:6px;">
        ${p.name}
      </td>
      <td>${p.wins}</td>
      <td>${p.losses}</td>
      <td>${pct}%</td>
      <td>
        <img src="${withBase(`/images/games/tk7/regions/${regionImg}.png`)}"
             alt="${p.region}" width="35" height="24" style="vertical-align:middle; margin-right:6px;">
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ---------------------------
// Update Stats (table + chart)
// ---------------------------
function updateStats() {
  const year = document.getElementById("yearFilter")?.value || "all";
  const character = document.getElementById("characterFilter")?.value || "all";
  const region = document.getElementById("regionFilter")?.value || "all";

  const filtered = charData
    .map(c => {
      const count = leaderboardData
        .filter(p =>
          (year === "all" || p.year.toString() === year.toString()) &&
          (region === "all" || p.region.toLowerCase() === region.toLowerCase()) &&
          (character === "all" || p.character.toLowerCase() === character.toLowerCase()) &&
          p.character.toLowerCase() === c.character.toLowerCase()
        )
        .reduce((sum, p) => sum + p.wins + p.losses, 0);

      return { ...c, count };
    })
    .filter(c => c.count > 0);

  loadCharacterUsage(filtered, null);
  renderCharacterUsageChart(filtered.slice(0, chartTopN));
}

// ---------------------------
// Filter Summary
// ---------------------------
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

// ---------------------------
// Reset Filters
// ---------------------------
function setupResetButton() {
  const btn = document.getElementById("reset-filters");
  if (!btn) return;

  btn.addEventListener("click", () => {
    ["yearFilter", "characterFilter", "regionFilter"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "all";
    });

    updateFilterSummary();
    updateStats();
    updateLeaderboard();
  });
}

// ---------------------------
// Populate Filter Options
// ---------------------------
function populateFilters() {
  const yearFilter = document.getElementById("yearFilter");
  const charFilter = document.getElementById("characterFilter");
  const regionFilter = document.getElementById("regionFilter");

  if (yearFilter) {
    const yearsArr = Array.from(new Set(leaderboardData.map(p => p.year))).sort((a, b) => b - a);
    const years = ["all", ...yearsArr];
    yearFilter.innerHTML = years.map(y => `<option value="${y}">${y === "all" ? "All Time" : y}</option>`).join("");
    yearFilter.addEventListener("change", () => { updateStats(); updateLeaderboard(); updateFilterSummary(); });
  }

  if (charFilter) {
    const charArr = Array.from(new Set(leaderboardData.map(p => p.character))).sort((a, b) => a.localeCompare(b));
    const chars = ["all", ...charArr];
    charFilter.innerHTML = chars.map(c => `<option value="${c}">${c === "all" ? "All Characters" : c}</option>`).join("");
    charFilter.addEventListener("change", () => { updateStats(); updateLeaderboard(); updateFilterSummary(); });
  }

  if (regionFilter) {
    const regionArr = Array.from(new Set(leaderboardData.map(p => p.region))).sort((a, b) => a.localeCompare(b));
    const regions = ["all", ...regionArr];
    regionFilter.innerHTML = regions.map(r => `<option value="${r}">${r === "all" ? "All Regions" : r.toUpperCase()}</option>`).join("");
    regionFilter.addEventListener("change", () => { updateStats(); updateLeaderboard(); updateFilterSummary(); });
  }
}

// ---------------------------
// DOM Ready
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  await loadGlobalData();
  populateFilters();
  updateFilterSummary();
  updateStats();
  updateLeaderboard();
  setupResetButton();
});
