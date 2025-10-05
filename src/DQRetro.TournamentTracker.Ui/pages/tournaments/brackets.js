// ---------------------------
// Brackets Display (Pools + Top Cut)
// ---------------------------

// Utility to assign rounds dynamically for BracketsViewer
function assignRounds(matches, playersCount) {
  if (!matches || matches.length === 0) return [];
  const totalRounds = Math.ceil(Math.log2(playersCount));
  return matches.map((m, idx) => ({
    ...m,
    round: Math.floor(idx / (matches.length / totalRounds)) + 1
  }));
}

// Utility to generate dummy sets if none exist
function generateDummySets(players) {
  if (!players || players.length < 2) return [];
  const sets = [];
  for (let i = 0; i < players.length; i += 2) {
    if (players[i + 1]) {
      sets.push({
        player1: players[i],
        player2: players[i + 1],
        winner: players[i],
        score: "2-0"
      });
    }
  }
  return sets;
}

// ---------------------------
// Render Pools Brackets
// ---------------------------
async function renderPoolsBrackets(slug) {
  const poolsContainer = document.getElementById("poolsContainer");
  if (!poolsContainer || !slug) return;

  const tournament = await fetchTournament(slug);
  if (!tournament) return;

  const event = tournament.events.find(ev => ev.slug === slug);
  if (!event) return;

  poolsContainer.innerHTML = "";

  let pools = event.pools || [];
  // Fallback: create pools if none exist
  if (!pools.length) {
    const entrants = event.entrants?.nodes || [];
    let poolIndex = 1;
    for (let i = 0; i < entrants.length; i += 4) {
      pools.push({ 
        name: `Pool ${poolIndex++}`, 
        players: entrants.slice(i, i + 4).map(e => e.name || "Unknown"),
        sets: [] 
      });
    }
  }

  pools.forEach(pool => {
    const poolDiv = document.createElement("div");
    poolDiv.className = "bracket-container";
    poolDiv.innerHTML = `<h3>${pool.name}</h3>`;
    poolsContainer.appendChild(poolDiv);

    const players = pool.players || pool.entrants?.map(e => e.name) || [];
    let matches = (pool.sets && pool.sets.length > 0)
      ? pool.sets.map(s => ({
          player1: s.winner,
          player2: s.loser,
          winner: s.winner,
          score: s.score
        }))
      : generateDummySets(players);

    const matchesWithRounds = assignRounds(matches, players.length);

    new BracketsViewer(poolDiv, {
      teams: players,
      matches: matchesWithRounds
    }, { doubleElimination: false });
  });
}

// ---------------------------
// Render Top Cut Bracket
// ---------------------------
async function renderTopCutBracket(slug) {
  const topcutContainer = document.getElementById("topcutContainer");
  if (!topcutContainer || !slug) return;

  const tournament = await fetchTournament(slug);
  if (!tournament) return;

  const event = tournament.events.find(ev => ev.slug === slug);
  if (!event || !event.topcut) {
    topcutContainer.innerHTML = "<p>No top cut available.</p>";
    return;
  }

  topcutContainer.innerHTML = "";

  const players = event.topcut.players || [];
  let matches = (event.topcut.sets && event.topcut.sets.length > 0)
    ? event.topcut.sets.map(s => ({
        player1: s.winner,
        player2: s.loser,
        winner: s.winner,
        score: s.score
      }))
    : generateDummySets(players);

  const matchesWithRounds = assignRounds(matches, players.length);

  new BracketsViewer(topcutContainer, {
    teams: players,
    matches: matchesWithRounds
  }, { doubleElimination: true });
}

// ---------------------------
// Auto-load on DOM ready
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug) return;

  // Detect which container exists and render accordingly
  if (document.getElementById("poolsContainer")) {
    renderPoolsBrackets(slug);
  }
  if (document.getElementById("topcutContainer")) {
    renderTopCutBracket(slug);
  }
});
