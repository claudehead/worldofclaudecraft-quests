// Generates reference/companions.md — the delve companions guide, derived from
// DELVE_COMPANIONS + COMPANION_UPGRADE_COSTS in the game source.
import { DELVE_COMPANIONS, COMPANION_UPGRADE_COSTS, MOBS } from '../woc/src/sim/data.ts';
import * as fs from 'node:fs';

const out = process.argv[2] || 'reference/companions.md';
const companions = Object.values(DELVE_COMPANIONS as Record<string, any>);
const costs = COMPANION_UPGRADE_COSTS as Record<string, { marks: number; copper: number }>;

const roleEmoji: Record<string, string> = { healer: '💚 Healer', tank: '🛡️ Tank', dps: '⚔️ Damage', damage: '⚔️ Damage', support: '✨ Support' };

const L: string[] = [];
L.push('# Delve Companions');
L.push('');
L.push('Companions are hired allies that fight alongside you in [delves](../delves/README.md) — handy when you\'re running solo or short a role. You buy them with **Marks** (the delve currency) and upgrade their rank to scale their power.');
L.push('');

// --- roster ---
L.push('## Roster');
L.push('');
L.push('| Companion | Role | Notes |');
L.push('|---|---|---|');
for (const c of companions) {
  const role = roleEmoji[c.role] || c.role || '—';
  const mob = (MOBS as any)[c.mobTemplateId];
  const note = c.role === 'healer' ? 'Keeps you alive on long delve runs.' : mob ? `Based on ${mob.name}.` : '';
  L.push(`| **${c.name}** | ${role} | ${note} |`);
}
L.push('');

// --- upgrades ---
L.push('## Ranks & upgrade costs');
L.push('');
L.push('A companion **scales by its purchased rank**, not your level — so rank it up to keep it useful as you go deeper. Costs (cumulative as you climb):');
L.push('');
L.push('| Rank | Cost to reach |');
L.push('|---|---|');
L.push('| 1 | _(starting rank — included when hired)_ |');
const ranks = Object.keys(costs).sort((a, b) => Number(a) - Number(b));
for (const r of ranks) {
  const c = costs[r];
  const parts: string[] = [];
  if (c.marks) parts.push(`${c.marks} Marks`);
  if (c.copper) parts.push(`${c.copper} copper`);
  L.push(`| ${r} | ${parts.join(' + ') || '—'} |`);
}
L.push('');
const totalMarks = ranks.reduce((s, r) => s + (costs[r].marks || 0), 0);
L.push(`- **Total to fully rank up:** ${totalMarks} Marks (rank ${ranks[0]} → ${ranks[ranks.length - 1]}).`);
L.push('- **Marks** are earned by running delves — spend them at the delve **Marks vendor** on companions (and other delve rewards).');
L.push('');

L.push('## Tips');
L.push('');
L.push('- **Solo or missing a healer?** Hire **' + (companions.find((c) => c.role === 'healer')?.name || 'a healer companion') + '** before a delve — sustained healing turns risky pulls into safe ones.');
L.push('- **Rank up early.** Since companions scale by rank (not your level), an un-upgraded companion falls behind in deeper delves.');
L.push('- Budget your **Marks** — upgrading a companion competes with other delve-vendor purchases.');
L.push('');
L.push('_Auto-generated from the game source; updates with each release._');

fs.writeFileSync(out, L.join('\n') + '\n');
console.log(`wrote companions guide (${companions.length} companion(s), ranks up to ${ranks[ranks.length - 1] || 1}) to ${out}`);
