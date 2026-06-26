// Generates reference/raids-and-dungeons.md — an overview + strategy guide for
// all instanced content (dungeons, raids, solo lead-ins), derived from the game
// source so it stays current. Per-instance detail pages live in dungeons/.
import { MOBS } from '../woc/src/sim/data.ts';
import { DUNGEON_LEASH_DISTANCE } from '../woc/src/sim/types.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import * as fs from 'node:fs';

const out = process.argv[2] || 'reference/raids-and-dungeons.md';
const ALL: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };

// Nythraxis temple instances live in the Drowned Temple zone; others link to their dungeon page.
function classify(players: number): { type: string; emoji: string } {
  if (players >= 10) return { type: 'Raid', emoji: '🐉' };
  if (players <= 1) return { type: 'Solo', emoji: '🧍' };
  return { type: 'Dungeon', emoji: '⚔️' };
}

function instanceInfo(id: string, def: any) {
  const mobIds = [...new Set((def.spawns || []).map((s: any) => s.mobId))];
  const mobs = mobIds.map((m) => ALL[m]).filter(Boolean);
  const lvls = mobs.flatMap((m: any) => [m.minLevel, m.maxLevel]).filter((n: any) => typeof n === 'number');
  const lo = lvls.length ? Math.min(...lvls) : 0;
  const hi = lvls.length ? Math.max(...lvls) : 0;
  const bosses = mobs.filter((m: any) => m.boss);
  return { mobs, lo, hi, bosses };
}

const fmtLvl = (lo: number, hi: number) => (lo === 0 && hi === 0) ? '—' : (lo === hi ? `${lo}` : `${lo}–${hi}`);

const entries = Object.entries(DUNGEON_DEFS) as [string, any][];
const rows: any[] = entries.map(([id, def]) => {
  const { lo, hi, bosses } = instanceInfo(id, def);
  const c = classify(def.suggestedPlayers);
  return { id, def, lo, hi, bosses, ...c };
}).sort((a, b) => (a.def.index ?? 0) - (b.def.index ?? 0));

const L: string[] = [];
L.push('# Raids & Dungeons');
L.push('');
L.push('Instanced group content — private copies of a zone you and your party clear for elite gear and quest objectives. This is the overview + strategy guide; each instance also has its own detail page with a route map, full pull list, and loot (linked below).');
L.push('');

// --- explainer ---
L.push('## Dungeons vs Raids');
L.push('');
L.push('| Format | Party size | What it is |');
L.push('|---|---|---|');
L.push('| 🧍 **Solo** | 1 | Story lead-ins you can clear alone. |');
L.push('| ⚔️ **Dungeon** | up to 5 | Standard group instances — a few elite pulls and a boss or two. |');
L.push('| 🐉 **Raid** | up to 10 | Large-scale encounters with mechanics that punish mistakes (see boss mechanics below). |');
L.push('');
L.push('- **Instances are private.** Entering takes your group into a separate copy, so you never compete with other players for pulls or loot.');
L.push(`- **Mobs leash.** Pulled enemies give up and reset if you drag them more than **${DUNGEON_LEASH_DISTANCE} yards** from their spawn — pull deliberately; don't over-run.`);
L.push('- **Party XP & loot** are shared with nearby members — stick together so everyone gets credit.');
L.push('- **Bring a balanced group** for dungeons/raids: someone to hold aggro, someone to heal, and damage. Solo lead-ins are tuned for one player.');
L.push('');

// --- master table ---
L.push('## All instances');
L.push('');
L.push('| Instance | Format | Players | Level | Bosses |');
L.push('|---|---|---|---|---|');
for (const r of rows) {
  const lvl = fmtLvl(r.lo, r.hi);
  const bosses = r.bosses.map((b: any) => b.name).join(', ') || '—';
  L.push(`| [${r.def.name}](../dungeons/${r.id}.md) | ${r.emoji} ${r.type} | ${r.def.suggestedPlayers} | ${lvl} | ${bosses} |`);
}
L.push('');

// --- how to run ---
L.push('## How to run an instance');
L.push('');
L.push('1. **Get the right level & group.** Match the level range above; fill the party for dungeons/raids.');
L.push('2. **Pull deliberately.** Clear trash toward the boss one pack at a time. If a fight goes bad, run — mobs leash and reset at ' + DUNGEON_LEASH_DISTANCE + ' yards.');
L.push('3. **Mind the tags.** **Boss** > Elite > Rare > Normal in danger and reward. Bosses hit hardest and drop the best gear.');
L.push('4. **Loot the boss.** Instance bosses are the main source of best-in-slot gear — see the [Best-in-Slot](../gear/bis.json) builds and each instance page for its drop table.');
L.push('5. **Watch boss cast bars.** Raid bosses have telegraphed mechanics (below). Reacting to the cast — not just DPS — is what clears them.');
L.push('');

// --- boss mechanics ---
L.push('## Boss mechanics');
L.push('');
L.push('### 🐉 Nythraxis — Nythraxis Raid Arena (10-player raid)');
L.push('- **The pillars are the fight.** They take **time to charge**, and there is a **limited window** to use them.');
L.push('- **Watch the death-attack cast** under Nythraxis\'s HP bar — when he starts charging it, drop everything.');
L.push('- **Race to a charged pillar within the window.** If you\'re **too slow to the pillars, it\'s a wipe (GG)** — the death attack one-shots the raid.');
L.push('- Priority: pillar timing **over** damage. Assign players to pillars ahead of each charge.');
L.push('');
const otherBosses = rows.flatMap((r) => r.bosses.map((b: any) => ({ ...b, inst: r.def.name, id: r.id, type: r.type })))
  .filter((b) => !/nythraxis/i.test(b.name));
if (otherBosses.length) {
  L.push('### Other bosses');
  for (const b of otherBosses) {
    const lvl = b.minLevel === b.maxLevel ? `${b.minLevel}` : `${b.minLevel}–${b.maxLevel}`;
    L.push(`- **${b.name}** — level ${lvl}, in [${b.inst}](../dungeons/${b.id}.md). See the instance page + bestiary for its pull and loot.`);
  }
  L.push('');
}

L.push('## Per-instance detail pages');
L.push('');
for (const r of rows) L.push(`- [${r.def.name}](../dungeons/${r.id}.md) — ${r.emoji} ${r.type}, ${r.def.suggestedPlayers}-player, level ${fmtLvl(r.lo, r.hi)}`);
L.push('');
L.push('_Auto-generated from the game source; updates with each release._');

fs.writeFileSync(out, L.join('\n') + '\n');
console.log(`wrote raids & dungeons guide (${rows.length} instances, ${rows.filter(r => r.type === 'Raid').length} raid) to ${out}`);
