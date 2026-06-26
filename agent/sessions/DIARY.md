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
