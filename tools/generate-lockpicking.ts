// Generates reference/lockpicking.md — the "Tumbler's Path" delve lockpicking
// minigame guide, derived from src/sim/lockpick.ts so it tracks the real rules.
import * as lp from '../woc/src/sim/lockpick.ts';
import * as fs from 'node:fs';

const out = process.argv[2] || 'reference/lockpicking.md';
const tier = lp.ANTE_TO_TIER as Record<string, string>;
const pages = lp.ANTE_TO_PAGES as Record<string, number>;
const tries = lp.ANTE_TO_TRIES as Record<string, number>;
const timeout = lp.ANTE_TO_STEP_TIMEOUT_MS as Record<string, number>;
const delta = lp.ACTION_DELTA as Record<string, number>;

const tierLabel: Record<string, string> = { premium: '🟣 Premium', medium: '🔵 Medium', low: '⚪ Low' };

const L: string[] = [];
L.push('# Lockpicking — Tumbler\'s Path');
L.push('');
L.push('Locked chests inside [delves](../delves/README.md) are opened with **Tumbler\'s Path**, a skill minigame. The board is a row of brass **tumbler tracks** (one per column); only the lit wards show — an open notch, a gold **gate**, the green **bolt seat**, or a red **ward-trap**. You drive the pick one column at a time, threading the open channel, seating on each gate and dodging traps, until it reaches the bolt seat. Clear it and the chest pays out; fail and it jams.');
L.push('');
L.push('> 🔓 **Practice it free, no chest required:** open the [**interactive Tumbler\'s Path trainer →**](#/lockpick) — the exact same board and rules, with Easy / Medium / Hard modes, so you can get the feel before you risk a real cache.');
L.push('');

// --- ante / risk-reward ---
L.push('## Ante = risk vs reward');
L.push('');
L.push('Before you pick, you **commit an ante** up front. The ante is locked in at engage time (you can\'t burn lives to climb tiers mid-pick), and it sets *both* the difficulty and the loot:');
L.push('');
L.push('| Ante | Loot tier | Reward pages | Tries allowed | Time per move |');
L.push('|---|---|---|---|---|');
for (const a of ['1', '2', '3']) {
  const t = tier[a];
  L.push(`| **${a}** | ${tierLabel[t] || t} | ${pages[a]} | ${tries[a]} | ${(timeout[a] / 1000).toFixed(0)}s |`);
}
L.push('');
L.push('- **Lower ante = bigger reward but harder:** Ante 1 pays the most (premium, ' + pages['1'] + ' pages) but gives **only ' + tries['1'] + ' try** and the tightest clock (' + (timeout['1'] / 1000) + 's per move). Ante 3 is forgiving (' + tries['3'] + ' tries, ' + (timeout['3'] / 1000) + 's per move) but pays the least.');
L.push('- **Each try must be flawless** — any slip, bind, or trap **jams that try**. Higher antes simply give you fewer tries to get a clean run.');
L.push('- The chest only **jams for good once your tries run out** — so at Ante 3 you get ' + tries['3'] + ' shots at a clean pick.');
L.push('');

// --- the moves ---
L.push('## The moves');
L.push('');
L.push('Each input nudges the pin by a fixed amount. Pick the move that lands the pin exactly on the open row for the next column:');
L.push('');
L.push('| Move | Pin shift |');
L.push('|---|---|');
const order = (lp.PICK_ACTIONS as string[]);
for (const a of order) {
  const d = delta[a];
  const dir = d < 0 ? `${d} (push in hard)` : d > 0 ? `+${d} (ease out)` : '0 (hold steady)';
  L.push(`| \`${a}\` | ${dir} |`);
}
L.push('');
L.push('- `hardSet` moves **−2**, `set` **−1**, `steady` **0**, `ease` **+1**, `drop` **+2** — combine them to step the pin onto each column\'s open row.');
L.push('- `abort` bails out of the current try.');
L.push('');

// --- traps & fairness ---
L.push('## Traps & fairness');
L.push('');
L.push('- **Traps look open but jam on contact.** They are **never placed on the solution path**, so there is always a legal route through every column — read carefully before committing a move.');
L.push('- Higher antes reveal **less of the board ahead** (smaller visibility window), so you plan fewer columns in advance.');
L.push('- Generation is deterministic from `(seed, tier)` — the same lock always has the same valid path.');
L.push('');

L.push('## Tips');
L.push('');
L.push('- **New to it? Start at Ante 3.** ' + tries['3'] + ' tries and ' + (timeout['3'] / 1000) + 's per move let you learn the pin math safely.');
L.push('- **Plan the whole path before you move** at low antes — the clock per step is short and a single mis-step jams the try.');
L.push('- **Watch for traps on "open"-looking rows** — if a row is on the solution it is safe; traps are decoys off the path.');
L.push('- Go for **Ante 1** only when you can read the board fast — it\'s the premium payout but you get one flawless shot.');
L.push('');
L.push('_Auto-generated from `src/sim/lockpick.ts`; updates with each release._');

fs.writeFileSync(out, L.join('\n') + '\n');
console.log(`wrote lockpicking guide (${order.length} moves, 3 antes) to ${out}`);
