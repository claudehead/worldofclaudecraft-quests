// Emits docs/questchains.json — quest chains (linked by requiresQuest) as nested
// trees grouped by zone, so players can follow a storyline start-to-finish.
import { ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_QUESTS, ZONE2_ZONE } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_QUESTS, ZONE3_ZONE } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import { NPCS } from '../woc/src/sim/data.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/questchains.json';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const giverName = (id: string) => (NPCS as any)[id]?.name || id;

const ZONES: [any, string, string][] = [
  [ZONE1_QUESTS, '01-eastbrook-vale', 'Eastbrook Vale'],
  [ZONE2_QUESTS, '02-' + slug(ZONE2_ZONE.name), ZONE2_ZONE.name],
  [ZONE3_QUESTS, '03-' + slug(ZONE3_ZONE.name), ZONE3_ZONE.name],
  [TEMPLE_QUESTS, '04-the-drowned-temple', 'The Drowned Temple'],
];

// global id -> node (chains can cross zones via requiresQuest)
const node: Record<string, any> = {};
const zoneOf: Record<string, string> = {};
for (const [rec, dir, zoneName] of ZONES)
  for (const q of Object.values(rec) as any[]) {
    node[q.id] = {
      id: q.id, name: q.name, giver: giverName(q.giverNpcId),
      minLevel: q.minLevel ?? null, req: q.requiresQuest || null,
      href: `#/doc/${encodeURIComponent(`quests/zones/${dir}/${slug(q.id)}.md`)}`,
      children: [],
    };
    zoneOf[q.id] = zoneName;
  }

// link children
for (const n of Object.values(node)) if (n.req && node[n.req]) node[n.req].children.push(n);
// sort children by level then name
const sortKids = (n: any) => { n.children.sort((a: any, b: any) => (a.minLevel ?? 99) - (b.minLevel ?? 99) || a.name.localeCompare(b.name)); n.children.forEach(sortKids); };

// roots = no req, or req points outside the dataset; only show multi-step chains
const roots = Object.values(node).filter((n: any) => !n.req || !node[n.req]);
roots.forEach(sortKids);
const countNodes = (n: any): number => 1 + n.children.reduce((s: number, c: any) => s + countNodes(c), 0);

const zones = ZONES.map(([, , zoneName]) => {
  const chains = roots
    .filter((r: any) => zoneOf[r.id] === zoneName && countNodes(r) > 1) // skip standalone quests
    .sort((a: any, b: any) => (a.minLevel ?? 99) - (b.minLevel ?? 99) || a.name.localeCompare(b.name));
  return { name: zoneName, chains };
}).filter((z) => z.chains.length);

fs.writeFileSync(OUT, JSON.stringify({ zones }));
const total = zones.reduce((s, z) => s + z.chains.length, 0);
console.log(`wrote questchains.json (${total} chains across ${zones.length} zones) to ${OUT}`);
