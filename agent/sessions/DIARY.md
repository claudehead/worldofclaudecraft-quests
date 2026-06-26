# Gameplay Diary

Chronological log of Claude's play sessions in World of Claudecraft — what I
learned and what I changed each time. The distilled, always-current playbook
lives in [`../gameplay-skill.md`](../gameplay-skill.md); this file is the
history of how it got that way.

Videos are stored in `videos/` (gitignored — too large for git), named
`YYYY-MM-DD_session-NN_<model>_<note>.mp4`. Scripted (non-live) demos are in
`videos/demos/`.

---

## Session 01 — 2026-06-26 — Haiku — first live joystick
**Video:** `videos/2026-06-26_session-01_haiku_live-joystick.mp4`
**Goal:** Prove Claude can drive the live game (read state → decide → act), talking in-game, full-screen recorded.
**Result:** Accepted q_wolves, Fireballed wolves, ~5 kills. Recording ended before turn-in.
**Learned:** The take-over loop works end-to-end (perceive/decide/act + in-game chat). Reading my own guide data to play (quest = 8 wolves, Mage rotation).
**Changed:** Built the file-IPC harness (obs.json / ctl.json) + ffmpeg `gdigrab` full-screen capture.

## Session 02 — 2026-06-26 — Haiku — 20 min (stopped early)
**Video:** `videos/2026-06-26_session-02_haiku_20min-stopped.mp4`
**Goal:** Long autonomous grind.
**Result:** Stopped early by user; only the opening minutes are gameplay.
**Learned:** A single hidden background loop hides my reasoning — better to decide in visible steps.
**Changed:** Nothing structural; informed later sessions to surface decisions in the terminal.

## Session 03 — 2026-06-26 — Sonnet — stuck on turn-in
**Video:** `videos/2026-06-26_session-03_sonnet_stuck-on-turnin.mp4`
**Goal:** Full q_wolves loop with visible thinking.
**Result:** Killed all 8 wolves, dinged level 2 — then **got stuck** trying to walk back to Redbrook, stalling at ~20yd. Quest never turned in.
**Learned:** Movement is "face + walk forward" with **no pathfinding**; long walks stall on obstacles, and one nudge-per-command isn't enough. Also: died from meleeing as a Mage.
**Changed:** Diagnosed the nav bug; planned the strafe-unstuck fix.

## Session 04 — 2026-06-26 — Opus — 10 min, full loop ✅
**Video:** `videos/2026-06-26_session-04_opus_10min-full-loop.mp4`
**Goal:** Complete the whole q_wolves loop incl. turn-in, applying lessons.
**Result:** ✅ Full loop: accept → 8 wolves → **turn in** → level 2 → unlocked q_greyjaw + q_bandits → grinded to xp 833. **Zero deaths** during the main grind.
**Learned:** flee-at-40% (not 25%) + range discipline = no deaths; wolves spawn outward so I drift; q_greyjaw needs a *named* rare, not common drops.
**Changed:** Wrote `agent/joystick2.mjs` (strafe-around-obstacle nav + `goto`) → fixed the stuck-at-20 bug. Added a **hard leash** to the hub. Wrote the full playbook in `gameplay-skill.md`.

<!-- New session entries go below this line -->

## Session 05 — 2026-06-26 — Opus — 5 min, deathless full loop ✅✅
**Video:** `videos/2026-06-26_session-05_opus_5min-deathless.mp4`
**Goal:** Run the full q_wolves loop applying the whole playbook; keep the game window oriented for recording.
**Result:** ✅✅ **Zero deaths, HP pinned at ~100% the entire run.** Accept → 8 wolves → turn in → level 2 → unlocked q_greyjaw + q_bandits, all in ~4 min. Best run yet.
**Learned:**
- **flee-at-50% as top priority (above the leash)** fully prevented the session-04 retreat-death — never dropped below ~90% this time.
- **The leash doubles as mana regen** — walking back to the hub refilled mana 70→195 with no downtime.
- **Hub-cleared stall:** after clearing nearby wolves I sat at 7/8 with nothing in range. **Fix that worked:** `goto` a known spawn cluster (~-5,35) to find the last wolf. **LESSON: keep a list of spawn coords to venture to when the hub is farmed out.**
**Changed:**
- Policy v3 in the decision loop: `flee(<50% in combat) > turnin > leash(>40yd) > kill(≤35yd) > venture-to-spawn`.
- Used the new `goto x,z` command (from `joystick2.mjs`) to reach a spawn — confirmed working.
- Set up this **sessions folder + diary + labeled videos** and brought the game window to the foreground/maximized during capture so the recording is watchable.

## Session 06 — 2026-06-26 — Opus — 10 min, bandits = hard lesson ⚠️
**Video:** `videos/2026-06-26_session-06_opus_10min-bandits-lesson.mp4`
**Goal:** Clear q_wolves (now routine), then push into new content — trek ~95yd to the Vale Bandit camp (65,-65) and attempt q_bandits (kill 10, lvl 3-5).
**Result:** q_wolves done deathless again → lvl 2. Then **died 4× for only 3 bandit kills.** Bandits are far too strong for a solo lvl-2 Mage.
**Learned:**
- ✅ **Long-distance nav works** — strafe-unstuck carried me the full 95yd from hub→bandit camp without stalling. `goto x,z` is reliable now even over long, obstacle-strewn paths.
- ⚠️ **Bandits (lvl 3-5) burst a lvl-2 Mage from ~67%→0% in ~2 ticks**, even at d5. The +1..+3 level gap is lethal.
- ⚠️ **flee-at-50% FAILS vs higher-level mobs** — they out-DPS and out-run the back-pedal; I died *while fleeing* (67→39→10→0). Fleeing only works vs even-level mobs.
- ⚠️ **Death spiral:** respawn is far from the camp (~(-12,-14)), so each death = a 92yd trek straight back into the same fight. Repeated deaths burned most of the session.
- ✅ **Validated my own rule the hard way:** "target level ≤ my level +1." Bandits broke it and I paid for it.
**Changed (playbook updates):**
- **Hard rule added:** never engage a mob whose `level - myLevel >= 2`. Skip it.
- **Level gate:** grind wolves to ~lvl 4-5 BEFORE attempting bandits.
- **Flee earlier (≤65%) AND kite** for anything near my level; don't melee-range as a Mage ever.
- **Avoid death spirals:** after 2 deaths to the same content, abandon it and go back to safe content rather than re-trekking in.

## Session 07 — 2026-06-26 — Opus — 10 min + research — leveling efficiency
**Videos:** `videos/2026-06-26_session-07a_opus_10min-level-gated-grind.mp4`, `videos/2026-06-26_session-07b_opus_research-faster-leveling.mp4`
**Goal:** Apply the level-gate rule from session 06 — grind wolves safely toward level 4 (don't engage mobs ≥2 levels above), then research how to level faster.
**Result:** q_wolves deathless → lvl 2, grinded wolves → **level 3** (a few deaths during an unsupervised batch). Then researched the XP system to answer "what could I do faster?"
**Learned — the XP economy (from `src/sim/types.ts` + `zone1.ts`):**
- **Level curve (`XP_TABLE`):** L1→2 = 400, →3 = 900, →4 = 1400 (cumulative **2,700 to hit level 4**), up to 23,200 at L20.
- **Wolf kill ≈ 40-45 XP**, and **anti-farm scaling shrinks it as I out-level them** → grinding the same low mobs has diminishing returns (~60 kills for L4).
- **Quest rewards are 250-2,300 XP** — *but* the big ones are **level-gated by mob level**:
  - q_wolves 250 (wolves lvl 1-2) ✓ | q_boars 350 (boars lvl 2-3, *collect*) | q_spiders 420 (lvl 2-4)
  - q_prowlers **800** → mire_prowler **lvl 7-8** ❌ | q_stalkers **2,200** → ridge_stalker **lvl 13-14** ❌ (instant death at lvl 2)
- **KEY INSIGHT:** the fastest leveling is **stacking level-appropriate quests**, not pure grinding or chasing the biggest XP number. Each quest kill double-counts (kill XP **+** progress toward a 250-420 XP turn-in) ≈ **2-3× effective XP/kill**. Chasing q_stalkers (2,200) at low level just gets you killed — XP reward correlates with mob level.
**What I'd do differently to level faster:**
1. **Accept ALL level-appropriate hub quests at once** (q_wolves + q_boars + q_spiders) and kill in the overlap so each kill serves multiple objectives.
2. **Match quest mob level to mine** (≤ my level +1); ignore high-XP quests whose mobs out-level me.
3. **Move up the level-appropriate quest ladder** as I level (wolves→boars→spiders→murlocs→…), not re-grind greys.
**Changed / TODO:**
- **Harness gap found:** *collect* quests (q_boars, q_spiders) need a **loot-after-kill** step — `joystick2.mjs` only kills, doesn't loot corpses. Add a `loot` action (call `sim.interact()` on the fresh corpse) to unlock collect-quests.
- Added the level-gate (`mob.lvl - myLvl < 2`) + flee@65% to the policy — fewer deaths when supervised.

## Session 08 — 2026-06-26 — Opus — 20 min — multi-quest stacking + collect quests
**Video:** `videos/2026-06-26_session-08_opus_20min-multiquest.mp4`
**Goal:** Act on session-07 research — stack q_wolves + q_boars + q_spiders with the new loot-capable harness (`joystick3.mjs`) for faster leveling. (Recorded with the user's fixed layout untouched — no window changes.)
**Result:** q_wolves deathless → lvl 2; **collect quest DID work** (boar_hide 60% drop, auto-loot credited 2/5 hides) — **but boars are a death trap** (~5 deaths). Pivoted to safe wolf farming → recovered → **level 3** (xp 502→863 deathless once safe).
**Learned:**
- ✅ **Looting works** — `lootCorpse`/auto-loot within 6yd credits collect items; boar_hide = 60% drop. Per-NPC accept/turn-in works (Wilkes/Lin, not just Redbrook).
- ⚠️ **Swarming camps (6-mob boar/bandit packs) are lethal to a squishy solo Mage** — same pattern as session 06 bandits. Pulling at camp center aggros multiple → burst death.
- ⚠️ **Retreat/flee fails vs swarms** — blind back-pedal runs *into* more mobs; even **directed retreat-to-hub fails** because mobs out-run me and burst me below ~40% before I escape (they even chase to the hub and finish me).
- 🔑 **Biggest gap: I'm not using crowd-control.** A Mage has **Frost Nova (root)** and could Blink — the real survival tools. The harness only casts damage. **Root-and-run is how you survive a swarm; pure DPS + slow back-pedal is not.**
- ⚠️ **Ranged + collect is awkward** — I kill at 16+yd but must stand ≤6yd on the corpse to loot; in a camp that walk is deadly.
- ✅ **Safe path confirmed:** single-target wolf farming with retreat@70% = steady, near-deathless XP. For a low-level squishy solo, *single-pullable* content beats high-value swarmy content until I have CC/escape or more levels.
**Changed (this session + TODO):**
- Built `joystick3.mjs`: **auto-loot within 6yd**, **`lootwalk`** action, **per-NPC accept/turn-in** (`cmd.npc`), corpse count in obs. Loot gap from session 07 = closed.
- **#1 TODO: add Frost Nova (and Blink) to the harness** — cast Frost Nova when ≥1 mob is in melee, then run. This is the missing survivability piece for camps.
- **Pull discipline:** never path to camp *center*; pull singles from the edge and reset between.

## Session 09 — 2026-06-26 — Opus — 10 min — MKV recording + CC harness
**Video:** `videos/2026-06-26_session-09_opus_10min-mkv-CC.mp4`
**Goal:** First session with the FIXED recording (`.mkv`, kill-safe) + Frost Nova/Ice Barrier added to the harness (`joystick4.mjs`). Safe wolf questing. Layout left untouched.
**Result:** ✅ **Recording is clean** (mkv → mp4, no corruption — the fix works). q_wolves done → level 2, xp→650. 2 deaths, both informative.
**Learned:**
- ✅ **MKV recording is robust** — no moov-atom problem; converts to a clean mp4. Recording method fixed for good.
- ⚠️ **Mage spawns with ~6 mana**, not full — the first pulls had no Fireball (wand only) → took hits → early death. **FIX: regen/rebuff to full mana at the hub BEFORE the first pull.**
- ⚠️ **CC isn't available at low level** — Frost Nova / Ice Barrier are learned later, so the harness CC casts no-op at lvl 1-2. No escape tool early; survival = don't let HP drop.
- 🔑 **NEW BUG — "retreat to hub" deadlocks if a wolf chases you there.** Once I reach the hub, `go hub` is a no-op, so I **stand still and get meleed to death** (watched HP 36→0 at the hub while mana uselessly regenerated). **FIX: if retreating but already near the hub AND still in combat, TURN AND KILL the single chaser (full mana) — never passively stand.** Passive retreat into a corner = death.
**Changed:**
- `joystick4.mjs`: Frost Nova + Ice Barrier cast when a mob is in melee (≤8yd); frost_armor + arcane_intellect rebuffed on idle. (CC activates once learned.)
- Recording switched to `.mkv` + graceful finish (no `pkill`).
- **TODO (next):** retreat policy must **kill the chaser when cornered**; **top off mana before first pull**.
