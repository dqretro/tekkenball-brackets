#!/usr/bin/env node
// Checks that file paths used by the site point at files that are committed,
// with exactly matching case. Windows and macOS ignore case, GitHub Pages does not,
// so a wrong-case path works locally and 404s on the live site.
//
// Checks:
//   1. every image listed in pages/assets/assets.json
//   2. every fallback / box art / logo file named in pages/tournaments/game-config.js
//   3. every local src/href in the site's .html files (pages and shared nav/footer fragments)
//
// Usage: node .github/scripts/check-assets.js   (run from the repo root; needs git)
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const PUBLIC = "src/DQRetro.TournamentTracker.Ui/public";
const BASE_PREFIX = "/tekkenball-brackets";
const tracked = new Set(
  execFileSync("git", ["ls-files", "--", PUBLIC], { encoding: "utf8", maxBuffer: 1 << 26 })
    .split("\n").filter(Boolean).map(p => p.slice(PUBLIC.length + 1))
);
const errors = [];
const isTracked = rel => tracked.has(rel);

// 1. assets.json
const assetsRel = "pages/assets/assets.json";
const assets = JSON.parse(fs.readFileSync(path.join(PUBLIC, assetsRel), "utf8"));
let assetCount = 0;
for (const [section, list] of Object.entries(assets)) {
  if (!Array.isArray(list)) continue;
  for (const p of list) {
    if (typeof p !== "string") continue;
    assetCount++;
    if (!isTracked(p.replace(/^\/+/, ""))) errors.push(`${assetsRel} [${section}]: ${p}`);
  }
}

// 2. game-config.js
const cfgRel = "pages/tournaments/game-config.js";
const ctx = { window: { location: { hostname: "localhost" } } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(PUBLIC, cfgRel), "utf8") +
  "\nthis.__configs = Object.values(GAME_CONFIG).concat(GAME_CONFIG_DEFAULT);", ctx);
let cfgCount = 0;
for (const c of new Set(ctx.__configs)) {
  const dir = `images/games/${c.folder}`;
  const files = [];
  if (c.fallback) files.push(`${dir}/characters/characters_select/${c.fallback}`);
  if (c.slotFallbacks) for (const n of [1, 2]) files.push(`${dir}/characters/characters_select/select_random${n}.${c.imgExt}`);
  if (c.boxart) files.push(`${dir}/boxart/${c.boxart}`);
  if (c.logo) files.push(`${dir}/logo/${c.logo}`);
  for (const f of files) {
    cfgCount++;
    if (!isTracked(f)) errors.push(`${cfgRel} (${c.folder}): ${f}`);
  }
}

// 3. local src/href in HTML. Fragments under shared/layout/ are injected into
// pages and resolved from the site root by script.js, so treat them as root-relative.
let refCount = 0;
for (const rel of [...tracked].filter(f => f.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(PUBLIC, rel), "utf8").replace(/<!--[\s\S]*?-->/g, "");
  const fromRoot = rel.startsWith("shared/layout/");
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*"([^"]*)"/gi)) {
    let ref = m[1].trim();
    if (!ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\$\{|javascript:)/i.test(ref) || ref.includes("${")) continue;
    ref = ref.split(/[?#]/)[0];
    if (!ref) continue;
    let target;
    if (ref.startsWith("/")) {
      target = ref.startsWith(BASE_PREFIX + "/") ? ref.slice(BASE_PREFIX.length + 1) : ref.slice(1);
    } else {
      target = path.posix.normalize(path.posix.join(fromRoot ? "" : path.posix.dirname(rel), ref));
    }
    target = decodeURIComponent(target);
    if (target.endsWith("/") || target === ".") target = path.posix.join(target, "index.html");
    refCount++;
    if (target.startsWith("..")) errors.push(`${rel}: ${m[1]} (points outside the site)`);
    else if (!isTracked(target)) errors.push(`${rel}: ${m[1]}`);
  }
}

console.log(`Checked ${assetCount} assets.json images, ${cfgCount} game-config files, ${refCount} HTML references.`);
if (errors.length) {
  for (const e of errors) console.log(`::error::Missing or wrong-case file: ${e}`);
  console.log(`${errors.length} problem(s). Paths must match committed files exactly (GitHub Pages is case-sensitive).`);
  process.exit(1);
}
console.log("OK - every referenced file exists with matching case.");
