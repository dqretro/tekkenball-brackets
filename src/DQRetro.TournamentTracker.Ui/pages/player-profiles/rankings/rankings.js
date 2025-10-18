async function getPlacementPoints(placement) {
  switch (placement) {
    case 1: return 10;
    case 2: return 8;
    case 3: return 6;
    case 4: return 5;
    case 5: case 6: return 4;
    case 7: case 8: return 2;
    default: return 1;
  }
}

async function loadRankings() {
  const playersRes = await fetch("/pages/player-profiles/players/players.json");
  const players = await playersRes.json();

  const tourRes = await fetch("/pages/tournaments/placeholder-data/tournaments-placeholder.json");
  const data = await tourRes.json();

  const playerPoints = {};

  for (const tournament of data.tournaments) {
    const eventGroup = data.events.find(e => e.slug === tournament.slug);
    if (!eventGroup) continue;

    for (const event of eventGroup.events) {
      const entrants = event.entrants?.nodes || [];
      for (const entrant of entrants) {
        const name = entrant.name;
        const placement = entrant.placement || 0;
        if (!playerPoints[name]) playerPoints[name] = 0;
        playerPoints[name] += getPlacementPoints(placement);
      }
    }
  }

  const ranked = players.map(p => ({
    ...p,
    points: playerPoints[p.name] || 0
  })).sort((a, b) => b.points - a.points);

  const tbody = document.querySelector("#rankingsTable tbody");
  ranked.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.name}</td>
      <td>${p.team || "-"}</td>
      <td>${p.country || "-"}</td>
      <td>${p.points}</td>
    `;
    tbody.appendChild(tr);
  });
}

loadRankings();
