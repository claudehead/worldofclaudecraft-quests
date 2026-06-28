// Emits docs/bosses.json — strategy cards for every boss/elite with special
// mechanics, turning the raw mechanic data into human-readable tips.
import { CAMPS, MOBS, ZONES } from '../woc/src/sim/data.ts';
import { DUNGEON_DEFS } from '../woc/src/sim/content/dungeons.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || 'docs/bosses.json';
const zoneFor = (z: number) => ZONES.find((zz: any) => z >= zz.zMin && z < zz.zMax)?.name || '—';
const pct = (f: number) => Math.round(f * 100) + '%';

// mob -> overworld zones
const zonesOf: Record<string, Set<string>> = {};
for (const c of CAMPS as any[]) (zonesOf[c.mobId] ||= new Set()).add(zoneFor(c.center.z));
// mob -> dungeon name
const dungeonOf: Record<string, string> = {};
for (const [, d] of Object.entries(DUNGEON_DEFS) as any[]) for (const s of d.spawns || []) { const id = s.mobId || s.template; if (id && !dungeonOf[id]) dungeonOf[id] = d.name; }

// Hand-authored tips for bosses whose signature mechanic is coded in raid logic
// rather than template data (so it can't be auto-derived).
const MANUAL_TIPS: Record<string, string[]> = {
  nythraxis_scourge_of_thornpeak: [
    '☠️ **Death Decree** — Nythraxis periodically charges a raid-wide death attack; watch the cast bar under his HP. Reach and trigger the **pillars** before it finishes to interrupt it.',
    '🏛 **Pillars take time to charge** — send people early. If you\'re too slow to the pillars, it\'s gg (raid wipe).',
  ],
};

function tips(t: any): string[] {
  const o: string[] = MANUAL_TIPS[t.id] ? [...MANUAL_TIPS[t.id]] : [];
  if (t.aoePulse) o.push(`💥 **${t.aoePulse.name}** — ${t.aoePulse.min}–${t.aoePulse.max} AoE every ${t.aoePulse.every}s within ${t.aoePulse.radius}yd. Heal through it or keep your distance.`);
  if (t.stomp) o.push(`🦶 **${t.stomp.name}** — AoE stun${t.stomp.min ? ` + ${t.stomp.min}–${t.stomp.max} dmg` : ''} every ${t.stomp.every}s (${t.stomp.radius}yd). Don't clump; expect to be stunned.`);
  if (t.terrify) o.push(`😱 **${t.terrify.name}** — fears everyone nearby every ${t.terrify.every}s. Fight near a wall so you don't run far.`);
  if (t.summonAdds) o.push(`➕ Summons ${t.summonAdds.count}× adds at ${t.summonAdds.atHpPct.map(pct).join(', ')} HP. Kill adds fast or burst past the threshold.`);
  if (t.enrage) o.push(`🔴 Enrages below ${pct(t.enrage.belowHpPct)} HP (+${Math.round((t.enrage.dmgMult - 1) * 100)}% damage${t.enrage.hasteMult ? ', faster swings' : ''}). Save defensives for the execute phase.`);
  if (t.desperateHeal) o.push(`🩹 Self-heals ${pct(t.desperateHeal.healPct)} once below ${pct(t.desperateHeal.belowHpPct)} HP. Burst through it.`);
  if (t.rampage) o.push(`📈 **${t.rampage.name}** — gains attack power the longer it stays in melee (up to ${t.rampage.maxStacks} stacks). Breaking melee / kiting resets it.`);
  if (t.stoneskin) o.push(`🪨 **${t.stoneskin.name}** — self-shield (${t.stoneskin.amount} absorb) every ${t.stoneskin.every}s. Time your burst between shields.`);
  if (t.mendAlly) o.push(`💚 **${t.mendAlly.name}** — heals nearby allies ${t.mendAlly.healMin}–${t.mendAlly.healMax} every ${t.mendAlly.every}s. Kill or pull it away from its friends.`);
  if (t.wardAllies) o.push(`🛡 **${t.wardAllies.name}** — shields allies (${t.wardAllies.amount} absorb) every ${t.wardAllies.every}s. Focus it down first.`);
  if (t.rally) o.push(`⚔️ **${t.rally.name}** — buffs allies' attack power. Priority kill.`);
  if (t.warcry) o.push(`⏩ **${t.warcry.name}** — hastes allies' swings. Priority kill.`);
  return o;
}

const out = (Object.entries(MOBS) as any[]).map(([id, t]) => {
  const tps = tips(t);
  if (!t.boss && !tps.length) return null; // only bosses or mobs with real mechanics
  const lvl = Math.round((t.minLevel + t.maxLevel) / 2);
  const hp = Math.round((t.hpBase + t.hpPerLevel * (lvl - 1)) * (t.elite ? 2.3 : 1));
  const where = dungeonOf[id] || [...(zonesOf[id] || [])].filter((z) => z !== '—').join(', ') || '—';
  return { id, name: t.name, level: lvl, hp, rank: t.boss ? 'Boss' : t.elite ? 'Elite' : 'Rare', where, tips: tps };
}).filter(Boolean).sort((a: any, b: any) => a.level - b.level || a.name.localeCompare(b.name));

fs.writeFileSync(OUT, JSON.stringify({ bosses: out }));
console.log(`wrote bosses.json (${out.length} encounters) to ${OUT}`);
