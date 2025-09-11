// ==========================
// Unified API-Driven Script
// ==========================

// --------------------------
// Load Navigation
// --------------------------
function loadNav() {
  fetch("/Shared/Layout/Header/nav/nav.html")
    .then(res => res.text())
    .then(html => {
      const navPlaceholder = document.getElementById("nav-placeholder");
      if (navPlaceholder) navPlaceholder.innerHTML = html;
      const links = document.querySelectorAll("nav a");
      const current = window.location.pathname;
      links.forEach(link => {
        const target = link.getAttribute("href");
        if (current.endsWith(target) || current.includes(target)) {
          link.classList.add("active");
        }
      });
    })
    .catch(err => console.error("Error loading nav:", err));
}

// --------------------------
// Load Footer
// --------------------------
function loadFooter() {
  fetch("/Shared/Layout/Footer/footer.html")
    .then(res => res.text())
    .then(html => {
      const footer = document.getElementById("footer-placeholder");
      if (footer) footer.innerHTML = html;
    })
    .catch(err => console.warn("Footer not loaded:", err));
}

// --------------------------
// Fetch Tournaments
// --------------------------
async function fetchTournament(slug) {
  try {
    const res = await fetch(`/api/tournament?slug=${slug}`);
    const data = await res.json();
    return data.data.tournament || null;
  } catch (err) {
    console.error("Failed to fetch tournament:", err);
    return null;
  }
}

async function fetchAllTournaments() {
  try {
    const res = await fetch("/api/tournaments");
    const data = await res.json();
    return data.data.tournaments || [];
  } catch (err) {
    console.error("Failed to fetch tournaments:", err);
    return [];
  }
}

// --------------------------
// Bracket Utilities
// --------------------------
const matchLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function createPlayerDiv(p) {
  const div = document.createElement("div");
  div.className = "player";
  if (!p) return div;

  if (p.character) {
    const img = document.createElement("img");
    img.src = `/images/characters/characters_select/Select_${p.character}.png`;
    img.alt = p.character;
    img.width = 40;
    img.height = 40;
    div.appendChild(img);
  }

  div.appendChild(document.createTextNode(` ${p.name} ${p.score !== undefined ? `[${p.score}]` : ""}`));
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
  parentDiv.innerHTML = '';
  let matchCount = 0;
  rounds.forEach(round => {
    const roundDiv = document.createElement("div");
    roundDiv.className = "round";
    roundDiv.style.setProperty('--gap', '40px');

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
  const event = tournament.events[0];
  const tbody = document.getElementById("standings-body");
  if (!tbody) return;

  let standings = event.entrants.nodes.map(e => ({
    name: e.name,
    wins: e.standing?.stats?.wins?.value || 0,
    losses: e.standing?.stats?.losses?.value || 0,
    score: e.standing?.stats?.score?.value || 0,
    lostTo: e.standing?.stats?.lostTo?.value || "",
    character: e.character || ""
  }));

  standings.sort((a, b) => b.score - a.score);
  if (limit) standings = standings.slice(0, limit);

  tbody.innerHTML = '';
  standings.forEach((p, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${i+1}</td><td>${p.name}</td><td>${p.wins}</td><td>${p.losses}</td><td>${p.score}</td><td>${p.lostTo}</td>`;
    tbody.appendChild(row);
  });
}

// --------------------------
// Render Stats
// --------------------------
async function renderStats(containerId = "stats-container", slug) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const tournament = await fetchTournament(slug);
  if (!tournament) return;
  const event = tournament.events[0];

  const stats = event.entrants.nodes.reduce((acc, e) => {
    const chars = Array.isArray(e.character) ? e.character : [e.character];
    chars.forEach(c => {
      if (!c) return;
      acc[c] = (acc[c] || 0) + 1;
    });
    return acc;
  }, {});

  const totalPlayers = event.entrants.nodes.length;
  const sortedStats = Object.entries(stats).sort((a,b)=>b[1]-a[1]);

  sortedStats.forEach(([char, count]) => {
    const percent = ((count / totalPlayers) * 100).toFixed(1);
    const div = document.createElement("div");
    div.className = "stat-card";

    const img = document.createElement("img");
    img.src = `/images/characters/characters_select/Select_${char}.png`;
    img.alt = char;
    img.width = 60; img.height = 60;

    const label = document.createElement("div");
    label.className = "stat-label";
    label.textContent = `${char}: ${count} (${percent}%)`;

    div.appendChild(img);
    div.appendChild(label);
    container.appendChild(div);
  });
}

// --------------------------
// Load Tournaments Landing Page
// --------------------------
// --------------------------
// Load Tournaments Landing Page
// --------------------------
async function loadTournamentsLanding() {
  const container = document.getElementById("tournamentList");
  const gameFilter = document.getElementById("gameFilter");
  const statusFilter = document.getElementById("statusFilter");
  const relatedEvents = document.getElementById("relatedEvents");
  if (!container || !gameFilter || !statusFilter) return;

  // Fetch tournaments from API
  let tournaments = await fetchAllTournaments();

  // TEMPORARY: Add manual tournaments until API is ready
  tournaments.push(
    {
      name: "VSFighting XIII",
      game: "Tekken 8",
      status: "completed", // lowercase
      startAt: "2025-08-16",
      slug: "vsfighting-xiii",
      logoUrl: "../images/games/boxart/boxart_Tekken8.png"
    },
    {
      name: "VSFighting XI",
      game: "Tekken 3",
      status: "completed",
      startAt: "2023-08-19",
      slug: "vsfighting-xi",
      logoUrl: "../images/games/boxart/boxart_Tekken3.png"
    }
  );

  // --------------------------
  // Populate Game Filter
  // --------------------------
  const games = ["all", ...new Set(tournaments.map(t => t.game))];
  games.forEach(game => {
    const opt = document.createElement("option");
    opt.value = game === "all" ? "all" : game.toLowerCase().replace(/\s/g,'');
    opt.textContent = game === "all" ? "All Games" : game;
    gameFilter.appendChild(opt);
  });

  let selectedCharacter = null;

  // --------------------------
  // Render Tournament List
  // --------------------------
  function renderList() {
    const selectedGame = gameFilter.value;
    const selectedStatus = statusFilter.value;

    container.innerHTML = '';
    if (relatedEvents) relatedEvents.innerHTML = '';

    tournaments
      .filter(t => 
        (selectedGame === "all" || t.game.toLowerCase().replace(/\s/g,'') === selectedGame) &&
        (selectedStatus === "all" || t.status.toLowerCase() === selectedStatus) &&
        (!selectedCharacter || t.participants?.some(p => p.character === selectedCharacter))
      )
      .sort((a,b) => new Date(b.startAt) - new Date(a.startAt))
      .forEach(t => {
        // Tournament Card
        const card = document.createElement("div");
        card.className = "tournament-card";

        const thumbnail = document.createElement("img");
        thumbnail.className = "tournament-thumbnail";
        thumbnail.src = t.logoUrl || `../images/games/${t.game.replace(/\s/g,'')}.png`;
        thumbnail.alt = t.game;
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
        const start = new Date(t.startAt);
        date.textContent = `Date: ${start.toLocaleDateString()}`;
        card.appendChild(date);

        const game = document.createElement("p");
        game.textContent = `Game: ${t.game}`;
        card.appendChild(game);

        const link = document.createElement("a");
        link.href = `brackets.html?slug=${t.slug}`;
        link.textContent = "View Bracket";
        card.appendChild(link);

        container.appendChild(card);

        // Related Events Section
        if (relatedEvents) {
          const relatedLink = document.createElement("a");
          relatedLink.href = `brackets.html?slug=${t.slug}`;
          relatedLink.innerHTML = `<h2>${t.name}</h2>`;
          relatedEvents.appendChild(relatedLink);
        }
      });
  }

  // Initial render
  renderList();

  // Event listeners
  gameFilter.addEventListener("change", renderList);
  statusFilter.addEventListener("change", renderList);

  // Optional character filter
  window.setCharacterFilter = (charName) => {
    selectedCharacter = charName;
    renderList();
  };
}

// --------------------------
// Initialize everything on DOM ready
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadNav();
  loadFooter();

  const urlParams = new URLSearchParams(window.location.search);
  const pool = urlParams.get("pool");
  const topcut = urlParams.get("topcut");

  if (document.getElementById("tournamentList")) {
    if (pool) loadPool(Number(pool));
    else if (topcut) loadTopcut(Number(topcut));
    else loadTournamentsLanding();
  }

  if (document.getElementById("standings-body")) {
    const limit = document.getElementById("overview-bracket-btn") ? 8 : null;
    loadStandings(limit);
  }

  if (document.getElementById("stats-container")) {
    renderStats();
  }
});
