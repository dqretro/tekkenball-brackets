// ---------------------------
// Helpers
// ---------------------------
function withBase(path) {
  const BASE = window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "";
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? path : "/" + path}`;
}

function slugify(name) {
  return (name || "").toString().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");
}

function playerSlugify(name) {
  return (name || "").toString().toLowerCase()
    .replace(/\s*\|\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

// ---------------------------
// Data caches
// ---------------------------
let placeholderData = null;
let playersData = null;

// ---------------------------
// Load placeholder tournaments
// ---------------------------
async function loadPlaceholderData() {
  if (placeholderData) return placeholderData;
  try {
    const res = await fetch(withBase("/pages/tournaments/placeholder-data/tournaments-placeholder.json"));
    placeholderData = await res.json();

    placeholderData.events.forEach(wrapper => {
      wrapper.events.forEach(ev => {
        if (!ev.slug) ev.slug = `${wrapper.slug}-${ev.name.toLowerCase().replace(/\s+/g, "-")}`;
      });
    });
  } catch {
    placeholderData = { tournaments: [], events: [] };
  }
  return placeholderData;
}

// ---------------------------
// Load players.json for avatars
// ---------------------------
async function loadPlayersData() {
  if (playersData) return playersData;
  try {
    const res = await fetch(withBase("/pages/player-profiles/players/players.json"));
    playersData = await res.json();
  } catch {
    playersData = [];
  }
  return playersData;
}

// ---------------------------
// Load Event Info
// ---------------------------
async function loadEventStats(slug) {
  if (!slug) return;
  const data = await loadPlaceholderData();

  let foundEvent = null, tournamentMeta = null;
  for (const wrapper of data.events) {
    const ev = wrapper.events.find(e => e.slug === slug);
    if (ev) {
      foundEvent = ev;
      tournamentMeta = data.tournaments.find(t => t.slug === wrapper.slug);
      break;
    }
  }
  if (!foundEvent || !tournamentMeta) return;

  const titleEl = document.getElementById("standings-title");
  if (titleEl) {
    const overviewUrl = withBase(`/pages/tournaments/overview.html?slug=${encodeURIComponent(foundEvent.slug)}`);
    titleEl.innerHTML = `<a href="${overviewUrl}">${tournamentMeta.name} - ${foundEvent.name}</a>`;
  }

  return foundEvent;
}

// ---------------------------
// Render Standings Table
// ---------------------------
async function loadStandings(slug) {
  if (!slug) return;

  const [event, allPlayers] = await Promise.all([
    loadEventStats(slug),
    loadPlayersData()
  ]);

  const tbody = document.getElementById("standings-body");
  if (!event || !tbody) return;

  tbody.innerHTML = "";

  const entrants = event.entrants?.nodes || [];
  if (!entrants.length) {
    tbody.innerHTML = `<tr><td colspan="6">No entrants / standings available.</td></tr>`;
    return;
  }

  const isOverview = window.location.pathname.includes("overview.html");
  const limit = isOverview ? Math.min(8, entrants.length) : entrants.length;

  entrants.slice(0, limit).forEach((player, index) => {
    const stats = player.standing?.stats || {};

    const playerSlug = playerSlugify(player.name);

    // Find real player info from players.json to get avatar
    const realPlayer = allPlayers.find(p => playerSlugify(p.name) === playerSlug);
    const avatarSrc = realPlayer?.avatar || withBase("/images/placeholders/icons-profile/icon-pfp-player.png");

    // Character icons
    const charsHTML = (player.characters || []).map(c =>
      `<img src="${withBase(`/images/games/tk8/characters/characters_select/select_${slugify(c)}.png`)}" title="${c}">`
    ).join("");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td class="player-cell">
        <a href="#" onclick="checkPlayerExists(event, '${playerSlug}')">
          <img src="${avatarSrc}" class="player-avatar-table" alt="${player.name}">
          <span class="player-name-text">${player.name}</span>
        </a>
        <span class="character-icons">${charsHTML}</span>
      </td>
      <td>${stats.wins?.value ?? player.wins ?? "-"}</td>
      <td>${stats.losses?.value ?? player.losses ?? "-"}</td>
      <td>${stats.score?.value != null ? stats.score.value.toFixed(2) + "%" : "-"}</td>
      <td>${stats.lostTo?.value || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------------------
// Check Player Exists
// ---------------------------
async function checkPlayerExists(event, slug) {
  event.preventDefault();
  if (!slug) return;

  const allPlayers = await loadPlayersData();
  const exists = allPlayers.some(p => playerSlugify(p.name) === slug);
  if (!exists) return alert("Player not found.");

  window.location.href = withBase(`/pages/player-profiles/players/players.html?player=${encodeURIComponent(slug)}`);
}

// ---------------------------
// Init
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const urlSlug = new URLSearchParams(window.location.search).get("slug");
  if (urlSlug) await loadStandings(urlSlug);

  // Only reload table on popstate if not overview.html
  if (!window.location.pathname.includes("overview.html")) {
    window.addEventListener("popstate", async () => {
      const newSlug = new URLSearchParams(window.location.search).get("slug");
      if (newSlug) await loadStandings(newSlug);
    });
  }
});
