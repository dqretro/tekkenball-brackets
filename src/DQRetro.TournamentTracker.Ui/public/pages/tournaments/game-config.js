/**
 * DQRetro Game Configuration
 * Central source of truth for all game assets, character IDs, and image paths.
 * Used by matches.js, stats.js, standings.js, players.js, and any page needing game-aware assets.
 */

// -------------------------------------------------------
// GLOBAL PATH HELPER
// -------------------------------------------------------
if (typeof window !== "undefined" && !window.withBase) {
  window.withBase = function(path) {
    const BASE = window.location.hostname.includes("github.io") ? "/tekkenball-brackets" : "";
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path;
    return `${BASE}${path.startsWith("/") ? path : "/" + path}`;
  };
}

// -------------------------------------------------------
// GAME ASSETS (one entry per image folder)
// File names must match images/games/<folder>/ exactly: GitHub Pages is
// case-sensitive. CI checks this (.github/scripts/check-assets.js).
//   imgExt        format most character select icons use (the other format is tried next)
//   fallback      random/unknown icon in characters_select/, or null if the game has none
//   slotFallbacks true if select_random1/select_random2.<imgExt> exist (P1/P2 variants)
//   boxart, logo  file names in boxart/ and logo/, or null if missing
// -------------------------------------------------------
const GAME_ASSETS = {
  tk8:          { folder: "tk8", imgExt: "png", renderPrefix: "render_", hudPrefix: "hud_", boxart: "boxart_tekken8.png", logo: "logo_tekken8.png", fallback: "select_random.png" },
  tk8ball:      { folder: "tk8", imgExt: "png", renderPrefix: "render_", hudPrefix: "hud_", boxart: "boxart_tekken8ball.png", logo: "logo_tekken8ball.png", fallback: "select_random.png" },
  tk7:          { folder: "tk7", imgExt: "png", boxart: "boxart_tekken7.png", logo: null, fallback: "select_random.png" },
  tk6:          { folder: "tk6", imgExt: "png", boxart: "boxart_tekken6.png", logo: null, fallback: "select_random.png" },
  tk5dr:        { folder: "tk5dr", imgExt: "webp", boxart: "boxart_tekken5dr.webp", logo: "logo_tk5dr.webp", fallback: "select_random.png" },
  tk5:          { folder: "tk5", imgExt: "webp", boxart: "boxart_tekken5.webp", logo: "logo_tk5.webp", fallback: "select_random.png" },
  tk4:          { folder: "tk4", imgExt: "webp", boxart: "boxart_tekken4.png", logo: "logo_tk4.webp", fallback: "select_random.png" },
  tk3:          { folder: "tk3", imgExt: "png", boxart: "boxart_tekken3.png", logo: null, fallback: "select_random.webp", slotFallbacks: true },
  tk3ball:      { folder: "tk3", imgExt: "png", boxart: "boxart_tekken3ball.png", logo: null, fallback: "select_random.webp", slotFallbacks: true },
  tk2:          { folder: "tk2", imgExt: "webp", boxart: "boxart_tekken2.png", logo: null, fallback: null },
  tk1:          { folder: "tk1", imgExt: "webp", boxart: "boxart_tekken1.png", logo: null, fallback: "select_random.png" },
  ttt1:         { folder: "ttt1", imgExt: "png", boxart: "boxart_tekkentag1.png", logo: null, fallback: "select_random.png" },
  ttt2:         { folder: "ttt2", imgExt: "png", boxart: "boxart_tekkentag2.png", logo: null, fallback: "select_random.png" },
  doa6:         { folder: "doa6", imgExt: "png", boxart: null, logo: null, fallback: "select_random.png" },
  doa5:         { folder: "doa5", imgExt: "png", boxart: null, logo: null, fallback: null },
  vf6:          { folder: "vf6", imgExt: "png", boxart: null, logo: null, fallback: null },
  vf5:          { folder: "vf5", imgExt: "png", boxart: null, logo: null, fallback: null },
  vf2:          { folder: "vf2", imgExt: "webp", boxart: null, logo: null, fallback: null },
  bloodyroar2:  { folder: "bloodyroar2", imgExt: "png", boxart: null, logo: null, fallback: "select_random.png" },
  djffny:       { folder: "djffny", imgExt: "png", boxart: null, logo: null, fallback: "select_random.png" },
};

// -------------------------------------------------------
// GAME DEFINITIONS
// Maps start.gg videogame name strings and shortcodes → asset config.
// Order matters: getGameConfig() falls back to the first partial match.
// -------------------------------------------------------
const GAME_CONFIG = Object.fromEntries([
  ["tekken 8", "tk8"], ["tekken 8 ball", "tk8ball"], ["tk8", "tk8"],
  ["tekken 7", "tk7"], ["tk7", "tk7"],
  ["tekken 6", "tk6"], ["tk6", "tk6"],
  ["tekken 5: dark resurrection", "tk5dr"], ["tekken 5 dark resurrection", "tk5dr"], ["tekken 5 dr", "tk5dr"], ["tk5dr", "tk5dr"],
  ["tekken 5", "tk5"], ["tk5", "tk5"],
  ["tekken 4", "tk4"], ["tk4", "tk4"],
  ["tekken 3", "tk3"], ["tk3", "tk3"], ["tekken 3 ball", "tk3ball"], ["tk3ball", "tk3ball"], ["tekken ball", "tk3ball"],
  ["tekken 2", "tk2"], ["tk2", "tk2"],
  ["tekken", "tk1"], ["tekken 1", "tk1"], ["tk1", "tk1"],
  ["tekken tag tournament", "ttt1"], ["tekken tag", "ttt1"], ["ttt1", "ttt1"],
  ["tekken tag tournament 2", "ttt2"], ["tekken tag 2", "ttt2"], ["ttt2", "ttt2"],
  ["dead or alive 6", "doa6"], ["doa6", "doa6"],
  ["dead or alive 5", "doa5"], ["doa5", "doa5"],
  ["virtua fighter 6", "vf6"], ["vf6", "vf6"],
  ["virtua fighter 5", "vf5"], ["vf5", "vf5"],
  ["virtua fighter 2", "vf2"], ["vf2", "vf2"],
  ["bloody roar 2", "bloodyroar2"], ["bloodyroar2", "bloodyroar2"],
  ["def jam: fight for ny", "djffny"], ["def jam fight for ny", "djffny"], ["def jam", "djffny"], ["djffny", "djffny"],
].map(([name, asset]) => [name, { selectPrefix: "select_", ...GAME_ASSETS[asset] }]));

// Default fallback for unknown games
const GAME_CONFIG_DEFAULT = { selectPrefix: "select_", ...GAME_ASSETS.tk8 };

/**
 * Get game config by videogame name string from start.gg
 * @param {string} videogameName
 * @returns {object} game config
 */
function getGameConfig(videogameName) {
  if (!videogameName) return GAME_CONFIG_DEFAULT;
  const key = videogameName.toLowerCase().trim();

  // Exact match first
  if (GAME_CONFIG[key]) return GAME_CONFIG[key];

  // Partial match fallback
  for (const [k, v] of Object.entries(GAME_CONFIG)) {
    if (key.includes(k) || k.includes(key)) return v;
  }

  return GAME_CONFIG_DEFAULT;
}

/**
 * Image fallback chain. Each <img> lists the next sources to try in
 * data-fallbacks ("url|url"); when none are left it is hidden.
 */
if (typeof window !== "undefined" && !window.dqImgFallback) {
  window.dqImgFallback = function (img) {
    const rest = (img.dataset.fallbacks || "").split("|").filter(Boolean);
    if (!rest.length) {
      img.onerror = null;
      img.style.display = "none";
      return;
    }
    img.dataset.fallbacks = rest.slice(1).join("|");
    img.src = rest[0];
  };
}

/**
 * Build a character select icon HTML for a given game + character slug.
 * Tries the icon in the game's main format, then the other format, then the
 * game's random/unknown icon; hides the image if none exist.
 */
function buildCharacterIconHtml(charSlug, config, slotIndex = 0, width = 24, height = 24) {
  const cfg    = config || GAME_CONFIG_DEFAULT;
  const dir    = `/images/games/${cfg.folder || "tk8"}/characters/characters_select/`;
  const prefix = cfg.selectPrefix || "select_";
  const ext    = cfg.imgExt || "png";
  const altExt = ext === "png" ? "webp" : "png";
  const url    = file => window.withBase(dir + file);

  // Random/unknown icons: P1/P2 variants where the game has them, then the generic one.
  const randomIcons = [];
  if (cfg.slotFallbacks) randomIcons.push(url(`select_random${slotIndex === 1 ? 2 : 1}.${ext}`));
  if (cfg.fallback) randomIcons.push(url(cfg.fallback));

  const safeSlug = charSlug ? String(charSlug).toLowerCase().replace(/[^a-z0-9_-]/g, "") : "";
  const sources = safeSlug
    ? [url(`${prefix}${safeSlug}.${ext}`), url(`${prefix}${safeSlug}.${altExt}`), ...randomIcons]
    : randomIcons;
  if (!sources.length) return "";

  const label = safeSlug || "Random/Unreported";
  const title = safeSlug || "Random/Unreported character";
  return `<img src="${sources[0]}"
       alt="${label}" title="${title}"
       width="${width}" height="${height}"
       style="display:inline-block; margin-right:2px; vertical-align:middle;"
       data-fallbacks="${sources.slice(1).join("|")}"
       onerror="dqImgFallback(this)">`;
}

function getGameBoxart(videogameName) {
  const config = getGameConfig(videogameName);
  return config.boxart ? window.withBase(`/images/games/${config.folder}/boxart/${config.boxart}`) : "";
}

function getGameLogo(videogameName) {
  const config = getGameConfig(videogameName);
  return config.logo ? window.withBase(`/images/games/${config.folder}/logo/${config.logo}`) : "";
}

// -------------------------------------------------------
// TEKKEN 8 CHARACTER ID MAP
// -------------------------------------------------------
const T8_CHARACTER_IDS = {
  "2406": "alisa",
  "2407": "asuka",
  "2408": "azucena",
  "2409": "bryan",
  "2410": "claudio",
  "2411": "devil-jin",
  "2412": "feng",
  "2413": "hwoarang",
  "2414": "jack-8",
  "2415": "jin",
  "2416": "jun",
  "2417": "kazuya",
  "2418": "king",
  "2419": "kuma",
  "2420": "lars",
  "2421": "lee",
  "2422": "leo",
  "2423": "leroy",
  "2424": "lili",
  "2425": "xiaoyu",
  "2426": "law",
  "2427": "nina",
  "2428": "panda",
  "2429": "paul",
  "2431": "raven",
  "2432": "reina",
  "2433": "dragunov",
  "2434": "shaheen",
  "2435": "steve",
  "2436": "victor",
  "2437": "yoshimitsu",
  "2438": "zafina",
  "2446": "eddy",
  "2538": "lidia",
  "2598": "heihachi",
  "2612": "clive",
  "2620": "anna",
  "2700": "fahkumram",
};

const T8_CHARACTER_NAMES = {
  "alisa": "alisa", "alisa bosconovitch": "alisa",
  "anna": "anna", "anna williams": "anna",
  "asuka": "asuka", "asuka kazama": "asuka",
  "azucena": "azucena", "azucena oritz": "azucena",
  "bob richards": "bob", "bob": "bob", "bryan": "bryan", "bryan fury": "bryan",
  "claudio": "claudio", "claudio serafino": "claudio",
  "clive": "clive", "clive rosfield": "clive",
  "devil jin": "devil-jin", "devil_jin": "devil-jin", "deviljin": "devil-jin",
  "dragunov": "dragunov", "sergei dragunov": "dragunov",
  "eddy": "eddy", "eddy gordo": "eddy",
  "fahkumram": "fahkumram",
  "feng": "feng", "feng wei": "feng",
  "heihachi": "heihachi", "heihachi mishima": "heihachi",
  "hwoarang": "hwoarang",
  "jack-8": "jack-8", "jack8": "jack-8", "jack 8": "jack-8",
  "jin": "jin", "jin kazama": "jin",
  "jun": "jun", "jun kazama": "jun",
  "kazuya": "kazuya", "kazuya mishima": "kazuya",
  "king": "king",
  "kuma": "kuma",
  "lars": "lars", "lars alexandersson": "lars",
  "law": "law", "marshall law": "law",
  "lee": "lee", "lee chaolan": "lee",
  "leo": "leo", "leo kliesen": "leo",
  "leroy": "leroy", "leroy smith": "leroy",
  "lili": "lili", "emilie de rochefort": "lili",
  "lidia": "lidia", "lidia sobieska": "lidia",
  "nina": "nina", "nina williams": "nina",
  "panda": "panda",
  "paul": "paul", "paul phoenix": "paul",
  "raven": "raven",
  "reina": "reina", "reina mishima": "reina",
  "shaheen": "shaheen",
  "steve": "steve", "steve fox": "steve",
  "victor": "victor", "victor chevalier": "victor",
  "xiaoyu": "xiaoyu", "ling xiaoyu": "xiaoyu",
  "yoshimitsu": "yoshimitsu",
  "zafina": "zafina",
};

const T3_CHARACTER_IDS = {};

function getCharacterIdMap(videogameName) {
  if (!videogameName) return T8_CHARACTER_IDS;
  const key = videogameName.toLowerCase();
  if (key.includes("tekken 3") || key.includes("tekken3") || key.includes("tekken ball")) {
    return T3_CHARACTER_IDS;
  }
  return T8_CHARACTER_IDS;
}

function resolveCharacterSlug(selectionValue, characterObj, videogameName) {
  const idMap = getCharacterIdMap(videogameName);

  if (selectionValue != null) {
    const slug = idMap[selectionValue.toString().trim()];
    if (slug) return slug;
  }

  if (characterObj?.id != null) {
    const slug = idMap[characterObj.id.toString().trim()];
    if (slug) return slug;
  }

  if (characterObj?.name) {
    const key = characterObj.name.toLowerCase().trim().replace(/\s+/g, "-");
    if (T8_CHARACTER_NAMES[key]) return T8_CHARACTER_NAMES[key];
    return key;
  }

  return null;
}

// -------------------------------------------------------
// MANUAL FALLBACK MAP
// -------------------------------------------------------
const MANUAL_PLAYER_CHARACTERS = {
  "slawpro":       [],
  "strykie":       ["yoshimitsu"],
  "shirdel":       [],
  "protonicobra":  ["heihachi"],
  "protocobra":    ["heihachi"],
  "sponchy":       [],
  "kingjae":       [],
  "king jae":      [],
  "justtreatman":  [],
  "treatman":      [],
  "temphuibis":    ["king"],
  "harrycm01":     ["anna"],
  "hampnon":       ["paul"]
};

function getManualCharacters(entrantName) {
  if (!entrantName) return [];
  const lower = entrantName.toLowerCase();
  for (const [key, chars] of Object.entries(MANUAL_PLAYER_CHARACTERS)) {
    if (lower.includes(key)) return chars;
  }
  return [];
}