// Emits docs/solo.json — the precomputed ingredients for the "Ultimate Solo Class"
// tool (#/soloclass). The client runs the actual solo-viability sim (player+pet vs
// each mob) from these + mobstats.json, so weightings stay transparent/adjustable.
//
// What we precompute here (the parts that need the game source or heavy cross-ref):
//   - per-class base stats / growth / apRule / caster / canHeal / pet kind
//   - per-level PET stats (hp/armor/dps) for pet classes, scaled exactly like the
//     game scales a pet: createMob(template, ownerLevel) in woc/src/sim/entity.ts
//     (hp = hpBase + hpPerLevel*(L-1); dmg = dmgBase + dmgPerLevel*(L-1);
//      weapon min = dmg*0.8, max = dmg*1.25; armor = armorPerLevel*(L-1)).
//     Hunter tames a real beast (best durable trash beast available by level);
//     warlock summons the voidwalker (tank) or succubus (dps demon).
//   - per-level BiS stat totals per class (parsed from gear/bis.json progression),
//     plus a neutral leveling-weapon curve for the "no BiS" scenario.
import { WARLOCK_PET_MOBS } from '../woc/src/sim/content/warlock_pets.ts';
import { MOBS } from '../woc/src/sim/data.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/solo.json';
const CS = JSON.parse(fs.readFileSync('docs/classstats.json', 'utf8'));
const BIS = JSON.parse(fs.readFileSync('gear/bis.json', 'utf8'));
const CAP = CS.maxLevel || 20;
const CAN_HEAL = new Set(['paladin', 'priest', 'shaman', 'druid']);
const PET_KIND: Record<string, string> = { hunter: 'beast', warlock: 'demon' };

// --- pet scaling, mirroring createMob(template, level) ---
function scalePet(t: any, L: number) {
  const hp = Math.round(t.hpBase + t.hpPerLevel * (L - 1));
  const dmg = t.dmgBase + t.dmgPerLevel * (L - 1);
  const min = Math.round(dmg * 0.8), max = Math.round(dmg * 1.25);
  const armor = Math.round(t.armorPerLevel * (L - 1));
  const dps = (min + max) / 2 / t.attackSpeed;
  return { hp, armor, dmgMin: min, dmgMax: max, speed: t.attackSpeed, dps: +dps.toFixed(2), ranged: !!t.petRanged };
}
// rough EHP proxy (health inflated by armor) to rank candidate hunter beasts
function petEhp(p: any, atkLevel: number) {
  const K = CS.constants;
  const mit = Math.min(K.armorCap, p.armor / (p.armor + K.armorA * atkLevel + K.armorB));
  return p.hp / (1 - mit);
}

// hunter-tameable beasts = normal trash of family 'beast' (a spawn RANGE, so we skip
// named uniques where minLevel === maxLevel like Old Greyjaw / Old Cragmaw).
const BEASTS = Object.values(MOBS).filter(
  (m: any) => m.family === 'beast' && !m.elite && !m.rare && (m.maxLevel ?? m.minLevel) > (m.minLevel ?? 1),
) as any[];

function hunterPetAt(L: number, tanky: boolean) {
  const avail = BEASTS.filter((b) => (b.minLevel || 1) <= L).map((b) => ({ name: b.name, p: scalePet(b, L) }));
  if (!avail.length) { const b = BEASTS[0]; return { name: b.name, ...scalePet(b, L) }; }
  // tank pet: most effective HP; dps pet: highest damage
  avail.sort((a, b) => tanky ? petEhp(b.p, L) - petEhp(a.p, L) : b.p.dps - a.p.dps);
  const pick = avail[0];
  return { name: pick.name, ...pick.p };
}

function petSeries(classId: string) {
  const kind = PET_KIND[classId];
  if (!kind) return null;
  const tank: any[] = [null], dps: any[] = [null];
  let tankName = '', dpsName = '';
  for (let L = 1; L <= CAP; L++) {
    if (kind === 'demon') {
      const tk = scalePet(WARLOCK_PET_MOBS.gloomshade, L); tk.name = 'Gloomshade (tank demon)';
      const dp = scalePet(WARLOCK_PET_MOBS.duskborn, L); dp.name = 'Duskborn (dps demon)';
      tank.push(tk); dps.push(dp); tankName = tk.name; dpsName = dp.name;
    } else {
      const tk = hunterPetAt(L, true); const dp = hunterPetAt(L, false);
      tank.push(tk); dps.push(dp); tankName = 'Tamed beast (durable)'; dpsName = 'Tamed beast (fast)';
    }
  }
  return { kind, tank, dps, tankName, dpsName };
}

// --- BiS stat totals per class per level, parsed from bis.json progression ---
function parseStats(str: string) {
  const out: any = { str: 0, agi: 0, int: 0, spi: 0, sta: 0, armor: 0 };
  const am = /(\d+)\s*armor/.exec(str); if (am) out.armor += +am[1];
  for (const m of str.matchAll(/\+(\d+)\s*(Str|Agi|Int|Spi|Sta)/g)) out[m[2].toLowerCase()] += +m[1];
  return out;
}
function parseWeapon(str: string) {
  const m = /(\d+)\s*[–—-]\s*(\d+)\s*dmg\s*@\s*([\d.]+)\s*s/.exec(str);
  return m ? { min: +m[1], max: +m[2], speed: +m[3] } : null;
}
// best progression item obtainable by level L for a slot (highest entry.level <= L)
function itemAtLevel(slot: any, L: number) {
  const prog = slot.progression && slot.progression.length ? slot.progression : [{ level: slot.item.level || 1, item: slot.item }];
  let best: any = null;
  for (const e of prog) if ((e.level || 1) <= L && (!best || (e.level || 1) >= (best.level || 1))) best = e;
  return (best || prog[0]).item;
}
const levelingWeapon = (L: number) => ({ min: Math.round(2 + 0.9 * L), max: Math.round(4 + 1.4 * L), speed: 2.5 });

function bisSeries(classId: string) {
  const c = BIS.classes.find((x: any) => x.id === classId);
  const build = c && ((c.builds || []).find((b: any) => b.role === 'dps') || c.builds[0]);
  const series: any[] = [null];
  for (let L = 1; L <= CAP; L++) {
    const tot: any = { str: 0, agi: 0, int: 0, spi: 0, sta: 0, armor: 0, wMin: 0, wMax: 0, wSpeed: 2.5 };
    if (build) for (const slot of build.slots) {
      const it = itemAtLevel(slot, L);
      const s = parseStats(it.stats || '');
      for (const k of ['str', 'agi', 'int', 'spi', 'sta', 'armor']) tot[k] += s[k];
      if (slot.slot === 'mainhand') { const w = parseWeapon(it.stats || ''); if (w) { tot.wMin = w.min; tot.wMax = w.max; tot.wSpeed = w.speed; } }
    }
    if (!tot.wMin) { const w = levelingWeapon(L); tot.wMin = w.min; tot.wMax = w.max; tot.wSpeed = w.speed; }
    series.push(tot);
  }
  return series;
}

const classes = Object.values(CS.classes).map((c: any) => ({
  id: c.id, name: c.name, baseStats: c.baseStats, statsPerLevel: c.statsPerLevel,
  baseHp: c.baseHp, hpPerLevel: c.hpPerLevel, apRule: c.apRule, caster: c.caster,
  canHeal: CAN_HEAL.has(c.id), petKind: PET_KIND[c.id] || null,
}));
const pets: any = {}, bis: any = {}, levelingWeaponCurve: any[] = [null];
for (const c of classes) { const p = petSeries(c.id); if (p) pets[c.id] = p; bis[c.id] = bisSeries(c.id); }
for (let L = 1; L <= CAP; L++) levelingWeaponCurve.push(levelingWeapon(L));

fs.writeFileSync(OUT, JSON.stringify({ levelCap: CAP, constants: CS.constants, classes, pets, bis, levelingWeapon: levelingWeaponCurve }));
console.log(`wrote ${OUT}: ${classes.length} classes, pets for [${Object.keys(pets).join(', ')}], BiS 1-${CAP}`);
