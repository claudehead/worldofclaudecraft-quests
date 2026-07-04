import { QUESTS } from '../woc/src/sim/data.ts';
import { ZONE1_QUESTS, ZONE1_ZONE } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_QUESTS, ZONE2_ZONE } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_QUESTS, ZONE3_ZONE } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import { GUIDE_CLASSES } from '../woc/src/guide/content.generated.ts';
import { DUNGEON_DEFS } from '../woc/src/sim/content/dungeons.ts';
import { COLLAPSED_RELIQUARY_DELVE, DROWNED_LITANY_DELVE } from '../woc/src/sim/content/delves/index.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/manifest.json';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const qslug = (id: string) => id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const buckets = [
  { key: 'zone1', dir: '01-eastbrook-vale', title: 'Eastbrook Vale', quests: ZONE1_QUESTS, levelRange: ZONE1_ZONE.levelRange, hub: ZONE1_ZONE.hub?.name, biome: 'vale' },
  { key: 'zone2', dir: '02-' + slug(ZONE2_ZONE.name), title: ZONE2_ZONE.name, quests: ZONE2_QUESTS, levelRange: ZONE2_ZONE.levelRange, hub: ZONE2_ZONE.hub?.name, biome: 'marsh' },
  { key: 'zone3', dir: '03-' + slug(ZONE3_ZONE.name), title: ZONE3_ZONE.name, quests: ZONE3_QUESTS, levelRange: ZONE3_ZONE.levelRange, hub: ZONE3_ZONE.hub?.name, biome: 'peaks' },
  { key: 'temple', dir: '04-the-drowned-temple', title: 'The Drowned Temple', quests: TEMPLE_QUESTS, levelRange: [15, 16], hub: undefined, biome: 'temple' },
];

const zones = buckets.map(b => ({
  key: b.key, dir: b.dir, title: b.title, levelRange: b.levelRange, hub: b.hub ?? null, biome: b.biome,
  bestiary: `quests/zones/${b.dir}/bestiary.md`,
  map: `quests/zones/${b.dir}/map.svg`,
  quests: Object.values(b.quests).map((q: any) => ({
    id: q.id,
    name: q.name,
    level: q.minLevel ?? b.levelRange[0],
    group: !!q.suggestedPlayers,
    chain: !!q.requiresQuest,
    file: `quests/zones/${b.dir}/${qslug(q.id)}.md`,
  })).sort((a, b) => a.level - b.level),
}));

const classes = GUIDE_CLASSES.map((c: any) => ({
  id: c.id,
  name: c.id[0].toUpperCase() + c.id.slice(1),
  resource: c.resource,
  roles: c.roles || [],
  specs: (c.specs || []).map((s: any) => s.name),
  file: `classes/${c.id}.md`,
  render: `classes/_class-renders/${c.id}.png`,
}));

const dungeons = (Object.entries(DUNGEON_DEFS) as any[]).map(([id, d]) => ({
  id, name: d.name, suggestedPlayers: d.suggestedPlayers || null,
  hasMap: (d.spawns || []).length > 0,
  file: `dungeons/${id}.md`,
  map: (d.spawns || []).length > 0 ? `dungeons/_maps/${id}.svg` : null,
})).filter(d => d.name);

const delves = [COLLAPSED_RELIQUARY_DELVE, DROWNED_LITANY_DELVE].map(d => ({
  id: d.id,
  name: d.name,
  minLevel: d.minLevel,
  file: `delves/${d.id}.md`,
}));

const allLevels = zones.flatMap(z => z.quests.map(q => q.level));
const manifest = {
  repo: 'claudehead/worldofclaudecraft-quests',
  branch: 'main',
  counts: {
    quests: Object.keys(QUESTS).length,
    zones: zones.length,
    classes: classes.length,
    dungeons: dungeons.length,
    delves: delves.length,
  },
  levelRange: [Math.min(...allLevels), 20],
  zones, classes, dungeons, delves,
};

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log(`wrote site manifest (${manifest.counts.quests} quests, ${zones.length} zones) to ${OUT}`);
