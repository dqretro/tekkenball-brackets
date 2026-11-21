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
// GAME DEFINITIONS
// Maps start.gg videogame name strings and shortcodes → asset config
// -------------------------------------------------------
const GAME_CONFIG = {
  // ---- Tekken 8 ----
  "tekken 8": {
    folder:       "tk8",
    imgExt:       "png",
    selectPrefix: "select_",
    renderPrefix: "render_",
    hudPrefix:    "hud_",
    boxart:       "boxart_tekken8.png",
    logo:         "logo_tekken8.png",
    fallback:     "select_random.png"
  },
  "tekken 8 ball": {
    folder:       "tk8",
    imgExt:       "png",
    selectPrefix: "select_",
    renderPrefix: "render_",
    hudPrefix:    "hud_",
    boxart:       "boxart_tekken8ball.png",
    logo:         "logo_tekken8ball.png",
    fallback:     "select_random.png"
  },
  "tk8": {
    folder:       "tk8",
    imgExt:       "png",
    selectPrefix: "select_",
    renderPrefix: "render_",
    hudPrefix:    "hud_",
    boxart:       "boxart_tekken8.png",
    logo:         "logo_tekken8.png",
    fallback:     "select_random.png"
  },

  // ---- Tekken 7 ----
  "tekken 7": {
    folder:       "tk7",
    imgExt:       "png",
    selectPrefix: "select_",
    boxart:       "boxart_tekken7.png",
    logo:         "logo_tekken7.png",
    fallback:     "select_random.png"
  },
  "tk7": {
    folder:       "tk7",
    imgExt:       "png",
    selectPrefix: "select_",
    boxart:       "boxart_tekken7.png",
    logo:         "logo_tekken7.png",
    fallback:     "select_random.png"
  },

  // ---- Tekken 6 ----
  "tekken 6": {
    folder:       "tk6",
    imgExt:       "png",
    selectPrefix: "select_",
    boxart:       "boxart_tekken6.png",
    logo:         "logo_tekken6.png",
    fallback:     "select_random.png"
  },
  "tk6": {
    folder:       "tk6",
    imgExt:       "png",
    selectPrefix: "select_",
    boxart:       "boxart_tekken6.png",
    logo:         "logo_tekken6.png",
    fallback:     "select_random.png"
  },

  // ---- Tekken 5: Dark Resurrection ----
  "tekken 5: dark resurrection": {
    folder:       "tk5dr",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken5dr.webp",
    logo:         "logo_tekken5dr.webp",
    fallback:     "select_random.webp"
  },
  "tekken 5 dark resurrection": {
    folder:       "tk5dr",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken5dr.webp",
    logo:         "logo_tekken5dr.webp",
    fallback:     "select_random.webp"
  },
  "tekken 5 dr": {
    folder:       "tk5dr",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken5dr.webp",
    logo:         "logo_tekken5dr.webp",
    fallback:     "select_random.webp"
  },
  "tk5dr": {
    folder:       "tk5dr",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken5dr.webp",
    logo:         "logo_tekken5dr.webp",
    fallback:     "select_random.webp"
  },

  // ---- Tekken 5 ----
  "tekken 5": {
    folder:       "tk5",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken5.webp",
    logo:         "logo_tekken5.webp",
    fallback:     "select_random.webp"
  },
  "tk5": {
    folder:       "tk5",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken5.webp",
    logo:         "logo_tekken5.webp",
    fallback:     "select_random.webp"
  },

  // ---- Tekken 4 ----
  "tekken 4": {
    folder:       "tk4",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken4.webp",
    logo:         "logo_tekken4.webp",
    fallback:     "select_random.webp"
  },
  "tk4": {
    folder:       "tk4",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken4.webp",
    logo:         "logo_tekken4.webp",
    fallback:     "select_random.webp"
  },

  // ---- Tekken 3 / Tekken 3 Ball ----
  "tekken 3": {
    folder:       "tk3",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken3.webp",
    logo:         "logo_tekken3.webp",
    fallback:     "select_random.webp"
  },
  "tk3": {
    folder:       "tk3",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken3.webp",
    logo:         "logo_tekken3.webp",
    fallback:     "select_random.webp"
  },
  "tekken 3 ball": {
    folder:       "tk3",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken3ball.webp",
    logo:         "logo_tekken3ball.webp",
    fallback:     "select_random.webp"
  },
  "tk3ball": {
    folder:       "tk3ball",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken3ball.webp",
    logo:         "logo_tekken3ball.webp",
    fallback:     "select_random.webp"
  },
  "tekken ball": {
    folder:       "tk3ball",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken3ball.webp",
    logo:         "logo_tekken3ball.webp",
    fallback:     "select_random.webp"
  },

  // ---- Tekken 2 ----
  "tekken 2": {
    folder:       "tk2",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken2.webp",
    logo:         "logo_tekken2.webp",
    fallback:     "select_random.webp"
  },
  "tk2": {
    folder:       "tk2",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken2.webp",
    logo:         "logo_tekken2.webp",
    fallback:     "select_random.webp"
  },

  // ---- Tekken 1 ----
  "tekken": {
    folder:       "tk1",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken1.webp",
    logo:         "logo_tekken1.webp",
    fallback:     "select_random.webp"
  },
  "tekken 1": {
    folder:       "tk1",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken1.webp",
    logo:         "logo_tekken1.webp",
    fallback:     "select_random.webp"
  },
  "tk1": {
    folder:       "tk1",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_tekken1.webp",
    logo:         "logo_tekken1.webp",
    fallback:     "select_random.webp"
  },

  // ---- Tekken Tag Tournament ----
  "tekken tag tournament": {
    folder:       "ttt1",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_ttt1.webp",
    logo:         "logo_ttt1.webp",
    fallback:     "select_random.webp"
  },
  "tekken tag": {
    folder:       "ttt1",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_ttt1.webp",
    logo:         "logo_ttt1.webp",
    fallback:     "select_random.webp"
  },
  "ttt1": {
    folder:       "ttt1",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_ttt1.webp",
    logo:         "logo_ttt1.webp",
    fallback:     "select_random.webp"
  },

  // ---- Tekken Tag Tournament 2 ----
  "tekken tag tournament 2": {
    folder:       "ttt2",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_ttt2.webp",
    logo:         "logo_ttt2.webp",
    fallback:     "select_random.webp"
  },
  "tekken tag 2": {
    folder:       "ttt2",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_ttt2.webp",
    logo:         "logo_ttt2.webp",
    fallback:     "select_random.webp"
  },
  "ttt2": {
    folder:       "ttt2",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_ttt2.webp",
    logo:         "logo_ttt2.webp",
    fallback:     "select_random.webp"
  },

  // ---- Dead or Alive 6 ----
  "dead or alive 6": {
    folder:       "doa6",
    imgExt:       "png",
    selectPrefix: "select_",
    boxart:       "boxart_doa6.png",
    logo:         "logo_doa6.png",
    fallback:     "select_random.png"
  },
  "doa6": {
    folder:       "doa6",
    imgExt:       "png",
    selectPrefix: "select_",
    boxart:       "boxart_doa6.png",
    logo:         "logo_doa6.png",
    fallback:     "select_random.png"
  },

  // ---- Dead or Alive 5 ----
  "dead or alive 5": {
    folder:       "doa5",
    imgExt:       "png",
    selectPrefix: "select_",
    boxart:       "boxart_doa5.png",
    logo:         "logo_doa5.png",
    fallback:     "select_random.png"
  },
  "doa5": {
    folder:       "doa5",
    imgExt:       "png",
    selectPrefix: "select_",
    boxart:       "boxart_doa5.png",
    logo:         "logo_doa5.png",
    fallback:     "select_random.png"
  },

  // ---- Virtua Fighter 6 ----
  "virtua fighter 6": {
    folder:       "vf6",
    imgExt:       "png",
    selectPrefix: "select_",
    boxart:       "boxart_vf6.png",
    logo:         "logo_vf6.png",
    fallback:     "select_random.png"
  },
  "vf6": {
    folder:       "vf6",
    imgExt:       "png",
    selectPrefix: "select_",
    boxart:       "boxart_vf6.png",
    logo:         "logo_vf6.png",
    fallback:     "select_random.png"
  },

  // ---- Virtua Fighter 5 ----
  "virtua fighter 5": {
    folder:       "vf5",
    imgExt:       "png",
    selectPrefix: "select_",
    boxart:       "boxart_vf5.png",
    logo:         "logo_vf5.png",
    fallback:     "select_random.png"
  },
  "vf5": {
    folder:       "vf5",
    imgExt:       "png",
    selectPrefix: "select_",
    boxart:       "boxart_vf5.png",
    logo:         "logo_vf5.png",
    fallback:     "select_random.png"
  },

  // ---- Virtua Fighter 2 ----
  "virtua fighter 2": {
    folder:       "vf2",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_vf2.webp",
    logo:         "logo_vf2.webp",
    fallback:     "select_random.webp"
  },
  "vf2": {
    folder:       "vf2",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_vf2.webp",
    logo:         "logo_vf2.webp",
    fallback:     "select_random.webp"
  },

  // ---- Bloody Roar 2 ----
  "bloody roar 2": {
    folder:       "bloodyroar2",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_bloodyroar2.webp",
    logo:         "logo_bloodyroar2.webp",
    fallback:     "select_random.webp"
  },
  "bloodyroar2": {
    folder:       "bloodyroar2",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_bloodyroar2.webp",
    logo:         "logo_bloodyroar2.webp",
    fallback:     "select_random.webp"
  },

  // ---- Def Jam: Fight for NY ----
  "def jam: fight for ny": {
    folder:       "djffny",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_djffny.webp",
    logo:         "logo_djffny.webp",
    fallback:     "select_random.webp"
  },
  "def jam fight for ny": {
    folder:       "djffny",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_djffny.webp",
    logo:         "logo_djffny.webp",
    fallback:     "select_random.webp"
  },
  "def jam": {
    folder:       "djffny",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_djffny.webp",
    logo:         "logo_djffny.webp",
    fallback:     "select_random.webp"
  },
  "djffny": {
    folder:       "djffny",
    imgExt:       "webp",
    selectPrefix: "select_",
    boxart:       "boxart_djffny.webp",
    logo:         "logo_djffny.webp",
    fallback:     "select_random.webp"
  }
};

// Default fallback for unknown games
const GAME_CONFIG_DEFAULT = {
  folder:       "tk8",
  imgExt:       "png",
  selectPrefix: "select_",
  renderPrefix: "render_",
  hudPrefix:    "hud_",
  boxart:       "boxart_tekken8.png",
  logo:         "logo_tekken8.png",
  fallback:     "select_random.png"
};

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
 * Build a character select icon HTML for a given game + character slug.
 */
function buildCharacterIconHtml(charSlug, config, slotIndex = 0, width = 24, height = 24) {
  const cfg      = config || GAME_CONFIG_DEFAULT;
  const folder   = cfg.folder || "tk8";
  const prefix   = cfg.selectPrefix || "select_";
  const ext      = cfg.imgExt || "png";
  const altExt   = ext === "png" ? "webp" : "png";
  
  // Specific fallback image based on player slot index (0 = P1, 1 = P2)
  const slotFallback = slotIndex === 1 ? `select_random2.${ext}` : `select_random1.${ext}`;
  const genericFallback = cfg.fallback || `select_random.${ext}`;
  
  const fallbackPath = window.withBase(`/images/games/${folder}/characters/characters_select/${slotFallback}`);
  const genericFallbackPath = window.withBase(`/images/games/${folder}/characters/characters_select/${genericFallback}`);

  if (!charSlug) {
    return `<img src="${fallbackPath}"
         alt="Random/Unreported" title="Random/Unreported character"
         width="${width}" height="${height}"
         style="display:inline-block; margin-right:2px; vertical-align:middle;"
         onerror="this.onerror=null;this.src='${genericFallbackPath}';this.onerror=function(){this.style.display='none';}">`;
  }

  const primary = window.withBase(`/images/games/${folder}/characters/characters_select/${prefix}${charSlug}.${ext}`);
  const altSrc  = window.withBase(`/images/games/${folder}/characters/characters_select/${prefix}${charSlug}.${altExt}`);

  return `<img src="${primary}"
       alt="${charSlug}" title="${charSlug}"
       width="${width}" height="${height}"
       style="display:inline-block; margin-right:2px; vertical-align:middle;"
       onerror="this.onerror=null;this.src='${altSrc}';this.onerror=function(){this.onerror=null;this.src='${fallbackPath}';this.onerror=function(){this.style.display='none';};}">`;
}

function getGameBoxart(videogameName) {
  const config = getGameConfig(videogameName);
  return window.withBase(`/images/games/${config.folder}/boxart/${config.boxart}`);
}

function getGameLogo(videogameName) {
  const config = getGameConfig(videogameName);
  return window.withBase(`/images/games/${config.folder}/logo/${config.logo}`);
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