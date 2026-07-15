# The Dungeon Finder — role queue & premade board 🔎

v0.26 adds a proper **Dungeon Finder**: an automatic role-based matchmaking queue plus a premade listing board, so you can fill a group for any dungeon, heroic, solo scenario, or the Nythraxis raid without spamming chat. Open it from the finder keybind (bound as **Dungeon Finder** in Keybinds) or the HUD button.

> 🔎 **The basics:** pick your **role(s)**, tick the activities you want, and hit queue. When the finder assembles a full group it fires a **proposal** — everyone has **30 seconds to accept**. Decline or let it lapse and you sit on a **60-second lockout** before you can re-queue.

---

## Three tabs

The finder window has three tabs:

- **Catalogue** — browse every activity the finder can form, with its level range, group size, and role split. Tick the ones you're eligible for to stage them, then queue.
- **Queue** — your live queue: which activities you're in for, your role selection, time waited, and the accept/decline proposal popup when a group pops.
- **Board** — the **premade listing board**. Leaders post a group with a structured tag (below); other players browse and apply. This is the manual alternative to the automatic queue for when you want to hand-pick a group.

---

## Roles

Every group is built from three roles — **Tank**, **Healer**, **DPS** — and you queue as one or more you can actually play.

- **Below level 10** (before you pick a specialization), your allowed roles come from a fixed class table:

  | Role | Classes |
  |---|---|
  | **Tank** | Warrior, Paladin, Druid |
  | **Healer** | Paladin, Priest, Shaman, Druid |
  | **DPS** | every class |

- **Level 10 and up**, your role must match your **active specialization's** role. Respec (see [[specializations]]) if you want to queue as a different role — a Holy paladin queues as Healer, a Protection paladin as Tank, and so on.

Queue as multiple roles (e.g. tank **and** dps) to pop faster — the finder slots you into whichever the forming group still needs.

---

## What you can queue for

The catalogue covers the full dungeon ladder, both difficulties, the solo scenario, and the raid:

| Activity | Type | Size | Levels |
|---|---|---|---|
| **Hollow Crypt** | Dungeon (Normal) | 5 | 7–10 |
| **Sunken Bastion** | Dungeon (Normal) | 5 | 12–13 |
| **Drowned Temple** | Dungeon (Normal) | 5 | 16–18 |
| **Gravewyrm Sanctum** | Dungeon (Normal) | 5 | 19–20 |
| **Hollow Crypt** | Dungeon (Heroic) | 5 | 20 |
| **Sunken Bastion** | Dungeon (Heroic) | 5 | 20 |
| **Drowned Temple** | Dungeon (Heroic) | 5 | 20 |
| **Gravewyrm Sanctum** | Dungeon (Heroic) | 5 | 20 |
| **Nythraxis Crypt** | Solo scenario | — | 20 |
| **Nythraxis Boss Arena** | Raid (Normal) | 10 | 20 |
| **Nythraxis Boss Arena** | Raid (Heroic) | 10 | 20 |

**Group compositions:**

- **5-man dungeon** — 1 Tank · 1 Healer · 3 DPS
- **10-man raid** — 2 Tanks · 2 Healers · 6 DPS

You can only stage activities inside your level range, and Heroic and the raid require you to be at the level cap. See [[heroic-nythraxis]] for the raid fight itself and [[heroic-dungeons]] for the heroic dungeon loot.

---

## Proposals & the decline lockout

When the finder has a full, role-complete group it sends every member a **proposal**:

- **30 seconds to accept.** All members must accept for the group to form and teleport in.
- **Decline, or let it expire, and you take a 60-second queue lockout** before you can re-queue. This keeps a single flaky player from stalling the queue indefinitely.
- Anyone who declines is dropped and the finder keeps matching the rest.

---

## Premade listings (the Board)

Instead of the blind queue you can post — or join — a **premade listing**. Listings carry **no free-form text** (there's deliberately no moderation surface); instead you attach one **structured tag** so applicants know the run's intent:

| Tag | Meaning |
|---|---|
| **First run** | New to the dungeon — expect a slower, explaining pace |
| **Quest run** | Stopping for quest objectives along the way |
| **Full clear** | Every pull and optional boss, not just the shortest path |
| **Learning** | Practising the fights / a new role or spec |
| **Fast run** | Speed clear — know the route, skip the trash you can |

The leader posts the listing at the group's capacity; players browse the board and apply to the tag that matches what they want.

---

## Tips

- **Queue as tank or healer if you can** — those are the bottleneck slots, so your pops are near-instant while DPS wait longer.
- **Multi-role queue** trades role flexibility for speed; tick every role you're geared and specced for.
- **Watch the proposal timer** — 30 seconds goes fast if you tab out. Missing it costs you the 60-second lockout, not just the group.
- **Use the Board for anything social** — first runs, quest runs, and learning groups are far smoother posted with the right tag than dropped into a silent speed-clear queue.
