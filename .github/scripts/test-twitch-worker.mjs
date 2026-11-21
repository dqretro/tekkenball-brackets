#!/usr/bin/env node
// Tests workers/twitch-live/worker.js against fake Twitch responses (no network, no secrets).
// Usage: node .github/scripts/test-twitch-worker.mjs
import { pathToFileURL } from "node:url";
import path from "node:path";

const workerPath = path.resolve("workers/twitch-live/worker.js");
let failures = 0;
const check = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  " + detail}`);
  if (!cond) failures++;
};

// ---- fakes -------------------------------------------------------------
class FakeCache {
  constructor() { this.store = new Map(); }
  async match(req) { const hit = this.store.get(req.url); return hit ? new Response(hit) : undefined; }
  async put(req, res) { this.store.set(req.url, await res.text()); }
}
const calls = { token: 0, streams: 0, streamsUrls: [] };
let scenario = { live: true, tokenStatus: 200, streams401Once: false, streamsStatus: 200 };

globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  if (url.startsWith("https://id.twitch.tv/oauth2/token")) {
    calls.token++;
    const body = String(init.body || "");
    if (!body.includes("client_secret=test-secret")) return new Response("{}", { status: 400 });
    return new Response(JSON.stringify({ access_token: `tok${calls.token}`, expires_in: 3600 }), { status: scenario.tokenStatus });
  }
  if (url.startsWith("https://api.twitch.tv/helix/streams")) {
    calls.streams++;
    calls.streamsUrls.push(url);
    if (scenario.streams401Once) { scenario.streams401Once = false; return new Response("{}", { status: 401 }); }
    if (scenario.streamsStatus !== 200) return new Response("{}", { status: scenario.streamsStatus });
    const data = scenario.live
      ? [{ type: "live", title: "Tekken Ball <script>alert(1)</script>", game_name: "TEKKEN 8", viewer_count: 42, started_at: "2026-11-21T12:00:00Z" }]
      : [];
    return new Response(JSON.stringify({ data }), { status: 200 });
  }
  throw new Error("unexpected fetch " + url);
};

const env = {
  TWITCH_CLIENT_ID: "test-id",
  TWITCH_CLIENT_SECRET: "test-secret",
  TWITCH_CHANNEL: "dqretro",
  ALLOWED_ORIGINS: "https://dqretro.github.io,http://localhost:3000",
};
const pending = [];
const ctx = { waitUntil: p => pending.push(p) };
const settle = () => Promise.all(pending.splice(0));
const req = (pathAndQuery = "/", { origin = "https://dqretro.github.io", method = "GET" } = {}) =>
  new Request("https://dqretro-twitch-live.example.workers.dev" + pathAndQuery, { method, headers: origin ? { Origin: origin } : {} });

// Fresh module (fresh token cache) per scenario.
async function load() {
  globalThis.caches = { default: new FakeCache() };
  calls.token = 0; calls.streams = 0; calls.streamsUrls = [];
  return (await import(pathToFileURL(workerPath).href + "?v=" + Math.random())).default;
}

// ---- tests ---------------------------------------------------------------
{
  const worker = await load();
  scenario = { live: true, tokenStatus: 200, streams401Once: false, streamsStatus: 200 };
  const res = await worker.fetch(req(), env, ctx); await settle();
  const body = await res.json();
  check("live: 200 + live=true", res.status === 200 && body.live === true, JSON.stringify(body));
  check("live: public fields only", JSON.stringify(Object.keys(body).sort()) === JSON.stringify(["channel", "checkedAt", "game", "live", "startedAt", "title", "viewers"]), Object.keys(body).join(","));
  check("live: no secret or token in response", !JSON.stringify(body).includes("test-secret") && !JSON.stringify(body).includes("tok1"));
  check("live: CORS for the site", res.headers.get("Access-Control-Allow-Origin") === "https://dqretro.github.io");
  check("live: cached 60s", res.headers.get("Cache-Control") === "public, max-age=60");
  check("live: title passed as data (site renders it as text)", body.title.includes("<script>"));

  const res2 = await worker.fetch(req("/live?channel=someoneelse"), env, ctx); await settle();
  check("cache: second request served from cache (1 Twitch call)", calls.streams === 1 && res2.status === 200, `streams=${calls.streams}`);
  check("channel can't be changed from the request", calls.streamsUrls.every(u => u.endsWith("user_login=dqretro")), calls.streamsUrls.join(" "));

  const denied = await worker.fetch(req("/", { origin: "https://evil.example" }), env, ctx); await settle();
  check("CORS: other origins get no allow header", denied.headers.get("Access-Control-Allow-Origin") === null);
  const local = await worker.fetch(req("/", { origin: "http://localhost:3000" }), env, ctx); await settle();
  check("CORS: localhost:3000 allowed", local.headers.get("Access-Control-Allow-Origin") === "http://localhost:3000");

  const post = await worker.fetch(req("/", { method: "POST" }), env, ctx);
  check("POST -> 405", post.status === 405);
  const nf = await worker.fetch(req("/other"), env, ctx);
  check("unknown path -> 404", nf.status === 404);
  const pre = await worker.fetch(req("/", { method: "OPTIONS" }), env, ctx);
  check("OPTIONS preflight -> 204 with CORS", pre.status === 204 && pre.headers.get("Access-Control-Allow-Origin") === "https://dqretro.github.io");
}
{
  const worker = await load();
  scenario = { live: false, tokenStatus: 200, streams401Once: false, streamsStatus: 200 };
  const body = await (await worker.fetch(req(), env, ctx)).json(); await settle();
  check("offline: live=false", body.live === false && body.channel === "dqretro", JSON.stringify(body));
}
{
  const worker = await load();
  scenario = { live: true, tokenStatus: 200, streams401Once: true, streamsStatus: 200 };
  const body = await (await worker.fetch(req(), env, ctx)).json(); await settle();
  check("401 from Twitch: new token, retried once", body.live === true && calls.token === 2 && calls.streams === 2, `token=${calls.token} streams=${calls.streams}`);
}
{
  const worker = await load();
  scenario = { live: true, tokenStatus: 200, streams401Once: false, streamsStatus: 503 };
  const res = await worker.fetch(req(), env, ctx); await settle();
  const body = await res.json();
  check("Twitch down: 502, live=false, not cached", res.status === 502 && body.live === false && res.headers.get("Cache-Control") === "no-store", `${res.status} ${JSON.stringify(body)}`);
  scenario.streamsStatus = 200;
  const again = await (await worker.fetch(req(), env, ctx)).json(); await settle();
  check("Twitch back: next request recovers", again.live === true);
  check("token reused across requests", calls.token === 1, `token=${calls.token}`);
}
{
  const worker = await load();
  const res = await worker.fetch(req(), { ...env, TWITCH_CLIENT_SECRET: "" }, ctx); await settle();
  check("missing secrets: 502, not live", res.status === 502 && (await res.json()).live === false);
}

console.log(failures ? `\n${failures} failure(s)` : "\nAll Worker tests passed.");
process.exit(failures ? 1 : 0);
