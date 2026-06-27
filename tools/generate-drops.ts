// Emits docs/drops.json — a reverse "where do I get item X?" index: for every
// obtainable item, the mobs that drop it (with %, level, zone, spawn density),
// the ground objects that contain it, and the vendors that sell it.
import { CAMPS, GROUND_OBJECTS, ITEMS, MOBS, NPCS, ZONES } from '../woc/src/sim/data.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/drops.json';
const zoneFor = (z: number) => ZONES.find((zz: any) => z >= zz.zMin && z < zz.zMax)?.name || '—';

// mob -> aggregated spawn info
const mobSpawn: Record<string, { spawns: number; zones: Set<string> }> = {};
for (const c of CAMPS as any[]) {
  const s = (mobSpawn[c.mobId] ||= { spawns: 0, zones: new Set() });
  s.spawns += c.count || 0; s.zones.add(zoneFor(c.center.z));
}

type Src = any;
const sources: Record<string, Src[]> = {};
const add = (itemId: string, s: Src) => { (sources[itemId] ||= []).push(s); };

// mob drops
for (const [mobId, m] of Object.entries(MOBS) as any[]) {
  for (const l of (m.loot || [])) {
    if (!l.itemId) continue;
    const sp = mobSpawn[mobId];
    add(l.itemId, {
      type: 'mob', name: m.name, level: Math.round((m.minLevel + m.maxLevel) / 2),
      chance: Math.round((l.chance || 0) * 100), questId: l.questId || null,
      zones: sp ? [...sp.zones].filter((z) => z !== '—') : [], spawns: sp ? sp.spawns : 0,
      elite: !!m.elite, rare: !!m.rare, boss: !!m.boss,
    });
  }
}
// ground objects
for (const g of GROUND_OBJECTS as any[]) {
  const zones = [...new Set(g.positions.map((p: any) => zoneFor(p.z)))].filter((z) => z !== '—');
  add(g.itemId, { type: 'object', name: g.name, zones, count: g.positions.length });
}
// vendors
for (const n of Object.values(NPCS) as any[]) {
  for (const id of (n.vendorItems || [])) add(id, { type: 'vendor', name: n.name, zones: [zoneFor(n.pos.z)].filter((z) => z !== '—') });
}

const rank = (s: Src) => s.type === 'mob' ? (s.chance || 0) : s.type === 'object' ? 50 : 1;
const out = Object.entries(sources).map(([itemId, srcs]) => {
  const it: any = (ITEMS as any)[itemId];
  srcs.sort((a, b) => rank(b) - rank(a));
  return { id: itemId, name: it?.name || itemId, kind: it?.kind || '?', quality: it?.quality || 'common', slot: it?.slot || null, sources: srcs };
}).sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(OUT, JSON.stringify({ items: out }));
console.log(`wrote drops.json (${out.length} obtainable items) to ${OUT}`);
