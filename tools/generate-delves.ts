import { ITEMS } from '../woc/src/sim/data.ts';
import { COLLAPSED_RELIQUARY_DELVE, COLLAPSED_RELIQUARY_MODULES, DROWNED_LITANY_DELVE, DROWNED_LITANY_MODULES, DELVE_AFFIXES, DELVE_COMPANIONS, DELVE_MOBS, DELVE_SHOPS, COMPANION_UPGRADE_COSTS } from '../woc/src/sim/content/delves/index.ts';
import { ACTION_DELTA, ANTE_TO_TIER, ANTE_TO_PAGES, ANTE_TO_TRIES, ANTE_TO_STEP_TIMEOUT_MS } from '../woc/src/sim/lockpick.ts';
import { LOCKPICK_TIER_PRESETS, LOCKPICK_TIER_REWARD } from '../woc/src/sim/content/delves/lockpick_tiers.ts';
import { RITE_INTENSITY } from '../woc/src/sim/delves/rite_tuning.ts';
import { qualityDot, statLine } from './iteminfo.ts';
import * as fs from 'node:fs';

// Which delves end on the Drowned Reliquary Rite (a shrine-sequence puzzle) instead
// of the lockpick chest. Mirrors the game's own finale branch in
// woc/src/sim/delves/runs.ts (onDelveBossDefeated: `if (run.delveId === 'drowned_litany')`).
const RITE_DELVES = new Set<string>(['drowned_litany']);

// Module defs per delve, so the enemy roster can be resolved generically from each
// delve's modules → spawnSets → mobIds (no per-delve id-prefix hardcoding).
const MODULES_BY_DELVE: Record<string, any> = {
  [COLLAPSED_RELIQUARY_DELVE.id]: COLLAPSED_RELIQUARY_MODULES,
  [DROWNED_LITANY_DELVE.id]: DROWNED_LITANY_MODULES,
};
function rosterFor(d: any): any[] {
  const mods = MODULES_BY_DELVE[d.id] || {};
  const ids = new Set<string>();
  for (const key of [...(d.modules || []), d.finaleModuleId].filter(Boolean)) {
    const mod = mods[key]; if (!mod) continue;
    for (const ss of (mod.spawnSets || [])) for (const sp of (ss.spawns || [])) if (sp.mobId) ids.add(sp.mobId);
  }
  for (const b of (d.bosses || [])) ids.add(b);
  return [...ids].map((id) => (DELVE_MOBS as any)[id]).filter(Boolean);
}

const ACTION_LABEL: Record<string, string> = { hardSet: 'Hard Set', set: 'Set', steady: 'Steady', ease: 'Ease', drop: 'Drop' };
function depthText(delta: number): string {
  if (delta === 0) return 'hold position';
  const n = Math.abs(delta);
  return delta < 0 ? `up ${n} (shallower)` : `down ${n} (deeper)`;
}

// Full "Tumbler's Path" lockpicking guide, built from the game's real constants.
function lockpickSection(d: any): string[] {
  const L: string[] = [];
  L.push(`## Chests & lockpicking — "Tumbler's Path"`);
  L.push('');
  L.push(`Clearing the delve opens a **locked chest** guarded by a lockpicking minigame. The pick advances **one column at a time** through a fogged grid of tumblers — thread the open channel, seat exactly on each gate, dodge the ward-traps, and reach the bolt at the end.`);
  L.push('');
  L.push(`> 🔓 **Practice for free:** try the interactive [Lockpick Practice game](#/lockpick) right here on the guide — same tumbler mechanics, no real chest at stake — before you run a delve.`);
  L.push('');
  L.push(`> 📺 **Need help?** Watch a [lockpicking walkthrough video](https://discord.com/channels/1515097174378020894/1515979731760320522/1519349657938165930) on the community Discord.`);
  L.push('');
  L.push(`### The five pick actions`);
  L.push('');
  L.push(`Each input moves the pick forward one column; you choose how deep it goes:`);
  L.push('');
  L.push(`| Action | Moves the pick |`);
  L.push(`|---|---|`);
  for (const [act, delta] of Object.entries(ACTION_DELTA)) L.push(`| **${ACTION_LABEL[act] || act}** | ${depthText(delta as number)} |`);
  L.push('');
  L.push(`- Only the next few columns are **lit** — the rest is fog, so plan ahead within the window.`);
  L.push(`- You must land **exactly** on each tumbler **gate** and finish on the bolt.`);
  L.push(`- **Ward-traps** look like open rows but **jam the lock instantly on contact** — avoid them.`);
  L.push(`- The forgiveness band is just **one row wide** here, so you must thread the true path precisely.`);
  L.push('');
  L.push(`### Board difficulty (by delve tier)`);
  L.push('');
  L.push(`| Tier | Grid | Gates | Ward-traps | Lit columns |`);
  L.push(`|---|---|---:|---:|---:|`);
  for (const t of d.tiers || []) {
    const p = (LOCKPICK_TIER_PRESETS as any)[t.id];
    if (p) L.push(`| ${t.label} | ${p.cols}×${p.rows} | ${p.gateCount} | ${p.trapCount || 0} | ${p.visibilityWindow} |`);
  }
  L.push('');
  L.push(`### Your ante = your loot tier`);
  L.push('');
  L.push(`Before you start you commit an **ante** (1–3). It fixes the reward, how many lock "pages" you must clear back-to-back **flawlessly**, how many tries you get, and a **per-move timer**. A single slip, bind, or trap jams that try.`);
  L.push('');
  L.push(`| Ante | Loot tier | Pages (flawless) | Tries | Time per move | Reward bonus |`);
  L.push(`|---:|---|---:|---:|---:|---|`);
  for (const ante of [3, 2, 1]) {
    const tier = (ANTE_TO_TIER as any)[ante];
    const rw = (LOCKPICK_TIER_REWARD as any)[tier];
    const bonus = ante === 3 ? 'base reward' : `+${rw.bonusMarks} Marks, ${rw.copperMult}× copper`;
    L.push(`| ${ante} | ${tier[0].toUpperCase() + tier.slice(1)} | ${(ANTE_TO_PAGES as any)[ante]} | ${(ANTE_TO_TRIES as any)[ante]} | ${(ANTE_TO_STEP_TIMEOUT_MS as any)[ante] / 1000}s | ${bonus} |`);
  }
  L.push('');
  L.push(`> **Premium (ante 1)** is the brutal one — a 3-page gauntlet, one try, 3 seconds per move — but pays the most (and a chance at the class signature rare). Just want the gear? **Ante 3** is forgiving: one page, three tries, nine seconds per move, for the base reward.`);
  L.push('');
  L.push(`### Tips`);
  L.push('');
  L.push(`- Plan a couple of moves ahead inside the lit window — the pick only goes forward, so overshooting a gate jams the page.`);
  L.push(`- Use **Steady** when the channel runs flat; don't over-correct with Hard Set / Drop.`);
  L.push(`- Heroic locks are wider with more gates, more traps, and heavier fog — drop your ante if you're not confident.`);
  L.push(`- A **Bountiful Coffer** guarantees your class's signature rare plus a premium green on a solve.`);
  L.push('');
  return L;
}

// The Drowned Reliquary Rite finale — the shrine-sequence (Simon-says) puzzle that
// REPLACES the lockpick chest for the Drowned Litany. Built from the game's real
// constants (RITE_INTENSITY in woc/src/sim/delves/rite_tuning.ts).
const CAP: Record<string, string> = { low: 'Low', medium: 'Medium', premium: 'Premium' };
function riteSection(_d: any): string[] {
  const L: string[] = [];
  L.push(`## The finale — the Drowned Reliquary Rite`);
  L.push('');
  L.push(`This delve has **no lockpick chest.** When **Sister Nhalia** falls, a drowned reliquary rises ringed by **four shrines** — a **bell**, a **candle**, a **reed**, and a **skull**. The reliquary lights them in a sequence; repeat it back in order, like a memory rite, to claim your spoils.`);
  L.push('');
  L.push(`> 🔔 It's a **"Simon says"** puzzle, not a lock. There is no pick, no timer per touch, and no ward-traps — just watch the sequence, then tap the shrines back in the same order.`);
  L.push('');
  L.push(`### How the rite runs`);
  L.push('');
  L.push(`1. **Pick a difficulty** when the reliquary rises — Easy, Medium or Hard. Harder rites are longer and show the sequence fewer times, but raise the **loot ceiling**.`);
  L.push(`2. **Watch the playback.** The shrines light one at a time (about **0.6s** apart), and the whole sequence replays a few times before input opens.`);
  L.push(`3. **Repeat the sequence** by touching the shrines in order. A **wrong touch costs 3% of your health** and burns a try; if you have tries left, the sequence replays from the top.`);
  L.push(`4. **Run out of tries** and the reliquary still opens — but only on **low-tier** loot.`);
  L.push('');
  L.push(`### Difficulty (you choose)`);
  L.push('');
  L.push(`| Difficulty | Sequence length | Times shown | Tries | Wrong touches allowed | Loot ceiling |`);
  L.push(`|---|---:|---:|---:|---:|---|`);
  for (const key of ['easy', 'medium', 'hard'] as const) {
    const c = (RITE_INTENSITY as any)[key];
    L.push(`| **${key[0].toUpperCase() + key.slice(1)}** | ${c.length} | ${c.playbacks} | ${c.tries} | ${c.tries - 1} | ${CAP[c.ceiling] || c.ceiling} |`);
  }
  L.push('');
  L.push(`> **Hard** is the memory test — a 6-step sequence shown just **once**, with a single try — but it lifts the loot ceiling to **Premium**. **Easy** shows a 4-step sequence **three times** and forgives two mistakes, capped at low-tier loot.`);
  L.push('');
  L.push(`The rite draws from the **same reward tiers** as the other delve's lockpick chest, and the Drowned Litany pays **double Marks** for it. So a clean **Hard** rite is this delve's route to premium loot and the class signature rare.`);
  L.push('');
  L.push(`### Tips`);
  L.push('');
  L.push(`- **Don't rush.** There's no per-touch timer — the pressure is memory, not speed. Wait for the full playback before you touch anything.`);
  L.push(`- **Chunk the sequence** (say it aloud: "bell, skull, reed…"). Four shrines and up to six steps is very repeatable once you name them.`);
  L.push(`- **Match difficulty to your memory, not your gear greed** — a failed Hard still opens on low loot, but a clean Medium beats a fumbled Hard.`);
  L.push(`- Each wrong touch chips **3% HP**, so on Hard a few misses plus boss splash can actually threaten a squishy — let a healer top you between attempts.`);
  L.push('');
  return L;
}

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

  // enemy roster — resolved from the delve's own modules (works for any delve)
  const roster = rosterFor(d);
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

  // finale: the shrine-rite (Drowned Litany) or the lockpick chest (everything else)
  const finale = RITE_DELVES.has(d.id) ? riteSection(d) : lockpickSection(d);
  for (const line of finale) L.push(line);

  if (d.leaveText) { L.push(`> ${d.leaveText}`); L.push(''); }
  L.push(`[← All delves](README.md)`);
  L.push('');
  return L.join('\n');
}

fs.mkdirSync(OUT, { recursive: true });
const delves = [COLLAPSED_RELIQUARY_DELVE, DROWNED_LITANY_DELVE];
const idx: string[] = [];
idx.push(`# Delves`);
idx.push('');
idx.push(`Replayable, scalable mini-instances with companions, difficulty tiers, random affixes, a **Marks** currency, and a finale reward — a lockpick chest, or the Drowned Litany's shrine-sequence rite.`);
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
