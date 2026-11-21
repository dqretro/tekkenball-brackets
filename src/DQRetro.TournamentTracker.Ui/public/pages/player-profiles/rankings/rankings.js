// Global rankings: placement points from every event's standings.
// Uses withBase() from script.js so paths work locally and on GitHub Pages.

// Same scale as the player profile's "Ranking Points" (players.js).
function getPlacementPoints(placement) {
  if (placement === 1) return 10;
  if (placement === 2) return 8;
  if (placement === 3) return 6;
  if (placement === 4) return 5;
  if (placement <= 6) return 4;
  if (placement <= 8) return 2;
  return 1;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function fetchJson(path, fallback) {
  try {
    const res = await fetch(withBase(path));
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn(`Failed to load ${path}:`, err);
  }
  return fallback;
}

async function loadRankings() {
  const tbody = document.querySelector("#rankingsTable tbody");
  const summary = document.getElementById("rankingsSummary");
  if (!tbody) return;

  const [players, brackets] = await Promise.all([
    fetchJson("data/players.json", []),
    fetchJson("data/brackets.json", null),
  ]);

  const playersBySlug = new Map((players || []).map(p => [p.slug, p]));
  const tournaments = brackets?.data?.currentUser?.tournaments?.nodes || [];
  const totals = new Map();
  let eventCount = 0;

  for (const t of tournaments) {
    for (const ev of t.events || []) {
      const standings = ev.standings?.nodes || [];
      if (standings.length) eventCount++;
      for (const st of standings) {
        const entrant = st.entrant;
        const placement = Number(st.placement ?? 0);
        if (!entrant?.name || !placement) continue;
        const key = entrant.playerSlug || entrant.name.toLowerCase();
        const row = totals.get(key) || { slug: entrant.playerSlug || null, name: entrant.name, points: 0, events: 0, titles: 0 };
        row.points += getPlacementPoints(placement);
        row.events++;
        if (placement === 1) row.titles++;
        totals.set(key, row);
      }
    }
  }

  const ranked = [...totals.values()].sort((a, b) =>
    b.points - a.points || b.titles - a.titles || a.events - b.events || a.name.localeCompare(b.name));

  if (!ranked.length) {
    summary.textContent = "No ranking data available yet.";
    return;
  }
  summary.textContent = `${ranked.length} players ranked across ${eventCount} events.`;

  let rank = 0, prevKey = null;
  tbody.innerHTML = ranked.map((r, i) => {
    const tieKey = `${r.points}|${r.titles}|${r.events}`;
    if (tieKey !== prevKey) { rank = i + 1; prevKey = tieKey; }
    const p = r.slug ? playersBySlug.get(r.slug) : null;
    const name = p?.name || r.name;
    const nameCell = r.slug
      ? `<a href="${withBase(`pages/player-profiles/players/players.html?player=${encodeURIComponent(r.slug)}`)}">${escapeHtml(name)}</a>`
      : escapeHtml(name);
    return `<tr>
      <td>${rank}</td>
      <td>${nameCell}</td>
      <td>${escapeHtml(p?.team || "-")}</td>
      <td>${escapeHtml(p?.country || "-")}</td>
      <td>${r.events}</td>
      <td>${r.titles}</td>
      <td>${r.points}</td>
    </tr>`;
  }).join("");
}

document.addEventListener("DOMContentLoaded", loadRankings);
