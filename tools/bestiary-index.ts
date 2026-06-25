// Which zone bestiary each mob appears in (camps + quest kill targets +
// dungeon spawns per zone band; temple dungeons -> temple). Used to link an
// item's drop source to the mob's bestiary entry.
import { ZONE1_CAMPS, ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_CAMPS, ZONE2_QUESTS } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_CAMPS, ZONE3_QUESTS } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_CAMPS, TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import { DUNGEON_DEFS } from '../woc/src/sim/content/dungeons.ts';

const TEMPLE_DUNGEONS = new Set(['nythraxis_crypt', 'nythraxis_boss_arena']);

export function bestiaryDirByMob(): Record<string, string> {
  const map: Record<string, string> = {};
  const zones: any[] = [
    [ZONE1_CAMPS, ZONE1_QUESTS, [-180, 180], '01-eastbrook-vale'],
    [ZONE2_CAMPS, ZONE2_QUESTS, [180, 540], '02-mirefen-marsh'],
    [ZONE3_CAMPS, ZONE3_QUESTS, [540, 900], '03-thornpeak-heights'],
    [TEMPLE_CAMPS, TEMPLE_QUESTS, null, '04-the-drowned-temple'],
  ];
  for (const [camps, quests, band, dir] of zones) {
    const add = (id: string) => { if (id && !(id in map)) map[id] = dir; };
    for (const c of camps) add(c.mobId);
    for (const q of Object.values(quests) as any[]) for (const o of q.objectives || []) if (o.type === 'kill' && o.targetMobId) add(o.targetMobId);
    for (const [id, d] of Object.entries(DUNGEON_DEFS) as any[]) {
      const inZone = band ? (!TEMPLE_DUNGEONS.has(id) && d.doorPos.z >= band[0] && d.doorPos.z < band[1]) : TEMPLE_DUNGEONS.has(id);
      if (inZone) for (const s of d.spawns || []) add(s.mobId);
    }
  }
  return map;
}
