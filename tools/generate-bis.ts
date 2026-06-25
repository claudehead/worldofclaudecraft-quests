import { ITEMS, MOBS, NPCS, QUESTS } from '../woc/src/sim/data.ts';
import { DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import { DELVE_MOBS, DELVE_SHOPS } from '../woc/src/sim/content/delves/index.ts';
import { GUIDE_CLASSES } from '../woc/src/guide/content.generated.ts';
import { quality, statLine } from './iteminfo.ts';
import { bestiaryDirByMob } from './bestiary-index.ts';
import * as fs from 'node:fs';

const DIR = bestiaryDirByMob();

const OUT = process.argv[2] || '/tmp/gen/bis.json';
const ALL_MOBS: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS, ...DELVE_MOBS };
const SLOTS = ['mainhand', 'helmet', 'shoulder', 'chest', 'gloves', 'waist', 'legs', 'feet'];
const SLOT_LABEL: Record<string, string> = { mainhand: 'Weapon', helmet: 'Head', shoulder: 'Shoulder', chest: 'Chest', gloves: 'Hands', waist: 'Waist', legs: 'Legs', feet: 'Feet' };
const QRANK: Record<string, number> = { poor: 0, common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };

// Per-class stat-weight heuristic (primary-spec oriented). The game doesn't
// restrict armor by type, so "best in slot" = the highest weighted-stat item
// the class wants. dps weights melee swing damage; casters value the stats.
type W = { str?: number; agi?: number; sta?: number; int?: number; spi?: number; armor?: number; dps?: number };
const WEIGHTS: Record<string, W> = {
  warrior: { str: 2.5, sta: 1.5, agi: 1, armor: 0.1, dps: 3 },
  paladin: { str: 2.3, sta: 1.6, int: 0.8, spi: 0.4, agi: 0.6, armor: 0.1, dps: 2.5 },
  hunter: { agi: 2.5, sta: 1.2, str: 0.6, armor: 0.06, dps: 3 },
  rogue: { agi: 2.5, sta: 1.2, str: 0.8, armor: 0.05, dps: 3.2 },
  shaman: { int: 1.4, sta: 1.4, str: 1, agi: 1, spi: 0.8, armor: 0.07, dps: 1.5 },
  mage: { int: 2.5, spi: 1, sta: 1, armor: 0.02, dps: 0.4 },
  warlock: { int: 2.5, spi: 0.8, sta: 1.3, armor: 0.02, dps: 0.4 },
  priest: { int: 2, spi: 1.8, sta: 1, armor: 0.02, dps: 0.3 },
  druid: { int: 1.6, agi: 1.4, sta: 1.3, spi: 1, str: 0.6, armor: 0.05, dps: 1.2 },
};
// the stat(s) a class actually itemises around — used to keep thin slots on-class
const PRIMARY: Record<string, string[]> = {
  warrior: ['str'], paladin: ['str', 'int'], hunter: ['agi'], rogue: ['agi'],
  shaman: ['int', 'agi', 'str'], mage: ['int'], warlock: ['int'], priest: ['int', 'spi'], druid: ['int', 'agi'],
};

// ---- sources (same as gear) ----
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
function sourcesFor(id: string) {
  const out: any[] = [];
  if (questBy[id]) out.push({ type: 'quest', label: `Quest: ${uniq(questBy[id]).join(', ')}` });
  if (delveBy[id] != null) out.push({ type: 'delve', label: `Delve vendor — ${delveBy[id]} Marks` });
  if (vendorBy[id]) out.push({ type: 'vendor', label: `Vendor: ${uniq(vendorBy[id]).join(', ')}` });
  if (dropsBy[id]) { const m = dropMobs(id); out.push({ type: 'drop', label: `Drops from ${m.slice(0, 3).map(x => x.name).join(', ')}${m.length > 3 ? ` +${m.length - 3} more` : ''}`, mobs: m }); }
  if (!out.length) out.push({ type: 'other', label: 'Starting / crafted gear' });
  return out;
}

function score(item: any, w: W): number {
  const s = item.stats || {};
  let v = 0;
  for (const k of ['str', 'agi', 'sta', 'int', 'spi'] as const) v += (s[k] || 0) * (w[k] || 0);
  v += (s.armor || 0) * (w.armor || 0);
  if (item.weapon) { const dps = (item.weapon.min + item.weapon.max) / 2 / item.weapon.speed; v += dps * (w.dps || 0); }
  v += (QRANK[item.quality] || 0) * 1.5; // tie-break toward rarity
  return v;
}

const armorBySlot: Record<string, any[]> = {};
const weapons: any[] = [];
for (const i of Object.values(ITEMS) as any[]) {
  if (i.kind === 'armor' && i.slot) (armorBySlot[i.slot] ||= []).push(i);
  else if (i.kind === 'weapon') weapons.push(i);
}

function bisItem(i: any) {
  const q = quality(i.id);
  return { id: i.id, name: i.name, slot: i.slot || 'mainhand', slotLabel: SLOT_LABEL[i.slot] || 'Weapon', quality: i.quality || 'common', qualityName: q?.name || 'Common', stats: statLine(i.id), icon: `gear/_icons/${i.id}.png`, sources: sourcesFor(i.id) };
}

const isCaster = (w: W) => (w.dps || 0) < 1;
function hasPrimary(item: any, prim: string[]): boolean {
  const s = item.stats || {};
  return prim.some(k => (s[k] || 0) > 0);
}

const classes = GUIDE_CLASSES.map((c: any) => {
  const w = WEIGHTS[c.id] || WEIGHTS.warrior;
  const prim = PRIMARY[c.id] || ['str'];
  const slots = SLOTS.map(slot => {
    let pool = slot === 'mainhand' ? weapons : (armorBySlot[slot] || []);
    if (!pool.length) return null;
    // keep the pick on-class: prefer items carrying a primary stat when any exist.
    // (Melee weapons are dps-led, so only casters filter weapons by int.)
    const filterByStat = slot !== 'mainhand' || isCaster(w);
    if (filterByStat) {
      const on = pool.filter(i => hasPrimary(i, prim));
      if (on.length) pool = on;
    }
    const best = pool.map(i => ({ i, s: score(i, w) })).sort((a, b) => b.s - a.s)[0];
    return { slot, slotLabel: SLOT_LABEL[slot], item: bisItem(best.i) };
  }).filter(Boolean);
  return { id: c.id, name: c.id[0].toUpperCase() + c.id.slice(1), render: `classes/_class-renders/${c.id}.png`, roles: c.roles || [], slots };
});

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ classes }));
console.log(`wrote BiS for ${classes.length} classes (${SLOTS.length} slots each)`);
