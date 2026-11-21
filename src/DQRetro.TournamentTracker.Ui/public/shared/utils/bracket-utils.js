export function withBase(path) {
  const BASE = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? path : "/" + path}`;
}

export async function loadTournamentData() {
  try {
    const res = await fetch(withBase("/pages/tournaments/placeholder-data/tournaments-placeholder.json"));
    if (!res.ok) throw new Error("Failed to fetch tournaments JSON");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export function renderPools(pools) {
  const container = document.getElementById("poolsContainer");
  container.innerHTML = "";
  if (!pools || pools.length === 0) {
    container.innerHTML = `<div class="not-found">No pools available.</div>`;
    return;
  }
  pools.forEach(pool => {
    const poolCard = document.createElement("div");
    poolCard.className = "pool-card";
    poolCard.textContent = `${pool.name} (${pool.players.length} players)`;
    container.appendChild(poolCard);
  });
}

export function slugify(name) {
  return (name || "").toString().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");
}

export function generateBracketSets(players, sets) {
  const rounds = [];
  let currentRoundMatches = sets.map(s => ({
    top: { name: s.winner, character: "Random", seed: null, score: s.score.split("-")[0] || 0 },
    bottom: { name: s.loser, character: "Random", seed: null, score: s.score.split("-")[1] || 0 }
  }));
  while (currentRoundMatches.length) {
    rounds.push({ matches: currentRoundMatches.splice(0, Math.ceil(currentRoundMatches.length / 2)) });
  }
  return rounds;
}
