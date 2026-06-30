# Lockpicking — Tumbler's Path

Locked chests inside [delves](../delves/README.md) are opened with **Tumbler's Path**, a skill minigame. The board is a row of brass **tumbler tracks** (one per column); only the lit wards show — an open notch, a gold **gate**, the green **bolt seat**, or a red **ward-trap**. You drive the pick one column at a time, threading the open channel, seating on each gate and dodging traps, until it reaches the bolt seat. Clear it and the chest pays out; fail and it jams.

> 🔓 **Practice it free, no chest required:** open the [**interactive Tumbler's Path trainer →**](#/lockpick) — the exact same board and rules, with Easy / Medium / Hard modes, so you can get the feel before you risk a real cache.

## Ante = risk vs reward

Before you pick, you **commit an ante** up front. The ante is locked in at engage time (you can't burn lives to climb tiers mid-pick), and it sets *both* the difficulty and the loot:

| Ante | Loot tier | Reward pages | Tries allowed | Time per move |
|---|---|---|---|---|
| **1** | 🟣 Premium | 3 | 1 | 3s |
| **2** | 🔵 Medium | 2 | 2 | 6s |
| **3** | ⚪ Low | 1 | 3 | 9s |

- **Lower ante = bigger reward but harder:** Ante 1 pays the most (premium, 3 pages) but gives **only 1 try** and the tightest clock (3s per move). Ante 3 is forgiving (3 tries, 9s per move) but pays the least.
- **Each try must be flawless** — any slip, bind, or trap **jams that try**. Higher antes simply give you fewer tries to get a clean run.
- The chest only **jams for good once your tries run out** — so at Ante 3 you get 3 shots at a clean pick.

## The moves

Each input nudges the pin by a fixed amount. Pick the move that lands the pin exactly on the open row for the next column:

| Move | Pin shift |
|---|---|
| `hardSet` | -2 (push in hard) |
| `set` | -1 (push in hard) |
| `steady` | 0 (hold steady) |
| `ease` | +1 (ease out) |
| `drop` | +2 (ease out) |

- `hardSet` moves **−2**, `set` **−1**, `steady` **0**, `ease` **+1**, `drop` **+2** — combine them to step the pin onto each column's open row.
- `abort` bails out of the current try.

## Traps & fairness

- **Traps look open but jam on contact.** They are **never placed on the solution path**, so there is always a legal route through every column — read carefully before committing a move.
- Higher antes reveal **less of the board ahead** (smaller visibility window), so you plan fewer columns in advance.
- Generation is deterministic from `(seed, tier)` — the same lock always has the same valid path.

## Tips

- **New to it? Start at Ante 3.** 3 tries and 9s per move let you learn the pin math safely.
- **Plan the whole path before you move** at low antes — the clock per step is short and a single mis-step jams the try.
- **Watch for traps on "open"-looking rows** — if a row is on the solution it is safe; traps are decoys off the path.
- Go for **Ante 1** only when you can read the board fast — it's the premium payout but you get one flawless shot.

_Auto-generated from `src/sim/lockpick.ts`; updates with each release._
