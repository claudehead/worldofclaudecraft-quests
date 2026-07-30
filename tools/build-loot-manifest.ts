import { MOBS } from '../woc/src/sim/data.ts';
import { GUIDE_ZONES, zoneForDungeon } from './zones.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import * as fs from 'node:fs';

const ALL: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };
const zones = GUIDE_ZONES.map((z) => [z.camps, z.quests] as [any[], Record<string, any>]);
const mobIds = new Set<string>();
for (const z of GUIDE_ZONES) {
  for (const c of z.camps) mobIds.add(c.mobId);
  for (const q of Object.values(z.quests) as any[]) for (const o of q.objectives || []) if (o.type === 'kill' && o.targetMobId) mobIds.add(o.targetMobId);
  for (const [id, d] of Object.entries(DUNGEON_DEFS) as any[]) {
    if (zoneForDungeon(id, d.doorPos)?.key === z.key) for (const s of d.spawns || []) mobIds.add(s.mobId);
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
