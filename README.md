# tekkenball-brackets

DQRetro tournament hub with brackets, standings, player profiles and stats for Tekken Ball and other retro fighting game events, built from [start.gg](https://start.gg) data.

**Live site:** https://dqretro.github.io/tekkenball-brackets/

## Repository layout

| Path | What it is |
|---|---|
| `src/DQRetro.TournamentTracker.Ui/public/` | The static website (HTML/CSS/JS). This folder is what gets published to GitHub Pages. |
| `src/DQRetro.TournamentTracker.Ui/public/data/` | Generated data: `brackets.json`, `players.json`. Hand-edited overrides go in `brackets-local.json`. |
| `src/DQRetro.TournamentTracker.Ui/server.js` | Small Express server for local preview. |
| `src/DQRetro.TournamentTracker.Startgg/` | .NET 8 console app that pulls tournament data from start.gg and writes the data files. |
| `.github/workflows/` | CI, data refresh and Pages deployment (see below). |

## Run the site locally

```bash
cd src/DQRetro.TournamentTracker.Ui
npm install
npm start            # http://localhost:3000
```

On Windows you can also double-click `start-admin.bat`. The server listens on `127.0.0.1` only. Set `HOST=0.0.0.0` to preview it from other devices on your network.

**Gallery videos (optional):** copy `public/pages/gallery/config.example.json` to `config.json` and add a YouTube key. `config.json` is gitignored. Without it, the gallery falls back to `gallery-videos.json`.

## Refresh the data (sync tool)

You need the .NET 8 SDK and a start.gg API key.

```bash
# one-time: store the key outside the repo
dotnet user-secrets set STARTGG_API_KEY "<your key>" --project src/DQRetro.TournamentTracker.Startgg

# fetch everything from start.gg and rewrite public/data/*.json
dotnet run --project src/DQRetro.TournamentTracker.Startgg
```

| Option | Effect |
|---|---|
| `--out <dir>` | Write the JSON somewhere else (useful for comparing against the current data). |
| `--from-file <brackets.json>` | Offline: rebuild `players.json`, deduplicate tournaments and add player slugs to an existing file. No key or network needed. |
| `--force` | Allow the tournament count to drop by more than 50%. |

Exit codes: `0` ok, `1` no key, `2` nothing fetched, `3` suspicious drop in tournaments, `4` key rejected, `5` unexpected error. The data files are only overwritten on success.

To add a tournament, add its slug to `TargetTournamentSlugs` in `Program.cs`. Anything matching "DQRetro" or "SRKade" on start.gg is picked up automatically.

## Secrets

Never commit keys. The same names are used locally and on GitHub. In the repo, go to Settings, then Secrets and variables, then Actions.

| Name | Used by | Local equivalent |
|---|---|---|
| `STARTGG_API_KEY` | `refresh-data.yml` (sync tool) | `dotnet user-secrets` (above) or an environment variable |
| `YOUTUBE_API_KEY` | `static.yml`, which writes the gallery `config.json` at deploy time | `public/pages/gallery/config.json` (gitignored) |

Restrict the YouTube key in Google Cloud to the HTTP referrers `https://dqretro.github.io/*` and `http://localhost:3000/*`, and to the YouTube Data API v3 only. It's a browser key, so visitors can see it.

## GitHub Actions

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Push to `main` / `feat/**`, PRs | Repo hygiene (no secrets, PSDs or build output committed), builds the sync tool plus an offline smoke test, validates the data files. |
| `refresh-data.yml` | Daily 05:17 UTC, or manually | Runs the sync tool with `STARTGG_API_KEY`, validates, commits only the two data files if they changed, then deploys. |
| `static.yml` | Push to `main`, manually, or called by the refresh | Validates the data and publishes `public/` to GitHub Pages. |

Scheduled runs and the "Run workflow" button only appear once a workflow file is on `main`.
