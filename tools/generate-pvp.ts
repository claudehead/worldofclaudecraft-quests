import { POWERUPS } from '../woc/src/sim/content/augments.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/pvp.md';
// effect summaries from each power-up's buffs (same derivation as the augments tab)
function effects(p: any): string {
  const out: string[] = [];
  for (const b of p.buffs || []) {
    if (b.kind === 'buff_speed') out.push(`+${Math.round((b.value - 1) * 100)}% movement speed`);
    else if (b.kind === 'buff_scale') out.push(b.value < 1 ? 'shrinks you (harder to hit)' : 'grows you (bigger, slower)');
    else if (b.kind === 'buff_haste') out.push(`+${Math.round((b.value - 1) * 100)}% attack/cast speed`);
    else if (b.kind === 'buff_dmg' || b.kind === 'buff_damage') out.push(`+${Math.round((b.value - 1) * 100)}% damage`);
    else if (b.kind === 'buff_jump') out.push('huge jump height');
    else out.push(`${b.kind.replace(/^buff_/, '')} ${b.value}`);
  }
  return out.join(', ') || '—';
}

const L: string[] = [];
L.push(`# PvP — the Ashen Coliseum`);
L.push('');
L.push(`Step into the Coliseum to fight other players in ranked brackets. Win and your rating climbs; lose and it dips (with a floor so a bad run can't tank you). Three formats:`);
L.push('');
L.push(`| Format | Players | What it is |`);
L.push(`|---|---|---|`);
L.push(`| **1v1** | 2 | A straight duel — your kit vs theirs. |`);
L.push(`| **2v2** | 4 | Two-player teams; coordination and peeling matter. |`);
L.push(`| **Fiesta** | free-for-all | A chaotic brawl where **power-ups** spawn on the field — grab them to swing the fight. |`);
L.push('');

L.push(`## Fiesta power-ups`);
L.push('');
L.push(`In Fiesta, power-ups periodically spawn (with a short telegraph before they're grabbable). Run over one to claim its buff for a few seconds — they're the heart of the mode.`);
L.push('');
L.push(`| Power-up | Lasts | Effect |`);
L.push(`|---|---:|---|`);
for (const p of POWERUPS) L.push(`| **${p.name}** | ${p.duration}s | ${effects(p)} |`);
L.push('');
L.push(`_Power-up effects are read from the game data; grab timing and spawn cadence are tuned by the match._`);
L.push('');

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, L.join('\n'));
console.log(`wrote PvP guide (${POWERUPS.length} power-ups)`);
