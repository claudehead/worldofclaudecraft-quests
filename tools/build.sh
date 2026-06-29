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

echo "==> 3D quest world slices"
$TSX $TOOLS/generate-quest3d.ts docs/quest3d.json

echo "==> 3D whole-zone worlds"
$TSX $TOOLS/generate-zone3d.ts docs/zone3d.json

echo "==> farming calculator"
$TSX $TOOLS/generate-farming.ts docs/farming.json

echo "==> drop locator + quest chains"
$TSX $TOOLS/generate-drops.ts docs/drops.json
$TSX $TOOLS/generate-questchains.ts docs/questchains.json

echo "==> class stats + mob stats (calculators)"
$TSX $TOOLS/generate-classstats.ts docs/classstats.json
$TSX $TOOLS/generate-mobstats.ts docs/mobstats.json
$TSX $TOOLS/generate-bosses.ts docs/bosses.json

echo "==> bestiary"
$TSX $TOOLS/generate-bestiary.ts quests

echo "==> bestiary cards (json)"
$TSX $TOOLS/generate-bestiary-json.ts bestiary/bestiary.json

echo "==> mob portraits (real .glb renders)"
$TSX $TOOLS/build-mob-manifest.ts $TOOLS/mobs.json
node $TOOLS/render-mobs.mjs $TOOLS/mobs.json $WOC/public quests/zones/_mob-renders

echo "==> loot icons (game icon code)"
$TSX $TOOLS/build-loot-manifest.ts $TOOLS/loot-items.json
node $TOOLS/render-loot.mjs $TOOLS/loot-items.json $WOC/public quests/zones/_loot-icons

echo "==> dungeon maps + pages"
$TSX $TOOLS/generate-dungeon-maps.ts dungeons/_maps
$TSX $TOOLS/generate-dungeons.ts dungeons

echo "==> raids & dungeons guide"
$TSX $TOOLS/generate-raids-dungeons.ts reference/raids-and-dungeons.md

echo "==> walkable 3D dungeon geometry"
$TSX $TOOLS/generate-dungeon3d.ts docs/dungeon3d.json

echo "==> lockpicking + delve companions guides"
$TSX $TOOLS/generate-lockpicking.ts reference/lockpicking.md
$TSX $TOOLS/generate-companions.ts reference/companions.md

echo "==> endgame & prestige guide"
$TSX $TOOLS/generate-endgame.ts reference/endgame.md

echo "==> class portraits + pages"
$TSX $TOOLS/build-class-manifest.ts $TOOLS/class-models.json
node $TOOLS/render-mobs.mjs $TOOLS/class-models.json $WOC/public classes/_class-renders
$TSX $TOOLS/generate-classes.ts classes

echo "==> delves + shop icons"
$TSX $TOOLS/generate-delves.ts delves
node $TOOLS/render-loot.mjs delves/_shop-items.json $WOC/public delves/_delve-icons
rm -f delves/_shop-items.json

echo "==> NPCs + portraits"
$TSX $TOOLS/generate-npcs.ts npcs/npcs.json
node $TOOLS/render-mobs.mjs npcs/npc-models.json $WOC/public npcs/_renders
rm -f npcs/npc-models.json

echo "==> gear catalog + icons"
$TSX $TOOLS/generate-gear.ts gear/gear.json
node $TOOLS/render-loot.mjs gear/gear-icons.json $WOC/public gear/_icons
rm -f gear/gear-icons.json

echo "==> consumables catalog + icons"
$TSX $TOOLS/generate-consumables.ts consumables/consumables.json
node $TOOLS/render-loot.mjs consumables/consumable-icons.json $WOC/public consumables/_icons
rm -f consumables/consumable-icons.json

echo "==> best-in-slot (reuses gear icons)"
$TSX $TOOLS/generate-bis.ts gear/bis.json

echo "==> item sets (v0.16)"
$TSX $TOOLS/generate-itemsets.ts docs/itemsets.json

echo "==> world map data"
$TSX $TOOLS/generate-worldmap.ts docs/world-map.json

echo "==> quest voice-over manifest"
$TSX $TOOLS/generate-voice-manifest.ts $WOC/public/audio/voice docs/voice.json

echo "==> talents + icons"
$TSX $TOOLS/generate-talents.ts docs/talents.json
node $TOOLS/render-game-icons.mjs docs/talent-icon-ids.json talent $WOC/public docs/talent-icons
rm -f docs/talent-icon-ids.json

echo "==> abilities + icons"
$TSX $TOOLS/generate-abilities.ts abilities/abilities.json
node $TOOLS/render-game-icons.mjs abilities/ability-icon-ids.json ability $WOC/public abilities/_icons
rm -f abilities/ability-icon-ids.json

echo "==> augments, combat reference, cosmetics (+ mech chroma renders)"
$TSX $TOOLS/generate-augments.ts augments/augments.json
$TSX $TOOLS/generate-combat-doc.ts reference/combat.md
$TSX $TOOLS/generate-cosmetics.ts cosmetics/cosmetics.json
node $TOOLS/render-mech.mjs cosmetics/chroma-renders.json $WOC/public cosmetics/_renders
rm -f cosmetics/chroma-renders.json

echo "==> translations (game locale files)"
$TSX $TOOLS/generate-i18n.ts docs/i18n

echo "==> website manifest"
$TSX $TOOLS/generate-site-manifest.ts docs/manifest.json

echo "==> search index"
$TSX $TOOLS/generate-search-index.ts docs/search.json

echo "==> getting-started guide"
WOC_DIR=$WOC $TSX $TOOLS/generate-getting-started.ts reference/getting-started.md

echo "==> 3D asset manifest"
$TSX $TOOLS/generate-assets.ts $WOC docs/assets.json

echo "==> materials / quest items / drops"
$TSX $TOOLS/generate-materials.ts reference/materials.md

echo "==> world market (economy)"
$TSX $TOOLS/generate-economy.ts reference/world-market.md $WOC

echo "==> agent skill packs (per class)"
$TSX $TOOLS/generate-agent-skill.ts agent/skills

echo "==> fishing, PvP, tameable beasts, warlock demons (+ renders)"
$TSX $TOOLS/generate-fishing.ts reference/fishing.md
$TSX $TOOLS/generate-pvp.ts reference/pvp.md
$TSX $TOOLS/generate-tameable.ts reference/tameable-beasts.md
$TSX $TOOLS/generate-warlock-demons.ts reference/warlock-demons.md
node $TOOLS/render-mobs.mjs reference/demon-models.json $WOC/public reference/_demon-renders
rm -f reference/demon-models.json

echo "==> patch notes (upstream releases)"
node $TOOLS/generate-patch-notes.mjs docs/patches.json

echo "==> sneak peek (upstream branches)"
node $TOOLS/generate-sneak-peek.mjs reference/sneak-peek.md || echo "  (skipped: GitHub API unavailable)"

echo "==> done"
