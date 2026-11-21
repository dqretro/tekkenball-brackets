/**
 * DQRetro Tournament Tracker Frontend Controller
 */

// ---------------------------
// Config & Manual Overrides
// ---------------------------
const MANUAL_TOURNAMENTS = [];

let cachedTournaments = null;

// ---------------------------
// Path & URL Helpers
// ---------------------------
function withBase(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;

  const base = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  const cleanPath = path.startsWith("/") ? path : "/" + path;
  return `${base}${cleanPath}`;
}

function parseTournamentState(state) {
  switch (state) {
    case 1: return "Upcoming";
    case 2: return "Live / Ongoing";
    case 3: return "Completed";
    default: return "Completed";
  }
}

function formatGamesDisplay(t) {
  if (!t.events || t.events.length === 0) return "Various Games";
  const names = t.events.map(e => e.videogame?.name || e.name).filter(Boolean);
  return [...new Set(names)].join(", ");
}

function getTournamentIcon(t) {
  if (t.images && t.images.length > 0) {
    const profileImg = t.images.find(img => img.type === "profile");
    if (profileImg?.url) return profileImg.url;
    if (t.images[0]?.url) return t.images[0].url;
  }
  return withBase("/images/placeholders/icons-profile/icon-pfp-player.png");
}

function checkIsDQRetro(t) {
  const nameMatch = (t.name || "").toLowerCase().includes("dqretro") || (t.name || "").toLowerCase().includes("dq retro");
  const slugMatch = (t.slug || "").toLowerCase().includes("dqretro") || (t.slug || "").toLowerCase().includes("dq-retro");
  return nameMatch || slugMatch;
}

function checkIsOffline(t) {
  return t.hasOfflineEvents ?? true;
}

// ---------------------------
// Data Fetching
// ---------------------------
async function fetchAllTournaments() {
  if (cachedTournaments) return cachedTournaments;

  let fetchedApiTournaments = [];

  try {
    const res = await fetch(withBase("/data/brackets.json"));
    if (res.ok) {
      const rawData = await res.json();
      const rawTournaments = rawData?.data?.currentUser?.tournaments?.nodes || rawData?.tournaments || [];

      fetchedApiTournaments = rawTournaments.map(t => {
        const slug = t.slug || "";
        const internalUrl = slug ? withBase(`/pages/tournaments/events.html?slug=${encodeURIComponent(slug)}`) : "#";

        return {
          id: t.id,
          name: t.name,
          slug: slug,
          url: internalUrl,
          status: parseTournamentState(t.state),
          events: t.events || [],
          gamesDisplay: formatGamesDisplay(t),
          iconUrl: getTournamentIcon(t),
          isHostedByDQ: checkIsDQRetro(t),
          isOffline: checkIsOffline(t),
          startAt: t.startAt ? t.startAt * 1000 : null
        };
      });
    }
  } catch (err) {
    console.warn("brackets.json fetch failed, relying on manual entry list:", err);
  }

  const processedManuals = MANUAL_TOURNAMENTS.map(t => ({
    ...t,
    iconUrl: t.iconUrl && t.iconUrl.trim() !== "" ? t.iconUrl : withBase("/images/placeholders/icons-profile/icon-pfp-player.png")
  }));

  cachedTournaments = [...fetchedApiTournaments, ...processedManuals];
  return cachedTournaments;
}

// ---------------------------
// Sorting & Filtering
// ---------------------------
function sortTournaments(tournaments, sortOption = "date-desc") {
  return [...tournaments].sort((a, b) => {
    const timeA = a.startAt || 0;
    const timeB = b.startAt || 0;

    switch (sortOption) {
      case "date-asc":
        return timeA - timeB;
      case "alpha-asc":
        return a.name.localeCompare(b.name);
      case "alpha-desc":
        return b.name.localeCompare(a.name);
      case "date-desc":
      default:
        return timeB - timeA;
    }
  });
}

function applyFilters(tournaments) {
  const searchInput = document.getElementById("searchFilter")?.value.toLowerCase() || "";
  const categoryFilter = document.getElementById("categoryFilter")?.value || "all";
  const statusFilter = document.getElementById("statusFilter")?.value || "all";
  const sortFilter = document.getElementById("sortFilter")?.value || "date-desc";

  const filtered = tournaments.filter(t => {
    // Search Filter
    const matchesSearch = (t.name || "").toLowerCase().includes(searchInput) ||
                          (t.gamesDisplay || "").toLowerCase().includes(searchInput);

    // Status Filter
    let matchesStatus = true;
    if (statusFilter === "completed") matchesStatus = t.status === "Completed";
    if (statusFilter === "ongoing") matchesStatus = t.status === "Live / Ongoing";
    if (statusFilter === "upcoming") matchesStatus = t.status === "Upcoming";

    // Category Filter
    let matchesCategory = true;
    if (categoryFilter === "dqretro") matchesCategory = t.isHostedByDQ;
    if (categoryFilter === "vsfighting") matchesCategory = (t.slug || "").includes("vsfighting");
    if (categoryFilter === "offline") matchesCategory = t.isOffline;
    if (categoryFilter === "online") matchesCategory = !t.isOffline;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const sortedAndFiltered = sortTournaments(filtered, sortFilter);
  renderTournaments(sortedAndFiltered);
}

// ---------------------------
// Rendering & UI
// ---------------------------
function renderTournaments(tournaments) {
  const container = document.getElementById("tournamentList");
  if (!container) return;

  if (tournaments.length === 0) {
    container.innerHTML = `<div class="no-results"><p>No tournaments found matching your criteria.</p></div>`;
    return;
  }

  const fallbackIcon = withBase("/images/placeholders/icons-profile/icon-pfp-player.png");

  container.innerHTML = tournaments.map(t => {
    const dateStr = t.startAt ? new Date(t.startAt).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    }) : 'TBD';

    const statusClass = t.status.toLowerCase().replace(/[^a-z]/g, '');

    return `
      <div class="tournament-card">
        <div class="card-header">
          <img src="${t.iconUrl}" alt="${t.name}" class="tournament-icon" onerror="this.onerror=null;this.src='${fallbackIcon}'" />
          <span class="badge badge-${statusClass}">${t.status}</span>
        </div>
        <div class="card-body">
          <h3 class="tournament-title">${t.name}</h3>
          <p class="tournament-game"><strong>Game:</strong> ${t.gamesDisplay}</p>
          <p class="tournament-date"><strong>Date:</strong> ${dateStr}</p>
          <p class="tournament-type"><strong>Type:</strong> ${t.isOffline ? 'Offline LAN' : 'Online'}</p>
        </div>
        <div class="card-footer">
          <a href="${t.url}" class="btn btn-primary">View Bracket</a>
        </div>
      </div>
    `;
  }).join('');
}

// ---------------------------
// Initialization
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const tournaments = await fetchAllTournaments();
  
  // Render sorted by Latest by default
  applyFilters(tournaments);

  // Attach event listeners for real-time filtering and sorting
  const searchInput = document.getElementById("searchFilter");
  const sortFilter = document.getElementById("sortFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const statusFilter = document.getElementById("statusFilter");

  searchInput?.addEventListener("input", () => applyFilters(tournaments));
  sortFilter?.addEventListener("change", () => applyFilters(tournaments));
  categoryFilter?.addEventListener("change", () => applyFilters(tournaments));
  statusFilter?.addEventListener("change", () => applyFilters(tournaments));
});