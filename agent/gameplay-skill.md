# World of Claudecraft — Gameplay Skill (Claude's playbook)

Living notes Claude updates each session so it plays better next time. Append
learnings under "Session log" with the date.

## How I drive the game
- I read `C:/tmp/woc-obs.json` (state) and write `C:/tmp/woc-ctl.json` (one action) via a Playwright harness (`agent/joystick2.mjs`). The harness translates my high-level command into key-presses / `window.__game.sim` calls.
- Commands: `{cmd:"go",npc:"redbrook"}` | `{cmd:"goto",x,z}` | `{cmd:"kill",id}` | `{cmd:"accept",quest}` | `{cmd:"turnin",quest}` | `{cmd:"say",text}` | `{cmd:"flee"}` | `{cmd:"consume"}` | `{cmd:"revive"}` | `{cmd:"idle"}`.

## Core mechanics (verified)
- **Facing convention**: `facing = atan2(targetX - x, targetZ - z)`. Movement is "face + walk forward" — there is **NO pathfinding** (from `src/game/click_move.ts`). It walks in a straight line and **gets stuck on obstacles** (water, fences, buildings).
- **Spawn / town**: player spawns ~(2,-2). Quest NPCs cluster near there: Marshal Redbrook (~4,6), Trader Wilkes (~-7,3), Apothecary Lin (~11,-3), The Merchant (~0,10).
- **Leveling**: hit level 2 after ~8 wolf kills. Level 2 = 67 HP / 264 mana (up from 54 HP / 195 mana at lvl 1). XP resets to 0 on ding.

## Mage play (class = mana, knows fireball/frostbolt/fire_blast/scorch)
- **Fireball**: 30 mana, **30yd range**, 1.5s cast. Primary nuke.
- **STAY AT RANGE.** Biggest mistake: closing to melee (dist <5) gets the Mage swarmed and killed fast. At lvl 1 (54 HP) two wolves in melee can kill me in seconds.
  - **RULE: hold at ~16-22yd and cast. Never walk into dist <8 voluntarily.**
- Mana is plentiful and regens fast out of combat — don't worry about OOM at low levels; auto-attack (wand) finishes anything that survives.
- If HP < 25% and in combat → `flee` (back away), let HP regen, then re-engage.

## Quests
- **Accept**: walking up to the giver (dist < ~2.6) often auto-accepts via `talkToNpc`; to be sure, also send `{cmd:"accept",quest:"q_wolves"}` while standing on them. Read the log from player **meta** (`sim.players.get(sim.primaryId).questLog`), not the entity.
- **q_wolves "Wolves at the Door"** (Redbrook): kill **8 Forest Wolves** (lvl 1-2, 28-42 HP). Reward dings level 2 and unlocks `q_greyjaw` + `q_bandits`.
- **Turn-in**: must be **physically at the giver** (dist < ~2.6). `questState` goes `active → ready → done`. Turning in only works when state is `ready` AND I'm standing on the NPC.

## ⚠️ Known failure modes & fixes
1. **Got stuck walking back to Redbrook (stalled at dist ~20).** Cause: no pathfinding + an obstacle, and the harness only nudged forward one tick per command. **Fix:** harness now holds W continuously toward the goal and **strafes around obstacles** when position stops changing (`joystick2.mjs`). Also: **don't wander far from the quest hub while hunting** — kill wolves near spawn so the turn-in walk is short.
2. **Died by meleeing as a Mage.** Fix: range discipline (see above).
3. **Headless freezes the sim.** Always launch with `--disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding` (or headed).
4. **Class select silently defaulted to Warrior.** Click the **visible** `[data-class="mage"]:visible` element; verify `sim.player.resourceType === 'mana'` after spawn.

## Strategy for a session
1. Spawn → accept the nearest no-prereq quest (q_wolves from Redbrook).
2. Hunt the quest mobs **close to the hub** (within ~30yd of spawn) at range.
3. At objective complete → walk straight back to giver → turn in → grab follow-ups.
4. Keep HP up (flee/regen), keep target level ≤ my level + 1.

## Session log
<!-- Append dated entries with new learnings. -->
- **2026-06-26 (pre-session):** Established the above from earlier Warrior + Mage runs. Next goal: complete the full q_wolves loop *including turn-in* without getting stuck, by hunting near the hub and using the new strafe-unstuck nav.
- **2026-06-26 (Opus 10-min session):**
  - ✅ **Turn-in nav FIXED.** The strafe-unstuck harness (`joystick2.mjs`) walked me home from ~30yd away → `q_wolves` turned in, **dinged level 2**, unlocked `q_greyjaw` + `q_bandits`. Last session's "stuck at dist 20" is solved by holding W continuously + veering ~57° when position stops changing.
  - ⚠️ **Still died once.** Fled at 24% HP but a wolf landed a hit and took me 13→0. **LESSON: flee at ~40% HP, not 25%** — there's lag between deciding to flee and actually disengaging, and stacked wolves burst fast.
  - ⚠️ **I chased wolves to (-31,24)** — way off the hub, violating my own rule. Wolves flee/respawn outward and I followed. **LESSON: if the nearest wolf is >35yd, walk back toward spawn and wait for closer spawns instead of chasing into the wilds (longer turn-in walk + more danger).**
  - ✅ **Range discipline in harness works** — holding ~16yd and Fireballing kept HP high on most pulls (only died when multiple wolves closed at once).
  - **Next:** `q_bandits` = kill 10 Vale Bandits (lvl 3-5, humanoid) — risky for a lvl-2 Mage; `q_greyjaw` = collect 1 greyjaw_fang (likely a named/rare wolf drop). Prefer leveling more on wolves before bandits.
  - ✅ **Flee-at-40% + range discipline = ZERO deaths** across a 22-pull grind (xp 258→673), vs dying repeatedly before. This combo is the key to safe Mage grinding.
  - ⚠️ **Drift still happens.** "Return to hub if no close wolf" failed because new wolves kept spawning within 35yd as I moved, so I never triggered the return and drifted to hub:49. **FIX: hard leash — if distance from hub (4,6) > 40, walk back to town regardless of nearby wolves.**
  - 📝 **Mana economy (lvl 2, chain-pulling):** mana bottoms to 0 when pulling back-to-back; wand auto-attack covers the gap fine. Optional: pause to regen if mana <30 and safe.
  - 📝 **q_greyjaw** needs `greyjaw_fang` — did NOT drop from regular Forest Wolves in ~20 kills; likely a **named "Greyjaw" rare wolf** spawn, not a common drop. Look for a named mob, not grind-farmable from commons.
  - ✅ **Hard leash works** — recentered from hub:49 → hub:1 then re-engaged. No more endless drift.
  - ⚠️ **Death during retreat:** leash triggered walk-back at 46% HP but a chasing wolf bursted me 31→0 mid-retreat. **LESSON: combine — if HP<40% AND leashing, `flee` (back-pedal) takes priority over walking toward town; only walk back once HP recovers and combat drops.** Final session: lvl 2, xp 833, full q_wolves loop done.
- **2026-06-26 (Opus session 05, 5-min — DEATHLESS):** Playbook validated — full q_wolves loop, 0 deaths, HP ~100% throughout.
  - ✅ **Decision priority that works:** `flee(<50% & in combat) > turn-in > leash(hub>40) > kill(≤35yd) > venture-to-spawn`. The flee-first ordering killed the session-04 retreat-death problem.
  - ✅ **Leash = free mana regen** (walk back refills mana, no idle downtime).
  - 📝 **Known wolf spawn cluster: ~(-5,35)** north of the hub. When the hub is farmed out and stuck at 7/8, `goto` there for the last kill instead of idling.
  - Sessions are now logged in `agent/sessions/DIARY.md` with labeled videos in `agent/sessions/videos/`.
