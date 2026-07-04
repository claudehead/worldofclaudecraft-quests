// Emits docs/zone3d.json — a full 3D world per zone (entire terrain + all NPCs,
// mob camps, roads, lakes, place names, foliage) so you can see a whole zone at
// once. Same world shape as quest3d.json (minus the quest path/hero).
import { MOBS } from '../woc/src/sim/data.ts';
import { ZONE1_NPCS, ZONE1_CAMPS, ZONE1_ROADS, ZONE1_ZONE } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_NPCS, ZONE2_CAMPS, ZONE2_ROADS, ZONE2_ZONE } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_NPCS, ZONE3_CAMPS, ZONE3_ROADS, ZONE3_ZONE } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_NPCS, TEMPLE_CAMPS } from '../woc/src/sim/content/temple.ts';
import { OVERWORLD_GRAVEYARDS } from '../woc/src/sim/content/graveyards.ts';
import * as mf from '../woc/src/render/characters/manifest.ts';
import { terrainHeight } from '../woc/src/sim/world.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/zone3d.json';
const SEED = 20061;
const itemName = (id: string) => (MOBS as any)[id]?.name || id;
function modelFor(kind: 'npc' | 'mob', id: string) {
  try { const def: any = (mf.VISUALS as any)[mf.visualKeyFor({ kind, templateId: id } as any)]; if (!def) return null;
    let tint: number | null = typeof def.tint === 'number' ? def.tint : (def.tint === 'entity' && typeof (MOBS as any)[id]?.color === 'number' ? (MOBS as any)[id].color : null);
    return { glb: def.url, height: def.height ?? 2, tint: tint == null ? null : '#' + (tint >>> 0).toString(16).padStart(6, '0').slice(-6), tintStrength: def.tintStrength ?? 0 };
  } catch { return null; }
}
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed: number) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
function foliageH(url: string, rnd: () => number): number {
  if (/oak|tree/.test(url)) return 6 + rnd() * 3; if (/dead_/.test(url)) return 4 + rnd() * 2;
  if (/rock_tall/.test(url)) return 2.5 + rnd() * 1.4; if (/rock_large|ore_rocks|\/rocks/.test(url)) return 1.6 + rnd() * 1.1;
  if (/bush/.test(url)) return 1.3 + rnd() * 0.7; if (/fern/.test(url)) return 1 + rnd() * 0.5; if (/mushroom/.test(url)) return 0.5 + rnd() * 0.4; return 1.5;
}

const ZONES = [
  { dir: '01-eastbrook-vale', Z: ZONE1_ZONE, npcs: ZONE1_NPCS, camps: ZONE1_CAMPS, roads: ZONE1_ROADS, biome: 0x3f5a33, foliage: ['oak_1', 'oak_2', 'bush', 'bush_flowers', 'fern', 'mushroom'] },
  { dir: '02-mirefen-marsh', Z: ZONE2_ZONE, npcs: ZONE2_NPCS, camps: ZONE2_CAMPS, roads: ZONE2_ROADS, biome: 0x35463a, foliage: ['dead_1', 'dead_2', 'fern', 'mushroom', 'bush'] },
  { dir: '03-thornpeak-heights', Z: ZONE3_ZONE, npcs: ZONE3_NPCS, camps: ZONE3_CAMPS, roads: ZONE3_ROADS, biome: 0x52483a, foliage: ['dead_1', 'dead_3', 'bush', 'fern'] },
  { dir: '04-the-drowned-temple', Z: null, npcs: TEMPLE_NPCS, camps: TEMPLE_CAMPS, roads: [], biome: 0x27424c, foliage: ['fern', 'mushroom', 'dead_2'] },
] as any[];
const ROCKS = ['models/props/rock_large_d.glb', 'models/props/rock_tall_a.glb', 'models/props/rock_tall_h.glb', 'models/resources/wood_log_a.glb'];

const out: Record<string, any> = {};
for (const z of ZONES) {
  const npcsAll = Object.values(z.npcs) as any[];
  const lakes = (z.Z?.lakes || []) as any[]; const pois = (z.Z?.pois || []) as any[];
  // bounds: span all content, clamp to sane width; z from zone band
  const xsAll = [...npcsAll.map((n) => n.pos.x), ...z.camps.map((c: any) => c.center.x), ...pois.map((p: any) => p.x), ...lakes.map((l: any) => l.x)];
  const zsAll = [...npcsAll.map((n) => n.pos.z), ...z.camps.map((c: any) => c.center.z), ...pois.map((p: any) => p.z)];
  const x0 = Math.min(...xsAll) - 45, x1 = Math.max(...xsAll) + 45;
  const z0 = z.Z ? z.Z.zMin : Math.min(...zsAll) - 30, z1 = z.Z ? z.Z.zMax : Math.max(...zsAll) + 30;
  const bounds = { x0, x1, z0, z1 };
  const inB = (p: any) => p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1;
  const npcs = npcsAll.filter((n) => inB(n.pos)).map((n) => ({ name: n.name, x: n.pos.x, z: n.pos.z, model: modelFor('npc', n.id) })).filter((n) => n.model);
  const camps = (z.camps as any[]).filter((c) => inB(c.center)).map((c) => ({ x: c.center.x, z: c.center.z, r: c.radius || 8, count: Math.min(c.count || 3, 4), model: modelFor('mob', c.mobId), name: itemName(c.mobId) })).filter((c) => c.model);
  const roads = (z.roads as any[]).map((r) => r.map((p: any) => ({ x: p.x, z: p.z })));
  const places: any[] = [];
  for (const p of pois) places.push({ name: p.label, x: p.x, z: p.z });
  if (z.Z?.hub && !places.some((pl) => pl.name === z.Z.hub.name)) places.push({ name: z.Z.hub.name, x: z.Z.hub.x, z: z.Z.hub.z });
  if (z.Z?.graveyard) places.push({ name: 'Graveyard', x: z.Z.graveyard.x, z: z.Z.graveyard.z });
  // foliage scatter
  const rnd = rng(hash(z.dir)); const foliage: any[] = [];
  const area = (x1 - x0) * (z1 - z0); const target = Math.min(340, Math.round(area / 850));
  for (let i = 0; i < target * 3 && foliage.length < target; i++) {
    const x = x0 + rnd() * (x1 - x0), zz = z0 + rnd() * (z1 - z0);
    if (lakes.some((l) => Math.hypot(l.x - x, l.z - zz) < l.radius + 3)) continue;
    const rock = rnd() < 0.2; const url = rock ? ROCKS[Math.floor(rnd() * ROCKS.length)] : `models/foliage/${z.foliage[Math.floor(rnd() * z.foliage.length)]}.glb`;
    foliage.push({ x: Math.round(x), z: Math.round(zz), url, h: +foliageH(url, rnd).toFixed(2) });
  }
  // decor at camps + hub
  const decor: any[] = [];
  for (const c of camps) { decor.push({ x: c.x, z: c.z, url: 'models/props/bonfire.glb', h: 1.4, rotY: 0 }); if (rnd() < 0.5) decor.push({ x: c.x + 5, z: c.z + 4, url: 'models/props/tent_small.glb', h: 2.6, rotY: rnd() * 6.28 }); }
  if (z.Z?.hub) { const h = z.Z.hub; decor.push({ x: h.x + 7, z: h.z + 4, url: 'models/props/market_stand_1.glb', h: 2.8, rotY: 1 }); decor.push({ x: h.x - 6, z: h.z + 5, url: 'models/props/cart.glb', h: 1.8, rotY: 2 }); decor.push({ x: h.x + 3, z: h.z - 7, url: 'models/props/well.glb', h: 2.6, rotY: 0 }); }
  // v0.20 graveyards (Spirit Healer waits at each) — a cluster of headstones + a label
  for (const gy of OVERWORLD_GRAVEYARDS) if (inB(gy)) {
    places.push({ name: '⚰ ' + gy.name, x: gy.x, z: gy.z });
    decor.push({ x: gy.x, z: gy.z, url: 'models/props/gravestone_bevel.glb', h: 1.1, rotY: 0.3 });
    decor.push({ x: gy.x + 3, z: gy.z + 2, url: 'models/dungeon/gravestone.glb', h: 1.0, rotY: 1.4 });
    decor.push({ x: gy.x - 3, z: gy.z + 3, url: 'models/dungeon/gravemarker_A.glb', h: 0.9, rotY: 2.6 });
    decor.push({ x: gy.x + 2, z: gy.z - 3, url: 'models/dungeon/grave_a.glb', h: 0.6, rotY: 4.1 });
  }
  // terrain grid
  const RES = 80, gx = (x1 - x0) / (RES - 1), gz = (z1 - z0) / (RES - 1), heights: number[] = [];
  for (let i = 0; i < RES; i++) for (let j = 0; j < RES; j++) heights.push(+terrainHeight(x0 + j * gx, z0 + i * gz, SEED).toFixed(2));
  out[z.dir] = { name: z.Z?.name || (z.dir === '04-the-drowned-temple' ? 'The Drowned Temple' : z.dir), biome: '#' + z.biome.toString(16).padStart(6, '0'), bounds, terrain: { res: RES, x0, z0, x1, z1, heights }, npcs, camps, roads, lakes: lakes.map((l: any) => ({ x: l.x, z: l.z, r: l.radius })), places, foliage, decor };
}

// ---- combined "Whole World" entry: all zones stitched into one 3D scene ----
{
  const zs = Object.values(out) as any[];
  const wb = {
    x0: Math.min(...zs.map((z) => z.bounds.x0)), x1: Math.max(...zs.map((z) => z.bounds.x1)),
    z0: Math.min(...zs.map((z) => z.bounds.z0)), z1: Math.max(...zs.map((z) => z.bounds.z1)),
  };
  const merge = (k: string) => zs.flatMap((z) => z[k] || []);
  // cap mob count per camp + subsample foliage so the full world stays performant
  const camps = merge('camps').map((c: any) => ({ ...c, count: Math.min(c.count || 2, 2) }));
  let foliage = merge('foliage'); const FCAP = 380;
  if (foliage.length > FCAP) { const step = foliage.length / FCAP; foliage = Array.from({ length: FCAP }, (_, i) => foliage[Math.floor(i * step)]); }
  const RES = 120, gx = (wb.x1 - wb.x0) / (RES - 1), gz = (wb.z1 - wb.z0) / (RES - 1), heights: number[] = [];
  for (let i = 0; i < RES; i++) for (let j = 0; j < RES; j++) heights.push(+terrainHeight(wb.x0 + j * gx, wb.z0 + i * gz, SEED).toFixed(2));
  out['00-world'] = {
    name: 'Whole World', biome: '#3a4f30', bounds: wb,
    terrain: { res: RES, x0: wb.x0, z0: wb.z0, x1: wb.x1, z1: wb.z1, heights },
    npcs: merge('npcs'), camps, roads: merge('roads'), lakes: merge('lakes'), places: merge('places'), foliage, decor: merge('decor'),
  };
}
// world entry stays LAST so #/zone3d still defaults to a light single zone
fs.writeFileSync(OUT, JSON.stringify({ modelRepo: 'levy-street/world-of-claudecraft', modelRef: 'main', zones: out }));
console.log(`wrote zone3d.json (${Object.keys(out).length} entries incl. Whole World)`);
