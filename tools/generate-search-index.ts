import { ITEMS, MOBS, ABILITIES } from '../woc/src/sim/data.ts';
import { ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_QUESTS, ZONE2_ZONE } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_QUESTS, ZONE3_ZONE } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import { COLLAPSED_RELIQUARY_DELVE } from '../woc/src/sim/content/delves/index.ts';
import { GUIDE_CLASSES } from '../woc/src/guide/content.generated.ts';
import { bestiaryDirByMob } from './bestiary-index.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/search.json';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const enc = encodeURIComponent;
const docHash = (p: string, anchor?: string) => `#/doc/${enc(p)}${anchor ? '/' + enc(anchor) : ''}`;

const out: any[] = [];

// quests
const zoneDirs: [any, string][] = [
  [ZONE1_QUESTS, '01-eastbrook-vale'], [ZONE2_QUESTS, '02-' + slug(ZONE2_ZONE.name)],
  [ZONE3_QUESTS, '03-' + slug(ZONE3_ZONE.name)], [TEMPLE_QUESTS, '04-the-drowned-temple'],
];
for (const [rec, dir] of zoneDirs) for (const q of Object.values(rec) as any[])
  out.push({ t: 'Quest', n: q.name, k: `quests:${q.id}`, go: docHash(`quests/zones/${dir}/${slug(q.id)}.md`) });

// mobs -> bestiary anchor
const DIR = bestiaryDirByMob();
const ALL_MOBS: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };
const seenMob = new Set<string>();
for (const [id, dir] of Object.entries(DIR)) {
  const m = ALL_MOBS[id]; if (!m || seenMob.has(id)) continue; seenMob.add(id);
  out.push({ t: m.boss ? 'Boss' : 'Mob', n: m.name, k: `mobs:${id}`, go: docHash(`quests/zones/${dir}/bestiary.md`, `mob-${id}`) });
}

// gear + consumables -> their tab, prefilled
for (const i of Object.values(ITEMS) as any[]) {
  if (i.kind === 'armor' || i.kind === 'weapon') out.push({ t: 'Gear', n: i.name, k: `items:${i.id}`, go: '#/gear', pre: i.name });
  else if (['food', 'drink', 'potion', 'elixir'].includes(i.kind)) out.push({ t: 'Consumable', n: i.name, k: `items:${i.id}`, go: '#/consumables', pre: i.name });
}
// abilities -> abilities tab, prefilled
for (const a of Object.values(ABILITIES) as any[]) if (a.class) out.push({ t: 'Ability', n: a.name, k: `abilities:${a.id}`, go: '#/abilities', pre: a.name });
// classes / dungeons / delves
for (const c of GUIDE_CLASSES as any[]) out.push({ t: 'Class', n: c.id[0].toUpperCase() + c.id.slice(1), go: docHash(`classes/${c.id}.md`) });
for (const [id, d] of Object.entries(DUNGEON_DEFS) as any[]) if ((d.spawns || []).length) out.push({ t: 'Dungeon', n: d.name, k: `dungeons:${id}`, go: docHash(`dungeons/${id}.md`) });
out.push({ t: 'Delve', n: COLLAPSED_RELIQUARY_DELVE.name, k: `delves:${COLLAPSED_RELIQUARY_DELVE.id}`, go: docHash(`delves/${COLLAPSED_RELIQUARY_DELVE.id}.md`) });

// dedupe identical (name+go)
const seen = new Set<string>();
const entries = out.filter(e => { const k = e.t + '|' + e.n + '|' + e.go; if (seen.has(k)) return false; seen.add(k); return true; })
  .map(e => ({ ...e, nl: e.n.toLowerCase() }));

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(entries));
console.log(`wrote search index: ${entries.length} entries`);
