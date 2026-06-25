import { AUGMENTS, AUGMENT_CATEGORY, POWERUPS } from '../woc/src/sim/content/augments.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/augments.json';
const arr = (x: any) => Array.isArray(x) ? x : Object.values(x);

const BUFF: Record<string, (v: number) => string> = {
  buff_speed: v => `+${Math.round((v - 1) * 100)}% movement speed`,
  buff_scale: v => v < 1 ? 'shrinks you (harder to hit)' : 'grows you',
  buff_ap: v => `+${v} attack power`,
  buff_haste: v => `+${Math.round((v - 1) * 100)}% attack speed`,
  buff_armor: v => `+${v} armor`,
  buff_crit: v => `+${Math.round(v * 100)}% crit`,
};

const augments = arr(AUGMENTS).map((a: any) => ({
  id: a.id, name: a.name, tier: a.tier, classes: a.classes || [],
  category: (AUGMENT_CATEGORY as any)[a.id] || 'misc', description: a.description,
}));

const powerups = arr(POWERUPS).map((p: any) => ({
  id: p.id, name: p.name, duration: p.duration,
  effects: (p.buffs || []).map((b: any) => (BUFF[b.kind] ? BUFF[b.kind](b.value) : `${b.kind} ${b.value}`)),
}));

const tiers = ['silver', 'gold', 'prismatic'].filter(t => augments.some(a => a.tier === t));
fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ tiers, augments, powerups }));
console.log(`wrote ${augments.length} augments, ${powerups.length} power-ups`);
