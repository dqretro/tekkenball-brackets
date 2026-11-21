/**
 * DQRetro Tournament Tracker — Multi-Pool & Top Cut Bracket Script
 */

function withBase(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  return `${base}${path.startsWith("/") ? path : "/" + path}`;
}

function extractSets(source) {
  if (!source) return [];
  if (Array.isArray(source)) return source;
  if (Array.isArray(source.nodes)) return source.nodes;
  if (source.sets) return extractSets(source.sets);
  if (Array.isArray(source.data)) return source.data;
  return [];
}

let globalTournamentData = null;

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Builds one selectable bracket per start.gg phase group (pool / top cut), using the
 * phases + set.phaseGroupId data written by the sync tool. Older data without phase
 * info shows a single "Main Bracket" (no invented pools).
 */
function extractAllOptionsFromEvent(eventObj) {
  const allSets = extractSets(eventObj?.sets);
  if (!allSets.length) return [];

  // phaseGroupId -> label, in phase order then pool order
  const labels = new Map();
  const phases = [...(eventObj.phases || [])].sort((a, b) => (a.phaseOrder ?? 0) - (b.phaseOrder ?? 0));
  phases.forEach(phase => {
    const groups = phase.phaseGroups?.nodes || [];
    groups.forEach(g => {
      const label = groups.length > 1 && g.displayIdentifier
        ? `${phase.name || "Bracket"} — Pool ${g.displayIdentifier}`
        : (phase.name || "Bracket");
      labels.set(String(g.id), label);
    });
  });

  const groupsMap = new Map();
  allSets.forEach(set => {
    const gId = String(set.phaseGroupId || set.phaseGroup?.id || "");
    if (!gId) return;
    if (!groupsMap.has(gId)) {
      const label = labels.get(gId)
        || [set.phaseGroup?.phase?.name, set.phaseGroup?.displayIdentifier && `Pool ${set.phaseGroup.displayIdentifier}`]
             .filter(Boolean).join(" — ")
        || "Bracket";
      groupsMap.set(gId, { id: gId, label, sets: [] });
    }
    groupsMap.get(gId).sets.push(set);
  });

  if (groupsMap.size > 0) {
    const order = [...labels.keys()];
    return [...groupsMap.values()].sort((a, b) => {
      const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
      return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib);
    });
  }

  return [{ id: "main", label: "Main Bracket", sets: allSets }];
}

// Exact event lookup (same rule as matches.js): full slug, then unambiguous suffix.
function findEvent(tournaments, rawSlug) {
  const norm = s => (s || "").trim().toLowerCase().replace(/\/+$|^\/+/g, "");
  const target = norm(rawSlug);
  if (!target) return null;
  const all = [];
  tournaments.forEach(t => (t.events || []).forEach(ev => all.push(ev)));
  const exact = all.find(ev => norm(ev.slug) === target);
  if (exact) return exact;
  const suffix = all.filter(ev => norm(ev.slug).endsWith("/" + target));
  return suffix.length && suffix.every(ev => norm(ev.slug) === norm(suffix[0].slug)) ? suffix[0] : null;
}

// Load the event named in the iframe URL (?event=<event slug>&phaseGroupId=<id>)
async function loadBracketData() {
  try {
    const params = new URLSearchParams(window.location.search);
    const eventSlug = params.get("event");
    if (!eventSlug) return { error: "No event specified." };

    const res = await fetch(withBase("/data/brackets.json"));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const liveData = await res.json();
    const tournaments = liveData?.data?.currentUser?.tournaments?.nodes || [];

    const foundEvent = findEvent(tournaments, eventSlug);
    if (!foundEvent) return { error: `Event not found: ${eventSlug}` };

    const options = extractAllOptionsFromEvent(foundEvent);
    const requested = params.get("phaseGroupId");
    const initialId = options.some(o => o.id === String(requested)) ? String(requested) : options[0]?.id;
    globalTournamentData = { options, initialId };
    return globalTournamentData;

  } catch (err) {
    console.error("Error loading bracket data:", err);
    return { error: "Failed to load bracket JSON data." };
  }
}

function getRoundRank(title, roundVal) {
  const t = (title || "").toLowerCase();
  if (t.includes("winners round 1") || t === "round 1") return 10;
  if (t.includes("winners round 2")) return 20;
  if (t.includes("winners round 3")) return 30;
  if (t.includes("winners quarter")) return 50;
  if (t.includes("winners semi")) return 60;
  if (t.includes("winners final")) return 70;
  if (t.includes("losers round 1")) return 110;
  if (t.includes("losers round 2")) return 120;
  if (t.includes("losers round 3")) return 130;
  if (t.includes("losers quarter")) return 170;
  if (t.includes("losers semi")) return 180;
  if (t.includes("losers final")) return 190;
  if (t.includes("grand final reset")) return 310;
  if (t.includes("grand final")) return 300;
  if (roundVal > 0) return roundVal * 10;
  if (roundVal < 0) return 100 + Math.abs(roundVal) * 10;
  return 500;
}

function categorizeDoubleElimination(sets) {
  const roundMap = {};

  sets.forEach((set) => {
    const roundVal = set.round ?? 0;
    let title = set.fullRoundText;

    if (!title) {
      title = roundVal < 0 ? `Losers Round ${Math.abs(roundVal)}` : `Winners Round ${roundVal || 1}`;
    }

    const key = `${roundVal}_${title}`;
    if (!roundMap[key]) {
      roundMap[key] = { title, roundVal, rank: getRoundRank(title, roundVal), sets: [] };
    }
    roundMap[key].sets.push(set);
  });

  const winners = [];
  const losers = [];
  const grandFinals = [];

  Object.values(roundMap).forEach(group => {
    const t = group.title.toLowerCase();
    if (t.includes("grand final")) grandFinals.push(group);
    else if (t.includes("loser") || group.roundVal < 0) losers.push(group);
    else winners.push(group);
  });

  winners.sort((a, b) => a.rank - b.rank);
  losers.sort((a, b) => a.rank - b.rank);
  grandFinals.sort((a, b) => a.rank - b.rank);

  return { winners, losers, grandFinals };
}

function renderBracketBlock(sectionTitleText, sortedRounds) {
  if (!sortedRounds || sortedRounds.length === 0) return "";

  let html = `<div class="bracket-section-container" style="margin-bottom: 48px;">`;
  if (sectionTitleText) {
    html += `<div style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: #03d9ce; margin-bottom: 12px; letter-spacing: 1px;">${sectionTitleText}</div>`;
  }

  html += `<div class="bracket-header" style="display: flex; gap: 24px; margin-bottom: 16px;">`;
  sortedRounds.forEach(r => { html += `<div class="round-title" style="min-width: 220px; font-weight: 600;">${r.title}</div>`; });
  html += `</div>`;

  html += `<div class="bracket-columns" style="display: flex; flex-direction: row; gap: 24px; overflow-x: auto;">`;

  sortedRounds.forEach((roundObj) => {
    html += `<div class="column" style="display: flex; flex-direction: column; gap: 16px; min-width: 220px;">`;
    roundObj.sets.forEach((set) => {
      const slots = set.slots || [];
      const p1Name = slots[0]?.entrant?.name || slots[0]?.entrant?.participants?.[0]?.gamerTag || "TBD";
      const p2Name = slots[1]?.entrant?.name || slots[1]?.entrant?.participants?.[0]?.gamerTag || "TBD";
      const score1 = slots[0]?.standing?.stats?.score?.displayValue ?? slots[0]?.score ?? "-";
      const score2 = slots[1]?.standing?.stats?.score?.displayValue ?? slots[1]?.score ?? "-";

      html += `
        <div class="match">
          <div class="team match-top">
            <span class="name">${escapeHtml(p1Name)}</span>
            <span class="score">${escapeHtml(score1)}</span>
          </div>
          <div class="team match-bottom">
            <span class="name">${escapeHtml(p2Name)}</span>
            <span class="score">${escapeHtml(score2)}</span>
          </div>
        </div>`;
    });
    html += `</div>`;
  });

  html += `</div></div>`;
  return html;
}

function displaySelectedBracket(optionId) {
  const container = document.getElementById("bracket-container");
  if (!container || !globalTournamentData) return;

  const selectedOption = globalTournamentData.options.find(o => String(o.id) === String(optionId)) || globalTournamentData.options[0];

  if (!selectedOption || !selectedOption.sets || selectedOption.sets.length === 0) {
    container.innerHTML = `<div style="color:#8b9bb4; padding:20px;">No sets found for ${selectedOption?.label || "selected bracket"}.</div>`;
    return;
  }

  const { winners, losers, grandFinals } = categorizeDoubleElimination(selectedOption.sets);

  let fullHTML = "";
  if (winners.length > 0) fullHTML += renderBracketBlock("Winners Bracket", winners);
  if (losers.length > 0) fullHTML += renderBracketBlock("Losers Bracket", losers);
  if (grandFinals.length > 0) fullHTML += renderBracketBlock("Grand Finals", grandFinals);

  container.innerHTML = fullHTML;
}

function setupBracketSelector(options, initialSelectedId) {
  let selectElem = document.getElementById("bracket-select");

  if (!selectElem) {
    const container = document.getElementById("bracket-container");
    const navDiv = document.createElement("div");
    navDiv.className = "bracket-nav-container";
    navDiv.style.cssText = "margin-bottom: 20px; display: flex; align-items: center; gap: 10px;";
    navDiv.innerHTML = `
      <label for="bracket-select" style="font-weight: 600; color: #fff;">Select Bracket:</label>
      <select id="bracket-select" style="padding: 6px 12px; background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 4px; font-size: 14px;"></select>
    `;
    if (container && container.parentElement) {
      container.parentElement.insertBefore(navDiv, container);
    } else {
      document.body.insertBefore(navDiv, document.body.firstChild);
    }
    selectElem = document.getElementById("bracket-select");
  }

  selectElem.innerHTML = options.map(opt => `
    <option value="${opt.id}" ${String(opt.id) === String(initialSelectedId) ? "selected" : ""}>
      ${opt.label} (${opt.sets.length} matches)
    </option>
  `).join("");

  selectElem.onchange = (e) => displaySelectedBracket(e.target.value);
}

// Theme Switcher Logic
function initThemeSwitcher() {
  const themeSelect = document.getElementById("theme-selector");
  const themeElem = document.querySelector(".theme") || document.body;

  const applyTheme = (themeName) => {
    // Retain non-theme classes while applying the selected theme
    const existingClasses = Array.from(themeElem.classList).filter(c => !c.startsWith("theme-") || c === "theme");
    
    // Fallback if raw option values don't include the 'theme-' prefix
    const fullThemeClass = themeName.startsWith("theme-") ? themeName : `theme-${themeName.toLowerCase()}`;
    themeElem.className = [...existingClasses, fullThemeClass].join(" ");
    localStorage.setItem("dqretro_bracket_theme", themeName);
  };

  const savedTheme = localStorage.getItem("dqretro_bracket_theme") || "theme-dark-trendy";
  
  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.addEventListener("change", (e) => applyTheme(e.target.value));
  }

  applyTheme(savedTheme);
}

document.addEventListener("DOMContentLoaded", async () => {
  initThemeSwitcher();

  const data = await loadBracketData();
  if (data.options && data.options.length > 0) {
    setupBracketSelector(data.options, data.initialId);
    displaySelectedBracket(data.initialId);
  } else {
    const container = document.getElementById("bracket-container");
    if (container) container.innerHTML = `<div style="color:#8b9bb4; padding:20px;">${escapeHtml(data.error || "No bracket data available for this event.")}</div>`;
  }
});