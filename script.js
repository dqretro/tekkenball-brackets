// ==========================
// Unified API-Driven Script
// ==========================

// ---------------------------------------
// Base path helpers (GH Pages vs. local)
// ---------------------------------------
const BASE = window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "";

// Prefix any internal path with BASE (keeps http(s): links intact)
function withBase(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;            // external links untouched
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

// Remove trailing slash for neat comparisons
function trimTrailingSlash(p) {
  return p ? p.replace(/\/$/, "") : p;
}

// --------------------------
// Load Navigation
// --------------------------
function loadNav() {
  // NOTE: paths are case-sensitive on GitHub Pages
  fetch(withBase("/shared/layout/header/nav/nav.html"))
    .then(res => {
      if (!res.ok) throw new Error(`Failed to fetch nav: ${res.status}`);
      return res.text();
    })
    .then(html => {
      const holder = document.getElementById("nav-placeholder");
      if (!holder) return;
      holder.innerHTML = html;

      // Highlight the active link (only one)
      const links = holder.querySelectorAll("nav a[href]");
      const current = trimTrailingSlash(window.location.pathname);

      let chosen = null;
      links.forEach(link => {
        const href = link.getAttribute("href");
        const targetAbs = trimTrailingSlash(
          href.startsWith("/") ? href : withBase(href)
        );

        // Prefer exact match, else fallback to endsWith match
        if (current === targetAbs) {
          chosen = link;
        } else if (!chosen && current.endsWith(trimTrailingSlash(href))) {
          // fallback only if nothing chosen yet
          chosen = link;
        }
      });

      if (chosen) links.forEach(a => a.classList.toggle("active", a === chosen));
    })
    .catch(err => console.error("Error loading nav:", err));
}

// --------------------------
// Load Footer
// --------------------------
function loadFooter() {
  // Keep path lowercase and prefixed
  fetch(withBase("/shared/layout/footer/footer.html"))
    .then(res => (res.ok ? res.text() : ""))
    .then(html => {
      const footer = document.getElementById("footer-placeholder");
      if (footer && html) footer.innerHTML = html;
    })
    .catch(err => console.warn("Footer not loaded:", err));
}

// --------------------------
// Fetch Tournament Data
// --------------------------
// NOTE: If you rely on /api/* endpoints, they won't work on GitHub Pages
// unless you're proxying to a real backend. These calls remain as-is.
async function fetchTournament(slug = "dqretro-tournament-slug") {
  try {
    const res = await fetch(withBase(`/api/tournament?slug=${encodeURIComponent(slug)}`));
    const data = await res.json();
    return data.data?.tournament || null;
  } catch (err) {
    console.error("Failed to fetch tournament:", err);
    return null;
  }
}

// --------------------------
// Fetch All Tournaments
// --------------------------
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
// Transform Sets → Rounds
// --------------------------
function transformSetsToRounds(sets) {
  const rounds = {};
  (sets || []).forEach(set => {
    const roundName = `Round ${set.round}`;
    if (!rounds[roundName]) rounds[roundName] = [];

    const [slot1, slot2] = set.slots || [];
    rounds[roundName].push({
      p1: slot1
        ? {
            name: slot1.entrant?.name,
            score: slot1.standing?.stats?.score?.value,
            winner: set.winnerId === slot1.entrant?.id,
            character: slot1.entrant?.character
          }
        : null,
      p2: slot2
        ? {
            name: slot2.entrant?.name,
            score: slot2.standing?.stats?.score?.value,
            winner: set.winnerId === slot2.entrant?.id,
            character: slot2.entrant?.character
          }
        : null
    });
  });
  return Object.entries(rounds).map(([title, matches]) => ({ title, matches }));
}

// --------------------------
// Bracket Rendering
// --------------------------
const matchLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function createPlayerDiv(p) {
  const div = document.createElement("div");
  div.className = "player";
  if (!p) return div;

  if (p.character) {
    const img = document.createElement("img");
    // character images must use BASE prefix
    img.src = withBase(`/images/characters/characters_select/Select_${p.character}.png`);
    img.alt = p.character;
    img.width = 40;
    img.height = 40;
    div.appendChild(img);
  }

  div.appendChild(
    document.createTextNode(
      ` ${p.name ?? ""} ${p.score !== undefined ? `[${p.score}]` : ""}`
    )
  );

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
async function loadStandings(limit = null, slug = "dqretro-tournament-slug") {
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
    row.innerHTML = `<td>${i + 1}</td><td>${p.name}</td><td>${p.wins}</td><td>${p.losses}</td><td>${p.score}</td><td>${p.lostTo}</td>`;
    tbody.appendChild(row);
  });
}

// --------------------------
// Render Stats
// --------------------------
async function renderStats(containerId = "stats-container", slug = "dqretro-tournament-slug") {
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

  sortedStats.forEach(([char, count]) => {
    const percent = ((count / totalPlayers) * 100).toFixed(1);
    const div = document.createElement("div");
    div.className = "stat-card";

    const img = document.createElement("img");
    img.src = withBase(`/images/characters/characters_select/Select_${char}.png`);
    img.alt = char;
    img.width = 60;
    img.height = 60;

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
async function loadTournamentsLanding() {
  const container = document.getElementById("tournamentList");
  if (!container) return;

  const tournaments = await fetchAllTournaments();

  // Populate filters
  const gameFilter = document.getElementById("gameFilter");
  const statusFilter = document.getElementById("statusFilter");
  if (gameFilter && gameFilter.options.length === 1) {
    const games = [...new Set(tournaments.map(t => t.game).filter(Boolean))];
    games.forEach(game => {
      const opt = document.createElement("option");
      opt.value = game;
      opt.textContent = game;
      gameFilter.appendChild(opt);
    });
  }

  let selectedCharacter = null;

  function renderList() {
    const selectedGame = gameFilter ? gameFilter.value : "all";
    const selectedStatus = statusFilter ? statusFilter.value : "all";

    container.innerHTML = "";

    tournaments
      .filter(
        t =>
          (selectedGame === "all" || t.game === selectedGame) &&
          (selectedStatus === "all" || t.status === selectedStatus) &&
          (!selectedCharacter ||
            (t.participants || []).some(p => p.character === selectedCharacter))
      )
      .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
      .forEach(tournament => {
        const card = document.createElement("div");
        card.className = "tournament-card";
        card.style.position = "relative";

        // Thumbnail
        const thumbnail = document.createElement("img");
        thumbnail.className = "tournament-thumbnail";
        const fallbackLogo = withBase(`/images/games/${String(tournament.game || "").replace(/\s/g, "")}.png`);
        thumbnail.src = tournament.logoUrl ? tournament.logoUrl : fallbackLogo;
        thumbnail.alt = tournament.game || "Game";
        card.appendChild(thumbnail);

        // Status badge
        const badge = document.createElement("span");
        badge.className = "tournament-badge";
        const statusText = (tournament.status || "").toString();
        badge.textContent = statusText ? statusText[0].toUpperCase() + statusText.slice(1) : "";
        badge.setAttribute("data-status", statusText.toLowerCase());
        card.appendChild(badge);

        // Title
        const title = document.createElement("h2");
        title.textContent = tournament.name || "Tournament";
        card.appendChild(title);

        // Date
        const date = document.createElement("p");
        const start = tournament.startAt ? new Date(tournament.startAt) : null;
        date.textContent = `Date: ${start ? start.toLocaleDateString() : "TBA"}`;
        card.appendChild(date);

        // Game
        const game = document.createElement("p");
        game.textContent = `Game: ${tournament.game || "Unknown"}`;
        card.appendChild(game);

        // Bracket link (ensure path works from anywhere)
        const link = document.createElement("a");
        link.href = withBase(`/pages/brackets.html?slug=${encodeURIComponent(tournament.slug)}`);
        link.textContent = "View Bracket";
        card.appendChild(link);

        container.appendChild(card);
      });
  }

  renderList();

  if (gameFilter) gameFilter.addEventListener("change", renderList);
  if (statusFilter) statusFilter.addEventListener("change", renderList);

  window.setCharacterFilter = charName => {
    selectedCharacter = charName;
    renderList();
  };
}

// --------------------------
// Init
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadNav();
  loadFooter();

  const urlParams = new URLSearchParams(window.location.search);
  const pool = urlParams.get("pool");
  const topcut = urlParams.get("topcut");

  if (document.getElementById("tournamentList")) {
    if (pool && typeof loadPool === "function") {
      loadPool(Number(pool));
    } else if (topcut && typeof loadTopcut === "function") {
      loadTopcut(Number(topcut));
    } else {
      loadTournamentsLanding();
    }
  }

  if (document.getElementById("standings-body")) {
    const limit = document.getElementById("overview-bracket-btn") ? 8 : null;
    loadStandings(limit);
  }

  if (document.getElementById("stats-container")) {
    renderStats();
  }
});
