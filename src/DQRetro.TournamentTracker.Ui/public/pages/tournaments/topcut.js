/**
 * DQRetro Tournament Tracker — topcut.js
 * Loads Top Cut phase data from Start.gg dataset (/data/brackets.json)
 */

// ---------------------------
// Helpers
// ---------------------------
function withBase(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  return `${base}${path.startsWith("/") ? path : "/" + path}`;
}

function normalizeSlug(slug) {
  return (slug ?? "")
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .trim();
}

// ---------------------------
// Start.gg Data Fetching
// ---------------------------
async function loadAllEvents() {
  let rawEvents = [];
  try {
    const res = await fetch(withBase("/data/brackets.json"));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const liveData = await res.json();
    const tournaments = liveData?.data?.currentUser?.tournaments?.nodes 
                     || liveData?.data?.tournaments 
                     || liveData?.tournaments 
                     || (Array.isArray(liveData) ? liveData : []);

    tournaments.forEach(t => {
      const events = t.events || [];
      events.forEach(e => {
        rawEvents.push({
          ...e,
          _tournamentName: t.name,
          _tournamentSlug: t.slug
        });
      });
    });
  } catch (err) {
    console.error("Error fetching Start.gg data in topcut.js:", err);
  }
  return rawEvents;
}

// ---------------------------
// Main Render Logic
// ---------------------------
async function initTopCut() {
  const container = document.getElementById("topcutContainer");
  const titleEl = document.getElementById("topcut-title");
  const backBtn = document.getElementById("back-button");

  const params = new URLSearchParams(window.location.search);
  const rawEventSlug = params.get("slug");

  // Back Button Navigation Setup
  if (backBtn) {
    const backUrl = rawEventSlug
      ? withBase(`/pages/tournaments/brackets.html?slug=${encodeURIComponent(rawEventSlug)}`)
      : withBase("/pages/tournaments/events.html");
    backBtn.href = backUrl;
  }

  if (!rawEventSlug) {
    if (container) container.innerHTML = `<div class="not-found">No event specified in URL.</div>`;
    return;
  }

  const target = normalizeSlug(rawEventSlug);
  const allEvents = await loadAllEvents();

  // Find event match
  const event = allEvents.find(e => {
    const s = normalizeSlug(e.slug || "");
    return s === target || s.endsWith(target) || target.endsWith(s);
  });

  if (!event) {
    if (container) container.innerHTML = `<div class="not-found">Event not found for slug: "${rawEventSlug}"</div>`;
    return;
  }

  const tourneySlug = event._tournamentSlug || rawEventSlug.split("/event/")[0];

  // Look for explicit Top Cut phase in Start.gg phases structure
  const phasesList = event.phases?.nodes || event.phases || [];
  let topCutPhase = null;
  let topCutSize = event.topcut?.size || null;

  phasesList.forEach(phase => {
    const pName = phase.name || "";
    const nameLower = pName.toLowerCase();
    const topMatch = pName.match(/top\s*(\d+)/i);

    if (topMatch) {
      topCutSize = parseInt(topMatch[1], 10);
      topCutPhase = phase;
    } else if (nameLower.includes("top") || nameLower.includes("final")) {
      topCutPhase = phase;
    }
  });

  // Fallback top cut size calculation
  if (!topCutSize) topCutSize = 12;

  // Header Title
  if (titleEl) {
    const prefix = event._tournamentName ? `${event._tournamentName} — ` : "";
    titleEl.textContent = `${prefix}${event.name ?? "Event"} (Top ${topCutSize})`;
  }
  document.title = `${event.name ?? "Event"} Top ${topCutSize} | DQRetro`;

  // Render Bracket Viewer Iframe inside container
  if (container) {
    const topPhaseId = topCutPhase?.id || "";
    const eventSlug = event.slug || rawEventSlug;
    
    const iframeUrl = `${withBase("/pages/tournaments/bracket/index.html")}?tournament=${encodeURIComponent(tourneySlug)}&event=${encodeURIComponent(eventSlug)}&type=topcut${topPhaseId ? '&phaseId=' + encodeURIComponent(topPhaseId) : ''}`;

    container.innerHTML = `<iframe id="topcut-iframe" src="${iframeUrl}" width="100%" height="700" style="border:none; display:block;"></iframe>`;
  }
}

document.addEventListener("DOMContentLoaded", initTopCut);