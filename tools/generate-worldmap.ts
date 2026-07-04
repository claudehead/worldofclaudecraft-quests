import { MOBS } from '../woc/src/sim/data.ts';
import { ZONE1_NPCS, ZONE1_CAMPS, ZONE1_ROADS, ZONE1_ZONE, ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_NPCS, ZONE2_CAMPS, ZONE2_ROADS, ZONE2_ZONE, ZONE2_QUESTS } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_NPCS, ZONE3_CAMPS, ZONE3_ROADS, ZONE3_ZONE, ZONE3_QUESTS } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_NPCS, TEMPLE_CAMPS, TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import { COLLAPSED_RELIQUARY_DELVE, DROWNED_LITANY_DELVE } from '../woc/src/sim/content/delves/index.ts';
import { bestiaryDirByMob } from './bestiary-index.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/world-map.json';
const ALL_MOBS: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };
const DIR = bestiaryDirByMob();
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const TEMPLE_DUNGEONS = new Set(['nythraxis_crypt', 'nythraxis_boss_arena']);

const zones = [
  { dir: '01-eastbrook-vale', title: 'Eastbrook Vale', npcs: ZONE1_NPCS, camps: ZONE1_CAMPS, roads: ZONE1_ROADS, zone: ZONE1_ZONE, quests: ZONE1_QUESTS },
  { dir: '02-' + slug(ZONE2_ZONE.name), title: ZONE2_ZONE.name, npcs: ZONE2_NPCS, camps: ZONE2_CAMPS, roads: ZONE2_ROADS, zone: ZONE2_ZONE, quests: ZONE2_QUESTS },
  { dir: '03-' + slug(ZONE3_ZONE.name), title: ZONE3_ZONE.name, npcs: ZONE3_NPCS, camps: ZONE3_CAMPS, roads: ZONE3_ROADS, zone: ZONE3_ZONE, quests: ZONE3_QUESTS },
  { dir: '04-the-drowned-temple', title: 'The Drowned Temple', npcs: TEMPLE_NPCS, camps: TEMPLE_CAMPS, roads: [], zone: null, quests: TEMPLE_QUESTS },
];

// questId -> quest page file
const questFile: Record<string, string> = {};
for (const z of zones) for (const q of Object.values(z.quests) as any[]) questFile[q.id] = `quests/zones/${z.dir}/q-${slug(q.id)}.md`;

const markers: any[] = [];
const lakes: any[] = [];
const roads: any[][] = [];
const bands: any[] = [];

for (const z of zones) {
  if (z.zone) {
    bands.push({ title: z.title, zMin: z.zone.zMin, zMax: z.zone.zMax, levelRange: z.zone.levelRange });
    if (z.zone.hub) markers.push({ type: 'town', x: z.zone.hub.x, z: z.zone.hub.z, r: z.zone.hub.radius, label: z.zone.hub.name });
    for (const l of z.zone.lakes || []) lakes.push({ x: l.x, z: l.z, r: l.radius });
    for (const p of z.zone.pois || []) markers.push({ type: 'poi', x: p.x, z: p.z, label: p.label });
  }
  for (const seg of z.roads || []) roads.push(seg.map((p: any) => [Math.round(p.x), Math.round(p.z)]));
  // mob camps -> bestiary
  for (const c of z.camps) {
    const m = ALL_MOBS[c.mobId];
    if (!m) continue;
    const dir = DIR[c.mobId];
    markers.push({ type: 'camp', x: Math.round(c.center.x), z: Math.round(c.center.z), label: `${m.name}${c.count > 1 ? ` ×${c.count}` : ''}`, tier: m.boss ? 'boss' : m.elite ? 'elite' : m.rare ? 'rare' : 'normal', link: dir ? `quests/zones/${dir}/bestiary.md#mob-${c.mobId}` : null });
  }
  // quest-giver NPCs -> their first quest page
  for (const n of Object.values(z.npcs) as any[]) {
    const give = (n.questIds || []).find((q: string) => questFile[q]);
    markers.push({ type: 'npc', x: Math.round(n.pos.x), z: Math.round(n.pos.z), label: n.name, link: give ? questFile[give] : null });
  }
}
// dungeons + delves
for (const [id, d] of Object.entries(DUNGEON_DEFS) as any[]) {
  if (!(d.spawns || []).length && !TEMPLE_DUNGEONS.has(id)) continue;
  markers.push({ type: 'dungeon', x: Math.round(d.doorPos.x), z: Math.round(d.doorPos.z), label: d.name, link: `dungeons/${id}.md` });
}
for (const dv of [COLLAPSED_RELIQUARY_DELVE, DROWNED_LITANY_DELVE]) markers.push({ type: 'delve', x: Math.round(dv.doorPos.x), z: Math.round(dv.doorPos.z), label: dv.name, link: `delves/${dv.id}.md` });

// bounds
const xs = markers.map(m => m.x).concat(lakes.flatMap(l => [l.x - l.r, l.x + l.r]));
const zs = markers.map(m => m.z).concat(lakes.flatMap(l => [l.z - l.r, l.z + l.r]));
const bounds = { minX: Math.min(...xs) - 30, maxX: Math.max(...xs) + 30, minZ: Math.min(...zs) - 30, maxZ: Math.max(...zs) + 30 };

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ bounds, bands, lakes, roads, markers }));
console.log(`wrote world map: ${markers.length} markers, ${lakes.length} lakes, ${roads.length} roads`);
