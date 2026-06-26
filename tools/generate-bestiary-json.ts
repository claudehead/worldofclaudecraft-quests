// Emits bestiary/bestiary.json — per-mob card data for the website's Bestiary
// card view (mirrors gear/gear.json). Pure data from the game source.
import { MOBS, ITEMS } from '../woc/src/sim/data.ts';
import { ZONE1_CAMPS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_CAMPS } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_CAMPS } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_CAMPS } from '../woc/src/sim/content/temple.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import { COLLAPSED_RELIQUARY_DELVE, DELVE_MOBS } from '../woc/src/sim/content/delves/index.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'bestiary/bestiary.json';
const ALL: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS, ...DELVE_MOBS };

const ZONES = [
  { dir: '01-eastbrook-vale', title: 'Eastbrook Vale', camps: ZONE1_CAMPS },
  { dir: '02-mirefen-marsh', title: 'Mirefen Marsh', camps: ZONE2_CAMPS },
  { dir: '03-thornpeak-heights', title: 'Thornpeak Heights', camps: ZONE3_CAMPS },
  { dir: '04-the-drowned-temple', title: 'The Drowned Temple', camps: TEMPLE_CAMPS },
];
const TEMPLE_DUNGEONS = new Set(['nythraxis_crypt', 'nythraxis_boss_arena']);

// mob -> first camp (zone + location)
const campOf: Record<string, { zone: any; center: { x: number; z: number } }> = {};
for (const z of ZONES) for (const c of (z.camps || []) as any[]) { if (c.mobId && !campOf[c.mobId]) campOf[c.mobId] = { zone: z, center: c.center }; }
// mob -> dungeon/delve
const dungeonOf: Record<string, { name: string; file: string; zoneDir: string }> = {};
for (const [id, d] of Object.entries(DUNGEON_DEFS) as any[]) for (const s of d.spawns || []) { const mid = s.mobId || s.template; if (mid && !dungeonOf[mid]) dungeonOf[mid] = { name: d.name, file: `dungeons/${id}.md`, zoneDir: TEMPLE_DUNGEONS.has(id) ? '04-the-drowned-temple' : '' }; }
const delveOf: Record<string, { name: string; file: string }> = {};
for (const mid of Object.keys(DELVE_MOBS)) delveOf[mid] = { name: COLLAPSED_RELIQUARY_DELVE.name, file: `delves/${COLLAPSED_RELIQUARY_DELVE.id}.md` };

const itemName = (id: string) => (ITEMS as any)[id]?.name || id;
const itemQual = (id: string) => (ITEMS as any)[id]?.quality || 'common';
const hasRender = (id: string) => fs.existsSync(`quests/zones/_mob-renders/${id}.png`);

const FAMILY_LABEL: Record<string, string> = {
  beast: 'Beast', undead: 'Undead', humanoid: 'Humanoid', demon: 'Demon',
  elemental: 'Elemental', dragonkin: 'Dragonkin', critter: 'Critter', spider: 'Spider', murloc: 'Murloc',
};

const mobs: any[] = [];
for (const [id, m] of Object.entries(ALL)) {
  if (!m || !m.name) continue;
  const maxL = m.maxLevel ?? m.minLevel ?? 0;
  const hp = Math.round((m.hpBase ?? 0) + (m.hpPerLevel ?? 0) * maxL);
  const rank = m.boss ? 'boss' : m.elite ? 'elite' : m.rare ? 'rare' : 'normal';
  const camp = campOf[id];
  const dung = dungeonOf[id];
  const delve = delveOf[id];
  let zoneDir = '', zoneTitle = '', location = '', mapXZ: number[] | null = null, detailFile = '';
  if (camp) { zoneDir = camp.zone.dir; zoneTitle = camp.zone.title; location = `${Math.round(camp.center.x)}, ${Math.round(camp.center.z)}`; mapXZ = [Math.round(camp.center.x), Math.round(camp.center.z)]; detailFile = `quests/zones/${zoneDir}/bestiary.md`; }
  else if (dung) { zoneTitle = dung.name; location = dung.name; detailFile = dung.file; zoneDir = dung.zoneDir; }
  else if (delve) { zoneTitle = delve.name; location = delve.name; detailFile = delve.file; }
  else if (m.family === 'demon') { zoneTitle = 'Warlock demon'; location = location || 'Summoned'; detailFile = 'reference/warlock-demons.md'; }
  // anchor only exists on per-zone bestiary pages; other pages link without it
  const detailAnchor = detailFile.endsWith('bestiary.md') ? `mob-${id}` : '';
  const loot = (m.loot || [])
    .filter((l: any) => l.itemId)
    .map((l: any) => ({ name: itemName(l.itemId), chance: l.chance ?? null, quality: itemQual(l.itemId) }));
  mobs.push({
    id, name: m.name,
    level: m.minLevel === maxL ? `${maxL}` : `${m.minLevel}–${maxL}`,
    minLevel: m.minLevel ?? maxL, maxLevel: maxL,
    hp, family: m.family || 'other', familyLabel: FAMILY_LABEL[m.family] || (m.family ? m.family[0].toUpperCase() + m.family.slice(1) : 'Other'),
    rank, zoneDir, zoneTitle, location, mapXZ, detailFile, detailAnchor,
    render: hasRender(id) ? `quests/zones/_mob-renders/${id}.png` : null,
    loot: loot.slice(0, 6),
  });
}
mobs.sort((a, b) => (a.minLevel - b.minLevel) || a.name.localeCompare(b.name));

const families = [...new Set(mobs.map((m) => m.family))].map((f) => [f, FAMILY_LABEL[f] || f[0].toUpperCase() + f.slice(1)]);
const zones = ZONES.map((z) => [z.dir, z.title]);
fs.mkdirSync('bestiary', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ count: mobs.length, zones, families, mobs }));
console.log(`wrote bestiary.json (${mobs.length} mobs, ${families.length} families) to ${OUT}`);
