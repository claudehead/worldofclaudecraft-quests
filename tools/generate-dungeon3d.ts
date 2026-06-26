// Emits docs/dungeon3d.json — walkable 3D geometry + spawn markers for each
// dungeon, derived from the real interior layout constants + DungeonDefs.
import { MOBS } from '../woc/src/sim/data.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import { COLLAPSED_RELIQUARY_DELVE, DELVE_MOBS } from '../woc/src/sim/content/delves/index.ts';
import {
  DUNGEON_WALL_X, DUNGEON_WALL_HEIGHT, DUNGEON_WALK_HALF_X, DUNGEON_END_WALL_HW,
} from '../woc/src/sim/dungeon_layout.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/dungeon3d.json';
const ALL: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS, ...DELVE_MOBS };

function toHex(c: any): string {
  if (typeof c === 'string') return c.startsWith('#') ? c : `#${c}`;
  if (typeof c === 'number') return '#' + c.toString(16).padStart(6, '0');
  return '#9aa';
}

const dungeons: any[] = [];
for (const [id, d] of Object.entries(DUNGEON_DEFS) as [string, any][]) {
  const spawns = (d.spawns || []).map((s: any) => {
    const m = ALL[s.mobId || s.template] || {};
    const rank = m.boss ? 'boss' : m.elite ? 'elite' : m.rare ? 'rare' : 'normal';
    return { id: s.mobId || s.template, name: m.name || s.mobId, x: s.x, z: s.z, rank, color: toHex(m.color), scale: m.scale || 1 };
  });
  const zs = [d.entry?.z ?? 0, ...spawns.map((s: any) => s.z)];
  const z0 = Math.min(...zs) - 8;
  const z1 = Math.max(...zs) + 10;
  dungeons.push({
    id, name: d.name, interior: d.interior, players: d.suggestedPlayers,
    floor: { x0: -DUNGEON_WALK_HALF_X, x1: DUNGEON_WALK_HALF_X, z0, z1 },
    wall: { x: DUNGEON_WALL_X, height: DUNGEON_WALL_HEIGHT, endHW: DUNGEON_END_WALL_HW },
    entry: d.entry || { x: 0, z: 0 },
    exit: { x: (d.entry?.x ?? 0) + (d.exitOffset?.x ?? 0), z: (d.entry?.z ?? 0) + (d.exitOffset?.z ?? 0) },
    spawns,
    bosses: spawns.filter((s: any) => s.rank === 'boss').map((s: any) => s.name),
  });
}
dungeons.sort((a, b) => a.players - b.players || a.name.localeCompare(b.name));

fs.writeFileSync(OUT, JSON.stringify({ count: dungeons.length, dungeons }));
console.log(`wrote dungeon3d.json (${dungeons.length} dungeons) to ${OUT}`);
