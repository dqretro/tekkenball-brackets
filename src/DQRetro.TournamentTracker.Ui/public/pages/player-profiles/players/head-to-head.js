// ============================
// head-to-head.js
// Reads brackets.json and builds full rival match records
// ============================

let allOpponentsData = [];
let currentSortField = null;
let sortAscending = false;

function withBase(path) {
  const base = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  path = path.replace(/^\/+/, "");
  return `${base}/${path}`;
}

function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

function stripClanTag(name) {
  if (!name) return "";
  const cleaned = name.includes("|") ? name.split("|").pop().trim() : name.trim();
  return cleaned
    .replace(/^[\s\-\]\.\[]+/, "")
    .replace(/[\s\-\]\.\[]+$/, "")
    .trim();
}

function createSlug(name) {
  if (!name) return "";
  return stripClanTag(name)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function namesMatch(a, b) {
  if (!a || !b) return false;
  const clean = n => n.toLowerCase().trim();
  const cleanTag = n => stripClanTag(n).toLowerCase();
  const slugA = createSlug(a);
  const slugB = createSlug(b);

  return (
    clean(a) === clean(b) ||
    cleanTag(a) === cleanTag(b) ||
    (slugA && slugB && slugA === slugB) ||
    clean(a).includes(cleanTag(b)) ||
    clean(b).includes(cleanTag(a))
  );
}

async function loadHeadToHeadData(playerName) {
  const opponentStats = {};
  let totalWins = 0;
  let totalLosses = 0;

  try {
    const res = await fetch(withBase("/data/brackets.json"));
    if (!res.ok) return { opponentStats, totalWins, totalLosses };

    const json = await res.json();
    const rawTournaments = json?.data?.currentUser?.tournaments?.nodes || [];

    for (const t of rawTournaments) {
      for (const ev of t.events || []) {
        const standings = ev.standings?.nodes || [];
        const sets = ev.sets?.nodes || [];

        const standingNode = standings.find(n => namesMatch(n.entrant?.name, playerName));
        if (!standingNode) continue;

        const entrantId = standingNode.entrant?.id;

        sets.forEach(set => {
          const slots = set.slots || [];
          const isInSet = slots.some(s => s.entrant && String(s.entrant.id) === String(entrantId));
          if (!isInSet || !set.winnerId) return;

          const isDQ = slots.some(s => s.standing?.stats?.score?.value === -1);
          if (isDQ) return;

          const opp = slots.find(s => s.entrant && String(s.entrant.id) !== String(entrantId));
          const isWin = String(set.winnerId) === String(entrantId);

          if (isWin) totalWins++;
          else totalLosses++;

          if (opp?.entrant?.name) {
            const oppName = stripClanTag(opp.entrant.name);
            if (!opponentStats[oppName]) {
              opponentStats[oppName] = { name: oppName, wins: 0, losses: 0, total: 0 };
            }
            if (isWin) opponentStats[oppName].wins++;
            else opponentStats[oppName].losses++;
            opponentStats[oppName].total++;
          }
        });
      }
    }
  } catch (err) {
    console.error("Failed to load brackets.json:", err);
  }

  return { opponentStats, totalWins, totalLosses };
}

function renderTable(data) {
  const tbody = document.getElementById("h2hTableBody");
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:2em;">No matching opponents found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(opp => {
    const oppSlug = createSlug(opp.name);
    const oppProfileUrl = withBase(`/pages/player-profiles/players/players.html?player=${encodeURIComponent(oppSlug)}`);
    
    return `
      <tr>
        <td>
          <a href="${oppProfileUrl}" style="color:var(--text, #fff); font-weight:600; text-decoration:none;">
            ${escapeHtml(opp.name)}
          </a>
        </td>
        <td>${opp.total}</td>
        <td class="win-badge">${opp.wins}</td>
        <td class="loss-badge">${opp.losses}</td>
        <td><strong>${Math.round(opp.winRatePct)}%</strong></td>
        <td>
          <a href="${oppProfileUrl}" style="color:var(--accent, #7c4dff); font-size:0.8rem; text-decoration:none; font-weight:600;">
            View Profile ↗
          </a>
        </td>
      </tr>
    `;
  }).join("");
}

function sortData(field) {
  if (currentSortField === field) {
    sortAscending = !sortAscending;
  } else {
    currentSortField = field;
    sortAscending = false;
  }

  allOpponentsData.sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    if (typeof valA === "string") {
      return sortAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAscending ? valA - valB : valB - valA;
  });

  renderTable(filterData());
}

function filterData() {
  const query = (document.getElementById("h2hSearch")?.value || "").toLowerCase();
  return allOpponentsData.filter(opp => opp.name.toLowerCase().includes(query));
}

async function initHeadToHead() {
  const rawParam = getQueryParam("player");
  if (!rawParam) {
    document.getElementById("playerName").textContent = "Player Not Specified";
    return;
  }

  const playerSlug = createSlug(decodeURIComponent(rawParam));
  
  const backLink = document.getElementById("backToProfileLink");
  if (backLink) {
    backLink.href = withBase(`/pages/player-profiles/players/players.html?player=${encodeURIComponent(playerSlug)}`);
  }

  try {
    const res = await fetch(withBase("/data/players.json"));
    if (res.ok) {
      const players = await res.json();
      const player = players.find(p => createSlug(p.name) === playerSlug || (p.slug && createSlug(p.slug) === playerSlug));
      if (player) {
        document.getElementById("playerName").textContent = stripClanTag(player.name);
        const avatarImg = document.querySelector(".player-avatar-modern");
        if (avatarImg && player.avatar) avatarImg.src = player.avatar;
      } else {
        document.getElementById("playerName").textContent = decodeURIComponent(rawParam);
      }
    }
  } catch {}

  const { opponentStats, totalWins, totalLosses } = await loadHeadToHeadData(decodeURIComponent(rawParam));

  allOpponentsData = Object.values(opponentStats).map(opp => ({
    ...opp,
    winRatePct: opp.total > 0 ? (opp.wins / opp.total) * 100 : 0
  }));

  const totalSets = totalWins + totalLosses;
  const overallPct = totalSets > 0 ? ((totalWins / totalSets) * 100).toFixed(1) + "%" : "0%";

  document.getElementById("totalOpponents").textContent = allOpponentsData.length;
  document.getElementById("totalSets").textContent = totalSets;
  document.getElementById("totalWins").textContent = totalWins;
  document.getElementById("totalLosses").textContent = totalLosses;
  document.getElementById("overallWinRate").textContent = overallPct;

  sortData("total");

  document.getElementById("h2hSearch")?.addEventListener("input", () => {
    renderTable(filterData());
  });

  document.getElementById("sortName")?.addEventListener("click", () => sortData("name"));
  document.getElementById("sortSets")?.addEventListener("click", () => sortData("total"));
  document.getElementById("sortWins")?.addEventListener("click", () => sortData("wins"));
  document.getElementById("sortLosses")?.addEventListener("click", () => sortData("losses"));
  document.getElementById("sortWinRate")?.addEventListener("click", () => sortData("winRatePct"));
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof loadNav === "function") loadNav();
  if (typeof loadFooter === "function") loadFooter();
  initHeadToHead();
});