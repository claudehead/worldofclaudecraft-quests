import { SKIN_RANKS, EVENT_SKIN_TIERS, MECH_CHROMAS, SKIN_RANK_ROLL_WEIGHTS } from '../woc/src/sim/content/skins.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/cosmetics.json';
const arr = (x: any) => Array.isArray(x) ? x : (x ? Object.values(x) : []);

const FOLDER: Record<string, string> = { uncommon: 'uncommon', rare: 'rares', epic: 'epics' };
const PREFIX: Record<string, string> = { uncommon: '', rare: 'rare_', epic: 'epic_' };
const texOf = (c: any) => `models/chars/players/Mech/textures/${FOLDER[c.rank]}/combatmech_${PREFIX[c.rank] || ''}${c.id}.png`;

const chromas = arr(MECH_CHROMAS).map((c: any) => ({
  id: c.id, name: c.name || c.id.replace(/_/g, ' '), rank: c.rank,
  texture: texOf(c), render: `cosmetics/_renders/${c.id}.png`,
}));

const out = {
  ranks: SKIN_RANKS,
  rollWeights: SKIN_RANK_ROLL_WEIGHTS ?? null,
  eventTiers: arr(EVENT_SKIN_TIERS),
  mechChromas: chromas,
};
fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
fs.writeFileSync(OUT.replace(/[^/\\]+$/, 'chroma-renders.json'), JSON.stringify(chromas.map(c => ({ id: c.id, texture: c.texture }))));
console.log(`wrote cosmetics: ${chromas.length} mech chromas, ${out.eventTiers.length} event tiers`);
