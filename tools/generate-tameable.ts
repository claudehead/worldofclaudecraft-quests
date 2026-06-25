import { MOBS, CAMPS } from '../woc/src/sim/data.ts';
import { bestiaryDirByMob } from './bestiary-index.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/tameable-beasts.md';
const DIR = bestiaryDirByMob();
const ZONE_TITLE: Record<string, string> = { '01-eastbrook-vale': 'Eastbrook Vale', '02-mirefen-marsh': 'Mirefen Marsh', '03-thornpeak-heights': 'Thornpeak Heights', '04-the-drowned-temple': 'The Drowned Temple' };

// main spawn coordinates per mob (largest camp), for the map link
const camp: Record<string, { x: number; z: number }> = {};
for (const c of CAMPS as any[]) {
  const cur = camp[c.mobId];
  if (!cur || (c.count || 0) > (camp[c.mobId] as any).count) camp[c.mobId] = { x: c.center.x, z: c.center.z, count: c.count } as any;
}

const beasts = (Object.values(MOBS) as any[])
  .filter(m => m.family === 'beast')
  .sort((a, b) => a.minLevel - b.minLevel);

const L: string[] = [];
L.push(`# Tameable beasts (Hunter pets)`);
L.push('');
L.push(`A Hunter can **tame any beast** in the world to fight as a pet — as long as it isn't above your own level. Below are every tameable creature, by level. Tame the look you like; stats scale with you.`);
L.push('');
L.push(`| Beast | Level | Where | |`);
L.push(`|---|---|---|---|`);
for (const m of beasts) {
  const dir = DIR[m.id];
  const zone = dir ? (ZONE_TITLE[dir] || dir) : '—';
  const lvl = m.minLevel === m.maxLevel ? `${m.minLevel}` : `${m.minLevel}–${m.maxLevel}`;
  const bestiary = dir ? `[${m.name}${m.rare ? ' ⭐' : ''}](../quests/zones/${dir}/bestiary.md#mob-${m.id})` : `${m.name}${m.rare ? ' ⭐' : ''}`;
  const map = camp[m.id] ? `[🗺️ map](#/map/${Math.round(camp[m.id].x)}/${Math.round(camp[m.id].z)})` : '';
  L.push(`| ${bestiary} | ${lvl} | ${zone} | ${map} |`);
}
L.push('');
L.push(`_⭐ marks a rare spawn — a one-of-a-kind tame. A beast must be at or below your level to tame it._`);
L.push('');

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, L.join('\n'));
console.log(`wrote tameable beasts (${beasts.length})`);
