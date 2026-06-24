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
  if (it.foodHp) parts.push(`restores ${it.foodHp} HP (over time)`);
  if (it.drinkMana) parts.push(`restores ${it.drinkMana} mana (over time)`);
  if (it.potionHp) parts.push(`restores ${it.potionHp} HP`);
  if (it.potionMana) parts.push(`restores ${it.potionMana} mana`);
  if (it.elixir) {
    const mins = Math.round((it.elixir.duration || 0) / 60);
    parts.push(`${it.elixir.aura}: +${it.elixir.value} for ${mins} min`);
  }
  return parts.join(', ');
}
