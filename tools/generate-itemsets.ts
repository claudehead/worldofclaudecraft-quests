// Emits docs/itemsets.json — the v0.16 item-set system: each set's pieces and its
// tiered set bonuses, so players can plan set builds.
import { ITEMS, ITEM_SETS } from '../woc/src/sim/data.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/itemsets.json';
const SLOT_LABEL: Record<string, string> = { mainhand: 'Weapon', offhand: 'Off-hand', helmet: 'Head', shoulder: 'Shoulder', chest: 'Chest', gloves: 'Hands', waist: 'Waist', legs: 'Legs', feet: 'Feet', ranged: 'Ranged' };

// items grouped by set id
const piecesBySet: Record<string, any[]> = {};
for (const it of Object.values(ITEMS) as any[]) {
  if (!it.set) continue;
  (piecesBySet[it.set] ||= []).push({ id: it.id, name: it.name, slot: it.slot, slotLabel: SLOT_LABEL[it.slot] || it.slot || '', quality: it.quality || 'epic' });
}

const sets = (Object.values(ITEM_SETS) as any[]).map((s) => ({
  id: s.id, name: s.name,
  pieces: (piecesBySet[s.id] || []).sort((a, b) => (a.slotLabel || '').localeCompare(b.slotLabel || '')),
  bonuses: (s.bonuses || []).map((b: any) => ({ pieces: b.pieces, text: b.text })),
})).sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(OUT, JSON.stringify({ sets }));
console.log(`wrote itemsets.json (${sets.length} sets, ${Object.values(piecesBySet).flat().length} pieces) to ${OUT}`);
