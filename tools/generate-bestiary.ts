import { MOBS, ITEMS } from '../woc/src/sim/data.ts';
import { armorReduction } from '../woc/src/sim/types.ts';
import { ZONE1_CAMPS, ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_CAMPS, ZONE2_QUESTS } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_CAMPS, ZONE3_QUESTS } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_CAMPS, TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/out';
const ALL_MOBS: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };

const TEMPLE_DUNGEONS = new Set(['nythraxis_crypt', 'nythraxis_boss_arena']);

interface ZoneSpec { dir: string; title: string; camps: any[]; quests: any; zBand?: [number, number]; temple?: boolean; }
const zones: ZoneSpec[] = [
  { dir: '01-eastbrook-vale', title: 'Eastbrook Vale', camps: ZONE1_CAMPS, quests: ZONE1_QUESTS, zBand: [-180, 180] },
  { dir: '02-mirefen-marsh', title: 'Mirefen Marsh', camps: ZONE2_CAMPS, quests: ZONE2_QUESTS, zBand: [180, 540] },
  { dir: '03-thornpeak-heights', title: 'Thornpeak Heights', camps: ZONE3_CAMPS, quests: ZONE3_QUESTS, zBand: [540, 900] },
  { dir: '04-the-drowned-temple', title: 'The Drowned Temple', camps: TEMPLE_CAMPS, quests: TEMPLE_QUESTS, temple: true },
];

const itemName = (id: string) => ITEMS[id]?.name || id;

// ---- stat math (mirrors createMob in entity.ts) ----
function hpAt(m: any, lvl: number): number {
  const mult = m.elite ? 2.3 : 1;
  return Math.round((m.hpBase + m.hpPerLevel * (lvl - 1)) * mult);
}
function armorAt(m: any, lvl: number): number {
  return Math.round(m.armorPerLevel * (lvl - 1));
}
function dmgAt(m: any, lvl: number): { min: number; max: number; dps: number } {
  const mult = m.elite ? 1.5 : 1;
  const dmg = (m.dmgBase + m.dmgPerLevel * (lvl - 1)) * mult;
  const min = Math.round(dmg * 0.8), max = Math.round(dmg * 1.25);
  return { min, max, dps: Math.round((min + max) / 2 / m.attackSpeed) };
}
// physical mitigation a same-level attacker sees
function mitig(m: any, lvl: number): number {
  return Math.round(armorReduction(armorAt(m, lvl), lvl) * 100);
}

// ---- tactics from mechanics ----
// ordered: most important first. value = advice line.
const MECH: Record<string, string> = {
  // kill-priority support
  mendAlly: 'Heals its wounded allies on a timer — **kill it first** or burst the group together.',
  wardAllies: 'Shields its allies with absorbs — focus it down before it can ward the pack.',
  rally: 'Buffs allies\' attack power — kill this one first.',
  warcry: 'Hastes allies\' swings — kill this one first.',
  // adds / AoE / control
  summonAdds: 'Summons adds at HP thresholds — bring AoE or kill the adds fast; don\'t let them pile up.',
  aoePulse: 'Pulses AoE damage around itself — healers expect steady raid damage; don\'t bring extra mobs into it.',
  stomp: 'War Stomp stuns nearby players on a timer — spread out so it can\'t catch the whole group.',
  terrify: 'Fears nearby players — fight with your back to a wall or bring fear protection.',
  knockback: 'Knocks players back — never fight it near a ledge or more mobs.',
  deathThroes: 'Explodes when it dies — clear its blast radius the moment it drops.',
  // self-defense
  enrage: 'Enrages at low HP (hits much harder) — save burst/defensives for the execute, or kite while enraged.',
  desperateHeal: 'Heals itself once when low — stun/interrupt the cast or burst straight past it.',
  rampage: 'Builds escalating fury the longer it swings — burst it down, or break melee to drop the stacks.',
  stoneskin: 'Periodically hardens against physical hits — time burst between windows or switch to spell damage.',
  spellReflect: 'Reflects spells while active — stop casting until it drops.',
  thorns: 'Reflects melee damage back at attackers — prefer ranged/spell damage.',
  lifeleech: 'Heals from the damage it deals — out-DPS its self-healing.',
  siphonSpirit: 'Drains life to heal itself — burst it before it tops up.',
  healAbsorb: 'Can blanket you in a heal-absorb — burst-heal through it or wait it out.',
  // your-healing / resources
  mortalStrike: 'Cuts the healing you receive — kill it before the debuff stacks matter.',
  manaBurn: 'Burns your mana — kill it quickly before casters run dry.',
  sapVigor: 'Saps your resources — keep fights short.',
  costTax: 'Taxes your ability costs — don\'t let the fight drag.',
  enervate: 'Drains your energy/mana — burst it down.',
  // lockouts on casters
  silence: 'Silences casters — melee/wand it down, or LoS the cast.',
  lockout: 'Locks out a spell school — swap schools or finish it fast.',
  tongues: 'Slows your casting — melee are unaffected.',
  // slows / snares
  chillOnHit: 'Chills/slows you on hit — don\'t rely on kiting once you\'re hit; just kill it.',
  frostbite: 'Frost DoT that slows — cleanse or push through quickly.',
  ensnare: 'Roots/snares you — bring a movement break or fight in place.',
  slowStrike: 'Slows your attack speed on hit — expect a longer fight.',
  staggerHit: 'Lowers your dodge on hit — tanks lose avoidance; rely on a healer.',
  // disarms / disables
  disarm: 'Can disarm your weapon — casters are unaffected; melee just wait it out.',
  stunOnHit: 'Chance to stun on hit — don\'t fight several at once.',
  concuss: 'Concusses (brief stun/daze) on hit — avoid multi-pulls.',
  blind: 'Can blind you — pull singles so a blind isn\'t fatal.',
  hex: 'Can hex/transform you — kill it fast or fight with a partner.',
  polymorphHex: 'Can polymorph you — avoid fighting it alongside other mobs.',
  // DoTs / debuffs on hit
  venom: 'Poison DoT on hit — cleanse it or keep heals ticking.',
  stackPoison: 'Stacking poison — the longer it\'s on you the harder it bites; kill it before stacks ramp.',
  bleed: 'Physical bleed DoT — bandages won\'t work while it ticks; heal through it.',
  smolder: 'Fire DoT on hit — cleanse or heal through.',
  cinder: 'Fire DoT on hit — cleanse or heal through.',
  soulrot: 'Shadow DoT on hit — cleanse or heal through.',
  arcaneRot: 'Arcane DoT on hit — cleanse or heal through.',
  plague: 'Disease DoT — cleanse disease or heal through.',
  wither: 'Withers your stats over time — kill it before the debuff piles up.',
  corrode: 'Corrodes your armor — physical mitigation drops; finish it quickly.',
  // damage-taken debuffs it applies to you
  expose: 'Raises the damage you take — don\'t tank it without a healer.',
  spellVuln: 'Raises your spell damage taken — don\'t face-tank casters alongside it.',
  critVuln: 'Makes you take more crits — bursty fight; keep HP topped.',
  vulnerability: 'Increases your damage taken — fight it with support.',
  demoralize: 'Lowers your attack power — expect a slower kill.',
  enfeeble: 'Weakens you — keep the fight short.',
  dread: 'Stacks a fear/dread debuff — don\'t let the fight drag.',
  // pack
  packFrenzy: 'Frenzies nearby kin (faster swings) when one dies — pull them one at a time.',
  frenzyOnHit: 'Frenzies when hit/hurt — expect rising damage; burst it.',
  cleave: 'Cleaves its frontal arc — keep everyone but the tank out of its face.',
  purgeOnHit: 'Strips your buffs on hit — re-up key buffs or burst it down.',
};

function tacticsFor(m: any): string[] {
  const out: string[] = [];
  // framing line
  if (m.boss) out.push('**Boss** — fight it as a group in its dungeon; assign a tank and watch its mechanics below.');
  else if (m.elite) out.push('**Elite** — ~2.3× the health and ~1.5× the damage of a normal mob; bring a group or out-level it.');
  else if (m.rare) out.push('**Rare** — a tougher roaming spawn; worth killing for loot, but pull it solo.');

  const mit = mitig(m, m.maxLevel);
  if (mit >= 35) out.push(`Heavily armored (~${mit}% physical mitigation at its level) — physical classes want armor reduction/Sunder; casters largely ignore armor.`);

  if (m.ccImmune) out.push('Immune to crowd control — it can\'t be stunned, feared, or polymorphed; just tank and burn.');

  for (const key of Object.keys(MECH)) {
    if (m[key]) {
      const nm = m[key]?.name ? `**${m[key].name}:** ` : '';
      out.push(`${nm}${MECH[key]}`);
    }
  }
  if (m.canSwim) out.push('Will follow you into the water — no escaping by swimming.');

  if (out.length === 0 || (out.length === 1 && (m.elite || m.boss || m.rare))) {
    out.push('Straightforward melee attacker — tank it, heal as needed, and burn it down. No special tricks.');
  }
  return out;
}

const FAMILY_LABEL: Record<string, string> = {
  beast: 'Beast', humanoid: 'Humanoid', murloc: 'Murloc', spider: 'Spider', kobold: 'Kobold',
  undead: 'Undead', troll: 'Troll', ogre: 'Ogre', elemental: 'Elemental', dragonkin: 'Dragonkin', demon: 'Demon',
};

function mobSection(m: any): string {
  const L: string[] = [];
  const flags = [m.boss && 'Boss', m.elite && 'Elite', m.rare && 'Rare'].filter(Boolean).join(' · ');
  L.push(`### ${m.name}${flags ? ` — _${flags}_` : ''}`);
  L.push('');
  L.push(`<img src="../_mob-icons/${m.id}.svg" width="100" align="right" alt="${m.name}">`);
  L.push('');
  const lvl = m.minLevel === m.maxLevel ? `${m.minLevel}` : `${m.minLevel}–${m.maxLevel}`;
  const hpLo = hpAt(m, m.minLevel), hpHi = hpAt(m, m.maxLevel);
  const hp = hpLo === hpHi ? `${hpLo}` : `${hpLo}–${hpHi}`;
  const dLo = dmgAt(m, m.minLevel), dHi = dmgAt(m, m.maxLevel);
  const armLo = armorAt(m, m.minLevel), armHi = armorAt(m, m.maxLevel);
  const arm = armLo === armHi ? `${armLo}` : `${armLo}–${armHi}`;
  const mLo = mitig(m, m.minLevel), mHi = mitig(m, m.maxLevel);
  const mit = mLo === mHi ? `${mLo}%` : `${mLo}–${mHi}%`;

  L.push(`| Stat | Value |`);
  L.push(`|---|---|`);
  L.push(`| Level | ${lvl} |`);
  L.push(`| Family | ${FAMILY_LABEL[m.family] || m.family} |`);
  L.push(`| Health | ${hp} HP |`);
  L.push(`| Armor (physical mitigation) | ${arm} (~${mit} vs a same-level attacker) |`);
  const dps = dLo.dps === dHi.dps ? `${dLo.dps}` : `${dLo.dps}–${dHi.dps}`;
  L.push(`| Melee damage | ${dLo.min}–${dHi.max} per hit @ ${m.attackSpeed}s swing (~${dps} DPS) |`);
  if (m.ccImmune) L.push(`| Crowd control | Immune |`);
  const drops = (m.loot || []).filter((l: any) => l.itemId).map((l: any) => `${itemName(l.itemId)} (${Math.round(l.chance * 100)}%)`);
  if (drops.length) L.push(`| Notable drops | ${drops.join(', ')} |`);
  L.push('');
  L.push(`**Best way to kill:**`);
  L.push('');
  for (const t of tacticsFor(m)) L.push(`- ${t}`);
  L.push('');
  return L.join('\n');
}

function mobsForZone(spec: ZoneSpec): any[] {
  const ids = new Set<string>();
  for (const c of spec.camps) ids.add(c.mobId);
  // quest kill targets
  for (const q of Object.values(spec.quests) as any[])
    for (const o of q.objectives || []) if (o.type === 'kill' && o.targetMobId) ids.add(o.targetMobId);
  // dungeon spawns for this zone
  for (const [id, d] of Object.entries(DUNGEON_DEFS) as any[]) {
    const inZone = spec.temple ? TEMPLE_DUNGEONS.has(id)
      : spec.zBand && !TEMPLE_DUNGEONS.has(id) && d.doorPos.z >= spec.zBand[0] && d.doorPos.z < spec.zBand[1];
    if (inZone) for (const s of d.spawns || []) ids.add(s.mobId);
  }
  const mobs = [...ids]
    .map(id => ALL_MOBS[id])
    .filter(Boolean)
    .filter(m => !m.petRole) // exclude summonable pets
    .sort((a, b) => (a.minLevel - b.minLevel) || (a.boss ? 1 : 0) - (b.boss ? 1 : 0) || a.name.localeCompare(b.name));
  return mobs;
}

for (const spec of zones) {
  const mobs = mobsForZone(spec);
  const L: string[] = [];
  L.push(`# Bestiary — ${spec.title}`);
  L.push('');
  L.push(`${mobs.length} creatures you'll fight in this zone. Health/armor/damage are shown across the mob's spawn level range (mobs roll a random level within it). Mitigation % is what a same-level attacker's physical hits lose to armor — spells ignore armor.`);
  L.push('');
  L.push(`> Threat tiers: **Boss** (dungeon, group it) · **Elite** (~2.3× HP, ~1.5× damage) · **Rare** (tough roamer) · normal (everything else).`);
  L.push('');
  // group: normal/rare first, elites, bosses last
  const normals = mobs.filter(m => !m.elite && !m.boss);
  const elites = mobs.filter(m => m.elite && !m.boss);
  const bosses = mobs.filter(m => m.boss);
  if (normals.length) { L.push(`## Common creatures`); L.push(''); for (const m of normals) L.push(mobSection(m)); }
  if (elites.length) { L.push(`## Elites`); L.push(''); for (const m of elites) L.push(mobSection(m)); }
  if (bosses.length) { L.push(`## Bosses`); L.push(''); for (const m of bosses) L.push(mobSection(m)); }
  L.push(`---`);
  L.push('');
  L.push(`[← Back to ${spec.title} quests](README.md) · [Zone map](map.svg)`);
  L.push('');
  fs.writeFileSync(`${OUT}/zones/${spec.dir}/bestiary.md`, L.join('\n'));
  console.log(`bestiary: ${spec.dir} (${mobs.length} mobs)`);
}
console.log('done');
