import { BIND_ACTIONS, BIND_CATEGORIES } from '../woc/src/game/keybinds.ts';
import * as fs from 'node:fs';

// emote ids are a local const in sim.ts — scrape them so the list stays current
const WOC = process.env.WOC_DIR || '../woc';
let EMOTE_IDS: string[] = [];
try {
  const sim = fs.readFileSync(`${WOC}/src/sim/sim.ts`, 'utf8');
  const m = /const EMOTES[^=]*=\s*\{([\s\S]*?)\n\};/.exec(sim);
  if (m) EMOTE_IDS = [...m[1].matchAll(/^\s{2,4}([a-z_]+):\s*\{/gm)].map(x => x[1]);
} catch {}

const OUT = process.argv[2] || '/tmp/gen/getting-started.md';

function keyLabel(code: string): string {
  const m = /^Key([A-Z])$/.exec(code); if (m) return m[1];
  const d = /^Digit(\d)$/.exec(code); if (d) return d[1];
  return ({ ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Space: 'Space', Escape: 'Esc', Enter: 'Enter', Tab: 'Tab' } as any)[code] || code.replace(/^Key|^Digit/, '');
}
const keysFor = (a: any) => (a.defaults || []).map(keyLabel).map((k: string) => `\`${k}\``).join(' or ');

const L: string[] = [];
L.push(`# Getting started`);
L.push('');
L.push(`New to World of Claudecraft? This walks you from zero to questing, grouping, and trading — plus fixes for lag.`);
L.push('');

L.push(`## 1. Move around`);
L.push('');
L.push(`Click into the game window first so it captures your keyboard, then:`);
L.push('');
L.push(`- **Walk** with **\`W\` \`A\` \`S\` \`D\`** (or the **arrow keys**).`);
L.push(`- **Jump** with **\`Space\`**.`);
L.push(`- **Look around** by holding the **right mouse button** and dragging; scroll to zoom.`);
L.push('');

L.push(`## 2. Start a quest (click an NPC)`);
L.push('');
L.push(`- Walk up to an **NPC with a quest marker** above their head and **click them** to talk.`);
L.push(`- Read the offer and **accept** it. Your active quests live in the **Quest Log** (\`L\`).`);
L.push(`- Do the objective (kill / collect / interact), then **click the turn-in NPC** to hand it in.`);
L.push(`- Not sure where to go? Use this guide's **[Quests](#/quests)** and **[Leveling route](#/route)** — every quest has a "where to go" map.`);
L.push('');

L.push(`## 3. Group & trade with real players`);
L.push('');
L.push(`- **Click another player** to target them and open their menu.`);
L.push(`- Choose **Invite to Party** to group up (they get a prompt to accept), or **Trade** to swap items and coin.`);
L.push(`- In a trade window, drag items in and set coin, then both players confirm.`);
L.push(`- Party members nearby **share quest credit and XP** (with a group XP bonus).`);
L.push('');

L.push(`## 4. Chat & party chat`);
L.push('');
L.push(`Press **\`Enter\`** to open chat, type, and press **\`Enter\`** to send. Prefix the line to pick a channel:`);
L.push('');
L.push(`| Type this | Goes to |`);
L.push(`|---|---|`);
L.push(`| \`/s message\` (or \`/say\`) | **Say** — players nearby |`);
L.push(`| \`/y message\` (or \`/yell\`) | **Yell** — the whole area |`);
L.push(`| \`/w name message\` (or \`/tell\`) | **Whisper** one player privately |`);
L.push(`| \`/p message\` (or \`/party\`) | **Party** chat |`);
L.push(`| \`/g message\` | **Guild** chat |`);
L.push(`| \`/general message\` | **General** — the zone-wide channel |`);
L.push(`| \`/world message\` | **World** channel |`);
L.push(`| \`/lfg message\` | **Looking-for-group** channel |`);
L.push('');
L.push(`> Manage your guild and friends from the **Social** panel (friends / guild / ignore tabs).`);
L.push('');
if (EMOTE_IDS.length) {
  L.push(`**Emotes.** Express yourself with \`/<emote>\` (add a target's name to aim it, e.g. \`/wave Aldric\`), or open the **Emote Wheel** (\`X\`). Available:`);
  L.push('');
  L.push(EMOTE_IDS.map(e => `\`/${e}\``).join(' · '));
  L.push('');
}

L.push(`## 5. Running slow? Fix lag`);
L.push('');
L.push(`Most stutter is the browser, not the game. In order:`);
L.push('');
L.push(`1. **Play in an Incognito / Private window.** This disables browser extensions, which are the most common cause of lag and input glitches.`);
L.push(`2. **Turn graphics down to Medium.** The game defaults to **Ultra**. Open **Settings** and set the graphics preset to **Medium** (or **Low**). Instant trick: add **\`?gfx=medium\`** to the page URL and reload (also \`?gfx=low\` / \`?gfx=high\`).`);
L.push(`3. **Use a Chromium browser** (Chrome/Edge) and **close other heavy tabs**.`);
L.push(`4. On a laptop, plug in to mains and set the OS to **High performance** so the GPU isn't throttled.`);
L.push('');

L.push(`## Full controls`);
L.push('');
for (const cat of BIND_CATEGORIES) {
  const rows = (BIND_ACTIONS as any[]).filter(a => a.category === cat && (a.defaults || []).length);
  if (!rows.length) continue;
  L.push(`### ${cat}`);
  L.push('');
  L.push(`| Action | Keys |`);
  L.push(`|---|---|`);
  for (const a of rows) L.push(`| ${a.label} | ${keysFor(a)} |`);
  L.push('');
}
L.push(`_Most actions are rebindable in Settings → Keybinds._`);
L.push('');

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, L.join('\n'));
console.log(`wrote getting-started guide (${BIND_ACTIONS.length} keybinds across ${BIND_CATEGORIES.length} categories)`);
