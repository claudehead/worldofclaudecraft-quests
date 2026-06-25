import { ABILITIES } from '../woc/src/sim/data.ts';
import { GUIDE_CLASSES } from '../woc/src/guide/content.generated.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/abilities.json';
const desc = (s?: string) => (s || '').replace(/\$\{?[a-zA-Z]+\}?/g, 'X').replace(/\s+/g, ' ').trim();
const fmtCd = (cd: number) => !cd ? '—' : cd >= 60 ? `${cd % 60 === 0 ? cd / 60 : (cd / 60).toFixed(1)} min` : `${cd}s`;

const classOrder = GUIDE_CLASSES.map((c: any) => c.id);
const byClass: Record<string, any[]> = {};
for (const a of Object.values(ABILITIES) as any[]) {
  if (!a.class) continue;
  (byClass[a.class] ||= []).push({
    id: a.id, name: a.name, learnLevel: a.learnLevel ?? 1,
    cost: a.cost || 0, cast: !a.castTime ? 'Instant' : `${a.castTime}s`,
    cooldown: fmtCd(a.cooldown || 0), range: a.range ? `${a.range} yd` : 'Melee',
    school: a.school && a.school !== 'physical' ? a.school[0].toUpperCase() + a.school.slice(1) : 'Physical',
    rankLevels: (a.ranks || []).map((r: any) => r.level).filter((l: number) => l),
    description: desc(a.description),
    icon: `abilities/_icons/${a.id}.png`,
  });
}
const ids: string[] = [];
const classes = classOrder.filter(c => byClass[c]).map(c => {
  const list = byClass[c].sort((a, b) => a.learnLevel - b.learnLevel || a.name.localeCompare(b.name));
  list.forEach(a => ids.push(a.id));
  return { id: c, name: c[0].toUpperCase() + c.slice(1), abilities: list };
});

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ count: ids.length, classes }));
fs.writeFileSync(OUT.replace(/[^/\\]+$/, 'ability-icon-ids.json'), JSON.stringify(ids));
console.log(`wrote ${ids.length} abilities across ${classes.length} classes`);
