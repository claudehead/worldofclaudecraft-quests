// Emit the guide's talent data from the game source.
//
// v0.27+ talent model (replaces the old point-buy `nodes` grid): each class has
// 3 specializations (chosen at SPEC_UNLOCK_LEVEL), and a shared choice-row tree of
// 6 rows unlocked at ROW_LEVELS (5/8/11/14/17/20). Each row offers 3 options and you
// pick exactly one. Rows are per-class and independent of the chosen spec.
import { TALENTS, SPEC_UNLOCK_LEVEL } from '../woc/src/sim/content/talents.ts';
import { ROW_LEVELS, rowTreeFor } from '../woc/src/sim/content/talent_rows.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/talents.json';

// Row-option icon ids to render as PNGs (see icon-entry.js / render-game-icons.mjs).
const iconIds: string[] = [];

const classes: Record<string, any> = {};
for (const [cid, ct] of Object.entries(TALENTS) as any[]) {
  const specs = (ct.specs || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    description: s.description,
    signature: s.signature,
    // The spec's signature ability icon is already rendered by the abilities pass.
    signatureIcon: `abilities/_icons/${s.signature}.png`,
    mastery: { name: s.mastery?.name, description: s.mastery?.description },
  }));
  const tree = rowTreeFor(cid) || [];
  const rows = tree.map((r: any) => ({
    level: r.level,
    theme: r.theme || null,
    decision: r.decision || null,
    options: r.options.map((o: any) => {
      iconIds.push(o.id);
      return { id: o.id, name: o.name, description: o.description, iconImg: `talent-icons/${o.id}.png`, effect: o.effect };
    }),
  }));
  classes[cid] = { id: cid, name: cid[0].toUpperCase() + cid.slice(1), specs, rows };
}

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ specLevel: SPEC_UNLOCK_LEVEL, rowLevels: ROW_LEVELS, classes }));
fs.writeFileSync(OUT.replace(/[^/\\]+$/, 'talent-icon-ids.json'), JSON.stringify(iconIds));
console.log(`wrote talents for ${Object.keys(classes).length} classes, ${iconIds.length} row-option icons (spec at Lv ${SPEC_UNLOCK_LEVEL}, rows ${ROW_LEVELS.join('/')})`);
