// =====================================================================
// Twitch live overlay (homepage)
//
// When twitch.tv/dqretro is live, shows the stream in a centre overlay.
// Minimising (click outside, the – button or Esc) moves the same player to a
// picture-in-picture window in the bottom-right corner. The player <iframe> is
// created once and never moved in the DOM, so the stream does not reload.
// × hides it for the rest of the browser session.
//
// Live status comes from the DQRetro live-status Worker (workers/twitch-live),
// which holds the Twitch credentials. Its public URL is read from
// shared/live/live-config.json, generated at deploy time (see static.yml).
// No config, an unknown host, an error or "offline" = nothing is shown.
// =====================================================================
(function () {
  "use strict";

  const CHANNEL = "dqretro";
  // Hosts the Twitch embed may run on (Twitch's "parent" list).
  const PARENT_HOSTS = ["dqretro.github.io", "localhost", "127.0.0.1"];
  const POLL_MS = 90 * 1000;
  const MAX_BACKOFF_MS = 10 * 60 * 1000;
  // Twitch requires players of at least 400x300; below this viewport size no compliant
  // player fits, so a "Watch on Twitch" card is shown instead of the embed.
  const EMBED_QUERY = "(min-width: 600px) and (min-height: 480px)";
  const KEY_DISMISSED = "dqretro:twitchLive:dismissed";
  const KEY_MINIMISED = "dqretro:twitchLive:minimised";

  if (!PARENT_HOSTS.includes(window.location.hostname)) return;

  const session = {
    get(key) { try { return window.sessionStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { window.sessionStorage.setItem(key, value); } catch { /* private mode etc. */ } },
  };
  if (session.get(KEY_DISMISSED) === "1") return;

  const base = typeof window.withBase === "function"
    ? window.withBase
    : p => (window.location.hostname === "dqretro.github.io" ? "/tekkenball-brackets" : "") + "/" + String(p).replace(/^\/+/, "");

  let statusUrl = null;
  let pollTimer = null;
  let failures = 0;
  let stopped = false;
  let ui = null; // built on first "live"

  // ------------------------------------------------------------------
  // Status polling
  // ------------------------------------------------------------------
  async function loadConfig() {
    try {
      const res = await fetch(base("shared/live/live-config.json"), { cache: "no-store" });
      if (!res.ok) return null;
      const cfg = await res.json();
      const url = String(cfg?.statusUrl || "").trim();
      const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);
      return /^https:\/\//i.test(url) || (local && /^http:\/\//i.test(url)) ? url : null;
    } catch {
      return null;
    }
  }

  async function poll() {
    pollTimer = null;
    if (stopped || document.hidden) return;
    let status = null;
    try {
      const res = await fetch(statusUrl, { cache: "no-store", credentials: "omit" });
      status = res.ok ? await res.json() : null;
    } catch {
      status = null;
    }
    if (stopped) return;
    failures = status ? 0 : failures + 1;
    if (status && status.live === true) showLive(status);
    else hideLive(); // offline, error or unexpected response: show nothing
    schedule();
  }

  function schedule() {
    if (stopped || pollTimer || document.hidden) return;
    const delay = failures ? Math.min(POLL_MS * 2 ** failures, MAX_BACKOFF_MS) : POLL_MS;
    pollTimer = window.setTimeout(poll, delay);
  }

  document.addEventListener("visibilitychange", () => {
    if (stopped || !statusUrl) return;
    if (document.hidden) {
      window.clearTimeout(pollTimer);
      pollTimer = null;
    } else if (!pollTimer) {
      poll();
    }
  });

  // ------------------------------------------------------------------
  // UI
  // ------------------------------------------------------------------
  function el(tag, attrs = {}, text) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text != null) node.textContent = text;
    return node;
  }

  function buildUi() {
    const embed = window.matchMedia(EMBED_QUERY).matches;

    const backdrop = el("div", { class: "tl-backdrop", "aria-hidden": "true" });
    const root = el("div", { class: "tl-player", role: "dialog", "aria-labelledby": "tl-heading", "data-mode": embed ? "embed" : "card" });

    const bar = el("div", { class: "tl-bar" });
    const badge = el("span", { class: "tl-badge" }, "LIVE");
    const info = el("div", { class: "tl-info" });
    const heading = el("span", { class: "tl-heading", id: "tl-heading" }, "DQRetro is live on Twitch");
    const meta = el("span", { class: "tl-meta" });
    info.append(heading, meta);
    const btnMin = el("button", { type: "button", class: "tl-btn tl-min", "aria-label": "Minimise stream", title: "Minimise" }, "–");
    const btnExpand = el("button", { type: "button", class: "tl-btn tl-expand", "aria-label": "Expand stream", title: "Expand" }, "⤢");
    const btnClose = el("button", { type: "button", class: "tl-btn tl-close", "aria-label": "Close stream for this session", title: "Close" }, "×");
    bar.append(badge, info, btnMin, btnExpand, btnClose);

    const body = el("div", { class: "tl-body" });
    let iframe = null;
    if (embed) {
      const parents = PARENT_HOSTS.map(h => "parent=" + encodeURIComponent(h)).join("&");
      iframe = el("iframe", {
        class: "tl-frame",
        src: `https://player.twitch.tv/?channel=${encodeURIComponent(CHANNEL)}&${parents}&muted=true&autoplay=true`,
        title: "DQRetro live stream on Twitch",
        allow: "autoplay; fullscreen; picture-in-picture",
        allowfullscreen: "",
      });
      body.append(iframe);
    } else {
      const card = el("div", { class: "tl-card" });
      card.append(
        el("p", { class: "tl-card-text" }, "We're streaming right now."),
        el("a", { class: "button primary tl-watch", href: `https://www.twitch.tv/${CHANNEL}`, target: "_blank", rel: "noopener" }, "Watch on Twitch ↗"),
      );
      body.append(card);
    }
    root.append(bar, body);

    const pill = el("button", { type: "button", class: "tl-pill", "aria-label": "DQRetro is live on Twitch. Open the stream." });
    pill.append(el("span", { class: "tl-badge" }, "LIVE"), el("span", {}, "Watch DQRetro"));

    backdrop.addEventListener("click", minimise);
    btnMin.addEventListener("click", minimise);
    btnExpand.addEventListener("click", expand);
    btnClose.addEventListener("click", closeForSession);
    pill.addEventListener("click", expand);

    document.body.append(backdrop, root, pill);
    return { embed, backdrop, root, pill, heading, meta, btnMin, iframe, state: null, inerted: [], returnFocus: null };
  }

  function setState(state) {
    if (!ui || ui.state === state) return;
    const wasCenter = ui.state === "center";
    ui.state = state;
    ui.root.dataset.state = state;
    ui.backdrop.classList.toggle("is-visible", state === "center");
    ui.pill.classList.toggle("is-visible", state === "pill");
    ui.root.classList.toggle("is-hidden", state === "pill");
    ui.root.setAttribute("aria-modal", state === "center" ? "true" : "false");

    if (state === "center") {
      ui.returnFocus = document.activeElement;
      setPageInert(true);
      window.requestAnimationFrame(() => ui && ui.btnMin.focus());
    } else if (wasCenter) {
      setPageInert(false);
      const target = state === "pill" ? ui.pill : ui.returnFocus;
      if (target && typeof target.focus === "function" && document.contains(target)) target.focus();
    }
  }

  // While the centre overlay is open, the rest of the page can't be focused or clicked.
  function setPageInert(on) {
    if (on) {
      ui.inerted = [...document.body.children].filter(n =>
        n !== ui.root && n !== ui.backdrop && n !== ui.pill && !n.inert && n.tagName !== "SCRIPT");
      ui.inerted.forEach(n => { n.inert = true; });
    } else {
      ui.inerted.forEach(n => { n.inert = false; });
      ui.inerted = [];
    }
  }

  function updateInfo(status) {
    const title = String(status.title || "").trim();
    ui.heading.textContent = title || "DQRetro is live on Twitch";
    const parts = [];
    if (status.game) parts.push(String(status.game));
    if (Number.isFinite(status.viewers)) parts.push(`${status.viewers.toLocaleString()} watching`);
    ui.meta.textContent = parts.join(" · ");
  }

  function showLive(status) {
    if (!ui) {
      ui = buildUi();
      const minimised = session.get(KEY_MINIMISED) === "1";
      // Start in the remembered state, faded out, then fade in on the next frames.
      ui.root.classList.add("is-entering");
      ui.pill.classList.add("is-entering");
      setState(minimised ? (ui.embed ? "pip" : "pill") : "center");
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        if (!ui) return;
        ui.root.classList.remove("is-entering");
        ui.pill.classList.remove("is-entering");
      }));
    }
    updateInfo(status);
  }

  function hideLive() {
    if (!ui) return;
    if (ui.state === "center") setPageInert(false);
    ui.backdrop.remove();
    ui.root.remove(); // removes the iframe: the player stops
    ui.pill.remove();
    ui = null;
  }

  function minimise() {
    if (!ui || ui.state !== "center") return;
    session.set(KEY_MINIMISED, "1");
    setState(ui.embed ? "pip" : "pill");
  }

  function expand() {
    if (!ui) return;
    session.set(KEY_MINIMISED, "0");
    setState("center");
  }

  function closeForSession() {
    session.set(KEY_DISMISSED, "1");
    stopped = true;
    window.clearTimeout(pollTimer);
    hideLive();
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && ui && ui.state === "center") {
      e.preventDefault();
      minimise();
    }
  });

  // ------------------------------------------------------------------
  // Start
  // ------------------------------------------------------------------
  async function start() {
    statusUrl = await loadConfig();
    if (!statusUrl) return; // not configured: no polling, nothing shown
    poll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
