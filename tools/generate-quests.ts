import { QUESTS, MOBS, ITEMS, NPCS, CAMPS, GROUND_OBJECTS, ZONES } from '../woc/src/sim/data.ts';
import { ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_QUESTS } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_QUESTS } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import { ZONE1_ZONE } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_ZONE } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_ZONE } from '../woc/src/sim/content/zone3.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/out';

type Q = (typeof QUESTS)[string];

// Merge dungeon mobs into the name/loot universe.
const ALL_MOBS: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };

const zoneBuckets: { key: string; dir: string; title: string; quests: Record<string, Q>; levelRange: [number, number]; hub?: string }[] = [
  { key: 'zone1', dir: '01-eastbrook-vale', title: 'Zone 1 — Eastbrook Vale', quests: ZONE1_QUESTS, levelRange: ZONE1_ZONE.levelRange, hub: ZONE1_ZONE.hub?.name },
  { key: 'zone2', dir: '02-' + slug(ZONE2_ZONE.name), title: 'Zone 2 — ' + ZONE2_ZONE.name, quests: ZONE2_QUESTS, levelRange: ZONE2_ZONE.levelRange, hub: ZONE2_ZONE.hub?.name },
  { key: 'zone3', dir: '03-' + slug(ZONE3_ZONE.name), title: 'Zone 3 — ' + ZONE3_ZONE.name, quests: ZONE3_QUESTS, levelRange: ZONE3_ZONE.levelRange, hub: ZONE3_ZONE.hub?.name },
  { key: 'temple', dir: '04-the-drowned-temple', title: 'Zone 4 — The Drowned Temple (Endgame)', quests: TEMPLE_QUESTS, levelRange: templeRange(TEMPLE_QUESTS) },
];

function templeRange(quests: Record<string, Q>): [number, number] {
  const lvls = Object.values(quests).map(q => q.minLevel ?? 15);
  return [Math.min(...lvls), Math.max(...lvls)];
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function npcLabel(id?: string): string {
  if (!id) return '_unknown_';
  const n = NPCS[id];
  if (!n) return id;
  const where = n.pos ? ` _(at ~x:${Math.round(n.pos.x)}, z:${Math.round(n.pos.z)})_` : '';
  return `**${n.name}**${n.title ? `, ${n.title}` : ''}${where}`;
}

function mobName(id?: string): string {
  if (!id) return '?';
  return ALL_MOBS[id]?.name || id;
}
function itemName(id?: string): string {
  if (!id) return '?';
  return ITEMS[id]?.name || id;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

// camps that spawn a given mob
function campsForMob(mobId: string): string[] {
  return CAMPS.filter(c => c.mobId === mobId).map(c =>
    `~x:${Math.round(c.center.x)}, z:${Math.round(c.center.z)} (${plural(c.count, 'mob')}, radius ${c.radius})`);
}

// dungeons that spawn a given mob
function dungeonsForMob(mobId: string): { name: string; door: { x: number; z: number } }[] {
  return Object.values(DUNGEON_DEFS)
    .filter((d: any) => (d.spawns || []).some((s: any) => s.mobId === mobId))
    .map((d: any) => ({ name: d.name, door: d.doorPos }));
}

// which mobs drop a given item (esp. quest items)
function mobsDropping(itemId: string): { name: string; mobId: string; chance: number }[] {
  const out: { name: string; mobId: string; chance: number }[] = [];
  for (const [mid, m] of Object.entries(ALL_MOBS)) {
    for (const l of (m as any).loot || []) {
      if (l.itemId === itemId) out.push({ name: (m as any).name, mobId: mid, chance: l.chance });
    }
  }
  return out;
}

// ground object pickup locations for an item
function groundFor(itemId: string): string[] {
  const g = GROUND_OBJECTS.find(o => o.itemId === itemId);
  if (!g) return [];
  return g.positions.map(p => `~x:${Math.round(p.x)}, z:${Math.round(p.z)}`);
}

function whereMob(mobId: string): string[] {
  const out: string[] = [];
  for (const c of campsForMob(mobId)) out.push(`Found in the open world at ${c}`);
  for (const d of dungeonsForMob(mobId)) out.push(`Inside dungeon **${d.name}** (entrance portal ~x:${Math.round(d.door.x)}, z:${Math.round(d.door.z)})`);
  return out;
}

function sortLevel(q: Q, zoneLow: number): number {
  return q.minLevel ?? zoneLow;
}

function classRewards(q: Q): string {
  const r = q.itemRewards || {};
  const entries = Object.entries(r);
  if (entries.length === 0) return '';
  const byItem: Record<string, string[]> = {};
  for (const [cls, item] of entries) (byItem[item as string] ||= []).push(cls);
  return Object.entries(byItem)
    .map(([item, classes]) => `  - ${itemName(item)} — _${classes.join(', ')}_`)
    .join('\n');
}

function objectiveHowTo(o: any): string {
  const lines: string[] = [];
  if (o.type === 'kill') {
    const m = ALL_MOBS[o.targetMobId];
    const tags = m ? [m.boss && '**Boss**', m.elite && '**Elite**', m.rare && 'Rare'].filter(Boolean).join(', ') : '';
    const lvl = m ? ` (level ${m.minLevel}–${m.maxLevel}${tags ? ', ' + tags : ''})` : '';
    lines.push(`- **Kill ${o.count}× ${mobName(o.targetMobId)}**${lvl}`);
    const where = whereMob(o.targetMobId);
    if (where.length) for (const w of where) lines.push(`  - ${w}`);
    else lines.push(`  - _Spawns as part of a scripted encounter_`);
  } else if (o.type === 'collect') {
    lines.push(`- **Collect ${o.count}× ${itemName(o.itemId)}**`);
    const ground = groundFor(o.itemId);
    const drops = mobsDropping(o.itemId);
    if (ground.length) lines.push(`  - Pick up from the ground (sparkle objects) at: ${ground.join(' · ')}`);
    for (const d of drops) {
      const where = whereMob(d.mobId);
      const w = where.length ? ` — ${where.join('; ')}` : '';
      lines.push(`  - Drops from **${d.name}** (${Math.round(d.chance * 100)}% chance)${w}`);
    }
    if (!ground.length && !drops.length) lines.push(`  - _Granted by a prerequisite quest or special encounter_`);
  } else if (o.type === 'interact') {
    const tgt = o.targetNpcId ? npcLabel(o.targetNpcId) : itemName(o.targetObjectItemId);
    lines.push(`- **Interact ${o.count > 1 ? `${o.count}× ` : ''}with ${tgt}**`);
    if (o.targetObjectItemId) {
      const ground = groundFor(o.targetObjectItemId);
      if (ground.length) lines.push(`  - Locations: ${ground.join(' · ')}`);
    }
  }
  if (o.label) lines.push(`  - _Tracker: ${o.label}_`);
  return lines.join('\n');
}

function questMd(q: Q, zone: typeof zoneBuckets[number]): string {
  const L: string[] = [];
  L.push(`# ${q.name}`);
  L.push('');
  L.push(`> Quest ID: \`${q.id}\` · ${zone.title}`);
  L.push('');
  L.push(`| | |`);
  L.push(`|---|---|`);
  L.push(`| **Recommended level** | ${q.minLevel ? `${q.minLevel}+` : `${zone.levelRange[0]}+ (zone range ${zone.levelRange[0]}–${zone.levelRange[1]})`} |`);
  L.push(`| **Quest giver** | ${npcLabel(q.giverNpcId)} |`);
  const turnIns = (q.turnInNpcIds && q.turnInNpcIds.length ? q.turnInNpcIds : [q.turnInNpcId]).map(npcLabel).join(' or ');
  L.push(`| **Turn in to** | ${turnIns} |`);
  if (q.requiresQuest) L.push(`| **Requires** | ${QUESTS[q.requiresQuest]?.name || q.requiresQuest} (\`${q.requiresQuest}\`) |`);
  if (q.suggestedPlayers) L.push(`| **Group quest** | 👥 Suggested players: ${q.suggestedPlayers} |`);
  if (q.retired) L.push(`| **Status** | Retired (finishable only if already accepted) |`);
  L.push('');
  L.push(`## Story`);
  L.push('');
  L.push(`> ${q.text.replace(/\$N/g, '<your name>')}`);
  L.push('');
  L.push(`## How to complete`);
  L.push('');
  for (const o of q.objectives) L.push(objectiveHowTo(o));
  L.push('');
  L.push(`Then return to ${turnIns} to turn in.`);
  L.push('');
  L.push(`## Rewards`);
  L.push('');
  if (q.xpReward) L.push(`- **XP:** ${q.xpReward}`);
  if (q.copperReward) L.push(`- **Money:** ${q.copperReward} copper`);
  const cr = classRewards(q);
  if (cr) { L.push(`- **Item reward (by class):**`); L.push(cr); }
  if (!q.xpReward && !q.copperReward && !cr) L.push(`- _None_`);
  L.push('');
  L.push(`## On completion`);
  L.push('');
  L.push(`> ${q.completionText}`);
  L.push('');
  const followups = Object.values(QUESTS).filter(x => x.requiresQuest === q.id);
  if (followups.length) {
    L.push(`## Leads to`);
    L.push('');
    for (const f of followups) L.push(`- ${f.name} (\`${f.id}\`)`);
    L.push('');
  }
  L.push(`## Zone map`);
  L.push('');
  L.push(`![Map of ${zone.title}](map.svg)`);
  L.push('');
  L.push(`_Gold = NPCs · red = mob camps · purple = dungeons · green = ground pickups. Match the names above to the markers._`);
  L.push('');
  L.push(`See the **[zone bestiary](bestiary.md)** for the health, armor, and kill tactics of every mob named above.`);
  L.push('');
  return L.join('\n');
}

// ---- write files ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

type Row = { name: string; id: string; lvl: number; zone: string; zoneDir: string; file: string; group: boolean; chain?: string };
const rows: Row[] = [];

for (const zone of zoneBuckets) {
  const dir = `${OUT}/zones/${zone.dir}`;
  fs.mkdirSync(dir, { recursive: true });
  const ordered = Object.values(zone.quests).sort((a, b) => sortLevel(a, zone.levelRange[0]) - sortLevel(b, zone.levelRange[0]));
  const zlines: string[] = [];
  zlines.push(`# ${zone.title}`);
  zlines.push('');
  zlines.push(`Level range: **${zone.levelRange[0]}–${zone.levelRange[1]}**${zone.hub ? ` · Hub: ${zone.hub}` : ''} · ${ordered.length} quests`);
  zlines.push('');
  zlines.push(`![Map of ${zone.title}](map.svg)`);
  zlines.push('');
  zlines.push(`_Gold = NPCs · red = mob camps (×count) · purple = dungeon entrances · green = ground pickups · blue = water._`);
  zlines.push('');
  zlines.push(`📖 **[Bestiary for this zone](bestiary.md)** — every mob's health, armor, damage, and how to kill it.`);
  zlines.push('');
  zlines.push(`| Lvl | Quest | Giver | Type |`);
  zlines.push(`|----:|-------|-------|------|`);
  for (const q of ordered) {
    const lvl = sortLevel(q, zone.levelRange[0]);
    const file = `${slug(q.id)}.md`;
    fs.writeFileSync(`${dir}/${file}`, questMd(q, zone));
    const types = [...new Set(q.objectives.map((o: any) => o.type))].join('/');
    const grp = !!q.suggestedPlayers;
    zlines.push(`| ${lvl} | [${q.name}](${file})${grp ? ' 👥' : ''} | ${NPCS[q.giverNpcId]?.name || q.giverNpcId} | ${types} |`);
    rows.push({ name: q.name, id: q.id, lvl, zone: zone.title, zoneDir: zone.dir, file: `zones/${zone.dir}/${file}`, group: grp, chain: q.requiresQuest });
  }
  zlines.push('');
  fs.writeFileSync(`${dir}/README.md`, zlines.join('\n'));
}

// by-level index  (lives at OUT/by-level.md, so links are zones/...)
rows.sort((a, b) => a.lvl - b.lvl || a.zone.localeCompare(b.zone));
const byLvl: Record<number, Row[]> = {};
for (const r of rows) (byLvl[r.lvl] ||= []).push(r);
const levels = Object.keys(byLvl).map(Number).sort((a, b) => a - b);

const bl: string[] = [];
bl.push(`# Quests by Level`);
bl.push('');
bl.push(`Pick quests at or below your character's level. 👥 = group quest. "chain" = part of a quest chain (do its prerequisites first).`);
bl.push('');
for (const lvl of levels) {
  bl.push(`## Level ${lvl}+`);
  bl.push('');
  bl.push(`| Quest | Zone | Notes |`);
  bl.push(`|-------|------|-------|`);
  for (const r of byLvl[lvl]) bl.push(`| [${r.name}](${r.file})${r.group ? ' 👥' : ''} | ${r.zone} | ${r.chain ? 'chain' : ''} |`);
  bl.push('');
}
fs.writeFileSync(`${OUT}/by-level.md`, bl.join('\n'));

// quests index
const qi: string[] = [];
qi.push(`# Quests`);
qi.push('');
qi.push(`${rows.length} quests across ${zoneBuckets.length} zones.`);
qi.push('');
qi.push(`- **[By level](by-level.md)** — pick what your character can do now.`);
qi.push('');
qi.push(`## By zone`);
qi.push('');
for (const z of zoneBuckets) {
  const n = Object.keys(z.quests).length;
  qi.push(`- **[${z.title}](zones/${z.dir}/README.md)** — levels ${z.levelRange[0]}–${z.levelRange[1]} · ${n} quests`);
}
qi.push('');
fs.writeFileSync(`${OUT}/README.md`, qi.join('\n'));

// per-character progress template  (lives at OUT/../characters/_template.md)
const charDir = `${OUT}/../characters`;
fs.mkdirSync(charDir, { recursive: true });
const tpl: string[] = [];
tpl.push(`# <Character Name>`);
tpl.push('');
tpl.push(`> Class: <warrior / mage / rogue / ...> · Current level: <1>`);
tpl.push('');
tpl.push(`Tick a box when you turn the quest in. Work top-down — quests are grouped by the level they unlock at.`);
tpl.push('');
for (const lvl of levels) {
  tpl.push(`## Level ${lvl}+`);
  tpl.push('');
  for (const r of byLvl[lvl]) {
    tpl.push(`- [ ] [${r.name}](../quests/${r.file})${r.group ? ' 👥' : ''}${r.chain ? ' _(chain)_' : ''} — ${r.zone}`);
  }
  tpl.push('');
}
fs.writeFileSync(`${charDir}/_template.md`, tpl.join('\n'));

const cr: string[] = [];
cr.push(`# Characters`);
cr.push('');
cr.push(`Track each of your characters' quest progress here.`);
cr.push('');
cr.push(`## Add a character`);
cr.push('');
cr.push(`1. Copy [\`_template.md\`](_template.md) to \`<your-character-name>.md\`.`);
cr.push(`2. Fill in the class and current level at the top.`);
cr.push(`3. Check off quests as you complete them. The list is ordered by unlock level — do everything at or below your level.`);
cr.push('');
cr.push(`## My characters`);
cr.push('');
cr.push(`<!-- Add a link per character file you create, e.g. -->`);
cr.push(`<!-- - [Thrall](thrall.md) — warrior, level 7 -->`);
cr.push('');
fs.writeFileSync(`${charDir}/README.md`, cr.join('\n'));

console.log(`Wrote ${rows.length} quests across ${zoneBuckets.length} zones to ${OUT}`);
