import { MOBS, ITEMS } from '../woc/src/sim/data.ts';
import { ZONE1_NPCS, ZONE1_CAMPS, ZONE1_OBJECTS, ZONE1_ROADS, ZONE1_ZONE } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_NPCS, ZONE2_CAMPS, ZONE2_OBJECTS, ZONE2_ROADS, ZONE2_ZONE } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_NPCS, ZONE3_CAMPS, ZONE3_OBJECTS, ZONE3_ROADS, ZONE3_ZONE } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_NPCS, TEMPLE_CAMPS, TEMPLE_OBJECTS } from '../woc/src/sim/content/temple.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/out';
const ALL_MOBS: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };
const mobName = (id: string) => ALL_MOBS[id]?.name || id;
const itemName = (id: string) => ITEMS[id]?.name || id;

type Pt = { x: number; z: number };
interface ZoneSpec {
  dir: string; title: string;
  npcs: any; camps: any[]; objects: any[]; roads?: Pt[][];
  lakes?: { x: number; z: number; radius: number }[];
  pois?: { x: number; z: number; label: string }[];
  hub?: { x: number; z: number; radius: number; name: string };
  zBand?: [number, number]; // to pick dungeon doors that belong here
}

const zones: ZoneSpec[] = [
  { dir: '01-eastbrook-vale', title: 'Eastbrook Vale', npcs: ZONE1_NPCS, camps: ZONE1_CAMPS, objects: ZONE1_OBJECTS, roads: ZONE1_ROADS, lakes: ZONE1_ZONE.lakes, pois: ZONE1_ZONE.pois, hub: ZONE1_ZONE.hub, zBand: [-180, 180] },
  { dir: '02-mirefen-marsh', title: 'Mirefen Marsh', npcs: ZONE2_NPCS, camps: ZONE2_CAMPS, objects: ZONE2_OBJECTS, roads: ZONE2_ROADS, lakes: ZONE2_ZONE.lakes, pois: ZONE2_ZONE.pois, hub: ZONE2_ZONE.hub, zBand: [180, 540] },
  { dir: '03-thornpeak-heights', title: 'Thornpeak Heights', npcs: ZONE3_NPCS, camps: ZONE3_CAMPS, objects: ZONE3_OBJECTS, roads: ZONE3_ROADS, lakes: ZONE3_ZONE.lakes, pois: ZONE3_ZONE.pois, hub: ZONE3_ZONE.hub, zBand: [540, 900] },
  { dir: '04-the-drowned-temple', title: 'The Drowned Temple', npcs: TEMPLE_NPCS, camps: TEMPLE_CAMPS, objects: TEMPLE_OBJECTS },
];

// Temple shares Thornpeak's z-band but is a distinct sub-area; give it its own
// dungeon set and keep its markers out of the Thornpeak map.
const TEMPLE_DUNGEONS = new Set(['nythraxis_crypt', 'nythraxis_boss_arena']);

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function dungeonsForZone(spec: ZoneSpec): { name: string; pos: Pt }[] {
  const all = Object.entries(DUNGEON_DEFS);
  if (spec.dir.startsWith('04')) {
    return all.filter(([id]) => TEMPLE_DUNGEONS.has(id)).map(([, d]: any) => ({ name: d.name, pos: d.doorPos }));
  }
  if (!spec.zBand) return [];
  const [lo, hi] = spec.zBand;
  return all
    .filter(([id, d]: any) => !TEMPLE_DUNGEONS.has(id) && d.doorPos.z >= lo && d.doorPos.z < hi)
    .map(([, d]: any) => ({ name: d.name, pos: d.doorPos }));
}

function renderZoneMap(spec: ZoneSpec): string {
  const npcArr = Object.values(spec.npcs) as any[];
  const dungeons = dungeonsForZone(spec);

  // collect points to size the viewport
  const pts: Pt[] = [];
  for (const n of npcArr) pts.push(n.pos);
  for (const c of spec.camps) pts.push(c.center);
  for (const o of spec.objects) for (const p of o.positions) pts.push(p);
  for (const d of dungeons) pts.push(d.pos);
  for (const l of spec.lakes || []) { pts.push({ x: l.x - l.radius, z: l.z - l.radius }); pts.push({ x: l.x + l.radius, z: l.z + l.radius }); }
  if (spec.hub) { pts.push({ x: spec.hub.x - spec.hub.radius, z: spec.hub.z - spec.hub.radius }); pts.push({ x: spec.hub.x + spec.hub.radius, z: spec.hub.z + spec.hub.radius }); }
  for (const p of spec.pois || []) pts.push(p);
  for (const seg of spec.roads || []) for (const p of seg) pts.push(p);

  const pad = 40;
  const minX = Math.min(...pts.map(p => p.x)) - pad;
  const maxX = Math.max(...pts.map(p => p.x)) + pad;
  const minZ = Math.min(...pts.map(p => p.z)) - pad;
  const maxZ = Math.max(...pts.map(p => p.z)) + pad;

  const worldW = maxX - minX;
  const worldH = maxZ - minZ;
  const W = 1000;
  const scale = W / worldW;
  const H = Math.round(worldH * scale);

  const X = (x: number) => ((x - minX) * scale).toFixed(1);
  const Y = (z: number) => ((z - minZ) * scale).toFixed(1);
  const R = (r: number) => (r * scale).toFixed(1);

  const s: string[] = [];
  s.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Helvetica, Arial, sans-serif">`);
  s.push(`<rect width="${W}" height="${H}" fill="#1f2a24"/>`);
  // subtle grid
  for (let gx = Math.ceil(minX / 50) * 50; gx < maxX; gx += 50) s.push(`<line x1="${X(gx)}" y1="0" x2="${X(gx)}" y2="${H}" stroke="#2c3a32" stroke-width="1"/>`);
  for (let gz = Math.ceil(minZ / 50) * 50; gz < maxZ; gz += 50) s.push(`<line x1="0" y1="${Y(gz)}" x2="${W}" y2="${Y(gz)}" stroke="#2c3a32" stroke-width="1"/>`);

  // lakes
  for (const l of spec.lakes || []) s.push(`<circle cx="${X(l.x)}" cy="${Y(l.z)}" r="${R(l.radius)}" fill="#2f6f8f" opacity="0.55"/>`);
  // roads
  for (const seg of spec.roads || []) {
    const d = seg.map((p, i) => `${i ? 'L' : 'M'}${X(p.x)} ${Y(p.z)}`).join(' ');
    s.push(`<path d="${d}" fill="none" stroke="#8a7a55" stroke-width="3" opacity="0.7"/>`);
  }
  // town hub
  if (spec.hub) {
    s.push(`<circle cx="${X(spec.hub.x)}" cy="${Y(spec.hub.z)}" r="${R(spec.hub.radius)}" fill="#caa15a" opacity="0.18" stroke="#caa15a" stroke-width="1.5"/>`);
    s.push(`<text x="${X(spec.hub.x)}" y="${Y(spec.hub.z)}" fill="#f0d89a" font-size="15" font-weight="bold" text-anchor="middle">${esc(spec.hub.name)}</text>`);
  }
  // POIs (area labels)
  for (const p of spec.pois || []) {
    if (spec.hub && p.label === spec.hub.name) continue;
    s.push(`<text x="${X(p.x)}" y="${Y(p.z)}" fill="#eef4ee" font-size="12" font-style="italic" text-anchor="middle" stroke="#10160f" stroke-width="0.8" paint-order="stroke">${esc(p.label)}</text>`);
  }

  const label = (x: number, z: number, t: string, fill: string, dy = -8) =>
    `<text x="${X(x)}" y="${(parseFloat(Y(z)) + dy).toFixed(1)}" fill="${fill}" font-size="11" text-anchor="middle" stroke="#11160f" stroke-width="0.6" paint-order="stroke">${esc(t)}</text>`;

  // camps (mob spawns)
  for (const c of spec.camps) {
    s.push(`<circle cx="${X(c.center.x)}" cy="${Y(c.center.z)}" r="6" fill="#d9534f" stroke="#11160f" stroke-width="1"/>`);
    s.push(label(c.center.x, c.center.z, `${mobName(c.mobId)} ×${c.count}`, '#f3b1ae'));
  }
  // ground objects (quest pickups)
  for (const o of spec.objects) {
    for (const p of o.positions) s.push(`<rect x="${(parseFloat(X(p.x)) - 4).toFixed(1)}" y="${(parseFloat(Y(p.z)) - 4).toFixed(1)}" width="8" height="8" transform="rotate(45 ${X(p.x)} ${Y(p.z)})" fill="#5cb85c" stroke="#11160f" stroke-width="1"/>`);
    const c = o.positions[0];
    s.push(label(c.x, c.z, itemName(o.itemId), '#a7e3a7', 10));
  }
  // dungeons
  for (const d of dungeons) {
    s.push(`<rect x="${(parseFloat(X(d.pos.x)) - 7).toFixed(1)}" y="${(parseFloat(Y(d.pos.z)) - 7).toFixed(1)}" width="14" height="14" fill="#9b59b6" stroke="#11160f" stroke-width="1.5"/>`);
    s.push(label(d.pos.x, d.pos.z, `⚔ ${d.name}`, '#d6a7e3'));
  }
  // NPCs (quest givers / turn-ins)
  for (const n of npcArr) {
    s.push(`<circle cx="${X(n.pos.x)}" cy="${Y(n.pos.z)}" r="5.5" fill="#f0c419" stroke="#11160f" stroke-width="1"/>`);
    s.push(label(n.pos.x, n.pos.z, n.name, '#ffe9a3'));
  }

  // compass + legend
  s.push(`<text x="18" y="26" fill="#cfe3d6" font-size="13" font-weight="bold">${esc(spec.title)} — N ↑</text>`);
  const legend = [
    ['#f0c419', 'NPC (quest giver / turn-in)'],
    ['#d9534f', 'Mob camp (×count)'],
    ['#9b59b6', 'Dungeon entrance'],
    ['#5cb85c', 'Quest pickup (ground)'],
    ['#2f6f8f', 'Water'],
  ];
  let ly = H - legend.length * 18 - 12;
  s.push(`<rect x="10" y="${ly - 16}" width="248" height="${legend.length * 18 + 14}" fill="#11160f" opacity="0.7" rx="4"/>`);
  for (const [col, txt] of legend) {
    s.push(`<rect x="18" y="${ly - 9}" width="11" height="11" fill="${col}"/>`);
    s.push(`<text x="36" y="${ly}" fill="#cfe3d6" font-size="12">${esc(txt)}</text>`);
    ly += 18;
  }
  s.push(`</svg>`);
  return s.join('\n');
}

for (const spec of zones) {
  const dir = `${OUT}/zones/${spec.dir}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/map.svg`, renderZoneMap(spec));
  console.log(`map: ${spec.dir}`);
}
console.log('done');
