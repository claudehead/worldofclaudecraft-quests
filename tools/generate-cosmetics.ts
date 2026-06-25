import { SKIN_RANKS, EVENT_SKIN_TIERS, MECH_CHROMAS, SKIN_RANK_ROLL_WEIGHTS } from '../woc/src/sim/content/skins.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/cosmetics.json';
const arr = (x: any) => Array.isArray(x) ? x : (x ? Object.values(x) : []);

const out = {
  ranks: SKIN_RANKS,
  rollWeights: SKIN_RANK_ROLL_WEIGHTS ?? null,
  eventTiers: arr(EVENT_SKIN_TIERS),
  mechChromas: arr(MECH_CHROMAS).map((c: any) => ({ id: c.id, name: c.name || c.id.replace(/_/g, ' '), rank: c.rank })),
};
fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`wrote cosmetics: ${out.mechChromas.length} mech chromas, ${out.eventTiers.length} event tiers`);
