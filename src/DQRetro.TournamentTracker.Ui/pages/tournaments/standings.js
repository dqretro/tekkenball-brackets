// ---------------------------
// Helpers (reuse from tournaments.js)
// ---------------------------
function withBase(path) {
  const BASE = window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "";
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? path : "/" + path}`;
}

// Simple slugify for character images
function slugify(name) {
  return (name || "").toString().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");
}

let placeholderData = null;

async function loadPlaceholderData() {
  if (placeholderData) return placeholderData;
  try {
    const res = await fetch(withBase("/pages/tournaments/placeholder-data/tournaments-placeholder.json"));
    placeholderData = await res.json();

    // Ensure all events have a slug
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
// Load Event Info (title, back link, and summary)
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

  // Update header title
  const titleEl = document.getElementById("standings-title");
  if (titleEl) {
    const overviewUrl = withBase(`/pages/tournaments/overview.html?slug=${encodeURIComponent(foundEvent.slug)}`);
    titleEl.innerHTML = `<a href="${overviewUrl}">${tournamentMeta.name} - ${foundEvent.name}</a>`;
  }

  // Back button logic
  const backOverviewEl = document.getElementById("back-to-overview");
  const backEventsEl = document.getElementById("back-to-events");
  const backTournamentsEl = document.getElementById("back-to-tournaments");

  if (window.location.pathname.includes("standings.html")) {
    if (backOverviewEl) backOverviewEl.innerHTML = `<a href="${withBase(`/pages/tournaments/overview.html?slug=${encodeURIComponent(foundEvent.slug)}`)}" class="button secondary">← Back to Overview</a>`;
  } else if (window.location.pathname.includes("overview.html")) {
    if (backEventsEl) backEventsEl.innerHTML = `<a href="${withBase("/pages/tournaments/events.html?slug=" + encodeURIComponent(tournamentMeta.slug))}" class="button secondary">← Back to Events</a>`;
  } else if (window.location.pathname.includes("events.html")) {
    if (backTournamentsEl) backTournamentsEl.innerHTML = `<a href="${withBase("/pages/tournaments/tournaments.html")}" class="button secondary">← Back to Tournaments</a>`;
  }

  return foundEvent;
}

// ---------------------------
// Render all character icons (chronological, including main)
// ---------------------------
function renderCharacterIcons(characters) {
  if (!characters || !characters.length) return "";
  
  return characters.map(c => {
    const slug = slugify(c);
    return `<img src="${withBase(`/images/games/tk8/characters/characters_select/select_${slug}.png`)}" title="${c}">`;
  }).join("");
}

// ---------------------------
// Load Standings Table
// ---------------------------
async function loadStandings(slug) {
  if (!slug) return;
  const event = await loadEventStats(slug);
  const tbody = document.getElementById("standings-body");
  if (!event || !tbody) return;

  const entrants = event.entrants?.nodes || [];
  if (!entrants.length) {
    tbody.innerHTML = `<tr><td colspan="6">No entrants / standings available.</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  const limit = window.location.pathname.includes("overview.html") ? 8 : entrants.length;

  entrants.slice(0, limit).forEach((player, index) => {
    const stats = player.standing?.stats || {};
    const tr = document.createElement("tr");

    // Main character
    const mainCharHTML = player.characters?.[0]
      ? `<img src="${withBase(`/images/games/tk8/characters/characters_select/select_${slugify(player.characters[0])}.png`)}" class="main-character" title="${player.characters[0]}">`
      : "";

    // Alt characters only (exclude main)
    const altChars = player.characters?.slice(1) || [];
    const altCharsHTML = altChars
      .map(c => `<img src="${withBase(`/images/games/tk8/characters/characters_select/select_${slugify(c)}.png`)}" class="alt-character" title="${c}">`)
      .join("");

    tr.innerHTML = `
<td>${index + 1}</td>
<td class="player-cell">
  <span class="main-character-wrapper">${mainCharHTML}</span>
  <span class="player-name">
    <span class="name-text">${player.name}</span>
    <span class="character-icons">${altCharsHTML}</span>
  </span>
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
// Initialize on DOM Ready
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const urlSlug = new URLSearchParams(window.location.search).get("slug");
  if (!urlSlug) return;

  await loadStandings(urlSlug);

  window.addEventListener("popstate", async () => {
    const newSlug = new URLSearchParams(window.location.search).get("slug");
    if (newSlug) await loadStandings(newSlug);
  });
});
