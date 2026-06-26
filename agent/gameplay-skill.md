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
- **2026-06-26 (Opus session 06, 10-min — bandits lesson):** Pushed into q_bandits too early; died 4× for 3 kills.
  - ⚠️ **HARD RULE: do not engage mobs with `level - myLevel >= 2`.** Vale Bandits (lvl 3-5) shred a lvl-2 Mage; flee-at-50% doesn't save you (they burst & chase faster than back-pedal — I died *while fleeing*).
  - ⚠️ **Level-gate content:** grind even-level mobs (wolves) to ~lvl 4-5 before bandits.
  - ⚠️ **Death-spiral avoidance:** respawn is far (~-12,-14) from the bandit camp (65,-65); after 2 deaths to the same content, ABANDON it and return to safe farming instead of re-trekking 92yd back in.
  - ✅ **Long-distance `goto` nav confirmed** — strafe-unstuck handled the full 95yd hub→camp trek without stalling.
  - 📍 **Vale Bandit camps: (65,-65) r24 (7 mobs), (90,-90) r16 (5 mobs).** Wolf hub: (4,6). Wolf spawn cluster: (-5,35).

## Leveling efficiency (researched session 07)
- **XP curve (`XP_TABLE`, types.ts):** to ding L2=400, L3=900, L4=1400, L5=2100 (cumulative L4=2,700; L20 total ≈ 137k).
- **Kill XP is small + anti-farm scaled** (~40-45/wolf, less as you out-level). Pure grinding is the SLOW path.
- **Quests are the fast path** (250-2,300 XP) — but **XP reward ∝ mob level**, so big quests are gated:
  | quest | XP | mob | mob lvl | ok at low lvl? |
  |---|---|---|---|---|
  | q_wolves | 250 | forest_wolf | 1-2 | ✅ |
  | q_boars | 350 | wild_boar | 2-3 | ✅ (but *collect* → needs loot) |
  | q_spiders | 420 | webwood_spider | 2-4 | ✅ at lvl2+ |
  | q_murlocs | 520 | mudfin_murloc | 3-5 | at lvl3+ |
  | q_prowlers | 800 | mire_prowler | 7-8 | ❌ death |
  | q_stalkers | 2200 | ridge_stalker | 13-14 | ❌ death |
- **RULE: fastest leveling = stack level-appropriate quests** (mob lvl ≤ myLvl+1) and kill in their overlap so each kill = kill-XP + quest progress (~2-3× effective). Never chase a high-XP quest whose mobs out-level you.
- **Quest giver map:** hub (z≈6): Redbrook(wolves), Wilkes(boars/supplies), Lin(spiders), Brandt(murlocs), Odell(mine). North z≈304: Fenwick/Hale (prowlers, lvl7-8). Far north z≈664: Thessaly/Bree (stalkers, lvl13-14).
- **HARNESS TODO:** add a `loot` action (interact with fresh corpse) — required for *collect* quests (q_boars, q_spiders); current harness only kills.

## Recording setup (user preference — do not violate)
- **NEVER change window layout.** User runs a fixed split: **Claude on the right, game on the left.** Do NOT maximize/foreground/move the game window (no `SetForegroundWindow`/`ShowWindow`). Just start ffmpeg `gdigrab` full-screen capture and play — the layout is already correct.
- **2026-06-26 (Opus session 08, 20-min — multi-quest/collect):** Built loot-capable harness (`joystick3.mjs`: auto-loot ≤6yd, `lootwalk`, per-NPC accept/turn-in). q_wolves deathless→lvl2, collect works (boar_hide 60%), but **boar camp = death trap (~5 deaths)**; pivoted to safe wolves → lvl3.
  - 🔑 **USE CROWD-CONTROL TO SURVIVE.** Pure-DPS + back-pedal flee dies to swarms; a Mage must **Frost Nova (root) the meleeing mobs then run / Blink**. Harness only casts damage — adding Frost-Nova-on-melee is the top survivability fix.
  - ⚠️ **Never pull camp centers** (6-mob packs swarm-burst). Single-pull from the edge, reset between.
  - ⚠️ **Retreat fails vs faster mobs** — directed retreat-to-hub still died (they out-run + burst < 40%, chase to hub). CC > running.
  - ✅ **Collect quests:** must stand ≤6yd on the corpse to loot (auto-loot range); kill at melee or `lootwalk` to the corpse. boar_hide = 60%/kill.
  - ✅ **Squishy-solo rule:** prefer single-pullable kill content (wolves) over swarmy high-value collect content (boars/bandits) until you have CC/escape or a level buffer.

## ⚠️ Recording method (FIXED after sessions 06-08 corrupted)
- **Problem:** plain `.mp4` via gdigrab writes the moov atom only on clean exit; hard-killing ffmpeg (`pkill`) mid-record → "moov atom not found" → unplayable. Lost sessions 06/07/08 this way.
- **FIX — use a kill-safe container/flags:**
  - Record to **`.mkv`** (Matroska is robust to interruption): `ffmpeg -f gdigrab -framerate 10 -i desktop -t 1200 -c:v libx264 -pix_fmt yuv420p out.mkv`
  - OR fragmented MP4 (playable even if killed): add `-movflags +frag_keyframe+empty_moov+default_base_moof`.
- **Stop ffmpeg GRACEFULLY, never `pkill`/SIGKILL:** let `-t` expire, or send `q` to its stdin. If you must stop early, write `q` to the ffmpeg process stdin (run it with a stdin pipe) so it finalizes.
- Recovery of a moov-less mp4 needs `untrunc` + a healthy reference file of identical settings — avoid needing it by using mkv.

## Boss mechanics (from the user)
### Nythraxis (raid boss — `q_nythraxis_scourges_end`, giver brother_aldric_raid)
- **Pillars are the survival mechanic.** They take TIME to charge — there's a **limited time window** to use them.
- **Watch Nythraxis's cast:** under his HP bar you can see him **charging a death attack**.
- **Race to the pillars before that cast finishes.** If you're **too slow to the pillars, it's GG** (raid wipe / instant death).
- Implication for an agent: track the boss's cast bar under the HP bar; the moment the death-attack charge starts, drop everything and get to a charged pillar within the window — DPS is secondary to the pillar timing.
