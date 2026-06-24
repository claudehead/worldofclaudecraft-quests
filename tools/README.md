# Generators

These scripts regenerate everything under `../quests` from the upstream
[world-of-claudecraft](https://github.com/levy-street/world-of-claudecraft) game data.

## Setup

1. Clone the game next to a working copy and point the imports at it (the scripts
   currently expect it at `../woc/...` relative to where you run them — adjust the
   import paths at the top of each file).
2. `npm i tsx`

## Run order matters

`generate-quests.ts` **wipes** the `quests/` output dir before writing, so run it
first, then the two that add files into the zone folders:

```sh
npx tsx generate-quests.ts   ../quests   # quest pages, zone READMEs, by-level index, character template
npx tsx generate-maps.ts     ../quests   # zone map.svg files
npx tsx generate-bestiary.ts ../quests   # zone bestiary.md files
```

## What each emits

- **generate-quests.ts** — one page per quest (objectives resolved to mob/item names + locations, rewards, chain links), per-zone READMEs, `by-level.md`, and the `characters/_template.md` checklist.
- **generate-maps.ts** — an SVG map per zone (NPCs, mob camps, dungeons, pickups, water, roads).
- **generate-bestiary.ts** — a `bestiary.md` per zone: each mob's HP/armor/damage (computed from the game's real formulas across its spawn-level range) and kill tactics derived from its abilities.
