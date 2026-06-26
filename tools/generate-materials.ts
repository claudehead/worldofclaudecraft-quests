import { ITEMS, MOBS, NPCS, QUESTS } from '../woc/src/sim/data.ts';
import { DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import { DELVE_MOBS } from '../woc/src/sim/content/delves/index.ts';
import { ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_QUESTS, ZONE2_ZONE } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_QUESTS, ZONE3_ZONE } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import { bestiaryDirByMob } from './bestiary-index.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/materials.md';
const DIR = bestiaryDirByMob();
const ALL_MOBS: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS, ...DELVE_MOBS };
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const name = (id: string) => (ITEMS as any)[id]?.name || id;

// quest id -> {name, file} for "used for" links
const questInfo: Record<string, { name: string; file: string }> = {};
for (const [rec, dir] of [[ZONE1_QUESTS, '01-eastbrook-vale'], [ZONE2_QUESTS, '02-' + slug(ZONE2_ZONE.name)], [ZONE3_QUESTS, '03-' + slug(ZONE3_ZONE.name)], [TEMPLE_QUESTS, '04-the-drowned-temple']] as any[])
  for (const q of Object.values(rec) as any[]) questInfo[q.id] = { name: q.name, file: `quests/zones/${dir}/${slug(q.id)}.md` };

// item -> drop mobs (with chance), vendors, and the quests that need it
const dropsBy: Record<string, { id: string; name: string; chance: number }[]> = {};
for (const [mid, m] of Object.entries(ALL_MOBS) as any[]) for (const l of m.loot || []) if (l.itemId) (dropsBy[l.itemId] ||= []).push({ id: mid, name: m.name, chance: l.chance || 0 });
const vendorBy: Record<string, string[]> = {};
for (const n of Object.values(NPCS) as any[]) for (const v of n.vendorItems || []) (vendorBy[v] ||= []).push(n.name);
const neededBy: Record<string, Set<string>> = {};
for (const q of Object.values(QUESTS) as any[]) for (const o of q.objectives || []) if (o.type === 'collect' && o.itemId) (neededBy[o.itemId] ||= new Set()).add(q.id);

function sourceCell(id: string): string {
  const parts: string[] = [];
  const ms = dropsBy[id];
  if (ms) {
    const seen = new Set<string>();
    const uniq = ms.filter(m => !seen.has(m.id) && seen.add(m.id)).sort((a, b) => b.chance - a.chance);
    parts.push(uniq.slice(0, 3).map(m => `${DIR[m.id] ? `[${m.name}](../quests/zones/${DIR[m.id]}/bestiary.md#mob-${m.id})` : m.name}${m.chance ? ` ${Math.round(m.chance * 100)}%` : ''}`).join(', ') + (uniq.length > 3 ? `, +${uniq.length - 3} more` : ''));
  }
  if (vendorBy[id]) parts.push(`vendor (${[...new Set(vendorBy[id])].join(', ')})`);
  return parts.join('; ') || '—';
}
function usedCell(item: any): string {
  const ids = new Set<string>(neededBy[item.id] || []);
  if (item.questId) ids.add(item.questId);
  const links = [...ids].map(qid => questInfo[qid] ? `[${questInfo[qid].name}](../${questInfo[qid].file})` : null).filter(Boolean);
  if (links.length) return 'Quest: ' + links.join(', ');
  if (item.kind === 'junk') return item.sellValue ? `sells for ${item.sellValue}c` : 'vendor trash';
  if (item.kind === 'tool') return 'tool';
  return '—';
}

const SECTIONS: [string, string, string][] = [
  ['quest', 'Quest items', 'Carried for a quest — gather the listed count, then turn it in.'],
  ['tool', 'Tools', 'Equippable utility items (fishing poles, picks, and the like).'],
  ['junk', 'Trade goods & trash', 'Grey/white drops — mostly vendor fodder, a few used by quests.'],
];

const L: string[] = [];
L.push(`# Drops, materials & quest items`);
L.push('');
L.push(`Every non-gear, non-consumable item that drops in the world — quest pieces, tools and trade goods — with **where it drops** and **what it's for**. (Weapons and armor live on the [Gear](#/gear) tab; food and potions on [Consumables](#/consumables).)`);
L.push('');

for (const [kind, title, blurb] of SECTIONS) {
  const items = (Object.values(ITEMS) as any[]).filter(i => i.kind === kind).sort((a, b) => a.name.localeCompare(b.name));
  if (!items.length) continue;
  L.push(`## ${title}`);
  L.push('');
  L.push(`_${blurb}_`);
  L.push('');
  L.push(`| Item | Where to get it | Used for |`);
  L.push(`|---|---|---|`);
  for (const i of items) L.push(`| <a id="item-${i.id}"></a>${i.name} | ${sourceCell(i.id)} | ${usedCell(i)} |`);
  L.push('');
}

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, L.join('\n'));
console.log(`wrote materials page (${(Object.values(ITEMS) as any[]).filter(i => ['quest', 'tool', 'junk'].includes(i.kind)).length} items)`);
