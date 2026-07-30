// Which zone bestiary each mob appears in (camps + quest kill targets +
// dungeon spawns per zone; the endgame temple bucket owns the Nythraxis
// instances). Used to link an item's drop source to the mob's bestiary entry.
import { DUNGEON_DEFS } from '../woc/src/sim/content/dungeons.ts';
import { GUIDE_ZONES, zoneForDungeon } from './zones.ts';

export function bestiaryDirByMob(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const z of GUIDE_ZONES) {
    const add = (id: string) => { if (id && !(id in map)) map[id] = z.dir; };
    for (const c of z.camps) add(c.mobId);
    for (const q of Object.values(z.quests) as any[]) for (const o of q.objectives || []) if (o.type === 'kill' && o.targetMobId) add(o.targetMobId);
    for (const [id, d] of Object.entries(DUNGEON_DEFS) as any[]) {
      if (zoneForDungeon(id, d.doorPos)?.key === z.key) for (const s of d.spawns || []) add(s.mobId);
    }
  }
  return map;
}
