// Emits docs/pvpsim.json — per-class PvP attributes for the "Ultimate PvP Class" tool
// (#/pvpclass). The client runs a 1v1 duel round-robin (every class vs every class)
// from these + solo.json's combat stats, so the model stays transparent/adjustable.
//
// We mine, per class per level (gated by ability learnLevel), three PvP dimensions
// straight from the game's ability definitions, then normalize each 0..1 by the
// strongest class at max level:
//   control  — crowd control (stun/incapacitate/polymorph/root/slow), weighted by
//              type severity and uptime (1/sqrt(cooldown)).
//   healCap  — self-sustain (heal/hot/drain/lifetap/absorb effects).
//   defense  — damage-absorb / mitigation cooldowns.
// Plus a fixed archetype flag `ranged` (casters + hunter kite; the rest are melee),
// which drives the kiting advantage in the duel model.
import { ABILITIES, CLASSES } from '../woc/src/sim/data.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/pvpsim.json';
const CS = JSON.parse(fs.readFileSync('docs/classstats.json', 'utf8'));
const CAP = CS.maxLevel || 20;
const CC: Record<string, number> = { stun: 3, incapacitate: 3, polymorph: 3, finisherStun: 2.5, root: 2, aoeRoot: 2, slow: 1 };
const HEALW: Record<string, number> = { heal: 2, hot: 1.5, drainTick: 1, lifeTap: 0.5, absorb: 1 };
const RANGED = new Set(['mage', 'warlock', 'priest', 'hunter']); // kiters; the rest are melee

function rawAttrs(cls: any, L: number) {
  let control = 0, heal = 0, defense = 0;
  for (const aid of cls.abilities || []) {
    const a: any = ABILITIES[aid]; if (!a || (a.learnLevel || 1) > L) continue;
    const uptime = 1 / Math.sqrt(Math.max(3, a.cooldown || 6));
    for (const e of a.effects || []) {
      if (CC[e.type]) control += CC[e.type] * uptime;
      if (HEALW[e.type]) heal += HEALW[e.type];
      if (e.type === 'absorb') defense += 1.5;
    }
  }
  return { control, heal, defense };
}

const ids = Object.keys(CLASSES);
const raw: Record<string, any[]> = {};
for (const id of ids) { raw[id] = [null]; for (let L = 1; L <= CAP; L++) raw[id].push(rawAttrs(CLASSES[id], L)); }
const maxOf = (k: string) => Math.max(...ids.flatMap(id => raw[id].slice(1).map((v: any) => v[k])), 1e-6);
const mC = maxOf('control'), mH = maxOf('heal'), mD = maxOf('defense');

const classes = ids.map(id => ({
  id, name: CLASSES[id].name || id,
  ranged: RANGED.has(id),
  byLevel: raw[id].map((v: any) => v && ({ control: +(v.control / mC).toFixed(3), heal: +(v.heal / mH).toFixed(3), defense: +(v.defense / mD).toFixed(3) })),
}));

fs.writeFileSync(OUT, JSON.stringify({ levelCap: CAP, classes }));
console.log(`wrote ${OUT}: ${classes.length} classes · ranged=[${classes.filter(c => c.ranged).map(c => c.id).join(',')}]`);
