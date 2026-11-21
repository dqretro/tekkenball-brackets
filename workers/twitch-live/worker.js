// DQRetro Twitch live-status endpoint (Cloudflare Worker).
//
// GET /  ->  { live, title, game, viewers, startedAt, channel, checkedAt }
//
// - Only ever checks the configured channel (TWITCH_CHANNEL); the request cannot pick one.
// - Twitch credentials are Worker secrets (TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET) and never
//   leave the Worker. The response only contains public stream information.
// - Results are cached for CACHE_SECONDS at the edge, so Twitch is called at most about
//   once a minute per data centre, however many people open the site.
// - CORS is granted only to ALLOWED_ORIGINS (the site and local previews).

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const STREAMS_URL = "https://api.twitch.tv/helix/streams";
const CACHE_SECONDS = 60;

// App access token, reused while this Worker instance is alive.
let cachedToken = null; // { value, expiresAt }

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json({ error: "method not allowed" }, 405, { ...cors, Allow: "GET, HEAD, OPTIONS" });
    }
    const url = new URL(request.url);
    if (url.pathname !== "/" && url.pathname !== "/live") return json({ error: "not found" }, 404, cors);

    const channel = (env.TWITCH_CHANNEL || "dqretro").toLowerCase();
    // One cache entry per channel; query strings and origins never create new entries.
    const cacheKey = new Request(`https://twitch-live.cache/${encodeURIComponent(channel)}`);
    const cache = caches.default;

    let body = await cache.match(cacheKey).then(r => (r ? r.text() : null));
    if (!body) {
      let status;
      try {
        status = await fetchStatus(channel, env);
      } catch (err) {
        console.error("twitch status failed:", err && err.message);
        // Not cached, so the next request retries. The site treats any error as "offline".
        return json({ live: false, channel, error: "status unavailable" }, 502, { ...cors, "Cache-Control": "no-store" });
      }
      body = JSON.stringify(status);
      ctx.waitUntil(cache.put(cacheKey, new Response(body, {
        headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${CACHE_SECONDS}` },
      })));
    }

    return new Response(request.method === "HEAD" ? null : body, {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": `public, max-age=${CACHE_SECONDS}` },
    });
  },
};

async function fetchStatus(channel, env) {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) throw new Error("Twitch secrets are not configured");

  let res = await queryStreams(channel, env, await getToken(env));
  if (res.status === 401) {
    cachedToken = null; // token revoked or expired early: get a new one once
    res = await queryStreams(channel, env, await getToken(env));
  }
  if (!res.ok) throw new Error(`helix/streams HTTP ${res.status}`);

  const stream = ((await res.json()).data || [])[0];
  const checkedAt = new Date().toISOString();
  if (!stream || stream.type !== "live") return { live: false, channel, checkedAt };
  return {
    live: true,
    channel,
    title: String(stream.title || "").slice(0, 200),
    game: String(stream.game_name || "").slice(0, 100),
    viewers: Number(stream.viewer_count) || 0,
    startedAt: stream.started_at || null,
    checkedAt,
  };
}

function queryStreams(channel, env, token) {
  return fetch(`${STREAMS_URL}?user_login=${encodeURIComponent(channel)}`, {
    headers: { "Client-Id": env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` },
  });
}

async function getToken(env) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID,
      client_secret: env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new Error(`oauth2/token HTTP ${res.status}`);
  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
  return cachedToken.value;
}

function corsHeaders(origin, env) {
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const headers = { Vary: "Origin" };
  if (allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, HEAD, OPTIONS";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
}
