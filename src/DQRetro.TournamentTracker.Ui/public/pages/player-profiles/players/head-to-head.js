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

// Fallback only: mirrors Slugs.ForPlayer in the sync tool (Program.cs).
// Prefer the precomputed slug in the data (players.json "slug" / entrant "playerSlug").
function createSlug(name) {
  if (!name) return "";
  const tag = name.includes("|") ? name.split("|").pop() : name;
  return tag.trim().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function entrantSlug(entrant) {
  return entrant?.playerSlug || createSlug(entrant?.name);
}

// Exact slug match when the data has slugs; name matching only for older data.
function entrantIsPlayer(entrant, playerName, playerSlug) {
  if (!entrant) return false;
  if (playerSlug && entrant.playerSlug) return entrant.playerSlug === playerSlug;
  return namesMatch(entrant.name, playerName);
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

async function loadHeadToHeadData(playerName, playerSlug = null) {
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

        const standingNode = standings.find(n => entrantIsPlayer(n.entrant, playerName, playerSlug));
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
            const oppKey = entrantSlug(opp.entrant) || oppName;
            if (!opponentStats[oppKey]) {
              opponentStats[oppKey] = { name: oppName, slug: entrantSlug(opp.entrant), wins: 0, losses: 0, total: 0 };
            }
            if (isWin) opponentStats[oppKey].wins++;
            else opponentStats[oppKey].losses++;
            opponentStats[oppKey].total++;
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
    const oppSlug = opp.slug || createSlug(opp.name);
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

  // The param is normally a players.json slug already (e.g. "nubi-2"); normalise old-style links.
  const decodedParam = decodeURIComponent(rawParam);
  let playerSlug = decodedParam.toLowerCase();
  let playerName = decodedParam;

  const backLink = document.getElementById("backToProfileLink");
  if (backLink) {
    backLink.href = withBase(`/pages/player-profiles/players/players.html?player=${encodeURIComponent(playerSlug)}`);
  }

  try {
    const res = await fetch(withBase("/data/players.json"));
    if (res.ok) {
      const players = await res.json();
      const player =
        players.find(p => (p.slug || createSlug(p.name)) === playerSlug) ||
        players.find(p => createSlug(p.name) === createSlug(decodedParam));
      if (player) {
        playerSlug = player.slug || createSlug(player.name);
        playerName = player.name;
        if (backLink) backLink.href = withBase(`/pages/player-profiles/players/players.html?player=${encodeURIComponent(playerSlug)}`);
        document.getElementById("playerName").textContent = stripClanTag(player.name);
        const avatarImg = document.querySelector(".player-avatar-modern");
        if (avatarImg && player.avatar) avatarImg.src = player.avatar;
      } else {
        document.getElementById("playerName").textContent = decodeURIComponent(rawParam);
      }
    }
  } catch {}

  const { opponentStats, totalWins, totalLosses } = await loadHeadToHeadData(playerName, playerSlug);

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