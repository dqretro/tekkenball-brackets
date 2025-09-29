// ---------------------------
// Helpers
// ---------------------------
function withBase(path) {
  const BASE = window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "";
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? path : "/" + path}`;
}

function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// Map raw game names to pretty names
function prettifyGameName(raw) {
  if (!raw) return "Unknown";
  const key = raw.toLowerCase().replace(/\s+/g, "");
  const map = { 
    tekken8: "Tekken 8", 
    tekkentag2: "Tekken Tag Tournament 2", 
    tekkentag1: "Tekken Tag Tournament 1", 
    tekken7: "Tekken 7", 
    tekken6: "Tekken 6", 
    tekken5: "Tekken 5", 
    tekken4: "Tekken 4", 
    tekken3: "Tekken 3", 
    tekkenball: "Tekken Ball" 
  };
  return map[key] || raw.replace(/\b\w/g, c => c.toUpperCase());
}

// Convert game name to consistent _gameKey for thumbnails
function gameKeyFromName(name) {
  const map = {
    "tekken 8": "tekken8",
    "tekken tag tournament 2": "tekkentag2",
    "tekken tag tournament 1": "tekkentag1",
    "tekken 7": "tekken7",
    "tekken 6": "tekken6",
    "tekken 5": "tekken5",
    "tekken 4": "tekken4",
    "tekken 3": "tekken3",
    "tekken ball": "tekkenball"
  };
  return map[String(name || "").toLowerCase()] || String(name || "").toLowerCase().replace(/\s/g, "");
}

// ---------------------------
// Placeholder Data
// ---------------------------
let placeholderData = null;

async function loadPlaceholderData() {
  if (placeholderData) return placeholderData;
  try {
    const res = await fetch(withBase("/pages/tournaments/placeholder-data/tournaments-placeholder.json"));
    placeholderData = await res.json();

    // Ensure each event has a slug
    placeholderData.events.forEach(wrapper => {
      wrapper.events.forEach(ev => {
        if (!ev.slug) ev.slug = `${wrapper.slug}-${slugify(ev.name)}`;
      });
    });
  } catch {
    placeholderData = { tournaments: [], events: [] };
  }
  return placeholderData;
}

// ---------------------------
// Fetch All Tournaments
// ---------------------------
async function fetchAllTournaments() {
  try {
    const res = await fetch(withBase("/api/tournaments"));
    const data = await res.json();
    return (data.data?.tournaments || []).map(t => ({
      ...t,
      _gameKey: gameKeyFromName(t.game)
    }));
  } catch {
    const placeholders = await loadPlaceholderData();
    return (placeholders.tournaments || []).map(t => ({
      ...t,
      _gameKey: gameKeyFromName(t.game)
    }));
  }
}

// ---------------------------
// Fetch Tournament by Slug
// ---------------------------
async function fetchTournament(slug) {
  try {
    const res = await fetch(withBase(`/api/tournament?slug=${encodeURIComponent(slug)}`));
    const data = await res.json();
    return data.data?.tournament || null;
  } catch {
    const placeholders = await loadPlaceholderData();
    // Look for event slug inside wrappers
    const wrapper = placeholders.events.find(e => e.events.some(ev => ev.slug === slug));
    if (wrapper) {
      const tournamentMeta = placeholders.tournaments.find(t => t.slug === wrapper.slug);
      return {
        ...tournamentMeta,
        events: wrapper.events.map(ev => ({ ...ev, slug: ev.slug || `${wrapper.slug}-${slugify(ev.name)}` }))
      };
    }
    return null;
  }
}

// ---------------------------
// Game Thumbnails
// ---------------------------
function getGameThumbnail(key) {
  const map = {
    tekken8: "/images/games/tk8/boxart/boxart_tekken8.png",
    tekkentag2: "/images/games/ttt2/boxart/boxart_tekkentag2.png",
    tekkentag1: "/images/games/ttt1/boxart/boxart_tekkentag1.png",
    tekken7: "/images/games/tk7/boxart/boxart_tekken7.png",
    tekken6: "/images/games/tk6/boxart/boxart_tekken6.png",
    tekken5: "/images/games/tk5/boxart/boxart_tekken5.png",
    tekken4: "/images/games/tk4/boxart/boxart_tekken4.png",
    tekken3: "/images/games/tk3/boxart/boxart_tekken3.png",
    tekkenball: "/images/games/tekkenball/boxart/tekkenball.png"
  };
  return map[key] || "/images/games/default.png";
}

// ---------------------------
// Tournaments Landing Page
// ---------------------------
async function loadTournamentsLanding() {
  const container = document.getElementById("tournamentList");
  const gameFilter = document.getElementById("gameFilter");
  const statusFilter = document.getElementById("statusFilter");
  if (!container) return;

  let tournaments = await fetchAllTournaments();

  // Populate Game Filter
  if (gameFilter) {
    const uniqueGames = [...new Set(tournaments.map(t => t._gameKey))];
    gameFilter.innerHTML = `<option value="all">All Games</option>`;
    uniqueGames.forEach(key => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = prettifyGameName(key);
      gameFilter.appendChild(opt);
    });
  }

  function renderList() {
    const selectedGame = gameFilter?.value || "all";
    const selectedStatus = statusFilter?.value || "all";
    container.innerHTML = "";

    tournaments
      .filter(t => (selectedGame === "all" || t._gameKey === selectedGame) &&
                   (selectedStatus === "all" || t.status.toLowerCase() === selectedStatus))
      .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
      .forEach(t => {
        const card = document.createElement("div");
        card.className = "tournament-card";
        card.innerHTML = `
          <img class="tournament-thumbnail" src="${withBase(getGameThumbnail(t._gameKey))}" alt="${prettifyGameName(t.game)}">
          <span class="tournament-badge" data-status="${t.status.toLowerCase()}">${t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span>
          <h2>${t.name}</h2>
          <p>Date: ${t.startAt ? new Date(t.startAt).toLocaleDateString() : "TBA"}</p>
          <p>Game: ${prettifyGameName(t.game)}</p>
        `;

        // Event list section
        if (t.events && t.events.length > 0) {
          const eventList = document.createElement("div");
          eventList.className = "event-links";

          t.events.forEach((ev, idx) => {
            const evLink = document.createElement("a");
            evLink.href = withBase(`/pages/tournaments/events.html?slug=${encodeURIComponent(ev.slug)}`);
            evLink.textContent = ev.name;

            // First event = featured (primary), others = small secondary
            if (idx === 0) {
              evLink.className = "button primary";
            } else {
              evLink.className = "button small secondary";
            }

            evLink.addEventListener("click", e => {
              e.preventDefault();
              window.location.href = evLink.href;
            });
            eventList.appendChild(evLink);
          });

          card.appendChild(eventList);
        } else {
          // fallback if no events found
          const link = document.createElement("a");
          link.href = withBase(`/pages/tournaments/events.html?slug=${encodeURIComponent(t.slug)}`);
          link.textContent = "View Events";
          link.className = "button primary";
          card.appendChild(link);
        }

        container.appendChild(card);
      });
  }

  renderList();
  gameFilter?.addEventListener("change", renderList);
  statusFilter?.addEventListener("change", renderList);
}

// ---------------------------
// DOM Ready
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("tournamentList")) loadTournamentsLanding();
});
