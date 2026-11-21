# DQRetro Project Audit & Development Roadmap

**Date:** 21 Nov 2026
**Scope:** The whole local project folder, which is the source of truth and is newer than GitHub.
**Method:** Read-only inspection plus static checks and simulations against the real data files. No project files were changed during the audit.

**Bottom line:** the public site is in good shape and mostly works. Four things need sorting before anything else:
- About 14 months of work has never been committed to git.
- Two API keys are exposed.
- The Matches page shows the wrong tournament for 13 of 27 events.
- The GitHub deployment is broken.

---

## 1. What the project is

| Part | Location | Purpose |
|---|---|---|
| start.gg sync tool | [src/DQRetro.TournamentTracker.Startgg/Program.cs](src/DQRetro.TournamentTracker.Startgg/Program.cs) | .NET 8 console app. Pulls 10 fixed tournaments plus anything found by searching "DQRetro" and "SRKade". Writes `public/data/brackets.json` (24 tournaments, 3.3 MB) and `players.json` (261 players). Last run: 24 Aug 2026, so the data is about 3 months old. |
| Static website | [src/DQRetro.TournamentTracker.Ui/public/](src/DQRetro.TournamentTracker.Ui/public/) | Plain HTML/JS pages that read the JSON files directly in the browser. |
| Local Node server | [src/DQRetro.TournamentTracker.Ui/server.js](src/DQRetro.TournamentTracker.Ui/server.js) | Express 5 server, started by `start-admin.bat`. Serves the site and has old "save" endpoints. |
| Admin tools | `public/pages/admin/**` | Older pages from Nov 2025 that store data only in the browser. |

---

## 2. Git and repository state

- **Git isn't installed on this server.** The status below comes from reading `.git` directly.
- Branch `feat/site`, commit `547f3d2`, dated **16 Sep 2025**. Remote: `github.com/dqretro/tekkenball-brackets`. Nothing has been committed since then.
- Compared with the last commit:
  - **114 tracked files are gone from disk:** the old `src/DQRetro.TournamentTracker.Api/` project and the old `Ui/` layout without `public/`.
  - **Everything current is untracked:** the whole site, `server.js` and the sync tool, which is 97 code/data files and 415 images.
  - Only `.gitignore` is a modified tracked file.
- **Three PSD files are over GitHub's 100 MB limit** and aren't gitignored. A commit of everything would be rejected on push:
  - `public/images/games/tk3/characters/characters_select/Tekken 3 Characters.psd` (151 MB)
  - `public/images/banner.psd` (109 MB)
  - `public/images/socials/banners/banner.psd` (101 MB)
- [.github/workflows/api.yml](.github/workflows/api.yml) builds the deleted `Api` project, so it would fail on every push to `main`.
- [src/DQRetro.TournamentTracker.sln](src/DQRetro.TournamentTracker.sln) still points at the deleted `Api` project and doesn't include the sync tool.
- Tools available on the server: Node, .NET SDK 10.0.302 and Python 3.14.

---

## 3. What's done and working

- **Home page:** tournament cards with search, sort and filters (online/offline, status); top players; most-used characters.
- **Tournament flow:** tournaments list, then Events, then each event's pages:
  - Overview: top 8, win/loss, "lost to"
  - Standings
  - Stats, with a character-usage chart
  - Topcut
- **Global leaderboard and statistics** with game, year, character and region filters.
- **Player profiles:**
  - Search page.
  - Profile page with charts, rank badge, achievements, QR code and placement timeline.
  - Head-to-head page.
- **Gallery:** YouTube videos, photos and banner slider.
- **Game configuration** ([game-config.js](src/DQRetro.TournamentTracker.Ui/public/pages/tournaments/game-config.js)): character-icon setup for about 15 games. Tekken 8 character IDs are mapped. Events where start.gg has no character data get manual fills from [brackets-local.json](src/DQRetro.TournamentTracker.Ui/public/data/brackets-local.json).
- **Sync tool:** handles start.gg's rate limits with retries, follows set pagination, filters events by keyword, and writes files safely.
- **Encoding:** the files are clean UTF-8. The garbled characters you may see in PowerShell are only a display issue.

---

## 4. What needs fixing

### Critical

1. **Exposed keys.**
   - The start.gg API key is in plaintext in `src/DQRetro.TournamentTracker.Startgg/appsettings.Development.json`, plus a copy in `bin/Debug`. It's gitignored, which is good, but it should be rotated and moved to an environment variable or user-secrets.
   - A **YouTube Data API key** is in `public/pages/gallery/config.json`. That file isn't ignored and would be published with the site. Restrict the key by HTTP referrer in Google Cloud, or move the call off the browser.
   - The old `src/DQRetro.TournamentTracker.Api/appsettings.Secrets.json` was committed in 2025, so it's in GitHub's history. It couldn't be inspected without git. **Check whether it held a real secret, and rotate it if so.**
2. **Path traversal in `server.js`.** The `/data/:file` route ([server.js:147](src/DQRetro.TournamentTracker.Ui/server.js#L147)) gets URL-decoded parameters, so `..%2F` becomes `../`. Anyone who can reach port 3000 can read any `.json` file on the drive, including the start.gg key. `app.listen(PORT)` binds to all network interfaces. This was confirmed by reading the code, not by exploiting it.
3. **Uncommitted work.** About 14 months of work exists only in this folder, with no backup in git.

### High

4. **The Matches page shows the wrong event for 13 of 27 events.** `fetchEventData()` in [matches.js:76](src/DQRetro.TournamentTracker.Ui/public/pages/tournaments/matches.js#L76) applies its loose rules (shared event name, substring match) to each event before checking every event for an exact match. Many events share a name such as `tekken-ball-hosted-by-dqretro` (×4) or `tekken-8-ball-double-elimination` (×4). Simulated against the real data:
   - VSF XIII, VSF XII, Drowning Pools and Iron Pride show **VSF XIV's** matches.
   - Bi-monthly #6, #5 and #3 show **Pre-VSF #7's** matches.
   - Launch Party (both events), ELFM and three SRKade events show other tournaments' matches.
   - The Overview, Standings, Stats, Topcut and Brackets pages resolve correctly.
5. **The GitHub Pages deployment is broken.** [static.yml](.github/workflows/static.yml) publishes `./src/DQRetro.TournamentTracker.Ui`, but the site now lives in `public/`. The site would be served one folder too deep, so every `withBase()` path would break.
6. **Incomplete data from start.gg.**
   - Standings are fetched with `perPage: 64` and entrants with `perPage: 50`, with no pagination.
   - VSF XII has 115 entrants, but only 64 standings and 50 entrants were fetched. VSF XI (62) and VSF XIV (51) are also capped at 50 entrants.
   - The tournament with id 755865 is stored twice: the slug `dq-retro-tekken-ball-bi-monthly-tournament-2` redirects to the same event as `dqretro-tekken-8-ball-bi-monthly-tournament-2`. This double-counts it in the leaderboards and statistics.
7. **The brackets page can't show real pools or top cut.** The sync tool never fetches `phases`, `phaseGroups` or set `round`/`phaseGroup`. [brackets.js](src/DQRetro.TournamentTracker.Ui/public/pages/tournaments/brackets.js) therefore always falls back to one "Main Bracket", and `renderTopcut()` in matches.js is always hidden.

### Medium

8. **The tournament nav loads twice per page.** The tournament pages load `nav_t.js` from both `/tekkenball-brackets/...` and `/...`, and one of them 404s depending on where the site is hosted. `nav_t.js` also replaces `script.js`'s `loadNav()`, which only works by accident. Likewise `nav_t.html` hardcodes `/tekkenball-brackets/`.
9. **Every page downloads the 3.3 MB `brackets.json` on load.** `script.js` calls `loadStartggData()` on every page, even pages that don't use it.
10. **Broken pages and links:**
    - `pool.html` calls `fetchTournament`, `generateDummySets`, `assignRounds` and `BracketsViewer`, none of which exist.
    - `pools.html` calls `updateEventHeader` and `fetchTournament`, which don't exist.
    - `rankings.html` and `players/index.html` link a `styles.css` that doesn't exist at that path.
    - `nav_admin.html` links to `pages/assets/assets.html` and `pages/admin/admin.html`, which don't exist. `server.js` route `/admin` also points at a missing file.
    - The admin and JSON-generator pages use `../../../../` paths. These only work on localhost, because browsers stop at the site root. They break under the GitHub Pages sub-path. Some also reference `nav.js`, `../admin.css` and `../admin/admin-tools/admin.js`, which don't exist.
    - `players.html` and `head-to-head.html` reference `shared/layout/header/nav/nav.js`, which doesn't exist.
    - `index.html` calls `loadTournamentsLanding()`, which doesn't exist. The call is guarded, so it fails harmlessly.
11. **Player data quality.**
    - Four players appear twice in `players.json`: DerpxShikari, nubi/Nubi, PimpyLimpy420 and YeetsMakoto.
    - `namesMatch()` in players.js falsely matches "Hex" with "zhexy_30".
    - Player links are built with three different slug formats (search/stats, global leaderboard, sync tool). They only resolve thanks to the fuzzy fallback.
12. **Start.gg names are inserted into the page without escaping** in matches.js, tournaments.js and events.js. A name or tag containing `<` could break the layout.

### Low / cleanup

- **Leftover files:**
  - `pages/tournaments/bracket copy/`
  - `admin-players copy.html`
  - `tournaments-placeholder copy.json` and `copy 2.json`
  - `placeholder-data/.json`
  - `stats,css` (a comma instead of a dot)
  - `added.txt`
  - `screenshot_globalplayers.png` and `Thumbs.db` in the project root
- **Old placeholder JSON fallbacks:** `stats.js`, `rankings.js`, `bracket-utils.js` and `admin-tools.js` still fall back to `tournaments-placeholder.json`.
- **Duplicated helpers:** about 10 copies of `withBase()`, with inconsistent hostname checks (`=== "dqretro.github.io"` vs `.includes("github.io")`).
- **Unpinned CDN versions:** `chart.js` on players.html and `brackets-viewer.js` load without a pinned version.
- **Dead `server.js` endpoints:** `/save`, `/savePages`, `/deletePage` and `/pools/all` target `data-*.json` and `pages/bracket/`, which no longer exist, and nothing calls them. They also have no authentication.
- **README:** only two lines long.

---

## 5. Unfinished features

- **Admin area:** disconnected from the real data. It uses browser storage and `tournaments-placeholder.json`, not `brackets.json`/`players.json`.
- **Pools and phase brackets, and real top cut:** see #7.
- **Hardcoded event text:** `information.html` has hardcoded rules and prize text, and `overview.html` has a hardcoded 60/30/10 prize split.
- **Rankings page:** half-migrated. It fetches `pages/player-profiles/players/players.json`, which doesn't exist.
- **Data refresh:** there's no scheduled or automated refresh. The sync tool is run by hand.

---

## 6. Development roadmap

### Phase 0: Safeguard (do first, small changes)
1. Install Git for Windows.
2. Add `*.psd`, `bin/`, `obj/`, `Thumbs.db` and the secrets files to `.gitignore`.
3. Rotate the start.gg and YouTube keys.
   - Move the start.gg key into an environment variable or user-secrets.
   - Restrict the YouTube key by HTTP referrer.
4. Make one local "snapshot" commit of the current state on `feat/site`. **No push until approved.**

### Phase 1: Critical fixes
- `server.js`: fix the traversal in `/data/:file` (or bind to `127.0.0.1` only), and remove or lock down the dead write endpoints.
- `matches.js`: check for an exact match first, and remove the loose substring match.
- Point `static.yml` at `public/`, and retire or repoint `api.yml`.
- Update the `.sln` to include the sync tool.

### Phase 2: Data pipeline (sync tool)
- Paginate standings and entrants.
- Deduplicate tournaments by `id`.
- Fetch `phases { phaseGroups }` and set `round`/`phaseGroup`.
- Create player slugs once in the sync tool, and deduplicate players.
- Optionally split `brackets.json` into a small index plus one file per event. This also fixes #9.

### Phase 3: Frontend consolidation
- One shared helper script for paths, HTML escaping, event lookup and data loading.
- A single nav loader.
- Remove the duplicate and broken script includes, and escape all inserted names.

### Phase 4: Features
- Real pools and top-cut brackets, using the Phase 2 data.
- A working rankings page.
- Per-event info and prize data from start.gg instead of hardcoded text.

### Phase 5: Admin and cleanup
- Decide whether to rebuild or retire the admin tools.
- Remove the leftover files.
- Write a proper README covering how to run the sync tool and deploy.

---

## 7. Open decisions

1. **Git:** OK to install Git for Windows on this server? Should the first commit go on `feat/site` with the PSDs excluded?
2. **Hosting:** is the live target GitHub Pages (`dqretro.github.io/tekkenball-brackets`) or this Windows server via `server.js`?
3. **Admin tools:** rebuild them against the real data, or retire them?
4. **Keys:** who rotates the start.gg and YouTube keys?
