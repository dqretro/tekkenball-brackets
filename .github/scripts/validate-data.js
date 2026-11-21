#!/usr/bin/env node
// Validates the site's generated data before it is committed or deployed.
// Usage: node .github/scripts/validate-data.js [dataDir]
// Default dataDir: src/DQRetro.TournamentTracker.Ui/public/data
// Exit 0 = valid, 1 = invalid. No dependencies.
"use strict";
const fs = require("fs");
const path = require("path");

const dir = process.argv[2] || path.join("src", "DQRetro.TournamentTracker.Ui", "public", "data");
const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);

function load(file) {
  const p = path.join(dir, file);
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch (e) { fail(`${file}: cannot read/parse (${e.message})`); return null; }
}

const brackets = load("brackets.json");
const players = load("players.json");

// ---- players.json ----
const slugs = new Set();
if (players) {
  if (!Array.isArray(players)) fail("players.json: expected an array");
  else {
    players.forEach((p, i) => {
      if (!p || typeof p.name !== "string" || !p.name.trim()) fail(`players.json[${i}]: missing name`);
      if (!p || typeof p.slug !== "string" || !/^[a-z0-9_-]+$/.test(p.slug)) fail(`players.json[${i}] (${p && p.name}): invalid slug "${p && p.slug}"`);
      else if (slugs.has(p.slug)) fail(`players.json: duplicate slug "${p.slug}"`);
      else slugs.add(p.slug);
    });
  }
}

// ---- brackets.json ----
let tournamentCount = 0, eventCount = 0, setCount = 0;
const nodes = brackets?.data?.currentUser?.tournaments?.nodes;
if (brackets && !Array.isArray(nodes)) fail("brackets.json: data.currentUser.tournaments.nodes is not an array");
if (Array.isArray(nodes)) {
  tournamentCount = nodes.length;
  if (!nodes.length) fail("brackets.json: no tournaments");
  const ids = new Set();
  nodes.forEach(t => {
    const tid = String(t.id);
    if (ids.has(tid)) fail(`brackets.json: duplicate tournament id ${tid} (${t.slug})`);
    ids.add(tid);
    if (!t.slug) fail(`brackets.json: tournament ${tid} has no slug`);

    const evSlugs = new Set();
    (t.events || []).forEach(ev => {
      eventCount++;
      if (!ev.slug) fail(`${t.slug}: event ${ev.id} has no slug`);
      else if (evSlugs.has(ev.slug)) fail(`${t.slug}: duplicate event slug ${ev.slug}`);
      evSlugs.add(ev.slug);

      const groupIds = new Set();
      (ev.phases || []).forEach(ph => (ph.phaseGroups?.nodes || []).forEach(g => groupIds.add(String(g.id))));

      const total = ev.standings?.pageInfo?.total;
      const got = ev.standings?.nodes?.length ?? 0;
      if (typeof total === "number" && got < total) warnings.push(`${ev.slug}: standings ${got}/${total}`);

      (ev.sets?.nodes || []).forEach(s => {
        setCount++;
        if (s.phaseGroupId != null && groupIds.size && !groupIds.has(String(s.phaseGroupId)))
          fail(`${ev.slug}: set ${s.id} phaseGroupId ${s.phaseGroupId} not in event phases`);
        (s.slots || []).forEach(sl => {
          const ps = sl?.entrant?.playerSlug;
          if (ps && slugs.size && !slugs.has(ps)) fail(`${ev.slug}: set ${s.id} playerSlug "${ps}" not in players.json`);
        });
      });
    });
  });
}

console.log(`Data: ${tournamentCount} tournaments, ${eventCount} events, ${setCount} sets, ${slugs.size} players`);
warnings.forEach(w => console.log(`warning: ${w}`));
if (errors.length) {
  errors.slice(0, 50).forEach(e => console.log(`::error::${e}`));
  if (errors.length > 50) console.log(`...and ${errors.length - 50} more`);
  process.exit(1);
}
console.log("OK - data is valid.");
