import { ITEMS } from '../woc/src/sim/data.ts';

// WoW-style rarity colors as the closest unicode swatch.
const QUALITY: Record<string, { dot: string; name: string }> = {
  poor: { dot: '⚫', name: 'Poor' },
  common: { dot: '⚪', name: 'Common' },
  uncommon: { dot: '🟢', name: 'Uncommon' },
  rare: { dot: '🔵', name: 'Rare' },
  epic: { dot: '🟣', name: 'Epic' },
  legendary: { dot: '🟠', name: 'Legendary' },
};
const STAT: Record<string, string> = { str: 'Str', agi: 'Agi', sta: 'Sta', int: 'Int', spi: 'Spi' };

// Combat ratings + Spell Power live as sibling fields on the ItemDef, NOT inside
// `stats` (which is the six primary attributes + armor). v0.26 itemizes gear around
// these — especially the new Hit rating — so they must be surfaced to every app that
// shows item stats (gear browser, BiS, the compare tool). Order = how they read on
// a tooltip: Spell Power, then the three combat ratings, then the PvP-only ratings.
const RATING_KEYS = ['spellPower', 'critRating', 'hasteRating', 'hitRating', 'pvpOffenseRating', 'pvpDefenseRating'] as const;
export const RATING_LABEL: Record<string, string> = {
  spellPower: 'Spell Power', critRating: 'Crit rating', hasteRating: 'Haste rating',
  hitRating: 'Hit rating', pvpOffenseRating: 'PvP Power', pvpDefenseRating: 'PvP Resilience',
};
// The numeric rating bonuses an item carries, keyed as above, present values only.
export function itemRatings(it: any): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of RATING_KEYS) if (it && it[k]) out[k] = it[k];
  return out;
}

export function quality(id: string): { dot: string; name: string } | null {
  const q = ITEMS[id]?.quality;
  return q && QUALITY[q] ? QUALITY[q] : null;
}

export function qualityDot(id: string): string {
  return quality(id)?.dot ?? '';
}

// One-line stat summary: weapon dps + stats + consumable effects.
export function statLine(id: string): string {
  const it: any = ITEMS[id];
  if (!it) return '';
  const parts: string[] = [];
  if (it.weapon) {
    const dps = Math.round((it.weapon.min + it.weapon.max) / 2 / it.weapon.speed);
    parts.push(`${it.weapon.min}–${it.weapon.max} dmg @ ${it.weapon.speed}s (~${dps} DPS)`);
  }
  const s = it.stats || {};
  if (s.armor) parts.push(`${s.armor} armor`);
  for (const k of ['str', 'agi', 'sta', 'int', 'spi']) if (s[k]) parts.push(`+${s[k]} ${STAT[k]}`);
  for (const [k, v] of Object.entries(itemRatings(it))) parts.push(`+${v} ${RATING_LABEL[k]}`);
  if (it.foodHp) parts.push(`restores ${it.foodHp} HP (over time)`);
  if (it.drinkMana) parts.push(`restores ${it.drinkMana} mana (over time)`);
  if (it.potionHp) parts.push(`restores ${it.potionHp} HP`);
  if (it.potionMana) parts.push(`restores ${it.potionMana} mana`);
  if (it.elixir) {
    const mins = Math.round((it.elixir.duration || 0) / 60);
    const BUFF: Record<string, string> = { buff_sta: 'Stamina', buff_str: 'Strength', buff_agi: 'Agility', buff_int: 'Intellect', buff_spi: 'Spirit', buff_allstats: 'all stats', buff_armor: 'Armor', buff_ap: 'Attack Power', buff_sp: 'Spell Power' };
    const stat = BUFF[it.elixir.kind] || '';
    // stamina (vanilla rules: past the first 20, each point = 10 HP)
    const hp = (it.elixir.kind === 'buff_sta' || it.elixir.kind === 'buff_allstats') ? ` (~+${it.elixir.value * 10} HP)` : '';
    parts.push(`${it.elixir.aura}: +${it.elixir.value}${stat ? ' ' + stat : ''}${hp} for ${mins} min`);
  }
  return parts.join(', ');
}
