#!/usr/bin/env bash
# Regenerate the entire guide from the world-of-claudecraft source.
#
# Expects:
#   - the upstream game cloned at  <repo>/woc   (the tools import ../woc/src/...)
#   - deps installed in            <repo>/tools (npm ci) + Playwright Chromium
#
# Run from anywhere; it cd's to the repo root and writes in place.
set -euo pipefail

cd "$(dirname "$0")/.."          # repo root
TOOLS=tools
WOC=woc
TSX="node $TOOLS/node_modules/tsx/dist/cli.mjs"

[ -d "$WOC/src" ] || { echo "error: upstream source not found at ./$WOC (clone levy-street/world-of-claudecraft there)"; exit 1; }

echo "==> quests (wipes quests/)"
$TSX $TOOLS/generate-quests.ts quests

echo "==> zone maps"
$TSX $TOOLS/generate-maps.ts quests

echo "==> per-quest route maps"
$TSX $TOOLS/generate-quest-maps.ts quests

echo "==> bestiary"
$TSX $TOOLS/generate-bestiary.ts quests

echo "==> mob portraits (real .glb renders)"
$TSX $TOOLS/build-mob-manifest.ts $TOOLS/mobs.json
node $TOOLS/render-mobs.mjs $TOOLS/mobs.json $WOC/public quests/zones/_mob-renders

echo "==> loot icons (game icon code)"
$TSX $TOOLS/build-loot-manifest.ts $TOOLS/loot-items.json
node $TOOLS/render-loot.mjs $TOOLS/loot-items.json $WOC/public quests/zones/_loot-icons

echo "==> dungeon maps + pages"
$TSX $TOOLS/generate-dungeon-maps.ts dungeons/_maps
$TSX $TOOLS/generate-dungeons.ts dungeons

echo "==> class portraits + pages"
$TSX $TOOLS/build-class-manifest.ts $TOOLS/class-models.json
node $TOOLS/render-mobs.mjs $TOOLS/class-models.json $WOC/public classes/_class-renders
$TSX $TOOLS/generate-classes.ts classes

echo "==> delves + shop icons"
$TSX $TOOLS/generate-delves.ts delves
node $TOOLS/render-loot.mjs delves/_shop-items.json $WOC/public delves/_delve-icons
rm -f delves/_shop-items.json

echo "==> gear catalog + icons"
$TSX $TOOLS/generate-gear.ts gear/gear.json
node $TOOLS/render-loot.mjs gear/gear-icons.json $WOC/public gear/_icons
rm -f gear/gear-icons.json

echo "==> consumables catalog + icons"
$TSX $TOOLS/generate-consumables.ts consumables/consumables.json
node $TOOLS/render-loot.mjs consumables/consumable-icons.json $WOC/public consumables/_icons
rm -f consumables/consumable-icons.json

echo "==> website manifest"
$TSX $TOOLS/generate-site-manifest.ts docs/manifest.json

echo "==> done"
