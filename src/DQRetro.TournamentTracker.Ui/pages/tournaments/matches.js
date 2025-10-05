// ===========================
// Matches.js – Pools & Topcut with Characters + Correct Image Paths
// ===========================

// ---------------------------
// Base path helper
// ---------------------------
function withBase(path) {
  const BASE = window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "";
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
// Fetch placeholder JSON
// ---------------------------
async function fetchPlaceholderData() {
  const path = "./placeholder-data/tournaments-placeholder.json"; // relative to matches.html
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("Failed to fetch JSON");
    return await res.json();
  } catch (err) {
    console.error("Failed to load placeholder JSON:", err);
    return { tournaments: [], events: [] };
  }
}

// ---------------------------
// Fetch specific event
// ---------------------------
async function fetchEventData(slug) {
  const data = await fetchPlaceholderData();
  const wrapper = data.events.find(w => w.events.some(ev => ev.slug === slug));
  if (!wrapper) return null;

  const event = wrapper.events.find(ev => ev.slug === slug);
  if (!event) return null;

  const tournament = data.tournaments.find(t => t.slug === wrapper.slug) || { name: "Unknown Tournament" };
  return { event, tournament };
}

// ---------------------------
// Get characters used by a player
// ---------------------------
function getPlayerCharacters(playerName, entrants) {
  const player = (entrants || []).find(p => p.name === playerName);
  return player?.characters?.length ? player.characters : ["Unknown"];
}

// ---------------------------
// Render character images for table
// ---------------------------
function renderCharactersHTML(playerName, entrants) {
  const chars = getPlayerCharacters(playerName, entrants);
  return chars.map(c => `
    <img src="${withBase(`/images/games/tk8/characters/characters_select/select_${slugify(c)}.png`)}"
         alt="${c}" title="${c}" width="24" height="24" style="margin-right:2px;">
  `).join("");
}

// ---------------------------
// Render Pools
// ---------------------------
function renderPools(eventData) {
  const matchesBody = document.getElementById("matches-body");
  if (!matchesBody) return;
  matchesBody.innerHTML = "";

  if (!eventData.pools?.length) {
    matchesBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No pool matches available.</td></tr>`;
    return;
  }

  eventData.pools.forEach((pool, poolIndex) => {
    pool.sets?.forEach((set, idx) => {
      const roundName = `Pool ${poolIndex + 1} Round ${idx + 1}`;
      const player1Name = set.winner || "Unknown";
      const player2Name = set.loser || "Unknown";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${roundName}</td>
        <td>${player1Name}</td>
        <td>${renderCharactersHTML(player1Name, eventData.entrants?.nodes)}</td>
        <td>${set.score || "-"}</td>
        <td>${player2Name}</td>
        <td>${renderCharactersHTML(player2Name, eventData.entrants?.nodes)}</td>
        <td>${set.winner || "Unknown"}</td>
      `;
      matchesBody.appendChild(row);
    });
  });
}

// ---------------------------
// Render Topcut
// ---------------------------
function renderTopcut(eventData) {
  const topcutSection = document.getElementById("topcut-section");
  const topcutBody = document.getElementById("topcut-body");
  if (!topcutSection || !topcutBody) return;

  if (!eventData.topcut?.sets?.length) {
    topcutSection.style.display = "none";
    return;
  }

  topcutSection.querySelector("h2").textContent = `Top ${eventData.topcut.size} Matches`;
  topcutBody.innerHTML = "";

  eventData.topcut.sets.forEach((set, idx) => {
    const roundName = set.round || `Round ${idx + 1}`;
    const player1Name = set.winner || "Unknown";
    const player2Name = set.loser || "Unknown";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${roundName}</td>
      <td>${player1Name}</td>
      <td>${renderCharactersHTML(player1Name, eventData.entrants?.nodes)}</td>
      <td>${set.score || "-"}</td>
      <td>${player2Name}</td>
      <td>${renderCharactersHTML(player2Name, eventData.entrants?.nodes)}</td>
      <td>${set.winner || "Unknown"}</td>
    `;
    topcutBody.appendChild(row);
  });

  topcutSection.style.display = "block";
}

// ---------------------------
// Back to Events Button
// ---------------------------
function setupBackToEvents() {
  const backBtn = document.getElementById("back-to-events");
  if (!backBtn) return;
  backBtn.innerHTML = `<a href="../../events.html" class="back-button pool-card">← Back to Events</a>`;
}

// ---------------------------
// Load Event & Render All Matches
// ---------------------------
async function loadEventMatches(slug) {
  const data = await fetchEventData(slug);
  if (!data) {
    showNotFound(`Event with slug "${slug}" not found. Please return to Events.`);
    return null;
  }

  const { event, tournament } = data;

  const headerEl = document.getElementById("standings-title");
  if (headerEl) headerEl.textContent = `${tournament.name} - ${event.name}`;

  renderPools(event);
  renderTopcut(event);
  setupBackToEvents();

  return data;
}

// ---------------------------
// Initialize
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug) {
    showNotFound("No event specified. Please return to Events.");
    return;
  }

  await loadEventMatches(slug);

  window.addEventListener("popstate", async () => {
    const newSlug = new URLSearchParams(window.location.search).get("slug");
    if (!newSlug) return;
    await loadEventMatches(newSlug);
  });
});
