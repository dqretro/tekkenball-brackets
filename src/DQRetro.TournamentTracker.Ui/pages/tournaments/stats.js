// ===========================
// Event Stats & Character Usage + Pools/Topcut + Overall Stats
// ===========================

let placeholderData = null;
let charData = [];
let leaderboardData = [];
let usageChart = null;
const chartTopN = 10; // Top N characters for chart

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
// Slugify names
// ---------------------------
function slugify(name) {
  return (name || "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");
}

// ---------------------------
// Load placeholder JSON once
// ---------------------------
async function fetchPlaceholderData() {
  if (placeholderData) return placeholderData;

  try {
    const res = await fetch(withBase("pages/tournaments/placeholder-data/tournaments-placeholder.json"));
    if (!res.ok) throw new Error("Failed to fetch JSON");
    placeholderData = await res.json();

    placeholderData.events.forEach(wrapper => {
      wrapper.events.forEach(ev => {
        if (!ev.slug) ev.slug = `${wrapper.slug}-${ev.name.toLowerCase().replace(/\s+/g, "-")}`;
      });
    });
  } catch (err) {
    console.error("Failed to load placeholder JSON:", err);
    placeholderData = { tournaments: [], events: [] };
  }

  return placeholderData;
}

// ---------------------------
// Fetch specific event by slug
// ---------------------------
async function fetchEventData(slug) {
  const data = await fetchPlaceholderData();
  const wrapper = data.events.find(w => w.events.some(ev => ev.slug === slug));
  if (!wrapper) return null;
  const eventData = wrapper.events.find(ev => ev.slug === slug);
  if (!eventData) return null;
  const tournamentMeta = data.tournaments.find(t => t.slug === wrapper.slug);

  return {
    event: eventData,
    tournament: tournamentMeta || { name: "Unknown Tournament" }
  };
}

// ---------------------------
// Generate charData from leaderboard
// ---------------------------
function generateCharDataFromLeaderboard(maxSlots = chartTopN) {
  const charCounts = {};
  leaderboardData.forEach(p => {
    const char = p.character || "Random";
    charCounts[char] = (charCounts[char] || 0) + 1;
  });

  return Object.keys(charCounts)
    .map(c => ({ character: c, count: charCounts[c] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxSlots);
}

// ---------------------------
// Character Usage Table
// ---------------------------
function loadCharacterUsage(data, containerId = "stats-container") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = `<div class="not-found">No character usage data available.</div>`;
    return;
  }

  data.forEach(c => {
    const percent = ((c.count / leaderboardData.length) * 100).toFixed(1);
    const imgName = slugify(c.character);

    const card = document.createElement("div");
    card.className = "pool-card";
    card.innerHTML = `
      <img src="${withBase(`/images/games/tk8/characters/characters_select/select_${imgName}.png`)}"
           alt="${c.character}" width="24" height="24">
      ${c.character} — ${c.count} (${percent}%)
    `;
    container.appendChild(card);
  });
}

// ---------------------------
// Character Usage Chart
// ---------------------------
function renderCharacterUsageChart(data) {
  const ctx = document.getElementById("characterUsageChart");
  if (!ctx) return;
  if (usageChart) usageChart.destroy();
  if (!data.length) return;

  const barColors = data.map((_, i) => `hsl(${Math.floor((i/data.length)*360)}, 70%, 50%)`);

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
// Render Pools (read-only)
function renderPools(eventData) {
  const container = document.getElementById("pools-container");
  if (!container) return;
  container.innerHTML = "";

  if (!eventData.pools?.length) {
    container.innerHTML = `<div class="not-found">No pool data available.</div>`;
    return;
  }

  eventData.pools.forEach(pool => {
    const poolDiv = document.createElement("div");
    poolDiv.className = "pool-card";

    let setsHtml = "";
    if (pool.sets?.length) {
      setsHtml = pool.sets.map((s, idx) => {
        const statusClass = s.winner || s.score ? "completed" : "missing";
        const display = s.players ? `${s.players.join(" vs ")} (${s.winner || "?"})` : "Set info missing";
        const tooltipText = s.winner || s.score ? `Completed: ${s.winner || "?"}` : "Match not reported";

        return `<div class="set ${statusClass}">
                  Set ${idx + 1}: ${display}
                  <span class="tooltip">${tooltipText}</span>
                </div>`;
      }).join("");
    }

    poolDiv.innerHTML = `
      <strong>${pool.name}</strong> — Players: ${pool.players.join(", ")}
      <div class="sets-container">${setsHtml}</div>
    `;
    container.appendChild(poolDiv);
  });
}

// ---------------------------
// Render Topcut (read-only)
function renderTopcut(eventData) {
  const container = document.getElementById("topcut-container");
  if (!container) return;
  container.innerHTML = "";

  if (!eventData.topcut) {
    container.innerHTML = `<div class="not-found">No topcut data available.</div>`;
    return;
  }

  let setsHtml = "";
  if (eventData.topcut.sets?.length) {
    setsHtml = eventData.topcut.sets.map((s, idx) => {
      const statusClass = s.winner || s.score ? "completed" : "missing";
      const display = s.players ? `${s.players.join(" vs ")} (${s.winner || "?"})` : "Set info missing";
      const tooltipText = s.winner || s.score ? `Completed: ${s.winner || "?"}` : "Match not reported";

      return `<div class="set ${statusClass}">
                Set ${idx + 1}: ${display}
                <span class="tooltip">${tooltipText}</span>
              </div>`;
    }).join("");
  }

  const topcutDiv = document.createElement("div");
  topcutDiv.className = "pool-card";
  topcutDiv.innerHTML = `
    <strong>Top ${eventData.topcut.size}</strong> — Players: ${eventData.topcut.players.join(", ")}
    <div class="sets-container">${setsHtml}</div>
  `;
  container.appendChild(topcutDiv);
}

// ---------------------------
// Render Overall Stats
// ---------------------------
function renderOverallStats(eventData) {
  const container = document.getElementById("overall-stats");
  if (!container) return;

  const poolMatchesReported = eventData.pools?.reduce((sum, p) => sum + (p.sets?.filter(s => s.winner || s.score).length || 0), 0) || 0;
  const totalPoolMatches = eventData.pools?.reduce((sum, p) => sum + (p.sets?.length || 0), 0) || 0;
  const topcutMatchesReported = eventData.topcut?.sets?.filter(s => s.winner || s.score).length || 0;
  const totalTopcutMatches = eventData.topcut?.sets?.length || 0;

  const matchesReported = poolMatchesReported + topcutMatchesReported;
  const totalMatches = totalPoolMatches + totalTopcutMatches;
  const missingMatches = totalMatches - matchesReported;

  const top8 = leaderboardData.slice(0, 8);

  container.innerHTML = `
    <div style="width:100%; text-align:center; margin-bottom:12px; font-weight:bold;">
      ${matchesReported} / ${totalMatches} Matches Reported
      ${missingMatches ? ` — ${missingMatches} missing` : ""}
    </div>
    ${top8.map((player, i) => `
      <div class="stat-item">
        <img src="${withBase('/images/placeholders/icons-profile/icon-pfp-discord.png')}" alt="${player.name}">
        <div class="position">${i+1}${i===0?'st':i===1?'nd':i===2?'rd':'th'}</div>
        <div class="name">${player.name}</div>
        <div class="subtext">${player.character || ''}</div>
      </div>
    `).join('')}
  `;
}

// ---------------------------
// Render Event Stats
// ---------------------------
async function renderEventStats(slug) {
  const data = await fetchEventData(slug);
  if (!data) return null;

  const { event: eventData, tournament } = data;

  leaderboardData = eventData.entrants?.nodes.map(p => ({
    name: p.name,
    character: p.character || "Random"
  })) || [];

  charData = generateCharDataFromLeaderboard(chartTopN);

  loadCharacterUsage(charData);
  renderCharacterUsageChart(charData);
  renderPools(eventData);
  renderTopcut(eventData);
  renderOverallStats(eventData);

  return { name: eventData.name, tournamentName: tournament.name };
}

// ---------------------------
// Initialize on DOM Ready
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  const headerEl = document.getElementById("standings-title");

  if (!slug) {
    showNotFound("No event specified. Please return to Events.");
    return;
  }

  const event = await renderEventStats(slug);
  if (!event) {
    showNotFound(`Event with slug "${slug}" not found. Please return to Events.`);
    return;
  }

  if (headerEl) headerEl.textContent = `${event.tournamentName} - ${event.name}`;

  window.addEventListener("popstate", async () => {
    const newSlug = new URLSearchParams(window.location.search).get("slug");
    if (!newSlug) return;
    const newEvent = await renderEventStats(newSlug);
    if (headerEl && newEvent) headerEl.textContent = `${newEvent.tournamentName} - ${newEvent.name}`;
  });
});
