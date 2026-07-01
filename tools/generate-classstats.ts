// Emits docs/classstats.json — base class stats + growth + the AP rule per class,
// so the DPS/EHP calculator can reproduce the game's combat math client-side.
import { CLASSES } from '../woc/src/sim/content/classes.ts';
import { MAX_LEVEL, SPELL_POWER_PER_INT } from '../woc/src/sim/types.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/classstats.json';
// attack-power rule by class (from entity.recalcPlayerStats)
const apRule = (id: string) => ['warrior', 'paladin', 'shaman', 'druid'].includes(id) ? 'str2'
  : ['rogue', 'hunter'].includes(id) ? 'stragi' : 'str';

const classes: Record<string, any> = {};
for (const [id, c] of Object.entries(CLASSES) as any[]) {
  classes[id] = {
    id, name: c.name || id[0].toUpperCase() + id.slice(1),
    baseStats: c.baseStats, statsPerLevel: c.statsPerLevel,
    baseHp: c.baseHp, hpPerLevel: c.hpPerLevel, resource: c.resourceType, apRule: apRule(id),
    caster: apRule(id) === 'str', // int-based damage dealer
  };
}

fs.writeFileSync(OUT, JSON.stringify({
  maxLevel: MAX_LEVEL,
  // constants from woc/src/sim/types.ts + entity.ts
  constants: { apToDamageDivisor: 14, baseCrit: 0.05, critPerAgi: 0.0005, spellCritPerInt: 0.0008, meleeCritMult: 2, spellCritMult: 1.5, armorPerAgi: 2, armorCap: 0.75, armorA: 85, armorB: 400, staLowCap: 20, staHpLow: 1, staHpHigh: 10, spellPowerPerInt: SPELL_POWER_PER_INT },
  classes,
}));
console.log(`wrote classstats.json (${Object.keys(classes).length} classes) to ${OUT}`);
