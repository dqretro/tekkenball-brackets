function withBase(path) {
  const base = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  path = path.replace(/^\/+/, "");
  return `${base}/${path}`;
}

function getPlacementPoints(placement) {
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
  let players = [];
  try {
    const playersRes = await fetch(withBase("pages/player-profiles/players/players.json"));
    if (playersRes.ok) players = await playersRes.json();
  } catch (err) {
    console.error("Failed to fetch players.json:", err);
  }

  const playerPoints = {};
  let rawEvents = [];

  // Try live brackets data first
  try {
    const res = await fetch(withBase("data/brackets.json"));
    if (res.ok) {
      const liveData = await res.json();
      const tournaments = liveData?.data?.currentUser?.tournaments?.nodes || [];
      tournaments.forEach(t => {
        if (t.events) rawEvents.push(...t.events);
      });
    }
  } catch (err) {
    console.warn("brackets.json fetch failed, loading placeholder:", err);
  }

  // Fallback to placeholder JSON if no live events
  if (!rawEvents.length) {
    try {
      const tourRes = await fetch(withBase("pages/tournaments/placeholder-data/tournaments-placeholder.json"));
      if (tourRes.ok) {
        const data = await tourRes.json();
        (data.events || []).forEach(group => {
          if (Array.isArray(group.events)) rawEvents.push(...group.events);
        });
      }
    } catch (err) {
      console.error("Failed to load placeholder data:", err);
    }
  }

  // Accumulate points from events
  for (const event of rawEvents) {
    const entrants = event.entrants?.nodes || event.entrants || [];
    for (const entrant of entrants) {
      const name = entrant.name;
      if (!name) continue;
      const placement = entrant.placement || 0;
      if (!playerPoints[name]) playerPoints[name] = 0;
      playerPoints[name] += getPlacementPoints(placement);
    }
  }

  const ranked = players.map(p => ({
    ...p,
    points: playerPoints[p.name] || 0
  })).sort((a, b) => b.points - a.points);

  const tbody = document.querySelector("#rankingsTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

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

document.addEventListener("DOMContentLoaded", loadRankings);