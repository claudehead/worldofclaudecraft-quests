import { ITEMS, FISHING_TABLES, FISHING_RARE_ID } from '../woc/src/sim/data.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/fishing.md';
const name = (id: string) => (ITEMS as any)[id]?.name || id;
const ZONE: Record<string, string> = { eastbrook_vale: 'Eastbrook Vale', mirefen_marsh: 'Mirefen Marsh', thornpeak_heights: 'Thornpeak Heights' };

const L: string[] = [];
L.push(`# Fishing`);
L.push('');
L.push(`Buy a **${name('simple_fishing_pole')}** from the Provisioner in the first village (about 20 copper), equip it, then use it at any lake or river. Each cast rolls the local water's catch table below. Raw fish are **cooked into food** that restores health over time — the bigger the fish, the more it heals.`);
L.push('');
L.push(`> The **${name(FISHING_RARE_ID)}** is the prize catch — a rare that can surface in any water. Keep casting.`);
L.push('');

for (const [loc, entries] of Object.entries(FISHING_TABLES) as any[]) {
  const total = entries.reduce((s: number, e: any) => s + (e.weight ?? e.chance ?? 0), 0) || 1;
  L.push(`## ${ZONE[loc] || loc}`);
  L.push('');
  L.push(`| Catch | Chance | Restores |`);
  L.push(`|---|---:|---|`);
  const rows = entries
    .map((e: any) => ({ id: e.itemId, pct: Math.round((e.weight ?? e.chance ?? 0) / total * 100), hp: (ITEMS as any)[e.itemId]?.foodHp }))
    .sort((a: any, b: any) => b.pct - a.pct);
  for (const r of rows) {
    if (!r.id) { L.push(`| _nothing (the one that got away)_ | ${r.pct}% | — |`); continue; }
    const rare = r.id === FISHING_RARE_ID ? ' ⭐' : '';
    L.push(`| ${name(r.id)}${rare} | ${r.pct}% | ${r.hp ? `${r.hp} HP` : '—'} |`);
  }
  L.push('');
}
L.push(`_Catch rates are the water's roll weights, normalised to a percentage. ⭐ marks the rare catch._`);
L.push('');

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, L.join('\n'));
console.log(`wrote fishing guide (${Object.keys(FISHING_TABLES).length} waters)`);
