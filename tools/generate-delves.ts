import { ITEMS } from '../woc/src/sim/data.ts';
import { COLLAPSED_RELIQUARY_DELVE, DELVE_AFFIXES, DELVE_COMPANIONS, DELVE_MOBS, DELVE_SHOPS, COMPANION_UPGRADE_COSTS } from '../woc/src/sim/content/delves/index.ts';
import { qualityDot, statLine } from './iteminfo.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/out-delves';
const itemName = (id: string) => (ITEMS as any)[id]?.name || id;

const GATE: Record<string, string> = {
  available: 'Available from the start',
};
function gateLabel(g: string): string {
  if (GATE[g]) return GATE[g];
  if (g.startsWith('clears:')) return `Unlocks after ${g.split(':')[1]} clears`;
  if (g === 'heroicClear') return 'Unlocks after a Heroic clear';
  return g;
}

function armorTypeOf(id: string): string {
  const it: any = (ITEMS as any)[id];
  if (it?.kind === 'armor') {
    const at = it.armorType ? `${it.armorType[0].toUpperCase()}${it.armorType.slice(1)} ` : '';
    return `${at}armor`;
  }
  if (it?.kind === 'weapon') return 'Weapon';
  return it?.kind || '';
}

function delvePage(d: any): string {
  const L: string[] = [];
  L.push(`# ${d.name}`);
  L.push('');
  L.push(`A replayable **delve** — a short, scalable instance you run solo or in a small group, with a companion, tiers, affixes, and a currency (**Marks**) you spend at the delve vendor.`);
  L.push('');
  L.push(`| | |`);
  L.push(`|---|---|`);
  L.push(`| **Theme** | ${d.theme} |`);
  L.push(`| **Minimum level** | ${d.minLevel} |`);
  L.push(`| **Suggested players** | ${d.suggestedPlayers} |`);
  L.push(`| **Entrance** | overworld portal ~x:${Math.round(d.doorPos.x)}, z:${Math.round(d.doorPos.z)} |`);
  L.push(`| **Objective** | ${d.objective === 'kill_boss' ? 'Defeat the final boss' : d.objective} |`);
  if (d.bosses?.length) L.push(`| **Final boss** | ${d.bosses.map((b: string) => DELVE_MOBS[b]?.name || b).join(', ')} |`);
  L.push('');
  if (d.enterText) { L.push(`> ${d.enterText}`); L.push(''); }

  // tiers
  L.push(`## Difficulty tiers`);
  L.push('');
  L.push(`| Tier | Enemy levels | Affixes | Reward | Min level | First-clear XP | Repeat XP |`);
  L.push(`|---|---|---:|---|---:|---:|---:|`);
  for (const t of d.tiers || []) {
    L.push(`| ${t.label} | +${t.enemyLevelBonus} | ${t.affixCount} | ${t.rewardMult}× | ${t.minPlayerLevel ?? d.minLevel} | ${t.firstClearXp ?? '—'} | ${t.repeatClearXp ?? '—'} |`);
  }
  L.push('');

  // affixes
  const affixes = Object.values(DELVE_AFFIXES).filter((a: any) => a.themes.includes(d.theme));
  if (affixes.length) {
    L.push(`## Affixes`);
    L.push('');
    L.push(`Higher tiers roll random modifiers. Possible affixes for a **${d.theme}** delve:`);
    L.push('');
    for (const a of affixes as any[]) L.push(`- **${a.name}**`);
    L.push('');
  }

  // companion
  if (d.autoCompanionId) {
    const c: any = DELVE_COMPANIONS[d.autoCompanionId];
    if (c) {
      L.push(`## Companion`);
      L.push('');
      L.push(`You're joined by **${c.name}** (${c.role}). Companions can be upgraded with Marks:`);
      L.push('');
      L.push(`| Rank | Cost |`);
      L.push(`|---|---|`);
      for (const [rank, cost] of Object.entries(COMPANION_UPGRADE_COSTS) as any[]) {
        L.push(`| ${rank} | ${cost.marks} Marks${cost.copper ? ` + ${cost.copper}c` : ''} |`);
      }
      L.push('');
    }
  }

  // enemy roster
  const roster = Object.values(DELVE_MOBS).filter((m: any) => m.id.startsWith('reliquary_') || (d.bosses || []).includes(m.id));
  if (roster.length) {
    L.push(`## Enemies`);
    L.push('');
    L.push(`| Enemy | Level | Tier |`);
    L.push(`|---|---|---|`);
    for (const m of roster.sort((a: any, b: any) => a.minLevel - b.minLevel || (a.boss ? 1 : 0) - (b.boss ? 1 : 0)) as any[]) {
      const tier = m.boss ? '**Boss**' : m.elite ? 'Elite' : 'Normal';
      const lvl = m.minLevel === m.maxLevel ? `${m.minLevel}` : `${m.minLevel}–${m.maxLevel}`;
      L.push(`| ${m.name} | ${lvl} | ${tier} |`);
    }
    L.push('');
  }

  // shop
  const shop = (DELVE_SHOPS as any)[d.id] || [];
  if (shop.length) {
    L.push(`## Marks vendor`);
    L.push('');
    L.push(`Spend **Marks** (earned from clears) at the delve vendor:`);
    L.push('');
    L.push(`| Item | Type | Cost | Unlock |`);
    L.push(`|---|---|---:|---|`);
    for (const o of shop) {
      const icon = `<img src="_delve-icons/${o.itemId}.png" width="22" alt="">`;
      const stats = statLine(o.itemId);
      const type = stats ? `${armorTypeOf(o.itemId)} · ${stats}` : armorTypeOf(o.itemId);
      L.push(`| ${icon} ${qualityDot(o.itemId)} ${itemName(o.itemId)} | ${type} | ${o.marks} Marks | ${gateLabel(o.gate)} |`);
    }
    L.push('');
  }

  // lockpicking
  L.push(`## Chests & lockpicking`);
  L.push('');
  L.push(`Delves contain locked chests opened with a **lockpicking minigame** (a grid of gates and traps that gets harder at higher tiers). Cracking them yields bonus loot scaled to the chest's tier.`);
  L.push('');

  if (d.leaveText) { L.push(`> ${d.leaveText}`); L.push(''); }
  L.push(`[← All delves](README.md)`);
  L.push('');
  return L.join('\n');
}

fs.mkdirSync(OUT, { recursive: true });
const delves = [COLLAPSED_RELIQUARY_DELVE];
const idx: string[] = [];
idx.push(`# Delves`);
idx.push('');
idx.push(`Replayable, scalable mini-instances with companions, difficulty tiers, random affixes, a **Marks** currency, and lockpickable chests.`);
idx.push('');
idx.push(`| Delve | Theme | Min level | Players | Boss |`);
idx.push(`|---|---|---:|---:|---|`);
for (const d of delves) {
  fs.writeFileSync(`${OUT}/${d.id}.md`, delvePage(d));
  idx.push(`| [${d.name}](${d.id}.md) | ${d.theme} | ${d.minLevel} | ${d.suggestedPlayers} | ${(d.bosses || []).map((b: string) => DELVE_MOBS[b]?.name || b).join(', ')} |`);
}
idx.push('');
fs.writeFileSync(`${OUT}/README.md`, idx.join('\n'));

// emit the shop item ids so their icons can be rendered
const shopItems = new Set<string>();
for (const d of delves) for (const o of (DELVE_SHOPS as any)[d.id] || []) shopItems.add(o.itemId);
fs.writeFileSync(`${OUT}/_shop-items.json`, JSON.stringify([...shopItems], null, 0));
console.log(`wrote ${delves.length} delve page(s) + ${shopItems.size} shop items to ${OUT}`);
