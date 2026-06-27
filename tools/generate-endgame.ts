// Emits reference/endgame.md — the post-cap / prestige / rested-XP guide,
// using the real exported constants so the numbers track the source.
import { MAX_LEVEL, PRESTIGE_XP_PER_RANK, MAX_VIRTUAL_LEVEL, XP_TABLE } from '../woc/src/sim/types.ts';
import * as fs from 'node:fs';

const out = process.argv[2] || 'reference/endgame.md';
const toCap = XP_TABLE.slice(0, MAX_LEVEL - 1).reduce((a, b) => a + b, 0);
const fmt = (n: number) => n.toLocaleString('en-US');

const L: string[] = [];
L.push('# Endgame: Cap, Virtual Levels & Prestige');
L.push('');
L.push(`The level cap is **${MAX_LEVEL}**. Reaching it takes **${fmt(toCap)} total XP**. After that your character keeps progressing in two ways — cosmetic **virtual levels** and meaningful **prestige ranks** — and **rested XP** speeds the whole climb.`);
L.push('');

L.push('## At the cap');
L.push(`- Levels 1–${MAX_LEVEL} use the normal XP curve (the last level, ${MAX_LEVEL - 1}→${MAX_LEVEL}, alone costs **${fmt(XP_TABLE[MAX_LEVEL - 2])} XP**).`);
L.push('- Once you hit the cap, **every XP you earn is banked as lifetime XP** — nothing is wasted. That banked XP drives both systems below.');
L.push('');

L.push('## Virtual levels (cosmetic)');
L.push(`- Past the cap your XP bar keeps "leveling" into a **virtual level**, purely for show, up to **${MAX_VIRTUAL_LEVEL}**.`);
L.push('- Each virtual level past the cap costs **~10% more** lifetime XP than the last, so the bar slows down the higher you push it.');
L.push('- It does not change your power — it is a long-term progress/flex meter.');
L.push('');

L.push('## Prestige ranks');
L.push(`- **Every ${fmt(PRESTIGE_XP_PER_RANK)} lifetime XP earned *past the cap* = one prestige rank** (that's a full level-cap bar's worth per rank).`);
L.push(`- You can prestige only **at level ${MAX_LEVEL}**, and only once you've banked enough post-cap XP for the next rank.`);
L.push('- Because rank is a pure function of XP *actually earned* past the cap, it can\'t be cheesed — you simply keep playing at cap and the ranks accrue.');
L.push('- **Tip:** at cap, the fastest prestige is the same as fast leveling — chain level-appropriate quests and high-XP content rather than grinding low mobs.');
L.push('');

L.push('## Rested XP (use it the whole way up)');
L.push('- Rested XP **banks while you\'re resting at an inn** (standing in/just beside an inn, out of combat).');
L.push('- It fills at **~5% of a level per 8 in-game hours** and **caps at 1.5 levels** of banked XP.');
L.push('- Spend it by going out and killing — banked rested XP is consumed as **bonus kill XP** until the pool runs dry.');
L.push('- **Habit:** log out / idle inside an inn. You\'ll come back with a rested pool that makes your next session\'s grind noticeably faster — all the way to cap and beyond.');
L.push('');
L.push('See also: [Combat maths](combat.md) and [Raids & dungeons](raids-and-dungeons.md) for where the big end-game XP comes from.');
L.push('');
L.push('_Auto-generated from the game source; updates with each release._');

fs.writeFileSync(out, L.join('\n') + '\n');
console.log(`wrote endgame guide (cap ${MAX_LEVEL}, ${fmt(PRESTIGE_XP_PER_RANK)} xp/prestige) to ${out}`);
