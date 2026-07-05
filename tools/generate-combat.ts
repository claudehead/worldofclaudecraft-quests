// Emits docs/combat.json — REAL rotation DPS per class per level per gear, replacing
// the old x2.2-melee / x1.0-caster proxies that unfairly floored casters. We build
// each class's rotation from its actual damaging abilities (rank-resolved) using the
// game's own spell/AP scaling (woc/src/sim/spell_scaling.ts) and a GCD-budget model:
//   - casters cast back-to-back: DoTs run in the background, instants on cooldown, and
//     the best nuke fills the remaining cast time.
//   - melee/hunter auto-attack (physical) and fill the 1.5s GCD line with their best
//     specials by damage, cooldown-limited, the rest going to a spammable filler;
//     rogue finishers fire every 5 combo points.
// Output splits PHYSICAL (reduced by target armor) from MAGIC (ignores armor), so the
// solo/pvp/tier tools can mitigate each correctly. Expected-value (no rng); resources
// are assumed sustainable over a duel (a disclosed simplification).
import { ABILITIES, CLASSES } from '../woc/src/sim/data.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/combat.json';
const SOLO = JSON.parse(fs.readFileSync('docs/solo.json', 'utf8'));
const K = SOLO.constants, CAP = SOLO.levelCap;
const GCD = 1.5, DIV = 3.5, MINC = 1.5, MAXC = 3.5, DOT_DUR = 15, AOE = 0.333, AP_SCALE = 0.15, SP_PER_INT = K.spellPowerPerInt || 0.5;
const clampCast = (t: number) => Math.min(MAXC, Math.max(MINC, t <= 0 ? MINC : t));
const directCoeff = (cast: number) => clampCast(cast) / DIV;

function statsFor(c: any, L: number, gear: string) {
  const g = gear === 'bis' ? SOLO.bis[c.id][L] : null;
  const s: any = {}; for (const k of ['str', 'agi', 'sta', 'int', 'spi', 'armor']) s[k] = (c.baseStats[k] || 0) + (c.statsPerLevel[k] || 0) * (L - 1) + (g ? (g[k] || 0) : 0);
  const w = g ? { min: g.wMin, max: g.wMax, speed: g.wSpeed } : SOLO.levelingWeapon[L];
  const ap = c.apRule === 'str2' ? s.str * 2 : c.apRule === 'stragi' ? s.str + s.agi : s.str;
  return {
    ap, rangedPower: c.id === 'hunter' ? s.agi * 2 : 0, sp: Math.round(s.int * SP_PER_INT),
    crit: K.baseCrit + s.agi * K.critPerAgi, spellCrit: K.baseCrit + s.int * K.spellCritPerInt,
    weaponAvg: (w.min + w.max) / 2, weaponSpeed: w.speed,
  };
}

// rank-resolved effects at level L (highest rank whose level <= L, else base effects)
function effectsAt(a: any, L: number) {
  let eff = a.effects || [];
  for (const r of a.ranks || []) if ((r.level || 1) <= L && r.effects) eff = r.effects;
  return eff;
}
const scalingPower = (a: any, st: any) => a.scalesWith === 'ranged' ? st.rangedPower : a.school === 'physical' ? st.ap : st.sp;
const powerScale = (a: any) => (a.scalesWith === 'ranged' || a.school === 'physical') ? AP_SCALE : 1;

// per-ability expected damage, split into direct (evPhys/evMagic), a background DoT
// (dpsPhys/dpsMagic, already per-second over its duration), and rotation metadata.
function abilityDamage(a: any, L: number, st: any) {
  const eff = effectsAt(a, L);
  const isSpell = a.school !== 'physical';
  const power = scalingPower(a, st), pScale = powerScale(a);
  const critFactor = 1 + (isSpell ? st.spellCrit : st.crit) * ((isSpell ? 1.5 : 2) - 1);
  let evP = 0, evM = 0, dpsP = 0, dpsM = 0, dotDur = 0, direct = false;
  for (const e of eff) {
    if (e.type === 'directDamage' || e.type === 'aoeDamage') {
      const rider = Math.round(power * directCoeff(a.castTime || 0) * pScale * (e.type === 'aoeDamage' ? AOE : 1));
      const dmg = ((e.min + e.max) / 2 + rider) * critFactor; direct = true;
      if (a.school === 'physical') evP += dmg; else evM += dmg;
    } else if (e.type === 'dot') {
      const ticks = e.interval > 0 ? Math.max(1, e.duration / e.interval) : 1;
      const perTick = e.total / ticks + power * (e.duration / DOT_DUR / ticks) * pScale;
      const dps = perTick * ticks / e.duration; dotDur = Math.max(dotDur, e.duration);
      if (a.school === 'physical') dpsP += dps; else dpsM += dps;
    } else if (e.type === 'weaponDamage' || e.type === 'weaponStrike') {
      const rider = Math.round(power * directCoeff(a.castTime || 0) * AP_SCALE);
      const swing = a.onNextSwing ? 0 : (st.weaponAvg + st.ap / (K.apToDamageDivisor) * st.weaponSpeed);
      evP += (swing + (e.bonus || 0) + rider) * critFactor; direct = true;
    } else if (e.type === 'finisherDamage') {
      evP += (e.base + e.perCombo * 5 + (e.variance || 0) / 2 + st.ap / (K.apToDamageDivisor)) * critFactor; direct = true;
    }
  }
  return { evPhys: evP, evMagic: evM, dpsPhys: dpsP, dpsMagic: dpsM, dotDur, direct, isDot: dotDur > 0, isFinisher: eff.some((e: any) => e.type === 'finisherDamage'), castTime: a.castTime || 0, cooldown: a.cooldown || 0, onNextSwing: !!a.onNextSwing };
}

function rotationDPS(c: any, L: number, gear: string) {
  const st = statsFor(c, L, gear);
  const abils = (CLASSES[c.id].abilities || []).map((id: string) => ABILITIES[id]).filter((a: any) => a && (a.learnLevel || 1) <= L)
    .map((a: any) => abilityDamage(a, L, st)).filter((x: any) => x.direct || x.isDot);
  let phys = 0, magic = 0;
  for (const x of abils) if (x.isDot) { phys += x.dpsPhys; magic += x.dpsMagic; }
  const directs = abils.filter((x: any) => x.direct && (x.evPhys + x.evMagic) > 0);
  if (!c.caster) {
    // auto-attack (physical weapon swing)
    const autoHit = (st.weaponAvg + st.ap / K.apToDamageDivisor * st.weaponSpeed) * (1 + st.crit);
    phys += autoHit / st.weaponSpeed;
    // GCD line: allocate to best specials by damage, cooldown-limited; filler takes the rest
    directs.sort((p: any, q: any) => (q.evPhys + q.evMagic) - (p.evPhys + p.evMagic));
    const filler = directs.find((x: any) => x.cooldown === 0 && !x.isFinisher);
    let budget = 1 / GCD;
    for (const x of directs) {
      if (x === filler) continue;
      const period = x.isFinisher ? 5 * GCD : Math.max(x.cooldown, GCD);
      const rate = Math.min(1 / period, budget);
      phys += x.evPhys * rate; magic += x.evMagic * rate; budget -= rate;
      if (budget <= 0) break;
    }
    if (filler && budget > 0) { phys += filler.evPhys * budget; magic += filler.evMagic * budget; }
  } else {
    // caster: dots already added; instants on cooldown; best nuke fills remaining cast time
    let timeUsed = 0;
    for (const x of abils) if (x.isDot) timeUsed += Math.max(x.castTime, GCD) / x.dotDur;
    const instants = directs.filter((x: any) => x.castTime === 0 && x.cooldown > 0);
    for (const x of instants) { const rate = 1 / Math.max(x.cooldown, GCD); magic += x.evMagic * rate; phys += x.evPhys * rate; timeUsed += GCD * rate; }
    const nukes = directs.filter((x: any) => x.castTime > 0).sort((p: any, q: any) => (q.evMagic / q.castTime) - (p.evMagic / p.castTime));
    const best = nukes[0];
    if (best) { const frac = Math.max(0.1, 1 - timeUsed); magic += best.evMagic / best.castTime * frac; phys += best.evPhys / best.castTime * frac; }
  }
  return { phys: +phys.toFixed(2), magic: +magic.toFixed(2) };
}

const out: any = { levelCap: CAP, classes: {} };
for (const c of SOLO.classes) {
  const rec: any = { leveling: [null], bis: [null] };
  for (let L = 1; L <= CAP; L++) { rec.leveling.push(rotationDPS(c, L, 'leveling')); rec.bis.push(rotationDPS(c, L, 'bis')); }
  out.classes[c.id] = rec;
}
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`wrote ${OUT}: rotation DPS for ${SOLO.classes.length} classes, 1-${CAP}, leveling+bis`);
