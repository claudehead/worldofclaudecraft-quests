// Emits docs/combat.json — REAL rotation DPS per class per level per gear, from a
// resource-limited time-step simulation of a ~20s duel. Replaces the old
// x2.2-melee / x1.0-caster proxies AND the earlier resource-free amortized model
// (which over-credited melee because it let rogues/warriors spend their whole GCD
// line on specials they could never afford).
//
// Faithful to the game (woc/src/sim): ability damage uses the real spell/AP scaling
// (spell_scaling.ts); resources use the real rules (auras.ts / types.ts):
//   - energy: +20 every 2s (10/s). Rogue specials cost 25-60 energy, so they fire
//     only a few times in a duel, not every 1.5s GCD.
//   - rage:   generated from dealing physical damage (7.5*dmg / rageConversion(lvl));
//     warrior specials are gated by rage income.
//   - mana:   NO regen in combat (5-second rule), so casters run on their pool; over
//     a 20s duel most casters sustain, which is exactly why they now compare fairly.
// Output splits PHYSICAL (reduced by target armor) from MAGIC (ignores armor).
import { ABILITIES, CLASSES } from '../woc/src/sim/data.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/combat.json';
const SOLO = JSON.parse(fs.readFileSync('docs/solo.json', 'utf8'));
const K = SOLO.constants, CAP = SOLO.levelCap;
const GCD = 1.5, DIV = 3.5, MINC = 1.5, MAXC = 3.5, DOT_DUR = 15, AOE = 0.333, AP_SCALE = 0.15, SP_PER_INT = K.spellPowerPerInt || 0.5;
const T = 20, DT = 0.1; // duel window / step
const clampCast = (t: number) => Math.min(MAXC, Math.max(MINC, t <= 0 ? MINC : t));
const directCoeff = (cast: number) => clampCast(cast) / DIV;
const rageConversion = (L: number) => 0.0091 * L * L + 3.23 * L + 4.27;
const rageFromDealing = (dmg: number, L: number) => 7.5 * dmg / rageConversion(L);

function statsFor(c: any, L: number, gear: string) {
  const g = gear === 'bis' ? SOLO.bis[c.id][L] : null;
  const s: any = {}; for (const k of ['str', 'agi', 'sta', 'int', 'spi', 'armor']) s[k] = (c.baseStats[k] || 0) + (c.statsPerLevel[k] || 0) * (L - 1) + (g ? (g[k] || 0) : 0);
  const w = g ? { min: g.wMin, max: g.wMax, speed: g.wSpeed } : SOLO.levelingWeapon[L];
  const cls = CLASSES[c.id];
  const maxMana = (cls.baseMana || 100) + (cls.manaPerLevel || 0) * (L - 1);
  return {
    ap: c.apRule === 'str2' ? s.str * 2 : c.apRule === 'stragi' ? s.str + s.agi : s.str,
    rangedPower: c.id === 'hunter' ? s.agi * 2 : 0, sp: Math.round(s.int * SP_PER_INT),
    crit: K.baseCrit + s.agi * K.critPerAgi, spellCrit: K.baseCrit + s.int * K.spellCritPerInt,
    weaponAvg: (w.min + w.max) / 2, weaponSpeed: w.speed,
    resource: cls.resourceType, maxResource: cls.resourceType === 'mana' ? maxMana : 100,
  };
}
function effectsAt(a: any, L: number) { let eff = a.effects || []; for (const r of a.ranks || []) if ((r.level || 1) <= L && r.effects) eff = r.effects; return eff; }
const scalingPower = (a: any, st: any) => a.scalesWith === 'ranged' ? st.rangedPower : a.school === 'physical' ? st.ap : st.sp;
const powerScale = (a: any) => (a.scalesWith === 'ranged' || a.school === 'physical') ? AP_SCALE : 1;

// per-ability usable damage bundle + rotation metadata
function ability(a: any, L: number, st: any) {
  const eff = effectsAt(a, L), isSpell = a.school !== 'physical';
  const power = scalingPower(a, st), pScale = powerScale(a);
  const critFactor = 1 + (isSpell ? st.spellCrit : st.crit) * ((isSpell ? 1.5 : 2) - 1);
  let dP = 0, dM = 0, dotP = 0, dotM = 0, dotDur = 0, dotInt = 0, direct = false, isFin = false;
  for (const e of eff) {
    if (e.type === 'directDamage' || e.type === 'aoeDamage') {
      const rider = Math.round(power * directCoeff(a.castTime || 0) * pScale * (e.type === 'aoeDamage' ? AOE : 1));
      const dmg = ((e.min + e.max) / 2 + rider) * critFactor; direct = true;
      if (a.school === 'physical') dP += dmg; else dM += dmg;
    } else if (e.type === 'dot') {
      const ticks = e.interval > 0 ? Math.max(1, e.duration / e.interval) : 1;
      const perTick = e.total / ticks + power * (e.duration / DOT_DUR / ticks) * pScale;
      dotDur = Math.max(dotDur, e.duration); dotInt = e.interval || e.duration;
      if (a.school === 'physical') dotP += perTick; else dotM += perTick;
    } else if (e.type === 'weaponDamage' || e.type === 'weaponStrike') {
      const rider = Math.round(power * directCoeff(a.castTime || 0) * AP_SCALE);
      const swing = a.onNextSwing ? 0 : (st.weaponAvg + st.ap / K.apToDamageDivisor * st.weaponSpeed);
      dP += (swing + (e.bonus || 0) + rider) * critFactor; direct = true;
    } else if (e.type === 'finisherDamage') {
      dP += (e.base + e.perCombo * 5 + (e.variance || 0) / 2 + st.ap / K.apToDamageDivisor) * critFactor; direct = true; isFin = true;
    }
  }
  return { evPhys: dP, evMagic: dM, dotP, dotM, dotDur, dotInt, direct, isDot: dotDur > 0, isFin, awardsCombo: !!a.awardsCombo, cost: a.cost || 0, castTime: a.castTime || 0, cooldown: a.cooldown || 0 };
}

function rotationDPS(c: any, L: number, gear: string) {
  const st = statsFor(c, L, gear);
  const abils = (CLASSES[c.id].abilities || []).map((id: string) => ABILITIES[id]).filter((a: any) => a && (a.learnLevel || 1) <= L)
    .map((a: any) => ability(a, L, st)).filter((x: any) => x.direct || x.isDot);
  const directs = abils.filter((x: any) => x.direct && (x.evPhys + x.evMagic) > 0).sort((p: any, q: any) => (q.evPhys + q.evMagic) - (p.evPhys + p.evMagic));
  const pureDots = abils.filter((x: any) => x.isDot && !x.direct); // corruption/rend (a nuke's rider DoT rides its cast instead)
  const weaponUser = !c.caster;
  // sim state
  let t = 0, gcdReady = 0, nextSwing = weaponUser ? 0 : Infinity, res = st.resource === 'mana' ? st.maxResource : (st.resource === 'energy' ? 100 : 0), combo = 0;
  let totP = 0, totM = 0;
  const cd: Record<number, number> = {}; // ability index -> ready time
  const active: any[] = []; // running dots {p,m,int,next,expire}
  const idx = new Map(directs.map((x: any, i: number) => [x, i]));
  while (t < T + 1e-9) {
    // resource regen (energy 10/s; mana no combat regen; rage from hits only)
    if (st.resource === 'energy') res = Math.min(100, res + 10 * DT);
    // dot ticks
    for (const d of active) { if (t >= d.next && t < d.expire + 1e-9) { totP += d.p; totM += d.m; d.next += d.int; } }
    // auto-attack
    if (weaponUser && t >= nextSwing) {
      const hit = (st.weaponAvg + st.ap / K.apToDamageDivisor * st.weaponSpeed) * (1 + st.crit);
      totP += hit; if (st.resource === 'rage') res = Math.min(100, res + rageFromDealing(hit, L));
      nextSwing += st.weaponSpeed;
    }
    // GCD action
    if (t >= gcdReady) {
      let pick: any = null, asDot = false;
      // 1) finisher at 5 combo
      if (combo >= 5) pick = directs.find((x: any) => x.isFin && x.cost <= res && t >= (cd[idx.get(x)!] || 0));
      // 2) refresh an expired PURE dot (corruption/rend)
      if (!pick) { pick = pureDots.find((x: any) => x.cost <= res && !active.some(d => d.src === x && d.expire > t)); if (pick) asDot = true; }
      // 3) best affordable off-cooldown direct (excluding finisher unless combo ready)
      if (!pick) pick = directs.find((x: any) => !x.isFin && x.cost <= res && t >= (cd[idx.get(x)!] || 0));
      if (pick) {
        res -= pick.cost;
        if (pick.isFin) combo = 0; else if (pick.awardsCombo) combo = Math.min(5, combo + 1);
        if (asDot) { active.push({ src: pick, p: pick.dotP, m: pick.dotM, int: pick.dotInt, next: t + pick.dotInt, expire: t + pick.dotDur }); }
        else { // a direct cast: its nuke damage now, plus any rider DoT it applies
          totP += pick.evPhys; totM += pick.evMagic;
          if (pick.dotDur > 0 && !active.some(d => d.src === pick && d.expire > t)) active.push({ src: pick, p: pick.dotP, m: pick.dotM, int: pick.dotInt, next: t + pick.dotInt, expire: t + pick.dotDur });
        }
        if (pick.cooldown > 0 && idx.has(pick)) cd[idx.get(pick)!] = t + pick.cooldown;
        gcdReady = t + Math.max(pick.castTime, GCD);
      } else {
        gcdReady = t + 0.3; // nothing affordable (e.g. OOM / energy-starved): idle briefly
      }
    }
    t += DT;
  }
  return { phys: +(totP / T).toFixed(2), magic: +(totM / T).toFixed(2) };
}

const out: any = { levelCap: CAP, classes: {} };
for (const c of SOLO.classes) {
  const rec: any = { leveling: [null], bis: [null] };
  for (let L = 1; L <= CAP; L++) { rec.leveling.push(rotationDPS(c, L, 'leveling')); rec.bis.push(rotationDPS(c, L, 'bis')); }
  out.classes[c.id] = rec;
}
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`wrote ${OUT}: resource-limited rotation DPS for ${SOLO.classes.length} classes, 1-${CAP}, leveling+bis`);
