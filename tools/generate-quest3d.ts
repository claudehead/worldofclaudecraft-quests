// Emits docs/quest3d.json — a 3D "world slice" per quest: the route steps (with
// models), nearby NPCs and mob camps (with models), lakes, roads, scattered
// foliage, and a character model — so the client can render a walkable in-game
// scene with a hero walking the quest path.
import { MOBS } from '../woc/src/sim/data.ts';
import { ZONE1_NPCS, ZONE1_CAMPS, ZONE1_OBJECTS, ZONE1_ROADS, ZONE1_ZONE, ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_NPCS, ZONE2_CAMPS, ZONE2_OBJECTS, ZONE2_ROADS, ZONE2_ZONE, ZONE2_QUESTS } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_NPCS, ZONE3_CAMPS, ZONE3_OBJECTS, ZONE3_ROADS, ZONE3_ZONE, ZONE3_QUESTS } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_NPCS, TEMPLE_CAMPS, TEMPLE_OBJECTS, TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import * as mf from '../woc/src/render/characters/manifest.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/quest3d.json';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const ZONES = [
  { dir: '01-eastbrook-vale', biome: 0x3f5a33, npcs: ZONE1_NPCS, camps: ZONE1_CAMPS, objects: ZONE1_OBJECTS, roads: ZONE1_ROADS, lakes: (ZONE1_ZONE as any).lakes || [], quests: ZONE1_QUESTS, foliage: ['oak_1', 'oak_2', 'bush', 'bush_flowers', 'fern', 'mushroom'] },
  { dir: '02-mirefen-marsh', biome: 0x35463a, npcs: ZONE2_NPCS, camps: ZONE2_CAMPS, objects: ZONE2_OBJECTS, roads: ZONE2_ROADS, lakes: (ZONE2_ZONE as any).lakes || [], quests: ZONE2_QUESTS, foliage: ['dead_1', 'dead_2', 'fern', 'mushroom', 'bush'] },
  { dir: '03-thornpeak-heights', biome: 0x52483a, npcs: ZONE3_NPCS, camps: ZONE3_CAMPS, objects: ZONE3_OBJECTS, roads: ZONE3_ROADS, lakes: (ZONE3_ZONE as any).lakes || [], quests: ZONE3_QUESTS, foliage: ['dead_1', 'dead_3', 'bush', 'fern'] },
  { dir: '04-the-drowned-temple', biome: 0x27424c, npcs: TEMPLE_NPCS, camps: TEMPLE_CAMPS, objects: TEMPLE_OBJECTS, roads: [], lakes: [], quests: TEMPLE_QUESTS, foliage: ['fern', 'mushroom', 'dead_2'] },
] as any[];

const itemName = (id: string) => (MOBS as any)[id]?.name || id;
function modelFor(kind: 'npc' | 'mob', id: string) {
  try {
    const def: any = (mf.VISUALS as any)[mf.visualKeyFor({ kind, templateId: id } as any)];
    if (!def) return null;
    let tint: number | null = typeof def.tint === 'number' ? def.tint : (def.tint === 'entity' && typeof (MOBS as any)[id]?.color === 'number' ? (MOBS as any)[id].color : null);
    return { glb: def.url, height: def.height ?? 2, tint: tint == null ? null : '#' + (tint >>> 0).toString(16).padStart(6, '0').slice(-6), tintStrength: def.tintStrength ?? 0 };
  } catch { return null; }
}
const campCentroid = (camps: any[], mobId: string) => { const cs = camps.filter((c) => c.mobId === mobId); if (!cs.length) return null; return { x: cs.reduce((s, c) => s + c.center.x, 0) / cs.length, z: cs.reduce((s, c) => s + c.center.z, 0) / cs.length }; };

// deterministic PRNG so foliage placement is stable per quest
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed: number) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

function resolveSteps(z: any, q: any) {
  const steps: any[] = [];
  const giver = z.npcs[q.giverNpcId];
  if (giver) steps.push({ kind: 'giver', label: `Start — ${giver.name}`, x: giver.pos.x, z: giver.pos.z, model: modelFor('npc', q.giverNpcId) });
  for (const o of q.objectives || []) {
    if (o.type === 'kill' && o.targetMobId) { const c = campCentroid(z.camps, o.targetMobId); if (c) steps.push({ kind: 'kill', label: `${o.count}× ${itemName(o.targetMobId)}`, x: c.x, z: c.z, model: modelFor('mob', o.targetMobId) }); }
    else if (o.type === 'collect') {
      const drops = Object.values(MOBS as any).filter((m: any) => (m.loot || []).some((l: any) => l.itemId === o.itemId)).map((m: any) => m.id);
      const c = drops.map((m) => campCentroid(z.camps, m)).find(Boolean) as any;
      if (c) steps.push({ kind: 'collect', label: `Collect ${o.itemId}`, x: c.x, z: c.z, model: drops[0] ? modelFor('mob', drops[0]) : null });
      else { const ob = (z.objects || []).find((ob: any) => ob.itemId === o.itemId); if (ob && ob.positions[0]) steps.push({ kind: 'collect', label: `Collect ${o.itemId}`, x: ob.positions[0].x, z: ob.positions[0].z, model: null }); }
    }
    else if (o.type === 'interact' && o.targetNpcId && z.npcs[o.targetNpcId]) { const n = z.npcs[o.targetNpcId]; steps.push({ kind: 'interact', label: o.label || n.name, x: n.pos.x, z: n.pos.z, model: modelFor('npc', o.targetNpcId) }); }
  }
  const turnId = (q.turnInNpcIds && q.turnInNpcIds[0]) || q.turnInNpcId || q.giverNpcId;
  const turn = z.npcs[turnId];
  if (turn) steps.push({ kind: 'turnin', label: `Turn in — ${turn.name}`, x: turn.pos.x, z: turn.pos.z, model: modelFor('npc', turnId) });
  return steps;
}

const out: Record<string, any> = {};
for (const z of ZONES) {
  for (const q of Object.values(z.quests) as any[]) {
    const steps = resolveSteps(z, q);
    if (steps.length < 2) continue;
    const xs = steps.map((s) => s.x), zs = steps.map((s) => s.z);
    const pad = 55;
    const bounds = { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, z0: Math.min(...zs) - pad, z1: Math.max(...zs) + pad };
    const inB = (p: any) => p.x >= bounds.x0 && p.x <= bounds.x1 && p.z >= bounds.z0 && p.z <= bounds.z1;
    // nearby NPCs + camps + lakes + objects + roads
    const npcs = (Object.values(z.npcs) as any[]).filter((n) => inB(n.pos)).map((n) => ({ name: n.name, x: n.pos.x, z: n.pos.z, model: modelFor('npc', n.id) })).filter((n) => n.model);
    const camps = (z.camps as any[]).filter((c) => inB(c.center)).map((c) => ({ x: c.center.x, z: c.center.z, r: c.radius || 8, count: Math.min(c.count || 3, 5), model: modelFor('mob', c.mobId), name: itemName(c.mobId) })).filter((c) => c.model);
    const lakes = (z.lakes as any[]).filter((l) => inB(l)).map((l) => ({ x: l.x, z: l.z, r: l.radius }));
    const roads = (z.roads as any[]).map((r) => r.map((p: any) => ({ x: p.x, z: p.z }))).filter((r) => r.some(inB));
    // deterministic foliage scatter (skip lakes + path corridor)
    const rnd = rng(hash(q.id)); const foliage: any[] = [];
    const area = (bounds.x1 - bounds.x0) * (bounds.z1 - bounds.z0);
    const target = Math.min(120, Math.round(area / 900));
    for (let i = 0; i < target * 3 && foliage.length < target; i++) {
      const x = bounds.x0 + rnd() * (bounds.x1 - bounds.x0), zz = bounds.z0 + rnd() * (bounds.z1 - bounds.z0);
      if (lakes.some((l) => Math.hypot(l.x - x, l.z - zz) < l.r + 3)) continue;
      if (steps.some((s) => Math.hypot(s.x - x, s.z - zz) < 6)) continue;
      foliage.push({ x: Math.round(x), z: Math.round(zz), url: `models/foliage/${z.foliage[Math.floor(rnd() * z.foliage.length)]}.glb`, scale: +(0.8 + rnd() * 1.1).toFixed(2) });
    }
    out[q.id] = { name: q.name, zone: z.dir, biome: '#' + z.biome.toString(16).padStart(6, '0'), bounds, steps, npcs, camps, lakes, roads, foliage, character: 'models/chars/players/ranger.glb' };
  }
}

fs.writeFileSync(OUT, JSON.stringify({ modelRepo: 'levy-street/world-of-claudecraft', modelRef: 'main', quests: out }));
console.log(`wrote quest3d.json (${Object.keys(out).length} quests) to ${OUT}`);
