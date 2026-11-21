// =========================================================
// Event Stats, Standings & Character Usage (start.gg Schema)
// =========================================================

let placeholderData = null;
let usageChart = null;
const chartTopN = 12;
let allPlayers = [];

// ---------------------------
// Path Helper (Matches players-search.js)
// ---------------------------
function withBase(path) {
  const base = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  path = path.replace(/^\/+/, "");
  return `${base}/${path}`;
}

// ---------------------------
// Slugification Utility (Matches players-search.js)
// ---------------------------
function createSlug(name) {
  return (name || "")
    .toLowerCase()
    .replace(/\s*\|\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

// ---------------------------
// Load Players JSON (data/players.json)
// ---------------------------
async function loadAllPlayers() {
  if (allPlayers.length > 0) return allPlayers;
  try {
    const res = await fetch(withBase("data/players.json"));
    if (res.ok) {
      const data = await res.json();
      allPlayers = Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.error("Failed to load players.json:", err);
    allPlayers = [];
  }
  return allPlayers;
}

// ---------------------------
// Extract Start.gg Profile Avatar
// ---------------------------
function getStartGgAvatar(entrant) {
  if (!entrant) return null;
  
  // Start.gg image payloads can be on entrant.user or participant.user
  const user = entrant.user || entrant.participants?.[0]?.user;
  if (!user || !Array.isArray(user.images) || user.images.length === 0) return null;

  const profileImg = user.images.find(img => img.type === "profile") || user.images[0];
  return profileImg ? profileImg.url : null;
}

// ---------------------------
// Resolve Player Avatar (Start.gg -> players.json -> Placeholder)
// ---------------------------
function resolvePlayerAvatar(entrant, name) {
  const fallback = withBase("images/placeholders/icons-profile/icon-pfp-player.png");

  // 1. Try Start.gg API payload
  const startGgImg = getStartGgAvatar(entrant);
  if (startGgImg) return startGgImg;

  // 2. Try matching name in data/players.json
  if (name && allPlayers.length > 0) {
    const matched = allPlayers.find(p => p.name && p.name.toLowerCase() === name.toLowerCase());
    if (matched && matched.avatar) {
      return withBase(matched.avatar);
    }
  }

  // 3. Fallback default
  return fallback;
}

function getPlayerProfileUrl(name) {
  if (!name) return "#";
  return withBase(`pages/player-profiles/players/players.html?player=${createSlug(name)}`);
}

// ---------------------------
// Fetch Brackets Data
// ---------------------------
async function fetchBracketsData() {
  if (placeholderData) return placeholderData;

  try {
    const res = await fetch(withBase("data/brackets.json"));
    if (res.ok) {
      const rawData = await res.json();
      const tournaments = rawData?.data?.currentUser?.tournaments?.nodes || rawData?.tournaments || [];
      if (tournaments.length > 0) {
        placeholderData = { tournaments };
        return placeholderData;
      }
    }
  } catch (err) {
    console.warn("brackets.json fetch failed, attempting fallback:", err);
  }

  try {
    const res = await fetch(withBase("pages/tournaments/placeholder-data/tournaments-placeholder.json"));
    if (res.ok) {
      placeholderData = await res.json();
    }
  } catch (err) {
    console.error("Failed to load tournament data:", err);
    placeholderData = { tournaments: [] };
  }

  return placeholderData;
}

// ---------------------------
// Fetch Specific Event
// ---------------------------
async function fetchEventData(slug) {
  if (!slug) return null;
  const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
  const data = await fetchBracketsData();
  const tournaments = data.tournaments || [];

  for (const t of tournaments) {
    const tSlug = (t.slug || "").toLowerCase();
    for (const ev of t.events || []) {
      const eSlug = (ev.slug || "").toLowerCase();
      const fullPath = eSlug.startsWith("tournament/") ? eSlug : `${tSlug}/${eSlug}`.replace(/\/\//g, "/");

      if (eSlug === decodedSlug || fullPath === decodedSlug || ev.id?.toString() === decodedSlug) {
        return { event: ev, tournament: t };
      }
    }
  }

  const shortSlug = decodedSlug.includes("/event/") ? decodedSlug.split("/event/")[1] : decodedSlug.split("/").pop();
  for (const t of tournaments) {
    for (const ev of t.events || []) {
      const eSlug = (ev.slug || "").toLowerCase();
      if (eSlug === shortSlug || eSlug.endsWith(`/${shortSlug}`)) {
        return { event: ev, tournament: t };
      }
    }
  }

  return null;
}

// ---------------------------
// Character Usage Calculation
// ---------------------------
function calculateCharacterUsage(eventData) {
  const videogameName = eventData?.videogame?.name || "Tekken 8";
  const gameConfig = typeof getGameConfig === "function" ? getGameConfig(videogameName) : { folder: "tk8" };
  const counts = {};
  let totalPicks = 0;

  const sets = eventData?.sets?.nodes || eventData?.sets || [];

  sets.forEach(s => {
    const games = s.games || [];
    games.forEach(g => {
      const selections = g.selections || [];
      selections.forEach(sel => {
        const val = sel.selectionValue || sel.characterId || sel.id;
        let slug = null;

        if (typeof resolveCharacterSlug === "function") {
          slug = resolveCharacterSlug(val, null, videogameName);
        } else if (typeof val === "string") {
          slug = val.toLowerCase();
        }

        if (slug) {
          counts[slug] = (counts[slug] || 0) + 1;
          totalPicks++;
        }
      });
    });
  });

  if (totalPicks === 0) {
    const entrants = eventData?.entrants?.nodes || eventData?.entrants || [];
    const standings = eventData?.standings?.nodes || eventData?.standings || [];
    const playerNames = new Set();
    
    entrants.forEach(e => { if (e?.name) playerNames.add(e.name); });
    standings.forEach(st => { if (st?.entrant?.name) playerNames.add(st.entrant.name); });

    playerNames.forEach(name => {
      const manualChars = typeof getManualCharacters === "function" ? getManualCharacters(name) : [];
      manualChars.forEach(slug => {
        if (slug) {
          counts[slug] = (counts[slug] || 0) + 1;
          totalPicks++;
        }
      });
    });
  }

  const result = Object.keys(counts).map(slug => ({
    slug,
    count: counts[slug],
    percentage: totalPicks > 0 ? ((counts[slug] / totalPicks) * 100).toFixed(1) : "0.0",
    config: gameConfig
  })).sort((a, b) => b.count - a.count);

  return { usage: result, totalPicks };
}

// ---------------------------
// Render Character Usage Grid & Chart
// ---------------------------
function renderCharacterUsage(usageData) {
  const container = document.getElementById("stats-container");
  if (!container) return;
  container.innerHTML = "";

  if (!usageData || usageData.usage.length === 0) {
    container.innerHTML = `<div class="not-found">No character usage data recorded for this event.</div>`;
    return;
  }

  usageData.usage.forEach(item => {
    const card = document.createElement("div");
    card.className = "pool-card";

    const iconHtml = typeof buildCharacterIconHtml === "function"
      ? buildCharacterIconHtml(item.slug, item.config, 28, 28)
      : `<img src="${withBase(`images/games/${item.config.folder}/characters/characters_select/select_${item.slug}.png`)}" width="28" height="28" alt="${item.slug}">`;

    const formattedName = item.slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        ${iconHtml}
        <strong>${formattedName}</strong>
      </div>
      <div style="font-size:0.9rem; color: var(--muted, #aaa);">
        ${item.count} pick${item.count > 1 ? 's' : ''} (${item.percentage}%)
      </div>
    `;
    container.appendChild(card);
  });

  const ctx = document.getElementById("characterUsageChart");
  if (!ctx || typeof Chart === "undefined") return;
  if (usageChart) usageChart.destroy();

  const topUsage = usageData.usage.slice(0, chartTopN);
  const barColors = topUsage.map((_, i) => `hsl(${Math.floor((i / topUsage.length) * 320)}, 70%, 55%)`);

  usageChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: topUsage.map(u => u.slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())),
      datasets: [{
        label: "Picks",
        data: topUsage.map(u => u.count),
        backgroundColor: barColors,
        borderColor: "rgba(255,255,255,0.2)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#fff" }, grid: { color: "#333" } },
        y: { ticks: { color: "#fff" }, grid: { color: "#333" }, beginAtZero: true }
      }
    }
  });
}

// ---------------------------
// Render Overall Stats & Standings
// ---------------------------
async function renderOverallStats(eventData) {
  const container = document.getElementById("overall-stats");
  if (!container) return;

  await loadAllPlayers();

  const sets = eventData?.sets?.nodes || eventData?.sets || [];
  const totalSets = sets.length;
  const completedSets = sets.filter(s => s.winnerId != null || s.state === 3).length;
  const missingSets = totalSets - completedSets;
  const entrantsCount = eventData?.numEntrants || eventData?.entrants?.nodes?.length || eventData?.entrants?.length || 0;

  const standings = eventData?.standings?.nodes || eventData?.standings || [];
  const topStandings = standings.slice(0, 8);

  const videogameName = eventData?.videogame?.name || "Tekken 8";
  const gameConfig = typeof getGameConfig === "function" ? getGameConfig(videogameName) : { folder: "tk8" };
  const fallbackAvatar = withBase("images/placeholders/icons-profile/icon-pfp-player.png");

  container.innerHTML = `
    <div style="width:100%; text-align:center; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:12px;">
      <span style="font-size: 1.1rem;"><strong>${entrantsCount}</strong> Entrants</span>
      <span style="margin: 0 12px; opacity:0.4;">|</span>
      <span><strong>${completedSets} / ${totalSets}</strong> Matches Completed</span>
      ${missingSets > 0 ? `<span style="color:#f44336; margin-left:8px;">(${missingSets} uncompleted)</span>` : ''}
    </div>
    ${topStandings.length === 0 ? '<div style="width:100%; text-align:center;">No standings available.</div>' : ''}
    ${topStandings.map(item => {
      const entrant = item.entrant || item;
      const entrantName = entrant?.name || "Unknown";
      const placement = item.placement;
      const suffix = placement === 1 ? 'st' : placement === 2 ? 'nd' : placement === 3 ? 'rd' : 'th';

      const avatarUrl = resolvePlayerAvatar(entrant, entrantName);

      const manualChars = typeof getManualCharacters === "function" ? getManualCharacters(entrantName) : [];
      const charSlug = manualChars[0] || null;
      const charIconHtml = charSlug && typeof buildCharacterIconHtml === "function"
        ? buildCharacterIconHtml(charSlug, gameConfig, 18, 18)
        : '';

      return `
        <div class="stat-item">
          <a href="${getPlayerProfileUrl(entrantName)}" style="color:inherit; text-decoration:none;">
            <img src="${avatarUrl}" 
                 onerror="this.onerror=null;this.src='${fallbackAvatar}';" 
                 alt="${entrantName}">
            <div class="position">${placement}${suffix}</div>
            <div class="name">${entrantName}</div>
            <div class="subtext">${charIconHtml}</div>
          </a>
        </div>
      `;
    }).join('')}
  `;
}

// ---------------------------
// Render Bracket Sets
// ---------------------------
function renderBracketRounds(eventData) {
  const container = document.getElementById("rounds-container");
  if (!container) return;
  container.innerHTML = "";

  const sets = eventData?.sets?.nodes || eventData?.sets || [];
  if (sets.length === 0) {
    container.innerHTML = `<div class="not-found">No match data available for this event.</div>`;
    return;
  }

  const fallbackAvatar = withBase("images/placeholders/icons-profile/icon-pfp-player.png");
  const roundMap = {};

  sets.forEach(s => {
    const roundName = s.fullRoundText || "Matches";
    if (!roundMap[roundName]) roundMap[roundName] = [];
    roundMap[roundName].push(s);
  });

  Object.keys(roundMap).forEach(roundName => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "round-group";

    const roundSets = roundMap[roundName];
    const setsHtml = roundSets.map(s => {
      const isCompleted = s.winnerId != null || s.state === 3;
      const slots = s.slots || [];

      const p1 = slots[0]?.entrant;
      const p2 = slots[1]?.entrant;

      const p1Score = slots[0]?.standing?.stats?.score?.value ?? "?";
      const p2Score = slots[1]?.standing?.stats?.score?.value ?? "?";

      const p1Avatar = resolvePlayerAvatar(p1, p1?.name);
      const p2Avatar = resolvePlayerAvatar(p2, p2?.name);

      const p1Name = p1?.name ? `
        <a href="${getPlayerProfileUrl(p1.name)}" style="color:inherit; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
          <img src="${p1Avatar}" onerror="this.onerror=null;this.src='${fallbackAvatar}';" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
          <span>${p1.name}</span>
        </a>` : "TBD";

      const p2Name = p2?.name ? `
        <a href="${getPlayerProfileUrl(p2.name)}" style="color:inherit; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
          <span>${p2.name}</span>
          <img src="${p2Avatar}" onerror="this.onerror=null;this.src='${fallbackAvatar}';" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
        </a>` : "TBD";

      const p1IsWinner = s.winnerId && p1?.id && s.winnerId.toString() === p1.id.toString();
      const p2IsWinner = s.winnerId && p2?.id && s.winnerId.toString() === p2.id.toString();

      return `
        <div class="set ${isCompleted ? 'completed' : 'missing'}">
          <div class="players">
            <span class="${p1IsWinner ? 'winner' : ''}">${p1Name}</span>
            <span><strong>${p1Score} - ${p2Score}</strong></span>
            <span class="${p2IsWinner ? 'winner' : ''}">${p2Name}</span>
          </div>
        </div>
      `;
    }).join("");

    groupDiv.innerHTML = `
      <h3>${roundName}</h3>
      <div class="sets-list">${setsHtml}</div>
    `;
    container.appendChild(groupDiv);
  });
}

// ---------------------------
// Setup Back to Events Navigation
// ---------------------------
function setupBackToEvents(rawSlug) {
  const btn = document.getElementById("back-to-events");
  if (!btn) return;

  let tournamentSlug = rawSlug || "";
  if (tournamentSlug.includes("/event/")) {
    tournamentSlug = tournamentSlug.split("/event/")[0];
  }

  const backUrl = tournamentSlug
    ? withBase(`pages/tournaments/events.html?slug=${encodeURIComponent(tournamentSlug)}`)
    : withBase("pages/tournaments/events.html");

  btn.innerHTML = `<a href="${backUrl}" style="display:inline-block; padding:8px 12px; background:var(--card-bg, #222); border-radius:6px; color:var(--text, #fff); text-decoration:none; font-weight:bold;">← Back to Events</a>`;
}

// ---------------------------
// Main Render Controller
// ---------------------------
async function renderEventStats(slug) {
  const data = await fetchEventData(slug);
  if (!data) return null;

  const { event: eventData, tournament } = data;

  const usageData = calculateCharacterUsage(eventData);
  renderCharacterUsage(usageData);
  await renderOverallStats(eventData);
  renderBracketRounds(eventData);
  setupBackToEvents(tournament?.slug || slug);

  return { name: eventData.name, tournamentName: tournament.name };
}

// ---------------------------
// Initialization
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof loadNav === "function") loadNav();
  if (typeof loadFooter === "function") loadFooter();

  const slug = new URLSearchParams(window.location.search).get("slug");
  const headerEl = document.getElementById("standings-title");

  if (!slug) {
    if (typeof showNotFound === "function") showNotFound("No event specified. Please return to Events.");
    return;
  }

  const event = await renderEventStats(slug);
  if (!event) {
    if (typeof showNotFound === "function") showNotFound(`Event "${slug}" not found. Please return to Events.`);
    return;
  }

  if (headerEl) headerEl.textContent = `${event.tournamentName} - ${event.name}`;

  window.addEventListener("popstate", async () => {
    const newSlug = new URLSearchParams(window.location.search).get("slug");
    if (!newSlug) return;
    const newEvent = await renderEventStats(newSlug);
    if (headerEl && newEvent) headerEl.textContent = `${newEvent.tournamentName} - ${newEvent.name}`;
  });
});