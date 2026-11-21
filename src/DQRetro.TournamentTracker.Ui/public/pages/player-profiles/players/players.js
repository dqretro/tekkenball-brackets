// =============================================================================
// players.js - Player Profile & Analytics Engine (with 20-Tier Rank System)
// Depends on: game-config.js (must be loaded prior to players.js in players.html)
// =============================================================================

let allPlayers = [];
let allAchievements = [];
let achievementIcons = {};
let winLossChartInst = null;
let charUsageChartInst = null;
let placementChart = null;
let allTournamentsList = [];

// =============================================================================
// TEAM DICTIONARY & EXPANSIONS
// =============================================================================
const TEAM_EXPANSIONS = {
  TKC: "The King Collective",
  PND: "Piccadilly Nerf Demanders",
  DQ: "DQRetro",
  ELF: "East London Fighters",
  VSF: "VS Fighting",
  IP: "Iron Pride",
  RIZE: "Rize Gaming",
  ESC: "Enigmatic Smash Clash",
  SF: "Strike Fierce",
  DKO: "Double K.O",
  NGI: "Nth Gen Interactive"
};

function getFullTeamName(tag) {
  if (!tag || tag === "—") return "";
  const key = tag.trim().toUpperCase();
  return TEAM_EXPANSIONS[key] || tag;
}

// =============================================================================
// 20-TIER RANK STONE SYSTEM CONFIGURATION
// =============================================================================
const RANKS_BASE_PATH = "/images/dqretro/ranks/";

const RANK_STONES_CONFIG = [
  { level: 0,  name: "Beginner",   min: 0,   max: 14,  color: "#8e8e93", file: "rank-stone00-beginner.png" },
  { level: 1,  name: "Novice",     min: 15,  max: 29,  color: "#4cd964", file: "rank-stone01.png" },
  { level: 2,  name: "Rookie",     min: 30,  max: 49,  color: "#34c759", file: "rank-stone02.png" },
  { level: 3,  name: "Challenger", min: 50,  max: 74,  color: "#30d158", file: "rank-stone03.png" },
  { level: 4,  name: "Initiate",   min: 75,  max: 99,  color: "#28cd41", file: "rank-stone04.png" },
  { level: 5,  name: "Contender",  min: 100, max: 149, color: "#ffcc00", file: "rank-stone05.png" },
  { level: 6,  name: "Competitor", min: 150, max: 199, color: "#ffd60a", file: "rank-stone06.png" },
  { level: 7,  name: "Prospect",   min: 200, max: 249, color: "#ffb340", file: "rank-stone07.png" },
  { level: 8,  name: "Enforcer",   min: 250, max: 299, color: "#ff9500", file: "rank-stone08.png" },
  { level: 9,  name: "Seasoned",   min: 300, max: 349, color: "#ff8800", file: "rank-stone09.png" },
  { level: 10, name: "Vanguard",   min: 350, max: 399, color: "#ff7700", file: "rank-stone10.png" },
  { level: 11, name: "Specialist", min: 400, max: 449, color: "#ff5e3a", file: "rank-stone11.png" },
  { level: 12, name: "Expert",     min: 450, max: 499, color: "#ff453a", file: "rank-stone12.png" },
  { level: 13, name: "Striker",    min: 500, max: 549, color: "#ff3b30", file: "rank-stone13.png" },
  { level: 14, name: "Master",     min: 550, max: 649, color: "#d70015", file: "rank-stone14.png" },
  { level: 15, name: "Veteran",    min: 650, max: 724, color: "#af52de", file: "rank-stone15.png" },
  { level: 16, name: "Warlord",    min: 725, max: 799, color: "#bf5af2", file: "rank-stone16.png" },
  { level: 17, name: "High Lord",  min: 800, max: 874, color: "#64d2ff", file: "rank-stone17.png" },
  { level: 18, name: "Legend",     min: 875, max: 949, color: "#5ac8fa", file: "rank-stone18.png" },
  { level: 19, name: "Mythic",     min: 950, max: 999, color: "#007aff", file: "rank-stone19.png" },
  { level: 20, name: "Grand Champ",min: 1000,max: Infinity, color: "#e5e5ea", file: "rank-stone20.png" }
];

function getPlayerRankStone(points) {
  const currentPts = Number(points) || 0;
  const index = RANK_STONES_CONFIG.findIndex(t => currentPts >= t.min && currentPts <= t.max);
  const currentRank = RANK_STONES_CONFIG[index] || RANK_STONES_CONFIG[RANK_STONES_CONFIG.length - 1];
  const nextRank = RANK_STONES_CONFIG[index + 1] || null;

  let progressPercent = 100;
  let pointsNeeded = 0;

  if (nextRank) {
    const range = nextRank.min - currentRank.min;
    const progress = currentPts - currentRank.min;
    progressPercent = Math.min(Math.max((progress / range) * 100, 0), 100);
    pointsNeeded = nextRank.min - currentPts;
  }

  return {
    level: currentRank.level,
    title: currentRank.name,
    color: currentRank.color,
    imagePath: withBase(`${RANKS_BASE_PATH}${currentRank.file}`),
    currentPoints: currentPts,
    nextTitle: nextRank ? nextRank.name : "MAX RANK",
    nextThreshold: nextRank ? nextRank.min : 1000,
    pointsNeeded: pointsNeeded,
    progressPercent: Math.round(progressPercent)
  };
}

function updateRankProgressionWidget(points) {
  const rankData = getPlayerRankStone(points);

  const rankImg = document.getElementById('rankSphereImg');
  const rankTitle = document.getElementById('rankTitle');
  const rankSubtitle = document.getElementById('rankSubtitle');
  const rankBadge = document.getElementById('rankTierBadge');
  const progressBar = document.getElementById('rankProgressBar');
  const pointsNeededText = document.getElementById('pointsNeededText');

  if (rankImg) {
    rankImg.src = rankData.imagePath;
    rankImg.alt = rankData.title;
    rankImg.style.filter = `drop-shadow(0 0 10px ${rankData.color})`;
  }

  if (rankTitle) {
    rankTitle.textContent = rankData.title;
    rankTitle.style.color = rankData.color;
  }

  if (rankSubtitle) {
    rankSubtitle.innerHTML = `<strong>${rankData.currentPoints}</strong> / ${rankData.nextThreshold} PTS to ${rankData.nextTitle}`;
  }

  if (rankBadge) {
    rankBadge.textContent = `Rank ${rankData.level}`;
    rankBadge.style.background = `${rankData.color}22`;
    rankBadge.style.color = rankData.color;
    rankBadge.style.borderColor = rankData.color;
  }

  if (progressBar) {
    progressBar.style.width = `${rankData.progressPercent}%`;
    progressBar.style.background = `linear-gradient(90deg, ${rankData.color}, #ffffff)`;
  }

  if (pointsNeededText) {
    pointsNeededText.textContent = rankData.nextTitle !== "MAX RANK" 
      ? `${rankData.pointsNeeded} PTS Needed` 
      : "Pinnacle Rank Achieved";
  }
}

// =============================================================================
// HELPERS & UTILITIES
// =============================================================================
function withBase(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
  const cleanedPath = path.replace(/^\/+/, "");
  return `${base}/${cleanedPath}`;
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

// Slug of an entrant object: data-provided playerSlug, else computed from its name.
function entrantSlug(entrant) {
  return entrant?.playerSlug || createSlug(entrant?.name);
}

// True if this entrant is the profile's player. Uses exact slugs when the data has them
// (avoids fuzzy collisions like "Hex" vs "zhexy_30"); falls back to name matching.
function entrantIsPlayer(entrant, playerName, playerSlug) {
  if (!entrant) return false;
  if (playerSlug && entrant.playerSlug) return entrant.playerSlug === playerSlug;
  return namesMatch(entrant.name, playerName);
}

function capitalizeWords(str) {
  if (!str) return "";
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showNotFound(message) {
  const container = document.querySelector(".container.profile-page") || document.body;
  container.innerHTML = `<p style="padding:4em; text-align:center; color:var(--muted);">${escapeHtml(message)}</p>`;
}

function getPlacementPoints(placement) {
  if (placement === 1) return 10;
  if (placement === 2) return 8;
  if (placement === 3) return 6;
  if (placement === 4) return 5;
  if (placement <= 6) return 4;
  if (placement <= 8) return 2;
  return 1;
}

function getGameTag(gameName) {
  if (!gameName) return "";
  const g = gameName.toLowerCase().trim();

  if (g.includes("tekken 8 ball") || g.includes("tk8 ball") || g === "tk8ball") return "tk8ball";
  if (g.includes("tekken 3 ball") || g.includes("tk3 ball") || g === "tk3ball") return "tk3ball";
  if (g.includes("tag tournament 2 ball") || g.includes("ttt2 ball") || g === "ttt2ball") return "ttt2ball";
  if (g.includes("tekken 8") || g === "tk8") return "tk8";
  if (g.includes("tekken 7") || g === "tk7") return "tk7";
  if (g.includes("tag tournament 2") || g.includes("ttt2")) return "ttt2";
  if (g.includes("tag tournament") || g.includes("ttt1") || g === "ttt") return "ttt1";
  if (g.includes("tekken 6") || g === "tk6") return "tk6";
  if (g.includes("dark resurrection") || g.includes("tk5dr") || g.includes("5dr")) return "tk5dr";
  if (g.includes("tekken 5") || g === "tk5") return "tk5";
  if (g.includes("tekken 4") || g === "tk4") return "tk4";
  if (g.includes("tekken 3") || g === "tk3") return "tk3";
  if (g.includes("tekken 2") || g === "tk2") return "tk2";
  if (g.includes("tekken 1") || g === "tk1") return "tk1";
  if (g.includes("def jam") || g.includes("djffny")) return "djffny";
  if (g.includes("bloody roar 2") || g.includes("bloodyroar2")) return "bloodyroar2";
  if (g.includes("dead or alive 6") || g.includes("doa6")) return "doa6";

  return g;
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

async function fetchJsonSafe(url, fallback = null) {
  try {
    const res = await fetch(withBase(url));
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn(`Fetch failed for ${url}:`, err);
  }
  return fallback;
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard API failed, trying fallback...", err);
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  let success = false;
  try {
    success = document.execCommand("copy");
  } catch (err) {
    console.error("Fallback copy failed:", err);
  }

  document.body.removeChild(textArea);
  return success;
}

function getOrCreateCustomTooltip() {
  let tooltip = document.getElementById("char-custom-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "char-custom-tooltip";
    tooltip.style.position = "fixed";
    tooltip.style.zIndex = "99999";
    tooltip.style.padding = "6px 10px";
    tooltip.style.background = "rgba(20, 20, 24, 0.95)";
    tooltip.style.border = "1px solid rgba(255, 255, 255, 0.2)";
    tooltip.style.borderRadius = "6px";
    tooltip.style.color = "#ffffff";
    tooltip.style.fontSize = "0.75rem";
    tooltip.style.fontFamily = "sans-serif";
    tooltip.style.pointerEvents = "none";
    tooltip.style.display = "none";
    tooltip.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.5)";
    tooltip.style.backdropFilter = "blur(4px)";
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

// =============================================================================
// GLOBAL STANDINGS LEADERBOARD RANK CALCULATOR
// =============================================================================
async function calculateGlobalLeaderboardRank(targetPlayerName, targetSlug = null) {
  try {
    const rawData = await fetchJsonSafe("/data/brackets.json");
    const rawTournaments = rawData?.data?.currentUser?.tournaments?.nodes || [];

    const standingsMap = {};

    rawTournaments.forEach(t => {
      (t.events || []).forEach(ev => {
        (ev.sets?.nodes || []).forEach(set => {
          if (!set.winnerId) return;

          (set.slots || []).forEach(slot => {
            if (!slot.entrant?.name) return;
            const name = stripClanTag(slot.entrant.name);
            const key = slot.entrant.playerSlug || name;
            if (!standingsMap[key]) {
              standingsMap[key] = { name, slug: slot.entrant.playerSlug || null, wins: 0, losses: 0, total: 0 };
            }

            const isWinner = String(slot.entrant.id) === String(set.winnerId);
            if (isWinner) {
              standingsMap[key].wins++;
            } else {
              standingsMap[key].losses++;
            }
            standingsMap[key].total++;
          });
        });
      });
    });

    const leaderboard = Object.values(standingsMap).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const pctA = a.total > 0 ? a.wins / a.total : 0;
      const pctB = b.total > 0 ? b.wins / b.total : 0;
      return pctB - pctA;
    });

    const rankIndex = leaderboard.findIndex(p =>
      (targetSlug && p.slug) ? p.slug === targetSlug : namesMatch(p.name, targetPlayerName));
    return rankIndex !== -1 ? rankIndex + 1 : null;
  } catch (err) {
    console.warn("Error computing global leaderboard rank:", err);
    return null;
  }
}

// =============================================================================
// DATA LOADERS & CHARACTER ENGINE
// =============================================================================
async function loadAchievements() {
  allAchievements = (await fetchJsonSafe("/pages/player-profiles/achievement-list.json", [])) || [];
}

async function loadAchievementIcons() {
  achievementIcons = (await fetchJsonSafe("/pages/player-profiles/achievement-icons.json", {})) || {};
}

async function loadLocalData() {
  return (await fetchJsonSafe("/data/brackets-local.json", {})) || {};
}

function getLocalCharacters(localData, eventSlug, entrantName) {
  if (!localData?.events || !entrantName) return [];

  const eventData = localData.events[eventSlug]
    || Object.entries(localData.events).find(([k]) =>
        eventSlug.includes(k) || k.includes(eventSlug)
      )?.[1];

  if (!eventData?.playerCharacters) return [];

  const lower = stripClanTag(entrantName).toLowerCase();
  for (const [key, chars] of Object.entries(eventData.playerCharacters)) {
    const cleanKey = stripClanTag(key).toLowerCase();
    if (cleanKey === lower || lower.includes(cleanKey) || cleanKey.includes(lower)) {
      return chars;
    }
  }
  return [];
}

function getCharactersFromSets(sets, entrantId, entrantName, videogameName, localData, eventSlug) {
  const chars = new Set();
  const lowerGame = (videogameName || "").toLowerCase();
  const lookupGame = (lowerGame.includes("tekken 3") || lowerGame.includes("tk3"))
    ? "Tekken 3"
    : (lowerGame.includes("tekken 8") || lowerGame.includes("tk8") ? "Tekken 8" : videogameName);

  (sets || []).forEach(set => {
    (set.games || []).forEach(game => {
      (game.selections || []).forEach(sel => {
        const selId = sel.entrant?.id?.toString();
        if (entrantId && selId === entrantId.toString()) {
          const resolved = typeof resolveCharacterSlug === "function"
            ? (resolveCharacterSlug(sel.selectionValue, sel.character, lookupGame) || resolveCharacterSlug(sel.selectionValue, sel.character, videogameName))
            : null;
          if (resolved) chars.add(resolved);
        }
      });
    });
  });

  const cleanName = stripClanTag(entrantName);
  if (chars.size === 0 && localData) {
    getLocalCharacters(localData, eventSlug, cleanName).forEach(c => chars.add(c));
  }

  if (chars.size === 0 && typeof getManualCharacters === "function") {
    getManualCharacters(cleanName).forEach(c => chars.add(c));
  }

  return Array.from(chars);
}

// =============================================================================
// AGGREGATION ENGINE
// =============================================================================
async function collectPlayerData(playerName, playerSlug = null) {
  const charUsage = {};
  const gameCharUsage = {};
  const charStats = {};

  let tournamentsPlayed = 0, wins = 0, losses = 0, titles = 0, totalPoints = 0;
  const tournamentsList = [];
  const opponentStats = {};
  const localData = await loadLocalData();

  const startGgProfile = {
    avatar: null,
    twitter: null,
    twitch: null,
    youtube: null,
    instagram: null,
    discord: null,
    country: null
  };

  const rawData = await fetchJsonSafe("/data/brackets.json");
  const rawTournaments = rawData?.data?.currentUser?.tournaments?.nodes || [];

  for (const t of rawTournaments) {
    for (const ev of t.events || []) {
      const standings = ev.standings?.nodes || [];
      const sets = ev.sets?.nodes || [];
      const eventSlug = ev.slug || "";
      const rawVideogame = ev.videogame?.name || "Tekken 8";
      const evName = ev.name || "";
      const tName = t.name || "";
      const eventDate = t.startAt ? new Date(t.startAt * 1000) : new Date();

      let videogame = rawVideogame;
      const combinedTitle = `${evName} ${tName} ${rawVideogame}`.toLowerCase();
      if (combinedTitle.includes("tekken 3 ball") || combinedTitle.includes("tk3 ball") || (combinedTitle.includes("ball") && (combinedTitle.includes("tekken 3") || combinedTitle.includes("tk3")))) {
        videogame = "Tekken 3 Ball";
      } else if (combinedTitle.includes("ball") || combinedTitle.includes("tekken 8 ball") || combinedTitle.includes("tekken ball")) {
        videogame = "Tekken 8 Ball";
      } else if (combinedTitle.includes("tekken 3") || combinedTitle.includes("tk3")) {
        videogame = "Tekken 3";
      } else if (combinedTitle.includes("tekken 8") || combinedTitle.includes("tk8")) {
        videogame = "Tekken 8";
      }

      const standingNode = standings.find(n => entrantIsPlayer(n.entrant, playerName, playerSlug));
      if (!standingNode) continue;

      const entrant = standingNode.entrant || {};
      const user = entrant.user || standingNode.user || entrant.participants?.[0]?.user;

      if (user) {
        if (!startGgProfile.avatar && user.images) {
          const profileImg = user.images.find(img => img.type === "profile");
          if (profileImg) startGgProfile.avatar = profileImg.url;
        }

        if (user.authorizations) {
          user.authorizations.forEach(auth => {
            const type = (auth.type || "").toUpperCase();
            const handle = auth.externalUsername || auth.streamName || auth.username || auth.externalId;
            if (!handle) return;

            if (type.includes("TWITTER"))   startGgProfile.twitter   = handle;
            if (type.includes("TWITCH"))    startGgProfile.twitch    = handle;
            if (type.includes("YOUTUBE"))   startGgProfile.youtube   = handle;
            if (type.includes("INSTAGRAM")) startGgProfile.instagram = handle;
            if (type.includes("DISCORD"))   startGgProfile.discord   = handle;
          });
        }

        if (!startGgProfile.country && user.location?.country) {
          startGgProfile.country = user.location.country;
        }
      }

      tournamentsPlayed++;
      const entrantId = entrant.id;
      const entrantName = stripClanTag(entrant.name || playerName);
      const placement = Number(standingNode.placement ?? 0);
      const points = getPlacementPoints(placement);
      totalPoints += points;
      if (placement === 1) titles++;

      const chars = getCharactersFromSets(sets, entrantId, entrantName, videogame, localData, eventSlug);
      chars.forEach(c => {
        charUsage[c] = (charUsage[c] || 0) + 1;
        if (!gameCharUsage[videogame]) gameCharUsage[videogame] = {};
        gameCharUsage[videogame][c] = (gameCharUsage[videogame][c] || 0) + 1;
      });

      let evWins = 0, evLosses = 0;
      sets.forEach(set => {
        const slots = set.slots || [];
        const isInSet = slots.some(s => s.entrant && String(s.entrant.id) === String(entrantId));
        if (!isInSet || !set.winnerId) return;

        const isDQ = slots.some(s => s.standing?.stats?.score?.value === -1);
        if (isDQ) return;

        const opp = slots.find(s => s.entrant && String(s.entrant.id) !== String(entrantId));
        const isWin = String(set.winnerId) === String(entrantId);

        if (isWin) {
          evWins++;
        } else {
          evLosses++;
        }

        if (!charStats[videogame]) charStats[videogame] = {};
        chars.forEach(c => {
          if (!charStats[videogame][c]) charStats[videogame][c] = { wins: 0, losses: 0 };
          if (isWin) {
            charStats[videogame][c].wins++;
          } else {
            charStats[videogame][c].losses++;
          }
        });

        if (opp?.entrant?.name) {
          const oppName = stripClanTag(opp.entrant.name);
          const oppKey = entrantSlug(opp.entrant) || oppName;
          if (!opponentStats[oppKey]) {
            opponentStats[oppKey] = { name: oppName, slug: entrantSlug(opp.entrant), wins: 0, losses: 0, total: 0 };
          }
          if (isWin) {
            opponentStats[oppKey].wins++;
          } else {
            opponentStats[oppKey].losses++;
          }
          opponentStats[oppKey].total++;
        }
      });
      wins += evWins;
      losses += evLosses;

      const notableWins = sets
        .filter(s => String(s.winnerId) === String(entrantId))
        .flatMap(s => s.slots || [])
        .filter(s => s.entrant && String(s.entrant.id) !== String(entrantId))
        .map(s => stripClanTag(s.entrant.name))
        .filter(Boolean)
        .slice(0, 3)
        .join(", ");

      tournamentsList.push({
        event: ev.name,
        tournament: t.name,
        placement,
        date: eventDate,
        slug: eventSlug,
        notableWins,
        mainGame: videogame,
        characters: chars,
        points,
        wins: evWins,
        losses: evLosses
      });
    }
  }

  tournamentsList.sort((a, b) => a.date - b.date);

  return {
    stats: {
      tournamentsPlayed,
      wins,
      losses,
      winRate: wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) + "%" : "0%",
      titles,
      points: totalPoints,
      characterUsage: charUsage,
      gameCharUsage,
      charStats,
      firstPlace: titles,
      top3: tournamentsList.filter(t => t.placement <= 3).length,
      top8: tournamentsList.filter(t => t.placement <= 8).length,
      differentCharacters: Object.keys(charUsage).length
    },
    startGgProfile,
    tournamentsList,
    opponentStats
  };
}

// =============================================================================
// ACHIEVEMENTS & QR MODULES
// =============================================================================
function getUnlockedAchievements(playerData) {
  if (!allAchievements.length) return [];
  const stats = playerData.stats || {};

  return allAchievements.filter(a => {
    const cond = a.condition || {};
    for (const [key, value] of Object.entries(cond)) {
      const v = stats[key];
      if (typeof value === "boolean") {
        if (v !== value) return false;
      } else {
        if ((v ?? 0) < value) return false;
      }
    }
    return true;
  });
}

function setupQRCode(playerName, playerSlug, liveStreamUrl = null) {
  const qrContainer = document.getElementById("qrcode");
  if (!qrContainer || typeof QRCode === "undefined") return;

  const baseUrl = window.location.origin;
  const slug = playerSlug || createSlug(playerName);

  const fallbackOverlayUrl = `${baseUrl}${withBase(`/pages/player-profiles/players/overlay.html?player=${encodeURIComponent(slug)}`)}`;

  const targetUrls = {
    profile: `${baseUrl}${withBase(`/pages/player-profiles/players/players.html?player=${encodeURIComponent(slug)}`)}`,
    h2h: `${baseUrl}${withBase(`/pages/player-profiles/players/head-to-head.html?player=${encodeURIComponent(slug)}`)}`,
    overlay: liveStreamUrl || fallbackOverlayUrl
  };

  let currentTarget = targetUrls.profile;

  const renderQR = (url) => {
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text: url,
      width: 130,
      height: 130,
      colorDark: "#ffffff",
      colorLight: "#141414",
      correctLevel: QRCode.CorrectLevel.H
    });
  };

  const tabs = document.querySelectorAll(".qr-tab");
  tabs.forEach(tab => {
    tab.onclick = (e) => {
      tabs.forEach(t => t.classList.remove("active"));
      e.target.classList.add("active");
      const type = e.target.dataset.type;
      currentTarget = targetUrls[type] || targetUrls.profile;
      renderQR(currentTarget);
    };
  });

  const copyBtn = document.getElementById("copy-qr-btn");
  if (copyBtn) {
    copyBtn.onclick = async () => {
      const copied = await copyToClipboard(currentTarget);
      if (copied) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "✅ Copied!";
        setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
      } else {
        alert("Could not copy link to clipboard.");
      }
    };
  }

  const downloadBtn = document.getElementById("download-qr-btn");
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const canvas = qrContainer.querySelector("canvas");
      const img = qrContainer.querySelector("img");
      const src = canvas ? canvas.toDataURL("image/png") : (img ? img.src : null);
      if (!src) return;
      const link = document.createElement("a");
      link.download = `player-${slug}-qr.png`;
      link.href = src;
      link.click();
    };
  }

  renderQR(currentTarget);
}

// =============================================================================
// UI RENDERING MODULES
// =============================================================================
function renderPerGameCharacterBreakdown(gameCharUsage, stats) {
  const charList = document.getElementById("charactersList");
  if (!charList) return;

  charList.innerHTML = "";
  charList.style.textAlign = "left";

  const tooltip = getOrCreateCustomTooltip();

  const ORDERED_GAMES = [
    { tag: "tk8ball",      label: "Tekken 8 Ball" },
    { tag: "ttt2ball",     label: "Tekken Tag Tournament 2 Ball" },
    { tag: "tk3ball",      label: "Tekken 3 Ball" },
    { tag: "tk8",          label: "Tekken 8 Ball" },
    { tag: "tk7",          label: "Tekken 7" },
    { tag: "ttt2",         label: "Tekken Tag Tournament 2" },
    { tag: "tk6",          label: "Tekken 6" },
    { tag: "tk5dr",        label: "Tekken 5dr" },
    { tag: "tk5",          label: "Tekken 5" },
    { tag: "tk4",          label: "Tekken 4" },
    { tag: "ttt1",         label: "Tekken Tag Tournament 1" },
    { tag: "tk3",          label: "Tekken 3" },
    { tag: "tk2",          label: "Tekken 2" },
    { tag: "tk1",          label: "Tekken 1" },
    { tag: "djffny",       label: "Def Jam: FFNY" },
    { tag: "bloodyroar2",  label: "Bloody Roar 2" },
    { tag: "doa6",         label: "Dead or Alive 6" }
  ];

  const gameGroups = {};
  ORDERED_GAMES.forEach(g => {
    gameGroups[g.tag] = { label: g.label, items: [] };
  });

  Object.entries(gameCharUsage || {}).forEach(([gameName, charCounts]) => {
    const tag = getGameTag(gameName);
    
    if (gameGroups[tag]) {
      Object.entries(charCounts).forEach(([slug, count]) => {
        gameGroups[tag].items.push({ slug, count, gameName });
      });
    } else {
      if (!gameGroups[tag]) {
        gameGroups[tag] = { label: tag, items: [] };
      }
      Object.entries(charCounts).forEach(([slug, count]) => {
        gameGroups[tag].items.push({ slug, count, gameName });
      });
    }
  });

  let hasCharacters = false;

  const keysToRender = [
    ...ORDERED_GAMES.map(g => g.tag),
    ...Object.keys(gameGroups).filter(k => !ORDERED_GAMES.some(g => g.tag === k))
  ];

  keysToRender.forEach(tag => {
    const group = gameGroups[tag];
    if (!group || group.items.length === 0) return;
    hasCharacters = true;

    const uniqueMap = new Map();
    group.items.forEach(item => {
      if (!uniqueMap.has(item.slug)) {
        uniqueMap.set(item.slug, item);
      }
    });
    const uniqueItems = Array.from(uniqueMap.values());

    const catContainer = document.createElement("div");
    catContainer.className = "char-category-group";
    catContainer.style.textAlign = "left";
    catContainer.style.width = "100%";
    catContainer.style.marginBottom = "0.35rem";

    const catTitle = document.createElement("div");
    catTitle.className = "char-category-title";
    catTitle.textContent = `${group.label}:`;
    catTitle.style.textAlign = "left";
    catTitle.style.fontWeight = "600";
    catTitle.style.marginBottom = "0.2rem";
    catContainer.appendChild(catTitle);

    const iconGrid = document.createElement("div");
    iconGrid.className = "char-category-grid";
    iconGrid.style.display = "flex";
    iconGrid.style.flexWrap = "wrap";
    iconGrid.style.justifyContent = "flex-start";
    iconGrid.style.alignItems = "center";
    iconGrid.style.gap = "6px";

    uniqueItems.forEach(({ slug: charSlug, gameName }) => {
      const gName = (gameName || "").toLowerCase();
      const isTk3 = gName.includes("tekken 3") || gName.includes("tk3");

      let config = null;
      if (typeof getGameConfig === "function") {
        config = getGameConfig(gameName) || getGameConfig(isTk3 ? "Tekken 3" : "Tekken 8");
      }
      if (!config || !config.folder) {
        config = { folder: isTk3 ? "tk3" : "tk8" };
      }

      const specificStats = stats?.charStats?.[gameName]?.[charSlug];
      
      let cWins = 0;
      let cLosses = 0;
      let charWinRate = "0.0%";

      if (specificStats) {
        cWins = specificStats.wins || 0;
        cLosses = specificStats.losses || 0;
        const totalSets = cWins + cLosses;
        if (totalSets > 0) {
          charWinRate = ((cWins / totalSets) * 100).toFixed(1) + "%";
        }
      }

      const formattedCharName = capitalizeWords(charSlug.replace(/-/g, " "));

      const tooltipHtml = `
        <div style="font-weight: 700; margin-bottom: 2px;">${escapeHtml(formattedCharName)} <span style="opacity: 0.6; font-size: 0.85em;">(${escapeHtml(group.label)})</span></div>
        <div>
          <span style="color: #4ade80; font-weight: 700;">${cWins}W</span> / 
          <span style="color: #f87171; font-weight: 700;">${cLosses}L</span> 
          <span style="color: #aaa; margin-left: 4px;">(${charWinRate})</span>
        </div>
      `;

      const wrapper = document.createElement("div");
      wrapper.className = "char-icon-wrapper";
      wrapper.style.cursor = "pointer";

      if (typeof buildCharacterIconHtml === "function") {
        wrapper.innerHTML = buildCharacterIconHtml(charSlug, config, 36, 36);
      } else {
        wrapper.textContent = formattedCharName;
      }

      wrapper.addEventListener("mouseenter", (e) => {
        tooltip.innerHTML = tooltipHtml;
        tooltip.style.display = "block";
        tooltip.style.left = `${e.clientX + 12}px`;
        tooltip.style.top = `${e.clientY + 12}px`;
      });

      wrapper.addEventListener("mousemove", (e) => {
        tooltip.style.left = `${e.clientX + 12}px`;
        tooltip.style.top = `${e.clientY + 12}px`;
      });

      wrapper.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });

      iconGrid.appendChild(wrapper);
    });

    catContainer.appendChild(iconGrid);
    charList.appendChild(catContainer);
  });

  if (!hasCharacters) {
    charList.innerHTML = `<span style="color:var(--muted); font-size:0.85rem;">No character data recorded.</span>`;
  }
}

function renderPlayedAgainst(opponentStats, playerName, playerSlug = null) {
  const container = document.getElementById("playedAgainstList");
  if (!container) return;

  const totalOpponents = Object.keys(opponentStats || {}).length;

  const sorted = Object.entries(opponentStats || {})
    .map(([key, s]) => {
      const winRatePct = s.total > 0 ? (s.wins / s.total) * 100 : 0;
      return { ...s, name: stripClanTag(s.name || key), slug: s.slug || createSlug(s.name || key), winRatePct };
    })
    .sort((a, b) => b.total - a.total || b.wins - a.wins)
    .slice(0, 5);

  if (!sorted.length) {
    container.innerHTML = `<span style="color:var(--muted); font-size:0.75rem;">No match history found.</span>`;
    return;
  }

  const headerHtml = `
    <div style="display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 4px; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.15); font-size: 0.60rem; font-weight: 700; color: var(--muted, #8e8e93); text-transform: uppercase;">
      <span style="text-align:left;">Name</span>
      <span style="text-align:center;">Sets</span>
      <span style="text-align:center;">Wins</span>
      <span style="text-align:center;">Losses</span>
      <span style="text-align:right;">%</span>
    </div>
  `;

  const listHtml = sorted.map(opp => {
    const winRate = Math.round(opp.winRatePct);
    const playerLink = withBase(`/pages/player-profiles/players/players.html?player=${encodeURIComponent(opp.slug)}`);
    return `
      <div style="display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 4px; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.06); font-size:0.60rem;">
        <a href="${playerLink}" style="color:var(--text, #fff); font-weight:600; text-decoration:none; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${escapeHtml(opp.name)}">
          ${escapeHtml(opp.name)}
        </a>
        <span style="text-align:center; color:var(--muted, #aaa); font-weight:500;">${opp.total}</span>
        <span style="text-align:center; color:#4ade80; font-weight:600;">${opp.wins}W</span>
        <span style="text-align:center; color:#f87171; font-weight:600;">${opp.losses}L</span>
        <span style="text-align:right; color:var(--muted, #aaa); font-weight:500;">${winRate}%</span>
      </div>
    `;
  }).join("");

  const fullHistoryUrl = withBase(`/pages/player-profiles/players/head-to-head.html?player=${encodeURIComponent(playerSlug || createSlug(playerName))}`);

  const buttonHtml = `
    <div style="margin-top: 0.60rem;">
      <a href="${fullHistoryUrl}" style="display: block; width: 100%; text-align: center; padding: 8px 0; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(124, 77, 255, 0.4); border-radius: 8px; color: var(--accent, #7c4dff); font-size: 0.8rem; font-weight: 600; text-decoration: none; box-sizing: border-box; transition: background 0.2s, border-color 0.2s;">
        View Full W/L History (${totalOpponents}) ↗
      </a>
    </div>
  `;

  container.innerHTML = headerHtml + listHtml + buttonHtml;
}

// =============================================================================
// MAIN PROFILE POPULATION
// =============================================================================
async function populatePlayerProfile(player) {
  if (!player) return;
  await Promise.all([loadAchievements(), loadAchievementIcons()]);

  const cleanPlayerName = stripClanTag(player.name);

  // 1. Explicitly Center Player Name Header
  const nameEl = document.getElementById("playerName");
  if (nameEl) {
    nameEl.textContent = cleanPlayerName;
    nameEl.style.textAlign = "center";
    nameEl.style.width = "100%";
    nameEl.style.display = "block";
    nameEl.style.marginLeft = "auto";
    nameEl.style.marginRight = "auto";
  }

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  const playerData = await collectPlayerData(cleanPlayerName, player.slug || null);
  const { stats, startGgProfile, tournamentsList, opponentStats } = playerData;
  allTournamentsList = tournamentsList;

  // Compute Dynamic Leaderboard Rank
  const rankIndex = await calculateGlobalLeaderboardRank(cleanPlayerName, player.slug || null);
  const rankDisplay = rankIndex ? `#${rankIndex}` : '';

  // 2. Expanded Team & Centered
  const expandedTeam = getFullTeamName(player.team);
  const teamEl = document.getElementById("playerTeam");
  if (teamEl) {
    teamEl.textContent = expandedTeam;
    teamEl.style.display = expandedTeam ? "block" : "none";
    teamEl.style.textAlign = "center";
    teamEl.style.width = "100%";
  }

  // 3. Country Name & Centered
  const countryVal = startGgProfile.country || player.country || "";
  const countryEl = document.getElementById("playerCountry");
  if (countryEl) {
    countryEl.textContent = countryVal;
    countryEl.style.display = countryVal ? "block" : "none";
    countryEl.style.textAlign = "center";
    countryEl.style.width = "100%";
  }

  // 4. Render Points Value with Golden Rank Superscript
  const pointsEl = document.getElementById("playerPoints");
  if (pointsEl) {
    pointsEl.innerHTML = `${stats.points}${rankDisplay ? `<sup class="rank-badge">${escapeHtml(rankDisplay)}</sup>` : ''}`;
  }

  const avatarImg = document.querySelector(".player-avatar-modern");
  if (avatarImg) {
    avatarImg.src = startGgProfile.avatar || player.avatar || withBase("/images/placeholders/icons-profile/icon-pfp-player.png");
    avatarImg.onerror = () => { avatarImg.src = withBase("/images/placeholders/icons-profile/icon-pfp-player.png"); };
  }

  set("tournamentsPlayed", stats.tournamentsPlayed);
  set("wins",   stats.wins);
  set("losses", stats.losses);
  set("winRate", stats.winRate);
  set("titles", stats.titles);

  updateRankProgressionWidget(stats.points);

  const twitter   = startGgProfile.twitter   || player.twitter   || player.socials?.twitter;
  const twitch    = startGgProfile.twitch    || player.twitch    || player.socials?.twitch;
  const youtube   = startGgProfile.youtube   || player.youtube   || player.socials?.youtube;
  const instagram = startGgProfile.instagram || player.instagram || player.socials?.instagram;
  const discord   = startGgProfile.discord   || player.discord   || player.socials?.discord;

  const socialsList = document.getElementById("playerSocialsList");
  if (socialsList) {
    const cleanTwitter = twitter ? twitter.replace(/^@/, "") : "";
    const cleanInsta   = instagram ? instagram.replace(/^@/, "") : "";
    const cleanYt      = youtube ? (youtube.startsWith("http") ? youtube : `https://youtube.com/${youtube.startsWith("@") ? youtube : "@" + youtube}`) : "";

    const iconStyle = "width:18px; height:18px; vertical-align:middle; margin-right:6px; object-fit:contain;";

    socialsList.innerHTML = `
      ${cleanTwitter ? `<div style="display:flex; align-items:center;"><img src="${withBase("/images/socials/icons/icon-twitter.png")}" alt="Twitter" style="${iconStyle}"> Twitter: <a href="https://twitter.com/${escapeHtml(cleanTwitter)}" target="_blank" style="margin-left:4px;">@${escapeHtml(cleanTwitter)}</a></div>` : ""}
      ${twitch ? `<div style="display:flex; align-items:center;"><img src="${withBase("/images/socials/icons/icon-twitch.png")}" alt="Twitch" style="${iconStyle}"> Twitch: <a href="https://twitch.tv/${escapeHtml(twitch)}" target="_blank" style="margin-left:4px;">${escapeHtml(twitch)}</a></div>` : ""}
      ${cleanYt ? `<div style="display:flex; align-items:center;"><img src="${withBase("/images/socials/icons/icon-youtube.png")}" alt="YouTube" style="${iconStyle}"> YouTube: <a href="${escapeHtml(cleanYt)}" target="_blank" style="margin-left:4px;">${escapeHtml(youtube)}</a></div>` : ""}
      ${cleanInsta ? `<div style="display:flex; align-items:center;"><img src="${withBase("/images/socials/icons/icon-instagram.png")}" alt="Instagram" style="${iconStyle}"> Instagram: <a href="https://instagram.com/${escapeHtml(cleanInsta)}" target="_blank" style="margin-left:4px;">@${escapeHtml(cleanInsta)}</a></div>` : ""}
      ${discord ? `<div style="display:flex; align-items:center;"><img src="${withBase("/images/socials/icons/icon-discord.png")}" alt="Discord" style="${iconStyle}"> Discord: <span style="margin-left:4px;">${escapeHtml(discord)}</span></div>` : ""}
    `;

    if (!cleanTwitter && !twitch && !cleanYt && !cleanInsta && !discord) {
      socialsList.innerHTML = `<span style="color:var(--muted);">No social links linked.</span>`;
    }
  }

  let liveStreamUrl = null;
  if (twitch) {
    const cleanTwitch = twitch.replace(/^@/, "");
    liveStreamUrl = twitch.startsWith("http") ? twitch : `https://twitch.tv/${cleanTwitch}`;
  } else if (youtube) {
    const cleanYt = youtube.startsWith("http") ? youtube : `https://youtube.com/${youtube.startsWith("@") ? youtube : "@" + youtube}`;
    liveStreamUrl = cleanYt;
  }

  renderPlayedAgainst(opponentStats, cleanPlayerName, player.slug || null);
  setupQRCode(cleanPlayerName, player.slug, liveStreamUrl);
  renderPerGameCharacterBreakdown(stats.gameCharUsage, stats);

  const badges = document.querySelector(".badge-list");
  if (badges) {
    const unlocked = getUnlockedAchievements(playerData);
    badges.innerHTML = unlocked.length
      ? unlocked.map(a => `
          <span class="badge" title="${escapeHtml(a.description)}">
            ${achievementIcons[a.id] || "🏆"}
            <span class="badge-text">${escapeHtml(a.title)}</span>
          </span>`).join("")
      : `<p style="color:var(--muted); font-size:0.9rem;">No achievements unlocked yet.</p>`;
  }

  const historyBody = document.getElementById("tournamentHistory");
  if (historyBody) {
    historyBody.innerHTML = allTournamentsList.length
      ? [...allTournamentsList].reverse().map(t => {
          const link = withBase(`/pages/tournaments/overview.html?slug=${encodeURIComponent(t.slug)}`);
          const dateStr = t.date instanceof Date ? t.date.toLocaleDateString() : "—";
          const placementStr = t.placement > 0 ? `#${t.placement}` : "—";
          return `<tr>
            <td><a href="${link}" style="color:var(--accent);">${escapeHtml(t.tournament)} — ${escapeHtml(t.event)}</a></td>
            <td>${placementStr}</td>
            <td>${dateStr}</td>
            <td>${escapeHtml(t.notableWins || "—")}</td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="4" style="text-align:center; color:var(--muted); padding:2em;">No tournament history found.</td></tr>`;
  }

  renderWinLossChart(stats);
  renderCharUsageChart(stats.characterUsage);
  setupFilters(playerData);
  renderPlacementTimeline(allTournamentsList);
}

// =============================================================================
// CHARTS & VISUALIZATIONS
// =============================================================================
function renderWinLossChart(stats) {
  const canvas = document.getElementById("winLossChart");
  if (!canvas || typeof Chart === "undefined") return;
  if (winLossChartInst?.destroy) winLossChartInst.destroy();
  winLossChartInst = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Wins", "Losses"],
      datasets: [{
        data: [stats.wins || 0, stats.losses || 0],
        backgroundColor: ["#4ade80", "#f87171"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      cutout: "70%",
      plugins: {
        legend: { labels: { color: "#ccc" } },
        title: { display: true, text: "Win / Loss", color: "#ccc" }
      }
    }
  });
}

function renderCharUsageChart(charUsage) {
  const canvas = document.getElementById("charUsageChart");
  if (!canvas || typeof Chart === "undefined") return;
  if (charUsageChartInst?.destroy) charUsageChartInst.destroy();
  const entries = Object.entries(charUsage || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!entries.length) return;
  const colors = entries.map((_, i) => `hsl(${i * 40 + 240}, 70%, 55%)`);
  charUsageChartInst = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: entries.map(([c]) => capitalizeWords(c.replace(/-/g, " "))),
      datasets: [{ data: entries.map(([, v]) => v), backgroundColor: colors, borderWidth: 0 }]
    },
    options: {
      responsive: true,
      cutout: "70%",
      plugins: {
        legend: { labels: { color: "#ccc" } },
        title: { display: true, text: "Characters Used", color: "#ccc" }
      }
    }
  });
}

function renderPlacementTimeline(tournaments) {
  const canvas = document.getElementById("placementChart");
  if (!canvas || typeof Chart === "undefined") return;
  if (placementChart?.destroy) placementChart.destroy();
  if (!tournaments || !tournaments.length) return;

  const labels = tournaments.map(t => t.event || t.tournament);
  const placements = tournaments.map(t => t.placement);

  placementChart = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Placement",
        data: placements,
        borderColor: "#7c4dff",
        backgroundColor: "rgba(124, 77, 255, 0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#7c4dff"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          reverse: true,
          ticks: { stepSize: 1, color: "#ccc" },
          grid: { color: "rgba(255, 255, 255, 0.1)" }
        },
        x: {
          ticks: { color: "#ccc" },
          grid: { color: "rgba(255, 255, 255, 0.05)" }
        }
      },
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Placement History (Lower is Better)", color: "#ccc" }
      }
    }
  });
}

function setupFilters(playerData) {
  const gameFilter = document.getElementById("gameFilter");
  const charFilter = document.getElementById("charFilter");
  if (!gameFilter || !charFilter) return;

  const games = [...new Set(allTournamentsList.map(t => t.mainGame))].filter(Boolean);
  gameFilter.innerHTML = `<option value="">All Games</option>` + games.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");

  const chars = Object.keys(playerData.stats.characterUsage || {});
  charFilter.innerHTML = `<option value="">All Characters</option>` + chars.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(capitalizeWords(c.replace(/-/g, " ")))}</option>`).join("");

  const applyFilters = () => {
    const selectedGame = gameFilter.value;
    const selectedChar = charFilter.value;

    const filtered = allTournamentsList.filter(t => {
      const matchGame = !selectedGame || t.mainGame === selectedGame;
      const matchChar = !selectedChar || (t.characters && t.characters.includes(selectedChar));
      return matchGame && matchChar;
    });

    const historyBody = document.getElementById("tournamentHistory");
    if (historyBody) {
      historyBody.innerHTML = filtered.length
        ? [...filtered].reverse().map(t => {
            const link = withBase(`/pages/tournaments/overview.html?slug=${encodeURIComponent(t.slug)}`);
            const dateStr = t.date instanceof Date ? t.date.toLocaleDateString() : "—";
            const placementStr = t.placement > 0 ? `#${t.placement}` : "—";
            return `<tr>
              <td><a href="${link}" style="color:var(--accent);">${escapeHtml(t.tournament)} — ${escapeHtml(t.event)}</a></td>
              <td>${placementStr}</td>
              <td>${dateStr}</td>
              <td>${escapeHtml(t.notableWins || "—")}</td>
            </tr>`;
          }).join("")
        : `<tr><td colspan="4" style="text-align:center; color:var(--muted); padding:2em;">No matching tournaments found.</td></tr>`;
    }

    renderPlacementTimeline(filtered);
  };

  gameFilter.onchange = applyFilters;
  charFilter.onchange = applyFilters;
}

// =============================================================================
// INITIALIZATION
// =============================================================================
async function initPlayerProfilePage() {
  const playerParam = getQueryParam("player");

  let playersList = await fetchJsonSafe("/data/players.json", []);
  if (!Array.isArray(playersList)) playersList = [];
  allPlayers = playersList;

  if (!playerParam) {
    if (playersList.length > 0) {
      await populatePlayerProfile(playersList[0]);
    } else {
      showNotFound("No players available.");
    }
    return;
  }

  // Exact slug first (unique per player in players.json); fuzzy name match only as a fallback
  // for old links, so e.g. "?player=hex" can never land on "zhexy_30".
  const wanted = playerParam.toLowerCase();
  const foundPlayer =
    playersList.find(p => (p.slug || createSlug(p.name)) === wanted) ||
    playersList.find(p => createSlug(p.name) === createSlug(playerParam)) ||
    playersList.find(p => namesMatch(p.name, playerParam));

  if (foundPlayer) {
    await populatePlayerProfile(foundPlayer);
  } else {
    const rawData = await fetchJsonSafe("/data/brackets.json");
    const rawTournaments = rawData?.data?.currentUser?.tournaments?.nodes || [];
    let foundEntrantName = null;
    let foundSlug = null;

    for (const t of rawTournaments) {
      for (const ev of t.events || []) {
        for (const st of ev.standings?.nodes || []) {
          const name = st.entrant?.name;
          if (name && (entrantSlug(st.entrant) === wanted || namesMatch(name, playerParam))) {
            foundEntrantName = stripClanTag(name);
            foundSlug = entrantSlug(st.entrant);
            break;
          }
        }
        if (foundEntrantName) break;
      }
      if (foundEntrantName) break;
    }

    if (foundEntrantName) {
      await populatePlayerProfile({ name: foundEntrantName, slug: foundSlug });
    } else {
      showNotFound(`Player "${playerParam}" not found.`);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initPlayerProfilePage();
});