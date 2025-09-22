# DQRetro's Tekkenball-Brackets

[![Build & Publish API](https://github.com/dqretro/tekkenball-brackets/actions/workflows/api.yml/badge.svg)](https://github.com/dqretro/tekkenball-brackets/actions/workflows/api.yml)
[![Deploy static content to Pages](https://github.com/dqretro/tekkenball-brackets/actions/workflows/static.yml/badge.svg?branch=main)](https://github.com/dqretro/tekkenball-brackets/actions/workflows/static.yml)
[![pages-build-deployment](https://github.com/dqretro/tekkenball-brackets/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/dqretro/tekkenball-brackets/actions/workflows/pages/pages-build-deployment)

🌐 Live site: https://dqretro.github.io/tekkenball-brackets/

---

## 📌 Features & Pages
This project provides a full front-end for **Tekken Ball tournaments, statistics, and media**.  

- **Tournaments** – brackets, matches, standings, players and event overviews.  
- **Global Statistics** – most used characters, leaderboards, and resettable filters.  
- **Leaderboards** – sortable results across all tracked events.  
- **Player Profiles** – track individual performance and match history.  
- **Video Gallery** – curated YouTube videos dynamically loaded from Harry’s database.  
- **Updates & Integration** – API-driven content with seamless navigation and UI consistency.  

---

## 🏟️ start.gg API Integration
A big part of the tournament data is powered by **start.gg API integration** (implemented by Harry).  

- Pulls live tournament data directly from **start.gg**.  
- Provides details for **events, brackets, players, standings, and matches**.  
- Keeps the tournament pages synced with official start.gg records.  
- Ensures accuracy and automation for DQRetro’s Tekken Ball tournament coverage.  

---

## 🎥 Video Gallery Integration
The **Gallery** page now directly integrates with [Harry’s Tournament Tracker API](https://therollingbuffoons.zapto.org/tournamenttracker/videos).  

- API supports direct requests (no more CORS proxy).  
- `gallery.js` fetches videos directly from Harry’s database.  
- Videos are dynamically filtered by **year** and displayed with thumbnails linking to YouTube.  
- Fully synced with Harry’s curated database of DQRetro content.  

---

## 👥 Contributors
- **Sky Williamson** – [GitHub Profile](https://github.com/SlawSimulation)  
- **Harry Mather** – [GitHub Profile](https://github.com/HarryCMather)  
