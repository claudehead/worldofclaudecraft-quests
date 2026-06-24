import { GUIDE_CLASSES } from '../woc/src/guide/content.generated.ts';
import { ABILITIES } from '../woc/src/sim/data.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/out-classes';

const RESOURCE: Record<string, string> = {
  rage: 'Rage', mana: 'Mana', energy: 'Energy', focus: 'Focus',
};
const ROLE: Record<string, string> = { tank: 'Tank', dps: 'DPS', healer: 'Healer', heal: 'Healer' };

function roleLabel(r: string): string { return ROLE[r] || r; }

// readable description: blanks out $tokens (formula placeholders) the game fills at runtime
function desc(s: string | undefined): string {
  if (!s) return '';
  return s.replace(/\$\{?[a-zA-Z]+\}?/g, 'X').replace(/\s+/g, ' ').trim();
}

function fmtCooldown(cd: number): string {
  if (!cd) return '—';
  if (cd >= 60) return `${cd % 60 === 0 ? cd / 60 : (cd / 60).toFixed(1)} min`;
  return `${cd}s`;
}

function abilityRow(a: any): string {
  const learn = a.learnLevel ?? 1;
  const ranks = (a.ranks || []).map((r: any) => r.level).filter((l: number) => l && l !== learn);
  const learnCell = ranks.length ? `${learn} _(ranks: ${ranks.join(', ')})_` : `${learn}`;
  const cast = !a.castTime ? 'Instant' : `${a.castTime}s`;
  const cost = a.cost ? `${a.cost}` : '—';
  const cd = fmtCooldown(a.cooldown || 0);
  const range = a.range ? `${a.range}` : 'Melee';
  const school = a.school && a.school !== 'physical' ? a.school[0].toUpperCase() + a.school.slice(1) : 'Physical';
  return `| ${a.name} | ${learnCell} | ${cost} | ${cast} | ${cd} | ${range} | ${school} | ${desc(a.description)} |`;
}

function classPage(c: any): string {
  const abilities = Object.values(ABILITIES)
    .filter((a: any) => a.class === c.id)
    .sort((a: any, b: any) => (a.learnLevel ?? 1) - (b.learnLevel ?? 1) || a.name.localeCompare(b.name));

  const L: string[] = [];
  const title = c.id[0].toUpperCase() + c.id.slice(1);
  L.push(`# ${title}`);
  L.push('');
  L.push(`<img src="_class-renders/${c.id}.png" width="170" align="right" alt="${title}">`);
  L.push('');
  L.push(`| | |`);
  L.push(`|---|---|`);
  L.push(`| **Resource** | ${RESOURCE[c.resource] || c.resource} |`);
  L.push(`| **Roles** | ${(c.roles || []).map(roleLabel).join(', ')} |`);
  L.push(`| **Specs** | ${(c.specs || []).map((s: any) => `${s.name} (${roleLabel(s.role)})`).join(' · ')} |`);
  L.push('');

  if (c.specs?.length) {
    L.push(`## Specializations`);
    L.push('');
    for (const s of c.specs) {
      const sig = ABILITIES[s.signature];
      L.push(`- **${s.name}** — _${roleLabel(s.role)}_. Signature ability: **${sig?.name || s.signature}**${sig ? ` (learned at level ${sig.learnLevel ?? 1})` : ''}.`);
    }
    L.push('');
  }

  L.push(`## Abilities`);
  L.push('');
  L.push(`${abilities.length} abilities, in the order you learn them. "Ranks" shows the levels where the ability gets stronger.`);
  L.push('');
  L.push(`| Ability | Learns at (lvl) | Cost | Cast | Cooldown | Range | School | Effect |`);
  L.push(`|---|---|---:|---|---|---:|---|---|`);
  for (const a of abilities) L.push(abilityRow(a));
  L.push('');
  L.push(`---`);
  L.push('');
  L.push(`[← All classes](README.md)`);
  L.push('');
  return L.join('\n');
}

fs.mkdirSync(OUT, { recursive: true });
const idx: string[] = [];
idx.push(`# Classes`);
idx.push('');
idx.push(`The 9 playable classes. Each page lists every ability with the level you learn it, so you can plan your leveling.`);
idx.push('');
idx.push(`| Class | Resource | Roles | Specs |`);
idx.push(`|---|---|---|---|`);
for (const c of GUIDE_CLASSES) {
  const title = c.id[0].toUpperCase() + c.id.slice(1);
  fs.writeFileSync(`${OUT}/${c.id}.md`, classPage(c));
  idx.push(`| [${title}](${c.id}.md) | ${RESOURCE[c.resource] || c.resource} | ${(c.roles || []).map(roleLabel).join(', ')} | ${(c.specs || []).map((s: any) => s.name).join(', ')} |`);
}
idx.push('');
fs.writeFileSync(`${OUT}/README.md`, idx.join('\n'));
console.log(`wrote ${GUIDE_CLASSES.length} class pages to ${OUT}`);
