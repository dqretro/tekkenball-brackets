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
  if (!text) return "";
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function prettifyGameName(raw) {
  if (!raw) return "Fighting Game";
  const key = raw.toLowerCase().replace(/\s+/g, "");
  const map = {
    tekken8: "Tekken 8",
    tekken7: "Tekken 7",
    tekken3: "Tekken 3",
    tekkenball: "Tekken Ball",
    defjamfightforny: "Def Jam: Fight for NY"
  };
  return map[key] || raw.replace(/\b\w/g, c => c.toUpperCase());
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return { slug: params.get("slug"), id: params.get("id") };
}

function normaliseSlug(slug) {
  return (slug ?? "").toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "").trim();
}

// Returns true for DQRetro OR SRKade hosted events
function checkIsPriorityEvent(ev) {
  const name = (ev.name || "").toLowerCase();
  const slug = (ev.slug || "").toLowerCase();
  return name.includes("dqretro") || name.includes("dq retro") || name.includes("dq-retro") ||
         name.includes("srkade") || name.includes("sr kade") ||
         slug.includes("dqretro") || slug.includes("dq-retro") ||
         slug.includes("srkade");
}

function getPriorityLabel(ev) {
  const name = (ev.name || "").toLowerCase();
  const slug = (ev.slug || "").toLowerCase();
  if (name.includes("srkade") || slug.includes("srkade")) return "🎮 SRKade Event";
  if (name.includes("dqretro") || name.includes("dq retro") ||
      name.includes("dq-retro") || slug.includes("dqretro") || slug.includes("dq-retro"))
    return "👑 DQRetro Event";
  return null;
}

// ---------------------------
// Data Loading
// ---------------------------
let cachedBracketsData = null;

async function loadTournamentData() {
  if (cachedBracketsData) return cachedBracketsData;

  try {
    const res = await fetch(withBase("/data/brackets.json"));
    if (res.ok) {
      const rawData = await res.json();
      const tournaments = rawData?.data?.currentUser?.tournaments?.nodes || [];
      if (tournaments.length > 0) {
        cachedBracketsData = { tournaments, isLive: true };
        return cachedBracketsData;
      }
    }
  } catch (err) {
    console.warn("brackets.json fetch failed:", err);
  }

  return { tournaments: [], isLive: false };
}

// ---------------------------
// Tournament Lookup
// ---------------------------
async function findTournament(slug, id) {
  const { tournaments } = await loadTournamentData();

  if (slug) {
    const target = normaliseSlug(slug);
    const found = tournaments.find(t => normaliseSlug(t.slug) === target);
    if (found) return found;
  }

  if (id) {
    return tournaments.find(t => String(t.id) === String(id)) || null;
  }

  return null;
}

// ---------------------------
// Render Events Page
// ---------------------------
async function initEventsPage() {
  const { slug, id } = getQueryParams();

  const headerName      = document.getElementById("tournament-name");
  const headerDate      = document.getElementById("event-date");
  const headerEntrants  = document.getElementById("event-entrants");
  const eventsContainer = document.getElementById("eventsList") || document.getElementById("relatedEvents");
  const backBtn         = document.getElementById("back-to-tournaments");
  const startGgLink     = document.getElementById("showMoreLink");

  if (backBtn) {
    backBtn.innerHTML = `<a href="${withBase("/pages/tournaments/tournaments.html")}" class="button secondary" style="display:inline-block; margin-bottom:16px; text-decoration:none;">← Back to Tournaments</a>`;
  }

  if (!slug && !id) {
    if (headerName) headerName.textContent = "No Tournament Selected";
    if (headerEntrants) headerEntrants.textContent = "Entrants: 0";
    if (eventsContainer) eventsContainer.innerHTML = "<p>Please select a tournament from the tournaments list.</p>";
    return;
  }

  const tournament = await findTournament(slug, id);

  if (!tournament) {
    if (headerName) headerName.textContent = "Tournament Not Found";
    if (headerEntrants) headerEntrants.textContent = "Entrants: 0";
    if (eventsContainer) eventsContainer.innerHTML = `<p>Unable to load events for "<strong>${slug}</strong>". Make sure brackets.json is up to date.</p>`;
    return;
  }

  // Header
  if (headerName) headerName.textContent = tournament.name;
  if (headerDate) {
    const ts = tournament.startAt;
    const dateStr = ts
      ? new Date(ts > 1e11 ? ts : ts * 1000).toLocaleDateString(undefined, {
          year: "numeric", month: "short", day: "numeric"
        })
      : "TBA";
    headerDate.textContent = `Date: ${dateStr}`;
  }

  // Calculate and display total tournament entrants
  let events = tournament.events || [];
  if (headerEntrants) {
    const totalEntrants = events.reduce((sum, ev) => {
      const count = ev.numEntrants || ev.entrants?.pageInfo?.total || (Array.isArray(ev.entrants?.nodes) ? ev.entrants.nodes.length : 0);
      return sum + count;
    }, 0);
    headerEntrants.textContent = `Entrants: ${totalEntrants}`;
  }

  if (startGgLink) {
    startGgLink.href = `https://start.gg/${tournament.slug || slug}`;
    startGgLink.target = "_blank";
    startGgLink.rel = "noopener";
  }

  if (events.length === 0) {
    if (eventsContainer) eventsContainer.innerHTML = "<p>No events found for this tournament.</p>";
    return;
  }

  // Sort: DQRetro/SRKade events first, then everything else alphabetically
  events.sort((a, b) => {
    const aPriority = checkIsPriorityEvent(a) ? 1 : 0;
    const bPriority = checkIsPriorityEvent(b) ? 1 : 0;
    if (bPriority !== aPriority) return bPriority - aPriority;
    return (a.name || "").localeCompare(b.name || "");
  });

  if (!eventsContainer) return;
  eventsContainer.innerHTML = "";

  // Divider tracking
  let shownDivider = false;

  events.forEach(ev => {
    const isPriority = checkIsPriorityEvent(ev);
    const label = getPriorityLabel(ev);
    const gameTitle = prettifyGameName(ev.videogame?.name || ev.game);
    const eventEntrantsCount = ev.numEntrants || ev.entrants?.pageInfo?.total || (Array.isArray(ev.entrants?.nodes) ? ev.entrants.nodes.length : 0);

    // Insert a divider before non-priority events start
    if (!isPriority && !shownDivider) {
      shownDivider = true;
      const divider = document.createElement("div");
      divider.style.cssText = "margin: 20px 0 12px; display:flex; align-items:center; gap:10px;";
      divider.innerHTML = `
        <hr style="flex:1; border:none; border-top:1px solid #333; margin:0;">
        <span style="color:#666; font-size:0.8rem; white-space:nowrap;">Other Events</span>
        <hr style="flex:1; border:none; border-top:1px solid #333; margin:0;">
      `;
      eventsContainer.appendChild(divider);
    }

    const card = document.createElement("div");
    card.className = "event-card";
    card.style.cssText = `
      background: ${isPriority ? "#231b30" : "#1a1a1a"};
      border: 1px solid ${isPriority ? "#7b3ba6" : "#333"};
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    `;

    // Use full event slug for overview link
    const overviewSlug = ev.slug || `${tournament.slug}/event/${slugify(ev.name)}`;
    const overviewUrl  = withBase(`/pages/tournaments/overview.html?slug=${encodeURIComponent(overviewSlug)}`);
    const startggUrl   = ev.slug ? `https://start.gg/${ev.slug}` : `https://start.gg/${tournament.slug}`;

    card.innerHTML = `
      <div>
        ${label ? `<span style="color:#ffd700; font-size:0.8rem; font-weight:bold; display:block; margin-bottom:4px;">${label}</span>` : ""}
        <h3 style="margin:0 0 6px; color:#fff;">${ev.name}</h3>
        <span style="font-size:0.85rem; color:#aaa;">🎮 ${gameTitle}</span>
        ${eventEntrantsCount ? `<span style="font-size:0.85rem; color:#aaa; margin-left:12px;">👥 ${eventEntrantsCount} entrants</span>` : ""}
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
        <a href="${overviewUrl}" class="button primary" style="padding:8px 16px; text-decoration:none; white-space:nowrap;">
          View Overview
        </a>
        <a href="${startggUrl}" target="_blank" rel="noopener noreferrer" class="button" style="padding:8px 16px; text-decoration:none; white-space:nowrap;">
          Start.gg ↗
        </a>
      </div>
    `;

    eventsContainer.appendChild(card);
  });
}

// ---------------------------
// Initialize
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  initEventsPage();
});

window.addEventListener("popstate", () => {
  initEventsPage();
});