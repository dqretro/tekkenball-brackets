// ===========================
// Tournament Utilities
// ===========================

const matchLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// --------------------------
// Base API Fetches
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
const tempStandings = [
  { name: "PND | Stykie", wins: 6, losses: 0, score: 100, lostTo: null, character: "Yoshimitsu" },
  { name: "NGI | Sabrewoif", wins: 4, losses: 2, score: 80, lostTo: { name: "PND | Strykie", character: "Yoshimitsu" }, character: "Clive" },
  { name: "HarryCM01", wins: 4, losses: 2, score: 60, lostTo: { name: "NGI | Sabrewoif", character: "Clive" }, character: "Anna" },
  { name: "MILKGUY | Orion", wins: 4, losses: 2, score: 40, lostTo: { name: "NGI | Sabrewoif", character: "Clive" }, character: "Law" },
  { name: "DQ | ProtonicCobra", wins: 5, losses: 2, score: 20, lostTo: { name: "MILKGUY | Orion", character: "jin" }, character: "Jack8" },
  { name: "RIF | Geowesome", wins: 4, losses: 2, score: 0, lostTo: { name: "NGI | Sabrewoif", character: "Clive" }, character: "Clive" },
  { name: "SFO | Zephhyr", wins: 5, losses: 2, score: 20, lostTo: { name: "DQ | ProtonicCobra", character: "Jack8" }, character: "DevilJin" },
  { name: "Cringe Lord", wins: 3, losses: 2, score: 0, lostTo: { name: "RIF | Geowesome", character: "Clive" }, character: "Clive" }
];

async function loadStandings(limit = null, slug) {
  let standings = [];

  if (slug) {
    try {
      const tournament = await fetchTournament(slug);
      if (tournament) {
        const event = (tournament.events || [])[0];
        if (event) {
          standings = (event.entrants?.nodes || []).map(e => {
            const wins = e.standing?.stats?.wins?.value ?? 0;
            const losses = e.standing?.stats?.losses?.value ?? 0;
            return {
              name: e.name,
              wins,
              losses,
              score: e.standing?.stats?.score?.value ?? 0,
              setWinPct: wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0.0",
              lostTo: e.standing?.stats?.lostTo?.value
                ? { name: e.standing?.stats?.lostTo?.value, character: "" }
                : null,
              character: e.character || ""
            };
          });
        }
      }
    } catch (err) {
      console.warn("Tournament API failed, using temp data", err);
    }
  }

  if (!standings.length) {
    standings = tempStandings.map(p => ({
      ...p,
      setWinPct: p.wins + p.losses > 0 ? ((p.wins / (p.wins + p.losses)) * 100).toFixed(1) : "0.0"
    }));
  }

  standings.sort((a, b) => b.score - a.score);
  if (limit) standings = standings.slice(0, limit);

  const tbody = document.getElementById("standings-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  standings.forEach((p, i) => {
    const charImg = p.character
      ? `<img src="${withBase(`/images/games/tk8/characters/characters_select/select_${p.character}.png`)}" 
               alt="${p.character}" width="30" height="30" style="vertical-align:middle; margin-right:6px;">`
      : "";

    const lostToCell = p.lostTo
      ? `${p.lostTo.character ? 
          `<img src="${withBase(`/images/games/tk8/characters/characters_select/select_${p.lostTo.character}.png`)}" 
               alt="${p.lostTo.character}" width="25" height="25" style="vertical-align:middle; margin-right:6px;">`
        : ""}${p.lostTo.name}`
      : "-";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${charImg}${p.name}</td>
      <td>${p.wins}</td>
      <td>${p.losses}</td>
      <td>${p.setWinPct}%</td>
      <td>${lostToCell}</td>
    `;
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
// Load Event Stats (Overview + Brackets + Standings)
// --------------------------
async function loadEventStats(slug) {
  const tournament = await fetchTournament(slug);
  if (!tournament) return;
  const event = (tournament.events || [])[0];
  if (!event) return;

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
    { name: "VSFighting XIII", game: "Tekken 8", status: "completed", startAt: "2025-08-16", slug: "vsfighting-xiii", logoUrl: "/images/games/tk8/boxart/boxart_tekken8.png" },
    { name: "VSFighting XI", game: "Tekken 3", status: "completed", startAt: "2023-08-19", slug: "vsfighting-xi", logoUrl: "/images/games/tk3/boxart/boxart_tekken3.png" },
    { name: "Example", game: "Tekken Tag Tournament 2", status: "ongoing", startAt: "2025-01-01", slug: "example", logoUrl: "/images/games/ttt2/boxart/boxart_tekkentag2.png" }
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
// Auto-load on DOM ready
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
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
