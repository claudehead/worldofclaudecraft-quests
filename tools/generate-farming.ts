// Emits docs/farming.json — for each player level, how many of each mob you must
// kill to reach the next level, using the game's real XP math:
//   xpForLevel(L)            = XP_TABLE[L-1]               (XP from L -> L+1)
//   mobXpValue(mobLvl, L)    = level-diff scaled kill XP   (0 when grey)
//   elite mobs award x2.
import { MAX_LEVEL, XP_TABLE, mobXpValue, zeroDiff } from '../woc/src/sim/types.ts';
import { CAMPS, MOBS, ZONES } from '../woc/src/sim/data.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/farming.json';
const zoneFor = (z: number) => ZONES.find((zz: any) => z >= zz.zMin && z < zz.zMax)?.name || '—';

// Aggregate camps per mob (only mobs that actually spawn in the world are farmable)
const spawn: Record<string, { spawns: number; camps: number; zones: Set<string> }> = {};
for (const c of CAMPS as any[]) {
  const s = (spawn[c.mobId] ||= { spawns: 0, camps: 0, zones: new Set() });
  s.spawns += c.count || 0;
  s.camps += 1;
  s.zones.add(zoneFor(c.center.z));
}

const farmable = Object.entries(spawn).map(([id, s]) => {
  const t: any = (MOBS as any)[id];
  if (!t || t.boss) return null; // bosses aren't a leveling farm
  const level = Math.round((t.minLevel + t.maxLevel) / 2);
  return {
    id, name: t.name, level, minLevel: t.minLevel, maxLevel: t.maxLevel,
    elite: !!t.elite, rare: !!t.rare, family: t.family,
    spawns: s.spawns, camps: s.camps, zones: [...s.zones].filter((z) => z !== '—'),
  };
}).filter(Boolean) as any[];

const perLevel: any[] = [];
for (let L = 1; L < MAX_LEVEL; L++) {
  const xpNeeded = XP_TABLE[L - 1];
  const mobs = farmable.map((m) => {
    const xpPerKill = mobXpValue(m.level, L) * (m.elite ? 2 : 1);
    if (xpPerKill <= 0) return null; // grey — no XP at this level
    return {
      id: m.id, name: m.name, level: m.level, minLevel: m.minLevel, maxLevel: m.maxLevel,
      zones: m.zones, elite: m.elite, rare: m.rare, spawns: m.spawns,
      xpPerKill, kills: Math.ceil(xpNeeded / xpPerKill),
      tooHigh: m.level > L + 3, // realistically un-killable solo this far over your level
    };
  }).filter(Boolean) as any[];
  // realistic picks first (killable band), then fewest kills, then denser spawns
  // killable normal mobs first (rares are single-spawn, not a repeatable farm),
  // then fewest kills, then denser spawns
  mobs.sort((a, b) => Number(a.tooHigh) - Number(b.tooHigh) || Number(a.rare) - Number(b.rare) || a.kills - b.kills || b.spawns - a.spawns);
  perLevel.push({ level: L, next: L + 1, xpNeeded, greyAt: zeroDiff(L), mobs });
}

fs.writeFileSync(OUT, JSON.stringify({ maxLevel: MAX_LEVEL, xpTable: XP_TABLE, perLevel }));
console.log(`wrote farming.json (${farmable.length} farmable mobs, levels 1..${MAX_LEVEL - 1}) to ${OUT}`);
