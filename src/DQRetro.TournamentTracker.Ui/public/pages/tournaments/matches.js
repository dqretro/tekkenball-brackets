// ===========================
// matches.js
// Depends on: game-config.js (must be loaded first)
// ===========================

function withBase(path) {
  // Prevent infinite loop by verifying window.withBase isn't this exact function
  if (typeof window.withBase === "function" && window.withBase !== withBase) {
    return window.withBase(path);
  }
  const BASE = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? path : "/" + path}`;
}

// ---------------------------------------------------------------------------
// Debug helper
// Usage: debugCharacterIds("tournament/vsfighting-xi/event/tekken-ball-hosted-by-dqretro")
// ---------------------------------------------------------------------------
window.debugCharacterIds = async function(eventSlug) {
  const data = await fetchEventData(eventSlug);
  if (!data) { console.log("Event not found:", eventSlug); return; }
  const sets = data.event.sets?.nodes || [];
  const found = new Set();
  sets.forEach(set => {
    (set.games || []).forEach(game => {
      (game.selections || []).forEach(sel => {
        found.add(JSON.stringify({
          selectionValue: sel.selectionValue,
          character:      sel.character,
          entrant:        sel.entrant?.name
        }));
      });
    });
  });
  console.log(`Character selection data found in sets (${found.size} unique):`);
  found.forEach(s => console.log(JSON.parse(s)));
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
let _bracketsCache     = null;
let _localCache        = null;

async function fetchBracketsData() {
  if (_bracketsCache) return _bracketsCache;
  try {
    const res = await fetch(withBase("/data/brackets.json"));
    if (res.ok) {
      const raw = await res.json();
      _bracketsCache = raw?.data?.currentUser?.tournaments?.nodes || [];
    }
  } catch (err) {
    console.warn("brackets.json fetch failed:", err);
    _bracketsCache = [];
  }
  return _bracketsCache;
}

async function fetchLocalData() {
  if (_localCache) return _localCache;
  try {
    const res = await fetch(withBase("/data/brackets-local.json"));
    if (res.ok) {
      _localCache = await res.json();
    }
  } catch (err) {
    console.warn("brackets-local.json not found or failed:", err);
    _localCache = {};
  }
  return _localCache;
}

async function fetchEventData(targetSlug) {
  if (!targetSlug) return null;

  // 1. Fully decode target slug (handles double-encoded %2F)
  let decoded = targetSlug;
  try {
    while (decoded.includes("%")) {
      decoded = decodeURIComponent(decoded);
    }
  } catch (e) {
    decoded = decodeURIComponent(targetSlug);
  }
  decoded = decoded.trim().toLowerCase().replace(/\/+$|^\/+/g, "");

  const tournaments = await fetchBracketsData();

  // Helper to extract the core event path/name after '/event/'
  const extractEventName = (slugStr) => {
    if (slugStr.includes("/event/")) {
      return slugStr.split("/event/")[1].trim().replace(/\/+$|^\/+/g, "");
    }
    return slugStr.replace(/\/+$|^\/+/g, "");
  };

  const targetEventName = extractEventName(decoded);

  for (const t of tournaments) {
    for (const ev of t.events || []) {
      const s = (ev.slug || "").trim().toLowerCase().replace(/\/+$|^\/+/g, "");
      const currentEventName = extractEventName(s);

      // 1. Direct exact match
      if (s === decoded) {
        return { event: ev, tournament: t };
      }

      // 2. EndsWith match (handles missing leading slash or prefix variations)
      if (s.endsWith(decoded) || decoded.endsWith(s)) {
        return { event: ev, tournament: t };
      }

      // 3. Suffix fallback: Match by event slug suffix (e.g. "tekken-ball-double-elimination")
      if (targetEventName && currentEventName === targetEventName) {
        return { event: ev, tournament: t };
      }

      // 4. Fuzzy / Partial slug match fallback
      if (decoded.includes(currentEventName) || currentEventName.includes(targetEventName)) {
        return { event: ev, tournament: t };
      }
    }
  }

  return null;
}

// Helper to strip sponsor tags (e.g. "PND/ELF | Strykie" -> "strykie")
function cleanTag(name) {
  if (!name) return "";
  const parts = name.split("|");
  return parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

// Helper: Calculates total games played in a set based on score values (e.g., 2 - 1 = 3 games)
function calculateGamesPlayed(set) {
  const slots = set.slots || [];
  const s1 = parseInt(slots[0]?.standing?.stats?.score?.value, 10);
  const s2 = parseInt(slots[1]?.standing?.stats?.score?.value, 10);

  if (!isNaN(s1) && !isNaN(s2) && s1 >= 0 && s2 >= 0) {
    return s1 + s2;
  }
  return 0;
}

// Helper: Checks if either entrant in the set was disqualified
function isSetDisqualified(set) {
  const slots = set.slots || [];
  const s1 = slots[0]?.standing?.stats?.score?.value;
  const s2 = slots[1]?.standing?.stats?.score?.value;

  return s1 === -1 || s1 === "-1" || s2 === -1 || s2 === "-1";
}

// ---------------------------------------------------------------------------
// Local character lookup
// Returns characters for a player from brackets-local.json for this event
// ---------------------------------------------------------------------------
function getLocalCharacters(localData, eventSlug, entrantName) {
  if (!localData?.events || !entrantName) return [];

  const target = (eventSlug || "").toLowerCase().trim().replace(/\/+$|^\/+/g, "");

  // 1. Find event data safely by exact or normalized slug
  let eventData = localData.events[eventSlug] || localData.events[target];

  if (!eventData) {
    eventData = Object.entries(localData.events).find(([k]) => {
      const keyLower = k.toLowerCase().trim().replace(/\/+$|^\/+/g, "");
      if (keyLower === target) return true;

      const targetParts = target.split("/").filter(Boolean);
      const keyParts = keyLower.split("/").filter(Boolean);

      const targetTourn = targetParts.find((_, i) => targetParts[i - 1] === "tournament") || "";
      const keyTourn = keyParts.find((_, i) => keyParts[i - 1] === "tournament") || "";

      if (targetTourn && keyTourn && targetTourn === keyTourn) return true;
      return target.endsWith(keyLower) || keyLower.endsWith(target);
    })?.[1];
  }

  if (!eventData?.playerCharacters) return [];

  const cleanEntrant = cleanTag(entrantName);

  // Check exact key match, partial key match, or stripped sponsor name
  for (const [key, chars] of Object.entries(eventData.playerCharacters)) {
    const cleanKey = cleanTag(key);
    if (
      cleanKey === cleanEntrant ||
      cleanEntrant.includes(cleanKey) ||
      cleanKey.includes(cleanEntrant)
    ) {
      return chars;
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Character resolution per set slot
// ---------------------------------------------------------------------------
function getPlayerCharactersFromSet(set, entrantId, entrantName, videogameName, localData, eventSlug) {
  // Rule 1: Disqualified matches show no characters at all
  if (isSetDisqualified(set)) {
    return null; // Return null to flag explicit DQ status
  }

  // 1. Check if Start.gg reported game selections exist
  const gameSelections = [];
  (set.games || []).forEach(game => {
    (game.selections || []).forEach(sel => {
      const selId = sel.entrant?.id?.toString();
      if (entrantId && selId === entrantId.toString()) {
        const resolved = typeof resolveCharacterSlug === "function" 
          ? resolveCharacterSlug(sel.selectionValue, sel.character, videogameName) 
          : null;
        if (resolved) gameSelections.push(resolved);
      }
    });
  });

  if (gameSelections.length > 0) {
    return gameSelections;
  }

  // 2. Fallback to brackets-local.json
  const localChars = localData ? getLocalCharacters(localData, eventSlug, entrantName) : [];

  if (localChars.length > 0) {
    const gamesPlayed = (set.games && set.games.length > 0) 
      ? set.games.length 
      : calculateGamesPlayed(set);

    let maxUniqueChars = localChars.length;
    if (gamesPlayed === 2) maxUniqueChars = 1;
    else if (gamesPlayed === 3) maxUniqueChars = 2;
    else if (gamesPlayed >= 4) maxUniqueChars = 3;

    return localChars.slice(0, maxUniqueChars);
  }

  // 3. Fallback table in game-config.js
  if (typeof getManualCharacters === "function") {
    const manualChars = getManualCharacters(entrantName);
    if (manualChars && manualChars.length > 0) return manualChars;
  }

  // Rule 2 & 3: Character wasn't reported — default to random character image
  return ["random"];
}

function renderCharacterIcons(chars, videogameName, slotIndex = 0) {
  // If set was a DQ (chars === null), don't display any icon HTML
  if (chars === null) {
    return "";
  }

  const config = typeof getGameConfig === "function" ? getGameConfig(videogameName) : {};
  if (typeof buildCharacterIconHtml !== "function") return "";

  // If array is empty or unset, fall back to "random"
  const list = (!chars || chars.length === 0) ? ["random"] : chars;
  return list.map(c => buildCharacterIconHtml(c, config, slotIndex)).join("");
}

// ---------------------------------------------------------------------------
// Score formatting
// ---------------------------------------------------------------------------
function formatScore(value) {
  if (value === -1 || value === "-1") return "DQ";
  if (value == null || value === "") return "-";
  return value;
}

// ---------------------------------------------------------------------------
// Set parsing
// ---------------------------------------------------------------------------
function parseSetData(set, videogameName, localData, eventSlug) {
  const slots  = set.slots || [];
  const p1Slot = slots[0] || {};
  const p2Slot = slots[1] || {};

  const p1Name  = p1Slot.entrant?.name || "TBD";
  const p2Name  = p2Slot.entrant?.name || "TBD";
  const p1Id    = p1Slot.entrant?.id;
  const p2Id    = p2Slot.entrant?.id;

  const p1ScoreStr = formatScore(p1Slot.standing?.stats?.score?.value ?? null);
  const p2ScoreStr = formatScore(p2Slot.standing?.stats?.score?.value ?? null);
  const scoreDisplay = `${p1ScoreStr} - ${p2ScoreStr}`;

  let winnerName = "TBD";
  if (set.winnerId) {
    if (p1Id && p1Id.toString() === set.winnerId.toString()) winnerName = p1Name;
    else if (p2Id && p2Id.toString() === set.winnerId.toString()) winnerName = p2Name;
  }

  const p1Chars = getPlayerCharactersFromSet(set, p1Id, p1Name, videogameName, localData, eventSlug);
  const p2Chars = getPlayerCharactersFromSet(set, p2Id, p2Name, videogameName, localData, eventSlug);

  return {
    roundName: set.fullRoundText || set.round || "Match",
    p1Name,
    p1Icons:   renderCharacterIcons(p1Chars, videogameName, 0),
    score:     scoreDisplay,
    p2Name,
    p2Icons:   renderCharacterIcons(p2Chars, videogameName, 1),
    winnerName
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function renderMatchRows(sets, tbodyId, videogameName, localData, eventSlug) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!sets.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:1em; color:var(--muted);">No match data available.</td></tr>`;
    return;
  }

  sets.forEach(set => {
    const d   = parseSetData(set, videogameName, localData, eventSlug);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${d.roundName}</td>
      <td>${d.p1Name}</td>
      <td>${d.p1Icons}</td>
      <td>${d.score}</td>
      <td>${d.p2Name}</td>
      <td>${d.p2Icons}</td>
      <td>${d.winnerName}</td>`;
    tbody.appendChild(row);
  });
}

function renderPools(eventData, localData) {
  const gameName  = eventData.videogame?.name || "";
  const sets      = eventData.sets?.nodes || [];
  const eventSlug = eventData.slug || "";
  renderMatchRows(sets, "matches-body", gameName, localData, eventSlug);
}

function renderTopcut(eventData, localData) {
  const section   = document.getElementById("topcut-section");
  const gameName  = eventData.videogame?.name || "";
  const sets      = eventData.topcut?.sets || [];
  const eventSlug = eventData.slug || "";

  if (!section) return;
  if (!sets.length) { section.style.display = "none"; return; }

  const heading = section.querySelector("h2");
  if (heading) heading.textContent = `Top ${eventData.topcut?.size || ""} Matches`;

  renderMatchRows(sets, "topcut-body", gameName, localData, eventSlug);
  section.style.display = "block";
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
  btn.innerHTML = `<a href="${backUrl}" class="back-button pool-card">← Back to Events</a>`;
}

// ---------------------------------------------------------------------------
// Main loader
// ---------------------------------------------------------------------------
async function loadEventMatches(slug) {
  const [data, localData] = await Promise.all([
    fetchEventData(slug),
    fetchLocalData()
  ]);

  if (!data) {
    if (typeof showNotFound === "function") showNotFound(`Event "${slug}" not found.`);
    return null;
  }

  const { event, tournament } = data;
  const headerEl = document.getElementById("standings-title");
  if (headerEl) headerEl.textContent = `${tournament.name} — ${event.name}`;

  renderPools(event, localData);
  renderTopcut(event, localData);
  setupBackToEvents(tournament?.slug || slug);
  return data;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug) {
    if (typeof showNotFound === "function") showNotFound("No event specified.");
    return;
  }
  await loadEventMatches(slug);

  window.addEventListener("popstate", async () => {
    const s = new URLSearchParams(window.location.search).get("slug");
    if (s) await loadEventMatches(s);
  });
});