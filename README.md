# World of Claudecraft — Field Guide

A complete companion for [World of Claudecraft](https://github.com/levy-street/world-of-claudecraft) — quests, creatures, gear, classes, talents, dungeons, delves and more, all **extracted straight from the game's own data** so every level, stat, drop, and location is exact. Nothing is hand-written or guessed; the whole thing **regenerates automatically** when the game updates.

**77 quests · 4 zones · 60+ creatures · 214 gear items · 9 classes · levels 1–20.**

## 🌐 The website

A browsable single-page app lives in [`docs/`](docs/) and is served via GitHub Pages:

### **https://claudehead.github.io/worldofclaudecraft-quests/**

It renders **entirely from this repo** — it loads small generated data files for navigation and pulls the markdown, maps, renders, and icons live from `raw.githubusercontent.com`, so it always matches the data here.

**Tabs**

| | |
|---|---|
| 🚀 **Start here** | New-player guide: controls, questing, grouping, trading, chat, lag fixes |
| 🗺️ **Quests** | All 77 by level/zone, each with a "where to go" route map |
| 🧭 **Leveling route** | The fastest 1→20 path, zone by zone |
| 🗺️ **World map** | Pan/zoom every zone with clickable, labellable markers |
| 🐺 **Bestiary** | Every mob: model render, stats, kill tactics, full loot table |
| 🧑‍🌾 **NPCs** | Quest-givers & vendors — location, quests offered, stock |
| 🛡️ **Gear** | All 214 items — rarity, stats, and where to get them |
| ✨ **Best in Slot** | Best gear per class, **by zone** |
| 🍖 **Consumables** | Food, drink, potions, elixirs |
| ⚔️ **Classes** | Specs, abilities by learn-level, model portraits |
| 📖 **Abilities** | Searchable spellbook with real icons + ranks |
| 🌳 **Talents** | Interactive calculator with shareable/saved builds |
| 🧮 **Combat maths** | The real damage/armor/HP/XP formulas |
| 🏰 **Dungeons** | Route maps, rosters, bosses |
| 🔮 **Delves** | Tiers, affixes, companion, Marks vendor, lockpicking |
| 💠 **Augments** | Class augments + world power-ups |
| 🎨 **Cosmetics** | Event skins + rendered Combat Mech chromas |
| 📜 **Patch notes** | Official release notes for every game version |

Plus **global search** (press `/`), **13 languages** (the game's own translations), **light/dark** toggle, a **mobile menu**, and it's an **installable, offline-capable PWA**.

## Reading the repo directly

Everything on the site is generated markdown + data you can also browse on GitHub:

```
quests/        77 quest pages by zone + by-level index; per-quest route maps
  zones/<zone>/bestiary.md   mobs with renders, stats, tactics, loot
classes/       per-class pages + model portraits
dungeons/      per-dungeon pages + route maps
delves/        the Collapsed Reliquary delve guide
npcs/          NPC catalog (npcs.json + portraits)
gear/          gear.json + bis.json + item icons
consumables/   consumables.json + icons
reference/     combat.md, getting-started.md
cosmetics/     cosmetics.json + mech chroma renders
characters/    per-character progress template (copy + tick off)
docs/          the website (app + generated data: manifest, search, i18n, …)
tools/         the generators + the regeneration pipeline
```

## What the data captures

- **Quests** — recommended level, chain (prereqs/follow-ups), giver & turn-in NPCs with coordinates, every objective resolved to real mob/item names + where to find them, drop chances, per-class rewards, and the in-game story.
- **Mobs** — health, armor (with physical mitigation %), melee damage/DPS, a full loot table, and the best way to kill it (tactics derived from the mob's actual abilities), with a **portrait rendered from the game's real 3D model**.
- **Items** — rarity, stats, weapon DPS, and where to get them, each with its **real in-game icon** (the game's own icon code; weapon art rasterized from game assets).
- **Stats & formulas** — computed from the game's real combat math (armor curve, elite ×2.3 HP/×1.5 dmg, HP-from-stamina, XP table).

> Coordinates are the game's world `(x, z)` positions — a rough compass; zones run north (low `z`) to south (high `z`).

## How it's built — and kept current

Nearly everything is **generated from the upstream game data**; only this `README.md` and [`tools/README.md`](tools/README.md) are hand-written.

A GitHub Action ([`.github/workflows/update.yml`](.github/workflows/update.yml)) keeps it in sync:

- **Checks upstream every 30 minutes** (and on demand). It compares the game's `HEAD` to [`.upstream-sha`](.upstream-sha); if nothing changed, the run ends in seconds.
- When the game **has** changed, it clones it, installs the generator deps + headless Chromium, runs [`tools/build.sh`](tools/build.sh), and commits the regenerated guide. Idempotent — it only ever commits a real diff.

### Regenerate locally

```sh
git clone https://github.com/levy-street/world-of-claudecraft woc   # upstream source, next to this repo
cd tools && npm install && npx playwright install chromium && cd ..
bash tools/build.sh
```

_Not affiliated with the upstream project — this is a fan-made reference._
