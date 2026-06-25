import { WARLOCK_PET_MOBS } from '../woc/src/sim/content/warlock_pets.ts';
import * as mf from '../woc/src/render/characters/manifest.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/warlock-demons.md';
const hex = (n: number) => '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6);

// short role/use notes (the warlock's demon roster, classic roles)
const ROLE: Record<string, string> = {
  imp: 'Ranged nuker — a fragile Firebolt caster for steady damage.',
  voidwalker: 'Tank — soaks hits and taunts so you can cast in peace.',
  succubus: 'Burst/CC — high single-target damage with a seduction lockdown.',
  felhunter: 'Anti-caster — eats enemy buffs and locks out spellcasters.',
  felguard: 'Melee bruiser — the durable all-rounder once you can summon it.',
  infernal: 'AoE juggernaut — a huge, slow-summon powerhouse that pulses fire.',
  doomguard: 'Burst power-summon — the biggest hitter on a long cooldown.',
};

const L: string[] = [];
L.push(`# Warlock demons`);
L.push('');
L.push(`The Warlock fights alongside a summoned demon. Each fills a different role — pick by what the fight needs. Stats below are the demon's base; they scale with you as you level.`);
L.push('');

const models: any[] = [];
for (const [id, m] of Object.entries(WARLOCK_PET_MOBS) as any[]) {
  const key = mf.visualKeyFor({ kind: 'mob', templateId: id, family: m.family } as any);
  const def: any = mf.VISUALS[key];
  if (def?.url) models.push({ id, glb: def.url, height: def.height ?? null, tint: m.color != null ? hex(m.color) : null, tintStrength: 0.55, scale: m.scale ?? 1, attach: [] });

  L.push(`<a id="demon-${id}"></a>`);
  L.push('');
  L.push(`## ${m.name}`);
  L.push('');
  L.push(`<img src="_demon-renders/${id}.png" width="150" align="right" alt="${m.name}">`);
  L.push('');
  if (ROLE[id]) L.push(`**${ROLE[id]}**`);
  L.push('');
  L.push(`| Stat | Value |`);
  L.push(`|---|---|`);
  L.push(`| Base health | ${m.hpBase} (+${m.hpPerLevel}/level) |`);
  L.push(`| Base damage | ${m.dmgBase} (+${m.dmgPerLevel}/level) @ ${m.attackSpeed}s |`);
  L.push(`| Size | ${m.scale && m.scale >= 1.4 ? 'huge' : m.scale && m.scale >= 1.1 ? 'large' : m.scale && m.scale < 0.7 ? 'tiny' : 'normal'} (×${m.scale ?? 1}) |`);
  L.push('');
}

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, L.join('\n'));
fs.writeFileSync(OUT.replace(/[^/\\]+$/, 'demon-models.json'), JSON.stringify(models, null, 2));
console.log(`wrote ${Object.keys(WARLOCK_PET_MOBS).length} warlock demons (+${models.length} render entries)`);
