import { ITEMS, MOBS, NPCS, QUESTS } from '../woc/src/sim/data.ts';
import { DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import { DELVE_MOBS, DELVE_SHOPS } from '../woc/src/sim/content/delves/index.ts';
import { quality, statLine } from './iteminfo.ts';
import { bestiaryDirByMob } from './bestiary-index.ts';
import { canEquipItem, armorTypeForItem } from '../woc/src/sim/equipment_rules.ts';
import { ALL_CLASSES } from '../woc/src/sim/types.ts';
import * as fs from 'node:fs';

const DIR = bestiaryDirByMob();
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
// which classes can equip an item, plus a short restriction label (null = all classes)
function usableBy(item: any): string[] { return (ALL_CLASSES as string[]).filter(c => canEquipItem(c as any, item)); }
function restrictLabel(item: any, usable: string[]): string | null {
  if (usable.length >= (ALL_CLASSES as string[]).length) return null;
  const names = usable.map(cap).join(', ');
  const at = item.kind === 'armor' ? armorTypeForItem(item) : null;
  return at ? `${cap(at)} — ${names}` : names;
}

const OUT = process.argv[2] || '/tmp/gen/gear.json';
const ALL_MOBS: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS, ...DELVE_MOBS };

const SLOT_LABEL: Record<string, string> = {
  helmet: 'Head', shoulder: 'Shoulder', chest: 'Chest', gloves: 'Hands', waist: 'Waist',
  legs: 'Legs', feet: 'Feet', mainhand: 'Weapon',
};
const SLOT_ORDER = ['mainhand', 'helmet', 'shoulder', 'chest', 'gloves', 'waist', 'legs', 'feet'];

// ---- precompute reverse indexes for "where to get" ----
const dropsBy: Record<string, { id: string; name: string }[]> = {};
for (const [mid, m] of Object.entries(ALL_MOBS) as any[]) {
  for (const l of m.loot || []) if (l.itemId) (dropsBy[l.itemId] ||= []).push({ id: mid, name: m.name, chance: l.chance || 0 });
}
const questBy: Record<string, string[]> = {};
for (const q of Object.values(QUESTS) as any[]) {
  for (const it of Object.values(q.itemRewards || {})) (questBy[it as string] ||= []).push(q.name);
}
const vendorBy: Record<string, string[]> = {};
for (const n of Object.values(NPCS) as any[]) {
  for (const v of n.vendorItems || []) (vendorBy[v] ||= []).push(n.name);
}
const delveBy: Record<string, number> = {};
for (const offers of Object.values(DELVE_SHOPS) as any[]) {
  for (const o of offers) delveBy[o.itemId] = o.marks;
}

function uniq(a: string[] = []): string[] { return [...new Set(a)]; }
function dropMobs(id: string) {
  const seen = new Set<string>(), out: any[] = [];
  for (const m of dropsBy[id] || []) { if (seen.has(m.id)) continue; seen.add(m.id); out.push({ id: m.id, name: m.name, chance: m.chance, dir: DIR[m.id] || null }); }
  return out;
}
function sourcesFor(id: string): any[] {
  const out: any[] = [];
  if (questBy[id]) out.push({ type: 'quest', label: `Quest: ${uniq(questBy[id]).join(', ')}` });
  if (delveBy[id] != null) out.push({ type: 'delve', label: `Delve vendor — ${delveBy[id]} Marks` });
  if (vendorBy[id]) out.push({ type: 'vendor', label: `Vendor: ${uniq(vendorBy[id]).join(', ')}` });
  if (dropsBy[id]) {
    const mobs = dropMobs(id);
    out.push({ type: 'drop', label: `Drops from ${mobs.slice(0, 3).map(m => m.name).join(', ')}${mobs.length > 3 ? ` +${mobs.length - 3} more` : ''}`, mobs });
  }
  if (!out.length) out.push({ type: 'other', label: 'Starting / crafted gear' });
  return out;
}

const gear = (Object.values(ITEMS) as any[])
  .filter(i => i.kind === 'armor' || i.kind === 'weapon')
  .map(i => {
    const q = quality(i.id);
    return {
      id: i.id,
      name: i.name,
      kind: i.kind,
      slot: i.slot || (i.kind === 'weapon' ? 'mainhand' : ''),
      slotLabel: SLOT_LABEL[i.slot] || (i.kind === 'weapon' ? 'Weapon' : 'Armor'),
      armorType: i.armorType || null,
      quality: i.quality || 'common',
      qualityName: q?.name || 'Common',
      stats: statLine(i.id),
      icon: `gear/_icons/${i.id}.png`,
      usable: (() => { const u = usableBy(i); return u.length >= (ALL_CLASSES as string[]).length ? null : u.map(cap); })(),
      restrict: restrictLabel(i, usableBy(i)),
      sources: sourcesFor(i.id),
    };
  })
  .sort((a, b) => {
    const qr = ['legendary', 'epic', 'rare', 'uncommon', 'common', 'poor'];
    return qr.indexOf(a.quality) - qr.indexOf(b.quality)
      || SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)
      || a.name.localeCompare(b.name);
  });

const slots = SLOT_ORDER.filter(s => gear.some(g => g.slot === s)).map(s => ({ id: s, label: SLOT_LABEL[s] }));
const out = { count: gear.length, slots, qualities: ['legendary', 'epic', 'rare', 'uncommon', 'common'], gear };

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
// also emit the icon id list to render
fs.writeFileSync(OUT.replace(/[^/\\]+$/, 'gear-icons.json'), JSON.stringify(gear.map(g => g.id)));
console.log(`wrote ${gear.length} gear items to ${OUT}`);
