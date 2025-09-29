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

function prettifyGameName(raw) {
  if (!raw) return "Unknown";
  const key = raw.toLowerCase().replace(/\s+/g, "");
  const map = { tekken8: "Tekken 8", tekken7: "Tekken 7", tekken3: "Tekken 3", tekkenball: "Tekken Ball" };
  return map[key] || raw.replace(/\b\w/g, c => c.toUpperCase());
}

function getCurrentSlug() {
  return new URLSearchParams(window.location.search).get("slug");
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

    // Ensure every event has a slug
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
// Fetch Tournament by Event Slug
// ---------------------------
async function fetchTournament(slug) {
  const data = await loadPlaceholderData();

  // Check if slug is an event slug
  const wrapper = data.events.find(e => e.events.some(ev => ev.slug === slug));
  if (wrapper) {
    const tournamentMeta = data.tournaments.find(t => t.slug === wrapper.slug);
    return { ...tournamentMeta, events: wrapper.events };
  }

  // If slug is a tournament slug, redirect to first event
  const tournamentWrapper = data.events.find(e => e.slug === slug);
  if (tournamentWrapper) {
    const firstEvent = tournamentWrapper.events?.[0];
    return { ...data.tournaments.find(t => t.slug === slug), events: tournamentWrapper.events, _redirectToEvent: firstEvent?.slug };
  }

  return null;
}

// ---------------------------
// Load Event Stats
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

  const infoMap = {
    "tournament-name": tournamentMeta.name,
    "event-name": foundEvent.name,
    "event-date": `Date: ${foundEvent.startAt ? new Date(foundEvent.startAt).toLocaleDateString() : "TBA"}`,
    "event-game": `Game: ${foundEvent.game ?? "Unknown"}`,
    "event-entrants": `Entrants: ${foundEvent.entrants?.nodes?.length ?? 0}`
  };

  Object.entries(infoMap).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });

  // Back to Tournaments
  const backTournamentsEl = document.getElementById("back-to-tournaments");
  if (backTournamentsEl) {
    backTournamentsEl.innerHTML = `<a href="${withBase("/pages/tournaments/tournaments.html")}" class="button secondary">← Back to Tournaments</a>`;
  }
}

// ---------------------------
// Initialize Event Page
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  let slug = getCurrentSlug();
  const placeholders = await loadPlaceholderData();

  // If no slug in URL, default to first tournament's first event
  if (!slug) {
    slug = placeholders.events?.[0]?.events?.[0]?.slug || null;
    if (slug) window.history.replaceState({}, "", `?slug=${encodeURIComponent(slug)}`);
  }

  if (!slug) return;

  let tournament = await fetchTournament(slug);

  // Redirect to first event if slug was tournament slug
  if (tournament?._redirectToEvent) {
    slug = tournament._redirectToEvent;
    window.history.replaceState({}, "", `?slug=${encodeURIComponent(slug)}`);
    tournament = await fetchTournament(slug);
  }

  await loadEventStats(slug);

  // Populate Related Events
  const relatedEventsContainer = document.getElementById("relatedEvents");
  if (!tournament || !relatedEventsContainer) return;

  relatedEventsContainer.innerHTML = "";
  (tournament.events || []).forEach(ev => {
    const link = document.createElement("a");
    link.textContent = ev.name;
    if (ev.slug === slug) link.classList.add("active-event");

    link.href = withBase(`/pages/tournaments/overview.html?slug=${encodeURIComponent(ev.slug)}`);
    link.addEventListener("click", e => {
      e.preventDefault();
      window.location.href = link.href;
    });

    relatedEventsContainer.appendChild(link);
  });

  // Update Show More link
  const showMoreLink = document.getElementById("showMoreLink");
  if (showMoreLink) showMoreLink.href = `https://www.start.gg/tournament/${tournament.slug}/events`;

  // Handle browser back/forward navigation
  window.addEventListener("popstate", async () => {
    const newSlug = getCurrentSlug();
    if (newSlug) {
      await loadEventStats(newSlug);
      relatedEventsContainer.querySelectorAll("a").forEach(a => a.classList.remove("active-event"));
      const activeLink = Array.from(relatedEventsContainer.children).find(a => a.href.includes(newSlug));
      if (activeLink) activeLink.classList.add("active-event");
    }
  });
});
