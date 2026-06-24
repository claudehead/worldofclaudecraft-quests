import { MOBS } from '../woc/src/sim/data.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/out-dungeons';
const ALL: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };

// which zone bestiary holds a dungeon's mobs (for cross-links)
const TEMPLE_DUNGEONS = new Set(['nythraxis_crypt', 'nythraxis_boss_arena']);
function zoneDirForDungeon(id: string, doorZ: number): string {
  if (TEMPLE_DUNGEONS.has(id)) return '04-the-drowned-temple';
  if (doorZ < 180) return '01-eastbrook-vale';
  if (doorZ < 540) return '02-mirefen-marsh';
  return '03-thornpeak-heights';
}

function mobLink(id: string, label: string, zoneDir: string): string {
  return `[${label}](../quests/zones/${zoneDir}/bestiary.md#mob-${id})`;
}

function dungeonPage(id: string, d: any): string {
  const zoneDir = zoneDirForDungeon(id, d.doorPos.z);
  const counts: Record<string, number> = {};
  for (const s of d.spawns || []) counts[s.mobId] = (counts[s.mobId] || 0) + 1;
  const mobs = Object.entries(counts)
    .map(([mid, n]) => ({ m: ALL[mid], id: mid, n }))
    .filter(x => x.m)
    .sort((a, b) => (a.m.minLevel - b.m.minLevel) || (a.m.boss ? 1 : 0) - (b.m.boss ? 1 : 0));

  const lvls = mobs.flatMap(x => [x.m.minLevel, x.m.maxLevel]);
  const lvlRange = lvls.length ? `${Math.min(...lvls)}–${Math.max(...lvls)}` : '—';
  const bosses = mobs.filter(x => x.m.boss);

  const L: string[] = [];
  L.push(`# ${d.name}`);
  L.push('');
  L.push(`| | |`);
  L.push(`|---|---|`);
  L.push(`| **Suggested players** | ${d.suggestedPlayers || '?'} |`);
  L.push(`| **Enemy levels** | ${lvlRange} |`);
  L.push(`| **Entrance** | overworld portal ~x:${Math.round(d.doorPos.x)}, z:${Math.round(d.doorPos.z)} |`);
  L.push(`| **Zone** | [${zoneDir.replace(/^\d+-/, '').replace(/-/g, ' ')}](../quests/zones/${zoneDir}/README.md) |`);
  L.push('');
  if (d.enterText) { L.push(`> ${d.enterText}`); L.push(''); }

  if (mobs.length) {
    L.push(`![Map of ${d.name}](_maps/${id}.svg)`);
    L.push('');
    L.push(`_Green = entry · red/crimson = enemy pulls · gold = boss. Top to bottom is the route in._`);
    L.push('');
  }

  if (!mobs.length) {
    L.push(`_A quiet instance with no fixed enemies._`);
    L.push('');
  } else {
    if (bosses.length) {
      L.push(`## Bosses`);
      L.push('');
      for (const b of bosses) {
        const tags = [b.m.elite && 'Elite'].filter(Boolean).join(', ');
        L.push(`- ${mobLink(b.id, `**${b.m.name}**`, zoneDir)}${tags ? ` _(${tags})_` : ''} — level ${b.m.minLevel}${b.m.maxLevel !== b.m.minLevel ? `–${b.m.maxLevel}` : ''}. See the bestiary for its mechanics and loot.`);
      }
      L.push('');
    }
    L.push(`## Full roster`);
    L.push('');
    L.push(`| Enemy | Count | Level | Tier |`);
    L.push(`|---|---:|---|---|`);
    for (const x of mobs) {
      const tier = x.m.boss ? '**Boss**' : x.m.elite ? 'Elite' : x.m.rare ? 'Rare' : 'Normal';
      const lvl = x.m.minLevel === x.m.maxLevel ? `${x.m.minLevel}` : `${x.m.minLevel}–${x.m.maxLevel}`;
      L.push(`| ${mobLink(x.id, x.m.name, zoneDir)} | ${x.n} | ${lvl} | ${tier} |`);
    }
    L.push('');
  }
  if (d.leaveText) { L.push(`> ${d.leaveText}`); L.push(''); }
  L.push(`[← All dungeons](README.md)`);
  L.push('');
  return L.join('\n');
}

fs.mkdirSync(OUT, { recursive: true });
const entries = Object.entries(DUNGEON_DEFS) as any[];
const idx: string[] = [];
idx.push(`# Dungeons`);
idx.push('');
idx.push(`Instanced group content. Suggested party sizes and enemy levels are the game's own.`);
idx.push('');
idx.push(`| Dungeon | Players | Enemy levels | Bosses |`);
idx.push(`|---|---:|---|---|`);
for (const [id, d] of entries) {
  fs.writeFileSync(`${OUT}/${id}.md`, dungeonPage(id, d));
  const counts: Record<string, number> = {};
  for (const s of d.spawns || []) counts[s.mobId] = (counts[s.mobId] || 0) + 1;
  const mobs = Object.keys(counts).map(mid => ALL[mid]).filter(Boolean);
  const lvls = mobs.flatMap(m => [m.minLevel, m.maxLevel]);
  const lvlRange = lvls.length ? `${Math.min(...lvls)}–${Math.max(...lvls)}` : '—';
  const bosses = mobs.filter(m => m.boss).map(m => m.name).join(', ') || '—';
  idx.push(`| [${d.name}](${id}.md) | ${d.suggestedPlayers || '?'} | ${lvlRange} | ${bosses} |`);
}
idx.push('');
fs.writeFileSync(`${OUT}/README.md`, idx.join('\n'));
console.log(`wrote ${entries.length} dungeon pages to ${OUT}`);
