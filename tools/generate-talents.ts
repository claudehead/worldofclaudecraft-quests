import { TALENTS, talentPointsAtLevel, FIRST_TALENT_LEVEL } from '../woc/src/sim/content/talents.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/talents.json';

const pointsByLevel: Record<number, number> = {};
for (let l = 1; l <= 20; l++) pointsByLevel[l] = talentPointsAtLevel(l);

const iconIds: string[] = [];
const withIcon = (n: any) => { iconIds.push(n.id); return { ...n, iconImg: `talent-icons/${n.id}.png` }; };

const classes: Record<string, any> = {};
for (const [cid, ct] of Object.entries(TALENTS) as any[]) {
  const classTree = ct.nodes.filter((n: any) => n.tree === 'class').map(withIcon);
  const specs = (ct.specs || []).map((s: any) => ({
    id: s.id, name: s.name, icon: s.icon, role: s.role, description: s.description, mastery: s.mastery,
    nodes: ct.nodes.filter((n: any) => n.tree === 'spec' && n.specId === s.id).map(withIcon),
  }));
  classes[cid] = { id: cid, name: cid[0].toUpperCase() + cid.slice(1), classTree, specs };
}

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ firstLevel: FIRST_TALENT_LEVEL, maxPoints: talentPointsAtLevel(20), pointsByLevel, classes }));
fs.writeFileSync(OUT.replace(/[^/\\]+$/, 'talent-icon-ids.json'), JSON.stringify(iconIds));
console.log(`wrote talents for ${Object.keys(classes).length} classes, ${iconIds.length} icon ids (max ${talentPointsAtLevel(20)} points)`);
