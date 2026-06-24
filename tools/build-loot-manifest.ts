import { MOBS } from '../woc/src/sim/data.ts';
import { ZONE1_CAMPS, ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_CAMPS, ZONE2_QUESTS } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_CAMPS, ZONE3_QUESTS } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_CAMPS, TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import * as fs from 'node:fs';

const ALL: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };
const TD = new Set(['nythraxis_crypt', 'nythraxis_boss_arena']);
const zones: any[] = [
  [ZONE1_CAMPS, ZONE1_QUESTS, [-180, 180]],
  [ZONE2_CAMPS, ZONE2_QUESTS, [180, 540]],
  [ZONE3_CAMPS, ZONE3_QUESTS, [540, 900]],
  [TEMPLE_CAMPS, TEMPLE_QUESTS, null],
];
const mobIds = new Set<string>();
for (const [camps, quests, band] of zones) {
  for (const c of camps) mobIds.add(c.mobId);
  for (const q of Object.values(quests) as any[]) for (const o of q.objectives || []) if (o.type === 'kill' && o.targetMobId) mobIds.add(o.targetMobId);
  for (const [id, d] of Object.entries(DUNGEON_DEFS) as any[]) {
    const inZ = band ? (!TD.has(id) && d.doorPos.z >= band[0] && d.doorPos.z < band[1]) : TD.has(id);
    if (inZ) for (const s of d.spawns || []) mobIds.add(s.mobId);
  }
}
const items = new Set<string>();
for (const id of mobIds) {
  const m = ALL[id];
  if (!m || m.petRole) continue;
  for (const l of m.loot || []) if (l.itemId) items.add(l.itemId);
}
// also include every quest reward item (so reward icons render too)
for (const [, quests] of zones) {
  for (const q of Object.values(quests) as any[]) {
    for (const it of Object.values(q.itemRewards || {})) items.add(it as string);
    for (const it of q.requiredItems || []) items.add(it);
  }
}
fs.writeFileSync(process.argv[2] || 'loot-items.json', JSON.stringify([...items].sort(), null, 0));
console.log(`wrote ${items.size} loot item ids`);
