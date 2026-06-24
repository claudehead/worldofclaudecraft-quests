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
- **generate-bestiary.ts** — a `bestiary.md` per zone: each mob's HP/armor/damage (computed from the game's real formulas across its spawn-level range), kill tactics derived from its abilities, and the rendered model portrait.

## Mob portraits (rendered from the real .glb models)

The portraits in `quests/zones/_mob-renders/*.png` are screenshots of the game's
actual 3D models — not drawings. Two steps:

```sh
# 1. Resolve every fightable mob to its real model + tint (via the game's
#    visualKeyFor mapping) and emit a manifest.
npx tsx build-mob-manifest.ts mobs.json

# 2. Render each model headlessly and screenshot it.
#    Needs: npm i three playwright && npx playwright install chromium
node render-mobs.mjs mobs.json <woc>/public ../quests/zones/_mob-renders
```

`render-mobs.mjs` serves the GLBs + a three.js harness (`harness.html`) over a
local HTTP server and drives headless Chromium. Notes baked in from getting it
working on Windows/SwiftShader:

- GLBs are **meshopt-compressed** → the harness wires up `MeshoptDecoder`.
- Headless SwiftShader **can't rasterise `MeshStandardMaterial` (PBR)** → the
  harness swaps each material to `MeshLambertMaterial`, preserving color/texture
  and the mob's in-game tint, so the models still render lit.
- Skinned meshes are posed one frame into an idle clip so humanoids aren't
  T-posed.

Run this step **after** generate-quests.ts (which wipes `quests/`).
