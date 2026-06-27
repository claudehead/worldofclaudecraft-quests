// Emits docs/dungeon3d.json — walkable 3D geometry, interior props, and per-spawn
// model refs for each dungeon, from the real interior layouts + DungeonDefs.
import { MOBS } from '../woc/src/sim/data.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import { COLLAPSED_RELIQUARY_DELVE, DELVE_MOBS } from '../woc/src/sim/content/delves/index.ts';
import {
  DUNGEON_WALL_X, DUNGEON_WALL_HEIGHT, DUNGEON_WALK_HALF_X, DUNGEON_END_WALL_HW,
  PILLAR_COLLIDER_R, TOMB_HW, TOMB_HD,
  CRYPT_LAYOUT, SANCTUM_LAYOUT, NYTHRAXIS_LAYOUT, TEMPLE_LAYOUT,
} from '../woc/src/sim/dungeon_layout.ts';
import * as mf from '../woc/src/render/characters/manifest.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/dungeon3d.json';
const ALL: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS, ...DELVE_MOBS };
const LAYOUTS: Record<string, any> = { crypt: CRYPT_LAYOUT, sanctum: SANCTUM_LAYOUT, nythraxis: NYTHRAXIS_LAYOUT, temple: TEMPLE_LAYOUT };

function modelFor(id: string, mob: any) {
  try {
    const key = mf.visualKeyFor({ kind: 'mob', templateId: id } as any);
    const def: any = (mf.VISUALS as any)[key];
    if (!def) return null;
    let tint: number | null = null;
    if (typeof def.tint === 'number') tint = def.tint;
    else if (def.tint === 'entity') tint = typeof mob.color === 'number' ? mob.color : null;
    const tintHex = tint == null ? null : '#' + (tint >>> 0).toString(16).padStart(6, '0').slice(-6);
    return { glb: def.url, height: def.height ?? 2.2, tint: tintHex, tintStrength: def.tintStrength ?? 0 };
  } catch { return null; }
}

const dungeons: any[] = [];
for (const [id, d] of Object.entries(DUNGEON_DEFS) as [string, any][]) {
  const lay = LAYOUTS[d.interior] || CRYPT_LAYOUT;
  const spawns = (d.spawns || []).map((s: any) => {
    const mid = s.mobId || s.template;
    const m = ALL[mid] || {};
    const rank = m.boss ? 'boss' : m.elite ? 'elite' : m.rare ? 'rare' : 'normal';
    return { id: mid, name: m.name || mid, x: s.x, z: s.z, rank, scale: m.scale || 1, model: modelFor(mid, m) };
  });
  const z0 = lay.zMin, z1 = lay.zMax;
  const pxMax = Math.max(0, ...(lay.pillars || []).map((p: any) => Math.abs(p.x)), ...spawns.map((s: any) => Math.abs(s.x)));
  const halfX = Math.max(lay.floorHalfX ?? lay.wallX ?? DUNGEON_WALK_HALF_X, pxMax + 4);
  const wallX = lay.wallX ?? DUNGEON_WALL_X;
  const inRange = (p: any) => p.z >= z0 - 2 && p.z <= z1 + 2;
  dungeons.push({
    id, name: d.name, interior: d.interior, players: d.suggestedPlayers,
    floor: { x0: -halfX, x1: halfX, z0, z1 },
    wall: { x: Math.max(wallX, halfX + 1), height: DUNGEON_WALL_HEIGHT, endHW: lay.endWallHw ?? DUNGEON_END_WALL_HW },
    entry: d.entry || { x: 0, z: 0 },
    exit: { x: (d.entry?.x ?? 0) + (d.exitOffset?.x ?? 0), z: (d.entry?.z ?? 0) + (d.exitOffset?.z ?? 0) },
    props: {
      pillars: (lay.pillars || []).filter(inRange).map((p: any) => ({ x: p.x, z: p.z })),
      tombs: (lay.tombs || []).filter(inRange).map((p: any) => ({ x: p.x, z: p.z })),
      dais: lay.dais || null,
      pillarR: PILLAR_COLLIDER_R, tombHW: TOMB_HW, tombHD: TOMB_HD,
    },
    spawns,
    bosses: spawns.filter((s: any) => s.rank === 'boss').map((s: any) => s.name),
  });
}
dungeons.sort((a, b) => a.players - b.players || a.name.localeCompare(b.name));

const propModels = {
  pillar: 'models/dungeon/pillar.glb',
  tomb: 'models/dungeon/coffin_decorated.glb',
  torch: 'models/dungeon/torch_lit.glb',
  chest: 'models/dungeon/chest_gold.glb',
};
fs.writeFileSync(OUT, JSON.stringify({ count: dungeons.length, modelRepo: 'levy-street/world-of-claudecraft', modelRef: 'main', propModels, dungeons }));
const modeled = dungeons.reduce((s, d) => s + d.spawns.filter((x: any) => x.model).length, 0);
console.log(`wrote dungeon3d.json (${dungeons.length} dungeons, ${modeled} modeled spawns) to ${OUT}`);
