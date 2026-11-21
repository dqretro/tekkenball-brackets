/**
 * DQRetro Tournament Tracker — brackets.js
 * Parses Start.gg Phases, Pools, and Top Cut stages into an integrated view.[cite: 4, 5]
 */

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

function setupBackToEvents(rawSlug) {
  const btn = document.getElementById("back-to-events");
  if (!btn) return;

  let tournamentSlug = rawSlug || "";
  if (tournamentSlug.includes("/event/")) {
    tournamentSlug = tournamentSlug.split("/event/")[0];
  }

  const backUrl = tournamentSlug
    ? withBase(`/pages/tournaments/events.html?slug=${encodeURIComponent(tournamentSlug)}`)
    : withBase("/pages/tournaments/events.html");

  btn.innerHTML = `<a href="${backUrl}" class="back-button pool-card" style="padding: 8px 14px; background: var(--panel); border-radius: 6px; color: var(--text); text-decoration: none; border: 1px solid var(--line);">← Back to Events</a>`;
}

async function loadAllEvents() {
  try {
    const res = await fetch(withBase("/data/brackets.json"));
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch brackets data`);

    const liveData = await res.json();
    const tournaments = liveData?.data?.currentUser?.tournaments?.nodes 
                     || liveData?.data?.tournaments 
                     || liveData?.tournaments 
                     || (Array.isArray(liveData) ? liveData : []);

    let rawEvents = [];
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
    return rawEvents;
  } catch (err) {
    console.error("Error loading Start.gg data:", err);
    return [];
  }
}

function renderBracketSidebar(bracketGroups, tournamentSlug, eventSlug) {
  const container = document.getElementById("poolsContainer");
  const iframe = document.getElementById("bracket-iframe");
  const titleHeader = document.getElementById("current-bracket-title");
  
  if (!container) return;
  container.innerHTML = "";

  if (!bracketGroups || bracketGroups.length === 0) {
    container.innerHTML = `<div class="not-found" style="padding: 10px; font-size: 13px;">No brackets available.</div>`;
    return;
  }

  bracketGroups.forEach((group, index) => {
    const item = document.createElement("div");
    item.className = `bracket-nav-item ${index === 0 ? "active" : ""}`;

    const countText = group.numEntrants ? `${group.numEntrants}` : "";
    item.innerHTML = `
      <span>${group.name}</span>
      ${countText ? `<span class="badge">${countText} players</span>` : ""}
    `;

    const loadBracketView = () => {
      document.querySelectorAll(".bracket-nav-item").forEach(el => el.classList.remove("active"));
      item.classList.add("active");

      if (titleHeader) titleHeader.textContent = group.name;
      if (iframe) {
        iframe.src = `${withBase("/pages/tournaments/bracket/index.html")}?tournament=${encodeURIComponent(tournamentSlug)}&event=${encodeURIComponent(eventSlug)}&phaseId=${encodeURIComponent(group.phaseId || '')}&phaseGroupId=${encodeURIComponent(group.id)}&type=${group.isTopCut ? 'topcut' : 'pool'}`;
      }
    };

    item.onclick = loadBracketView;
    container.appendChild(item);

    // Load first bracket by default
    if (index === 0) {
      loadBracketView();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const rawEventSlug = params.get("slug");

  setupBackToEvents(rawEventSlug);

  if (!rawEventSlug) {
    if (typeof showNotFound === "function") showNotFound("No tournament or event specified.");
    return;
  }

  const target = normalizeSlug(rawEventSlug);
  const allEvents = await loadAllEvents();

  const event = allEvents.find(e => {
    const s = normalizeSlug(e.slug || "");
    return s === target || s.endsWith(target) || target.endsWith(s);
  });

  if (!event) {
    if (typeof showNotFound === "function") {
      showNotFound(`Event not found in Start.gg data for slug: "${rawEventSlug}".`);
    }
    return;
  }

  const tourneySlug = event._tournamentSlug || rawEventSlug.split("/event/")[0];
  setupBackToEvents(tourneySlug);

  // Update Header Titles
  const titleEl = document.getElementById("standings-title");
  const mainTitleEl = document.getElementById("event-main-title");
  
  if (titleEl) titleEl.textContent = event._tournamentName ? `${event._tournamentName}` : "Tournament Event";
  if (mainTitleEl) mainTitleEl.textContent = event.name ?? "Event Brackets";
  document.title = `${event.name ?? "Brackets"} | DQRetro`;

  // Entrant Counts
  const entrantsList = event.entrants?.nodes || event.entrants || event.standings?.nodes || [];
  const totalEntrants = event.numEntrants || entrantsList.length;
  
  const entrantCountEl = document.getElementById("entrant-count");
  if (entrantCountEl) entrantCountEl.textContent = totalEntrants;

  // Parse Phases and Groups
  let phasesList = event.phases?.nodes || event.phases || [];
  let bracketGroups = [];
  let poolCount = 0;

  phasesList.forEach(phase => {
    const pName = phase.name || "";
    const nameLower = pName.toLowerCase();
    const topMatch = pName.match(/top\s*(\d+)/i);
    const isTopCut = !!topMatch || nameLower.includes("top") || nameLower.includes("final");

    let groups = phase.phaseGroups?.nodes || phase.phaseGroups || [];
    if (Array.isArray(groups) && groups.length > 0) {
      groups.forEach(g => {
        const identifier = g.displayIdentifier || g.name || "";
        let displayName = pName;

        if (groups.length > 1 && identifier) {
          displayName = `${pName} (${identifier})`;
        } else if (identifier && !pName.toLowerCase().includes(identifier.toLowerCase())) {
          displayName = `${pName} - ${identifier}`;
        }

        if (!isTopCut) poolCount++;

        bracketGroups.push({
          id: g.id,
          name: displayName,
          isTopCut: isTopCut,
          phaseId: phase.id,
          numEntrants: g.numEntrants || g.entrants?.length || 0,
          slug: g.slug || g.id
        });
      });
    } else {
      if (!isTopCut) poolCount++;
      bracketGroups.push({
        id: phase.id,
        name: pName || "Bracket",
        isTopCut: isTopCut,
        phaseId: phase.id,
        numEntrants: phase.numEntrants || 0,
        slug: phase.id
      });
    }
  });

  if (bracketGroups.length === 0) {
    let rawGroups = event.phaseGroups?.nodes || event.phaseGroups || event.pools || [];
    if (rawGroups.length > 0) {
      rawGroups.forEach(g => {
        poolCount++;
        bracketGroups.push({
          id: g.id,
          name: g.displayIdentifier || g.name || "Pool",
          isTopCut: false,
          numEntrants: g.numEntrants || 0
        });
      });
    } else if (totalEntrants > 0) {
      poolCount = 1;
      bracketGroups.push({
        id: "main",
        name: "Main Bracket",
        isTopCut: false,
        numEntrants: totalEntrants
      });
    }
  }

const poolCountEl = document.getElementById("pool-count");
  if (poolCountEl) {
    if (poolCount > 0) {
      poolCountEl.textContent = `${poolCount} ${poolCount === 1 ? 'Pool' : 'Pools'}`;
    } else {
      poolCountEl.textContent = bracketGroups.length > 0 ? `${bracketGroups.length} Stage${bracketGroups.length === 1 ? '' : 's'}` : "1 Bracket";
    }
  }

  // Render the unified sidebar and trigger initial bracket load
  renderBracketSidebar(bracketGroups, tourneySlug, event.slug || rawEventSlug);
});