// ==========================
// Unified API-Driven Script
// ==========================

// ---------------------------------------
// Base path helpers (GH Pages vs. local)
// ---------------------------------------
const BASE = window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "";

function withBase(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path; // external links untouched
  return `${BASE}${path.startsWith("/") ? path : "/" + path}`;
}

function trimTrailingSlash(p) {
  return p ? p.replace(/\/$/, "") : "";
}

// --------------------------
// Load nav
// --------------------------
function loadNav(placeholderId, filePath) {
  fetch(withBase(filePath))
    .then(res => {
      if (!res.ok) throw new Error(`Failed to fetch nav: ${res.status}`);
      return res.text();
    })
    .then(html => {
      const holder = document.getElementById(placeholderId);
      if (!holder) return;
      holder.innerHTML = html;
      activateNavLinks(holder);
    })
    .catch(err => console.error(`Error loading nav ${filePath}:`, err));
}

// --------------------------
// Load Nav (Highlight active links)
// --------------------------
function activateNavLinks(holder) {
  const links = holder.querySelectorAll("nav a[href]");
  const current = trimTrailingSlash(window.location.pathname);

  let chosen = null;
  links.forEach(link => {
    const href = link.getAttribute("href");
    const targetAbs = trimTrailingSlash(href.startsWith("/") ? href : withBase(href));
    if (current === targetAbs) {
      chosen = link;
    } else if (!chosen && current.endsWith(trimTrailingSlash(href))) {
      chosen = link;
    }
  });

  if (chosen) links.forEach(a => a.classList.toggle("active", a === chosen));
}

// --------------------------
// Example usage on page
// --------------------------
loadNav("nav-placeholder", "/shared/layout/header/nav/nav.html");     // main nav
loadNav("nav-t-placeholder", "/shared/layout/header/nav/nav_t.html"); // sub nav_t


// --------------------------
// Load Footer
// --------------------------
function loadFooter() {
  fetch(withBase("/shared/layout/footer/footer.html"))
    .then(res => (res.ok ? res.text() : ""))
    .then(html => {
      const footer = document.getElementById("footer-placeholder");
      if (!footer || !html) return;

      footer.innerHTML = html;

      // Fix relative links
      footer.querySelectorAll("a[href]").forEach(a => {
        const href = a.getAttribute("href");
        if (href && !href.startsWith("http") && !href.startsWith("#")) {
          a.setAttribute("href", withBase(href));
        }
      });

      footer.querySelectorAll("img[src]").forEach(img => {
        const src = img.getAttribute("src");
        if (src && !src.startsWith("http") && !src.startsWith("data:")) {
          img.setAttribute("src", withBase(src));
        }
      });
    })
    .catch(err => console.warn("Footer not loaded:", err));
}

// --------------------------
// Fetch Tournament(s)
// --------------------------
async function fetchTournament(slug) {
  try {
    const res = await fetch(withBase(`/api/tournament?slug=${encodeURIComponent(slug)}`));
    const data = await res.json();
    return data.data?.tournament || null;
  } catch (err) {
    console.error("Failed to fetch tournament:", err);
    return null;
  }
}

async function fetchAllTournaments() {
  try {
    const res = await fetch(withBase("/api/tournaments"));
    const data = await res.json();
    return data.data?.tournaments || [];
  } catch (err) {
    console.error("Failed to fetch tournaments:", err);
    return [];
  }
}

// --------------------------
// Bracket Utilities
// --------------------------
function transformSetsToRounds(sets) {
  const rounds = {};
  (sets || []).forEach(set => {
    const roundName = `Round ${set.round}`;
    if (!rounds[roundName]) rounds[roundName] = [];

    const [slot1, slot2] = set.slots || [];
    rounds[roundName].push({
      p1: slot1 ? {
        name: slot1.entrant?.name,
        score: slot1.standing?.stats?.score?.value,
        winner: set.winnerId === slot1.entrant?.id,
        character: slot1.entrant?.character
      } : null,
      p2: slot2 ? {
        name: slot2.entrant?.name,
        score: slot2.standing?.stats?.score?.value,
        winner: set.winnerId === slot2.entrant?.id,
        character: slot2.entrant?.character
      } : null
    });
  });
  return Object.entries(rounds).map(([title, matches]) => ({ title, matches }));
}

const matchLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function createPlayerDiv(p) {
  const div = document.createElement("div");
  div.className = "player";
  if (!p) return div;

  if (p.character) {
    const img = document.createElement("img");
    img.src = withBase(`/images/characters/characters_select/select_${p.character}.png`);
    img.alt = p.character;
    img.width = 40;
    img.height = 40;
    div.appendChild(img);
  }

  div.appendChild(document.createTextNode(` ${p.name ?? ""} ${p.score !== undefined ? `[${p.score}]` : ""}`));

  if (p.winner === true) div.style.color = "gold";
  else if (p.winner === false) div.style.color = "red";

  return div;
}

function renderMatchElement(match, label) {
  const matchContainer = document.createElement("div");
  matchContainer.className = "match-container";

  const matchDiv = document.createElement("div");
  matchDiv.className = "match";

  const matchContent = document.createElement("div");
  matchContent.className = "match-content";

  const labelDiv = document.createElement("div");
  labelDiv.className = "match-label";
  labelDiv.textContent = label;

  const playersDiv = document.createElement("div");
  playersDiv.className = "match-players";

  if (match.p1) playersDiv.appendChild(createPlayerDiv(match.p1));
  if (match.p2) playersDiv.appendChild(createPlayerDiv(match.p2));

  matchContent.appendChild(labelDiv);
  matchContent.appendChild(playersDiv);
  matchDiv.appendChild(matchContent);
  matchContainer.appendChild(matchDiv);

  return matchContainer;
}

function renderBracket(rounds, parentDiv) {
  parentDiv.innerHTML = "";
  let matchCount = 0;
  (rounds || []).forEach(round => {
    const roundDiv = document.createElement("div");
    roundDiv.className = "round";
    roundDiv.style.setProperty("--gap", "40px");

    const roundHeader = document.createElement("div");
    roundHeader.className = "round-header";
    roundHeader.textContent = round.title;
    roundDiv.appendChild(roundHeader);

    (round.matches || []).forEach(match => {
      const matchEl = renderMatchElement(match, matchLabels[matchCount % matchLabels.length]);
      roundDiv.appendChild(matchEl);
      matchCount++;
    });

    parentDiv.appendChild(roundDiv);
  });
}

// --------------------------
// Load Standings
// --------------------------
async function loadStandings(limit = null, slug) {
  const tournament = await fetchTournament(slug);
  if (!tournament) return;
  const event = (tournament.events || [])[0];
  if (!event) return;

  const tbody = document.getElementById("standings-body");
  if (!tbody) return;

  let standings = (event.entrants?.nodes || []).map(e => ({
    name: e.name,
    wins: e.standing?.stats?.wins?.value ?? 0,
    losses: e.standing?.stats?.losses?.value ?? 0,
    score: e.standing?.stats?.score?.value ?? 0,
    lostTo: e.standing?.stats?.lostTo?.value ?? "",
    character: e.character || ""
  }));

  standings.sort((a, b) => b.score - a.score);
  if (limit) standings = standings.slice(0, limit);

  tbody.innerHTML = "";
  standings.forEach((p, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${i+1}</td><td>${p.name}</td><td>${p.wins}</td><td>${p.losses}</td><td>${p.score}</td><td>${p.character}</td>`;
    tbody.appendChild(row);
  });
}

// --------------------------
// Render Stats (Character Usage)
// --------------------------
async function renderStats(containerId = "stats-container", slug) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const tournament = await fetchTournament(slug);
  if (!tournament) return;
  const event = (tournament.events || [])[0];
  if (!event) return;

  const stats = (event.entrants?.nodes || []).reduce((acc, e) => {
    const chars = Array.isArray(e.character) ? e.character : [e.character];
    chars.forEach(c => {
      if (!c) return;
      acc[c] = (acc[c] || 0) + 1;
    });
    return acc;
  }, {});

  const totalPlayers = (event.entrants?.nodes || []).length || 1;
  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);

  const maxCount = sortedStats[0]?.[1] || 1;
  sortedStats.forEach(([char, count]) => {
    const percent = ((count / totalPlayers) * 100).toFixed(1);
    const div = document.createElement("div");
    div.className = "stat-card";
    if(count === maxCount) div.classList.add("top-pick");

    const img = document.createElement("img");
    img.src = withBase(`/images/characters/characters_select/select_${char}.png`);
    img.alt = char;
    img.width = 60;
    img.height = 60;

    const label = document.createElement("div");
    label.className = "stat-label";
    label.textContent = `${char}: ${count} (${percent}%)`;

    const bar = document.createElement("div");
    bar.className = "stat-bar";
    bar.style.width = `${percent}%`;

    div.appendChild(img);
    div.appendChild(label);
    div.appendChild(bar);
    container.appendChild(div);
  });
}

// --------------------------
// Load Event Stats
// --------------------------
async function loadEventStats(slug) {
  const tournament = await fetchTournament(slug);
  if (!tournament) return;
  const event = (tournament.events || [])[0];
  if (!event) return;

  // Event Info
  const infoMap = {
    "event-name": tournament.name,
    "event-date": `Date: ${event.startAt ? new Date(event.startAt).toLocaleDateString() : "TBA"}`,
    "event-game": `Game: ${tournament.game ?? "Unknown"}`,
    "event-entrants": `Entrants: ${event.entrants?.nodes?.length ?? 0}`
  };

  Object.entries(infoMap).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });

  if (document.getElementById("stats-container")) renderStats("stats-container", slug);
  if (document.getElementById("standings-body")) loadStandings(null, slug);

  if (document.getElementById("bracket-summary")) {
    const rounds = transformSetsToRounds(event.sets);
    renderBracket(rounds, document.getElementById("bracket-summary"));
  }
}

// --------------------------
// Load Tournaments Landing Page
// --------------------------
async function loadTournamentsLanding() {
  const container = document.getElementById("tournamentList");
  const gameFilter = document.getElementById("gameFilter");
  const statusFilter = document.getElementById("statusFilter");
  if (!container || !gameFilter || !statusFilter) return;

  let tournaments = await fetchAllTournaments();

  // Optional fallback
  tournaments.push(
    { name: "VSFighting XIII", game: "Tekken 8", status: "completed", startAt: "2025-08-16", slug: "vsfighting-xiii", logoUrl: "/images/games/boxart/boxart_tekken8.png" },
    { name: "VSFighting XI", game: "Tekken 3", status: "completed", startAt: "2023-08-19", slug: "vsfighting-xi", logoUrl: "/images/games/boxart/boxart_tekken3.png" },
    { name: "Example", game: "Tekken Tag Tournament 2", status: "ongoing", startAt: "2025-01-01", slug: "example", logoUrl: "/images/games/boxart/boxart_tekkentag2.png" }
  );

  // Populate filters
  gameFilter.innerHTML = "";
  const games = ["all", ...new Set(tournaments.map(t => t.game).filter(Boolean))];
  games.forEach(game => {
    const opt = document.createElement("option");
    opt.value = game === "all" ? "all" : game.toLowerCase().replace(/\s/g, "");
    opt.textContent = game === "all" ? "All Games" : game;
    gameFilter.appendChild(opt);
  });

  statusFilter.innerHTML = "";
  const statuses = ["all", ...new Set(tournaments.map(t => t.status.toLowerCase()))];
  statuses.forEach(status => {
    const opt = document.createElement("option");
    opt.value = status;
    opt.textContent = status === "all" ? "All Events" : status.charAt(0).toUpperCase() + status.slice(1);
    statusFilter.appendChild(opt);
  });

  let selectedCharacter = null;

  function renderList() {
    const selectedGame = gameFilter.value;
    const selectedStatus = statusFilter.value;

    container.innerHTML = "";

    tournaments
      .filter(t =>
        (selectedGame === "all" || t.game.toLowerCase().replace(/\s/g, "") === selectedGame) &&
        (selectedStatus === "all" || t.status.toLowerCase() === selectedStatus) &&
        (!selectedCharacter || (t.participants || []).some(p => p.character === selectedCharacter))
      )
      .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
      .forEach(t => {
        const card = document.createElement("div");
        card.className = "tournament-card";

        const thumbnail = document.createElement("img");
        thumbnail.className = "tournament-thumbnail";
        thumbnail.src = withBase(t.logoUrl || `/images/games/${String(t.game).replace(/\s/g, "")}.png`);
        thumbnail.alt = t.game || "Game";
        card.appendChild(thumbnail);

        const badge = document.createElement("span");
        badge.className = "tournament-badge";
        badge.textContent = t.status.charAt(0).toUpperCase() + t.status.slice(1);
        badge.setAttribute("data-status", t.status.toLowerCase());
        card.appendChild(badge);

        const title = document.createElement("h2");
        title.textContent = t.name;
        card.appendChild(title);

        const date = document.createElement("p");
        const start = t.startAt ? new Date(t.startAt) : null;
        date.textContent = `Date: ${start ? start.toLocaleDateString() : "TBA"}`;
        card.appendChild(date);

        const game = document.createElement("p");
        game.textContent = `Game: ${t.game}`;
        card.appendChild(game);

        const link = document.createElement("a");
        link.href = withBase(`/pages/tournaments/events.html?slug=${encodeURIComponent(t.slug)}`);
        link.textContent = "View Events";
        link.className = "button primary";
        card.appendChild(link);

        container.appendChild(card);
      });
  }

  renderList();
  gameFilter.addEventListener("change", renderList);
  statusFilter.addEventListener("change", renderList);
  window.setCharacterFilter = charName => { selectedCharacter = charName; renderList(); };
}

// --------------------------
// Initialize
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadNav();
  loadFooter();

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  if (document.getElementById("tournamentList")) {
    loadTournamentsLanding();
  }

  if (document.getElementById("stats-container") || 
      document.getElementById("standings-body") || 
      document.getElementById("bracket-summary")) {
    if (slug) loadEventStats(slug);
  }
});

// --------------------------
// Render Pie Chart (Character Usage)
// --------------------------
async function renderPieChart(slug) {
  const container = document.getElementById("pie-container");
  if(!container) return;
  container.innerHTML = "";

  const tournament = await fetchTournament(slug);
  if(!tournament) return;
  const event = (tournament.events || [])[0];
  if(!event) return;

  const stats = (event.entrants?.nodes || []).reduce((acc, e) => {
    const chars = Array.isArray(e.character) ? e.character : [e.character];
    chars.forEach(c => { if(c) acc[c] = (acc[c] || 0) + 1; });
    return acc;
  }, {});

  const total = Object.values(stats).reduce((a,b)=>a+b,0);
  if(total === 0) return;

  const colors = ["#4caf50","#2196f3","#ff9800","#9c27b0","#f44336","#00bcd4","#e91e63","#ffc107"];
  let cumulative = 0;
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS,"svg");
  svg.setAttribute("viewBox","0 0 32 32");
  svg.style.width = "100%";
  svg.style.height = "100%";

  Object.entries(stats).forEach(([char, count], idx) => {
    const start = cumulative;
    const slice = (count / total) * 100;
    cumulative += slice;

    const circle = document.createElementNS(svgNS,"circle");
    circle.setAttribute("r","16");
    circle.setAttribute("cx","16");
    circle.setAttribute("cy","16");
    circle.setAttribute("fill","transparent");
    circle.setAttribute("stroke", colors[idx % colors.length]);
    circle.setAttribute("stroke-width","32");
    circle.setAttribute("stroke-dasharray", `${slice} ${100-slice}`);
    circle.setAttribute("stroke-dashoffset", -start);
    circle.style.transform="rotate(-90deg)";
    circle.style.transformOrigin="50% 50%";

    svg.appendChild(circle);
  });

  container.appendChild(svg);
}
