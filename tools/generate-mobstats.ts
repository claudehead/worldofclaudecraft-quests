// Emits docs/mobstats.json — per-mob combat stats (HP, damage, attack speed,
// armor, derived DPS) computed with the game's spawn formulas, so the
// "Can I solo this?" calculator can pit player vs mob.
import { CAMPS, MOBS, ZONES } from '../woc/src/sim/data.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/mobstats.json';
const zoneFor = (z: number) => ZONES.find((zz: any) => z >= zz.zMin && z < zz.zMax)?.name || '—';

const spawn: Record<string, { spawns: number; zones: Set<string> }> = {};
for (const c of CAMPS as any[]) { const s = (spawn[c.mobId] ||= { spawns: 0, zones: new Set() }); s.spawns += c.count || 0; s.zones.add(zoneFor(c.center.z)); }

const mobs = Object.entries(spawn).map(([id, sp]) => {
  const t: any = (MOBS as any)[id];
  if (!t) return null;
  const lvl = Math.round((t.minLevel + t.maxLevel) / 2);
  const hpMult = t.elite ? 2.3 : 1, dmgMult = t.elite ? 1.5 : 1;
  const hp = Math.round((t.hpBase + t.hpPerLevel * (lvl - 1)) * hpMult);
  const avg = (t.dmgBase + t.dmgPerLevel * (lvl - 1)) * dmgMult;
  const dmgMin = Math.round(avg * 0.8), dmgMax = Math.round(avg * 1.25);
  const armor = Math.round(t.armorPerLevel * (lvl - 1));
  const dps = ((dmgMin + dmgMax) / 2) / t.attackSpeed;
  return {
    id, name: t.name, level: lvl, minLevel: t.minLevel, maxLevel: t.maxLevel,
    hp, dmgMin, dmgMax, attackSpeed: t.attackSpeed, armor, dps: +dps.toFixed(1),
    elite: !!t.elite, rare: !!t.rare, boss: !!t.boss, family: t.family,
    zones: [...sp.zones].filter((z) => z !== '—'), spawns: sp.spawns,
  };
}).filter(Boolean) as any[];
mobs.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

fs.writeFileSync(OUT, JSON.stringify({ mobs }));
console.log(`wrote mobstats.json (${mobs.length} mobs) to ${OUT}`);
