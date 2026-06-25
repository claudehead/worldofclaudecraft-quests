import { ITEMS, MOBS, NPCS, QUESTS } from '../woc/src/sim/data.ts';
import { DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import { DELVE_MOBS, DELVE_SHOPS } from '../woc/src/sim/content/delves/index.ts';
import { quality, statLine } from './iteminfo.ts';
import { bestiaryDirByMob } from './bestiary-index.ts';
import * as fs from 'node:fs';

const DIR = bestiaryDirByMob();

const OUT = process.argv[2] || '/tmp/gen/consumables.json';
const ALL_MOBS: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS, ...DELVE_MOBS };
const KINDS = ['food', 'drink', 'potion', 'elixir'];
const CAT_LABEL: Record<string, string> = { food: 'Food', drink: 'Drink', potion: 'Potion', elixir: 'Elixir' };

const dropsBy: Record<string, { id: string; name: string }[]> = {};
for (const [mid, m] of Object.entries(ALL_MOBS) as any[]) for (const l of m.loot || []) if (l.itemId) (dropsBy[l.itemId] ||= []).push({ id: mid, name: m.name });
const questBy: Record<string, string[]> = {};
for (const q of Object.values(QUESTS) as any[]) for (const it of Object.values(q.itemRewards || {})) (questBy[it as string] ||= []).push(q.name);
const vendorBy: Record<string, string[]> = {};
for (const n of Object.values(NPCS) as any[]) for (const v of n.vendorItems || []) (vendorBy[v] ||= []).push(n.name);
const delveBy: Record<string, number> = {};
for (const offers of Object.values(DELVE_SHOPS) as any[]) for (const o of offers) delveBy[o.itemId] = o.marks;

const uniq = (a: string[] = []) => [...new Set(a)];
function dropMobs(id: string) {
  const seen = new Set<string>(), out: any[] = [];
  for (const m of dropsBy[id] || []) { if (seen.has(m.id)) continue; seen.add(m.id); out.push({ id: m.id, name: m.name, dir: DIR[m.id] || null }); }
  return out;
}
function sourcesFor(id: string): any[] {
  const out: any[] = [];
  if (vendorBy[id]) out.push({ type: 'vendor', label: `Vendor: ${uniq(vendorBy[id]).join(', ')}` });
  if (questBy[id]) out.push({ type: 'quest', label: `Quest: ${uniq(questBy[id]).join(', ')}` });
  if (delveBy[id] != null) out.push({ type: 'delve', label: `Delve vendor — ${delveBy[id]} Marks` });
  if (dropsBy[id]) { const m = dropMobs(id); out.push({ type: 'drop', label: `Drops from ${m.slice(0, 3).map(x => x.name).join(', ')}${m.length > 3 ? ` +${m.length - 3} more` : ''}`, mobs: m }); }
  if (!out.length) out.push({ type: 'other', label: 'Cooked / gathered / fished' });
  return out;
}

const items = (Object.values(ITEMS) as any[])
  .filter(i => KINDS.includes(i.kind))
  .map(i => {
    const q = quality(i.id);
    return {
      id: i.id, name: i.name, kind: i.kind, category: CAT_LABEL[i.kind],
      quality: i.quality || 'common', qualityName: q?.name || 'Common',
      effect: statLine(i.id), icon: `consumables/_icons/${i.id}.png`, sources: sourcesFor(i.id),
    };
  })
  .sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || a.name.localeCompare(b.name));

const out = { count: items.length, categories: KINDS.filter(k => items.some(i => i.kind === k)).map(k => ({ id: k, label: CAT_LABEL[k] })), items };
fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
fs.writeFileSync(OUT.replace(/[^/\\]+$/, 'consumable-icons.json'), JSON.stringify(items.map(i => i.id)));
console.log(`wrote ${items.length} consumables to ${OUT}`);
