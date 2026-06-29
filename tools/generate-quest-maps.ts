import { MOBS, ITEMS, FISHING_TABLES } from '../woc/src/sim/data.ts';
import { ZONE1_NPCS, ZONE1_CAMPS, ZONE1_OBJECTS, ZONE1_ROADS, ZONE1_ZONE, ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_NPCS, ZONE2_CAMPS, ZONE2_OBJECTS, ZONE2_ROADS, ZONE2_ZONE, ZONE2_QUESTS } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_NPCS, ZONE3_CAMPS, ZONE3_OBJECTS, ZONE3_ROADS, ZONE3_ZONE, ZONE3_QUESTS } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_NPCS, TEMPLE_CAMPS, TEMPLE_OBJECTS, TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/out';
const ALL_MOBS: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const mobName = (id: string) => ALL_MOBS[id]?.name || id;
const itemName = (id: string) => ITEMS[id]?.name || id;
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Pt = { x: number; z: number };

const zones = [
  { key: 'zone1', dir: '01-eastbrook-vale', npcs: ZONE1_NPCS, camps: ZONE1_CAMPS, objects: ZONE1_OBJECTS, roads: ZONE1_ROADS, zone: ZONE1_ZONE, quests: ZONE1_QUESTS, zBand: [-180, 180] as [number, number] },
  { key: 'zone2', dir: '02-' + slug(ZONE2_ZONE.name), npcs: ZONE2_NPCS, camps: ZONE2_CAMPS, objects: ZONE2_OBJECTS, roads: ZONE2_ROADS, zone: ZONE2_ZONE, quests: ZONE2_QUESTS, zBand: [180, 540] as [number, number] },
  { key: 'zone3', dir: '03-' + slug(ZONE3_ZONE.name), npcs: ZONE3_NPCS, camps: ZONE3_CAMPS, objects: ZONE3_OBJECTS, roads: ZONE3_ROADS, zone: ZONE3_ZONE, quests: ZONE3_QUESTS, zBand: [540, 900] as [number, number] },
  { key: 'temple', dir: '04-the-drowned-temple', npcs: TEMPLE_NPCS, camps: TEMPLE_CAMPS, objects: TEMPLE_OBJECTS, roads: [], zone: null, quests: TEMPLE_QUESTS, zBand: null },
];
const TEMPLE_DUNGEONS = new Set(['nythraxis_crypt', 'nythraxis_boss_arena']);
const FISHING_ITEMS = new Set<string>(['the_codfather']);
for (const t of Object.values(FISHING_TABLES) as any[]) for (const e of t) if (e.itemId) FISHING_ITEMS.add(e.itemId);

function centroid(pts: Pt[]): Pt | null {
  if (!pts.length) return null;
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, z: pts.reduce((s, p) => s + p.z, 0) / pts.length };
}
function campsForMob(camps: any[], mobId: string): Pt[] { return camps.filter(c => c.mobId === mobId).map(c => c.center); }
function dungeonForMob(z: any, mobId: string): { name: string; pos: Pt } | null {
  for (const [id, d] of Object.entries(DUNGEON_DEFS) as any[]) {
    if ((d.spawns || []).some((s: any) => s.mobId === mobId)) {
      const inZone = z.zBand ? (!TEMPLE_DUNGEONS.has(id) && d.doorPos.z >= z.zBand[0] && d.doorPos.z < z.zBand[1]) : TEMPLE_DUNGEONS.has(id);
      if (inZone || !z.zBand) return { name: d.name, pos: d.doorPos };
    }
  }
  return null;
}
function mobsDroppingInZone(z: any, itemId: string): string[] {
  const out: string[] = [];
  for (const c of z.camps) {
    const m = ALL_MOBS[c.mobId];
    if (m && (m.loot || []).some((l: any) => l.itemId === itemId) && !out.includes(c.mobId)) out.push(c.mobId);
  }
  return out;
}
function groundFor(z: any, itemId: string): Pt[] {
  const g = z.objects.find((o: any) => o.itemId === itemId);
  return g ? g.positions : [];
}

interface Step { key: string; kind: 'giver' | 'turnin' | 'kill' | 'collect' | 'interact'; pos: Pt; label: string; }

function stepsForQuest(z: any, q: any): Step[] {
  const steps: Step[] = [];
  const giver = z.npcs[q.giverNpcId];
  if (giver) steps.push({ key: 'giver', kind: 'giver', pos: giver.pos, label: `Start — ${giver.name}` });

  for (const o of q.objectives) {
    if (o.type === 'kill') {
      const camps = campsForMob(z.camps, o.targetMobId);
      const c = centroid(camps);
      if (c) steps.push({ key: o.targetMobId, kind: 'kill', pos: c, label: `${o.count}× ${mobName(o.targetMobId)}` });
      else { const dg = dungeonForMob(z, o.targetMobId); if (dg) steps.push({ key: o.targetMobId, kind: 'kill', pos: dg.pos, label: `${mobName(o.targetMobId)} — in ${dg.name}` }); }
    } else if (o.type === 'collect') {
      const ground = groundFor(z, o.itemId);
      const gc = centroid(ground);
      if (gc) steps.push({ key: o.itemId, kind: 'collect', pos: gc, label: `Collect ${itemName(o.itemId)}` });
      else {
        const drops = mobsDroppingInZone(z, o.itemId);
        const c = centroid(drops.flatMap(m => campsForMob(z.camps, m)));
        if (c) steps.push({ key: o.itemId, kind: 'collect', pos: c, label: `${itemName(o.itemId)} — from ${drops.map(mobName).join('/')}` });
        else if (FISHING_ITEMS.has(o.itemId) && z.zone?.lakes?.length) {
          const lake = [...z.zone.lakes].sort((a: any, b: any) => b.radius - a.radius)[0];
          steps.push({ key: o.itemId, kind: 'collect', pos: { x: lake.x, z: lake.z }, label: `🎣 Fish for ${itemName(o.itemId)}` });
        }
      }
    } else if (o.type === 'interact') {
      if (o.targetObjectItemId) {
        const c = centroid(groundFor(z, o.targetObjectItemId));
        if (c) steps.push({ key: o.targetObjectItemId, kind: 'interact', pos: c, label: o.label || itemName(o.targetObjectItemId) });
      } else if (o.targetNpcId && z.npcs[o.targetNpcId]) {
        steps.push({ key: o.targetNpcId, kind: 'interact', pos: z.npcs[o.targetNpcId].pos, label: o.label || z.npcs[o.targetNpcId].name });
      }
    }
  }
  const turnId = (q.turnInNpcIds && q.turnInNpcIds[0]) || q.turnInNpcId;
  const turn = z.npcs[turnId];
  if (turn) steps.push({ key: 'turnin', kind: 'turnin', pos: turn.pos, label: `Turn in — ${turn.name}` });
  return steps;
}

function zonePoints(z: any): Pt[] {
  const pts: Pt[] = [];
  for (const n of Object.values(z.npcs) as any[]) pts.push(n.pos);
  for (const c of z.camps) pts.push(c.center);
  for (const o of z.objects) for (const p of o.positions) pts.push(p);
  if (z.zone) {
    for (const l of z.zone.lakes || []) { pts.push({ x: l.x - l.radius, z: l.z - l.radius }); pts.push({ x: l.x + l.radius, z: l.z + l.radius }); }
    if (z.zone.hub) pts.push({ x: z.zone.hub.x, z: z.zone.hub.z });
    for (const p of z.zone.pois || []) pts.push(p);
  }
  for (const seg of z.roads || []) for (const p of seg) pts.push(p);
  return pts;
}

const STEP_COLOR: Record<string, string> = { giver: '#f0c419', turnin: '#5cb85c', kill: '#d9534f', collect: '#46b8da', interact: '#9b8cff' };

function questMap(z: any, q: any, steps: Step[]): string {
  const allPts = zonePoints(z).concat(steps.map(s => s.pos));
  const pad = 40;
  const minX = Math.min(...allPts.map(p => p.x)) - pad, maxX = Math.max(...allPts.map(p => p.x)) + pad;
  const minZ = Math.min(...allPts.map(p => p.z)) - pad, maxZ = Math.max(...allPts.map(p => p.z)) + pad;
  const W = 1000, scale = W / (maxX - minX), H = Math.round((maxZ - minZ) * scale);
  const X = (x: number) => ((x - minX) * scale).toFixed(1);
  const Y = (zz: number) => ((zz - minZ) * scale).toFixed(1);
  const R = (r: number) => (r * scale).toFixed(1);

  const s: string[] = [];
  s.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Helvetica, Arial, sans-serif">`);
  s.push(`<rect width="${W}" height="${H}" fill="#1f2a24"/>`);
  // dimmed base context
  if (z.zone) for (const l of z.zone.lakes || []) s.push(`<circle cx="${X(l.x)}" cy="${Y(l.z)}" r="${R(l.radius)}" fill="#2f6f8f" opacity="0.28"/>`);
  for (const seg of z.roads || []) s.push(`<path d="${seg.map((p: Pt, i: number) => `${i ? 'L' : 'M'}${X(p.x)} ${Y(p.z)}`).join(' ')}" fill="none" stroke="#8a7a55" stroke-width="3" opacity="0.35"/>`);
  if (z.zone?.hub) s.push(`<circle cx="${X(z.zone.hub.x)}" cy="${Y(z.zone.hub.z)}" r="${R(z.zone.hub.radius)}" fill="#caa15a" opacity="0.08" stroke="#caa15a" stroke-width="1" stroke-opacity="0.3"/>`);
  for (const c of z.camps) s.push(`<circle cx="${X(c.center.x)}" cy="${Y(c.center.z)}" r="4" fill="#3a4a42"/>`);
  for (const n of Object.values(z.npcs) as any[]) s.push(`<circle cx="${X(n.pos.x)}" cy="${Y(n.pos.z)}" r="4" fill="#3a4a42"/>`);
  for (const p of (z.zone?.pois || [])) s.push(`<text x="${X(p.x)}" y="${Y(p.z)}" fill="#eef4ee" font-size="11" font-style="italic" text-anchor="middle" stroke="#10160f" stroke-width="0.8" paint-order="stroke">${esc(p.label)}</text>`);

  // merge steps that share (nearly) the same spot into one numbered badge
  const locs: { pos: Pt; nums: number[]; kinds: string[]; keys: string[] }[] = [];
  steps.forEach((st, i) => {
    const hit = locs.find(l => Math.hypot(l.pos.x - st.pos.x, l.pos.z - st.pos.z) < 12);
    if (hit) { hit.nums.push(i + 1); hit.kinds.push(st.kind); hit.keys.push(st.key); }
    else locs.push({ pos: st.pos, nums: [i + 1], kinds: [st.kind], keys: [st.key] });
  });
  const locColor = (l: any) => l.kinds.includes('giver') ? STEP_COLOR.giver : l.kinds.includes('turnin') ? STEP_COLOR.turnin : STEP_COLOR[l.kinds[0]];

  // route connector through the ordered locations
  if (locs.length > 1) {
    const d = locs.map((l, i) => `${i ? 'L' : 'M'}${X(l.pos.x)} ${Y(l.pos.z)}`).join(' ');
    s.push(`<path d="${d}" fill="none" stroke="#e6bb6a" stroke-width="2.5" stroke-dasharray="7 6" opacity="0.85"/>`);
  }

  // numbered badges (data-keys let the site link objectives -> marker)
  for (const l of locs) {
    const col = locColor(l); const r = 14;
    s.push(`<g class="qstep" data-keys="${esc(l.keys.join(','))}" data-steps="${l.nums.join(',')}">`);
    s.push(`<circle cx="${X(l.pos.x)}" cy="${Y(l.pos.z)}" r="${r + 7}" fill="${col}" opacity="0.18"/>`);
    s.push(`<circle cx="${X(l.pos.x)}" cy="${Y(l.pos.z)}" r="${r}" fill="${col}" stroke="#11160f" stroke-width="2"/>`);
    s.push(`<text x="${X(l.pos.x)}" y="${(parseFloat(Y(l.pos.z)) + 5).toFixed(1)}" fill="#11160f" font-size="15" font-weight="bold" text-anchor="middle">${l.nums.join('·')}</text>`);
    s.push(`</g>`);
  }

  // legend box (full step text, no on-map collisions)
  const lh = 24, padL = 12;
  const boxW = 360, boxH = steps.length * lh + 40;
  s.push(`<rect x="10" y="10" width="${boxW}" height="${boxH}" rx="10" fill="#11160f" opacity="0.82"/>`);
  s.push(`<text x="${10 + padL}" y="34" fill="#cfe3d6" font-size="14" font-weight="bold">Where to go — N ↑</text>`);
  steps.forEach((st, i) => {
    const y = 34 + 18 + i * lh;
    s.push(`<circle cx="${10 + padL + 8}" cy="${y - 4}" r="9" fill="${STEP_COLOR[st.kind]}"/>`);
    s.push(`<text x="${10 + padL + 8}" y="${y - 0.5}" fill="#11160f" font-size="11" font-weight="bold" text-anchor="middle">${i + 1}</text>`);
    s.push(`<text x="${10 + padL + 24}" y="${y}" fill="#e8e8ea" font-size="13.5">${esc(st.label)}</text>`);
  });
  s.push(`</svg>`);
  return s.join('\n');
}

let n = 0;
const manifest: Record<string, any> = {};
for (const z of zones) {
  for (const q of Object.values(z.quests) as any[]) {
    const steps = stepsForQuest(z, q);
    if (steps.length === 0) continue;
    const file = `qmap-${slug(q.id)}.svg`;
    fs.mkdirSync(`${OUT}/zones/${z.dir}`, { recursive: true });
    fs.writeFileSync(`${OUT}/zones/${z.dir}/${file}`, questMap(z, q, steps));
    manifest[q.id] = { zone: z.dir, map: `quests/zones/${z.dir}/${file}`, name: q.name, steps: steps.map((s, i) => ({ n: i + 1, kind: s.kind, key: s.key, label: s.label, x: Math.round(s.pos.x), z: Math.round(s.pos.z) })) };
    n++;
  }
}
// emit a steps manifest so the website can build the clickable legend
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/quest-maps.json`, JSON.stringify(manifest, null, 0));
console.log(`wrote ${n} quest maps + quest-maps.json`);
