# Rifts — the endgame race 🌀

v0.32 adds **Rifts**: procedurally-generated dungeons behind natural portals that open across the new expansion zones. Every portal is a **shared overworld race** — multiple groups can enter the same rift, but each runs its own private instance, and only the **first group to clear** takes the full reward. It's the level-20 endgame chase for gear, mounts, and the two legendaries.

> 🌀 **The basics:** at level 20, step into an open **C / B / A / S** portal. Your group gets its own instance of a procedurally-built dungeon. Race every other group to the boss — **win the first clear** for the full loot, mounts and legendary rolls; lose it and you still finish, but keep only what dropped off the mobs.

---

## Getting in

- **Level 20 required** — rifts are pure endgame (`RIFT_MIN_LEVEL` 20).
- **One portal per eligible zone, cycling hourly.** Every expansion zone keeps a single open portal; when it expires (**60-minute** lifetime) that zone's next one opens a cycle later. Portals are deterministic — every client sees the same one.
- **Solo or party.** A solo player or a full party each enter as their own **instance**; no rift geometry is sent over the wire, only a compact descriptor, so everyone races the identical dungeon.

---

## The four ranks

A portal's **rank** sets its difficulty and its loot table:

| Rank | Base level | Gear it pays out |
|---|---|---|
| **C** | 20 | Normal five-man loot (ilvl 23 rares) |
| **B** | 22 | Heroic five-man epics (ilvl 31) |
| **A** | 25 | Heroic five-man epics **+ better mount odds** |
| **S** | 28 | Heroic five-man epics **+ the two legendary chase rolls** |

Mob levels are capped at **22** even in S-rank — S is harder through tuning, not raw levels. **A** differs from **B** by its **mount** tier rather than its gear, and **S** is the only place the two **legendary** chase items can drop.

---

## The race

This is the twist that makes rifts different from a dungeon:

- **One portal, many instances.** Everyone who enters a portal gets a separate, isolated run of the same generated dungeon.
- **First clear wins.** The first group to down the final boss claims the **race rewards** — the gear ladder, the sealed cache, and the first-clear extras.
- **Losers still finish, but empty-handed on completion.** Every other instance keeps running and completes as the **race loser** when its own boss falls: you get an exit but **no completion loot** — only whatever dropped off the mobs along the way.
- **Instance binding.** The moment your group lands its **first mob kill**, the instance is bound to its members (WoW-raid style). An untouched instance recycles when the party regroups, so a freshly-formed group always shares one clean run.

**Speed matters.** Because only the first clear pays out, a rift rewards knowing the route and pushing pace, not full-clearing every pull.

---

## Rewards

- **Gear** — the rank's loot table (above), from normal-dungeon rares at C up to heroic epics at B/A/S.
- **Mounts** — higher ranks improve your mount odds; the two **epic** mounts (Aether-Jouster Hover-Cycle, Thunderstrut the Grand Gobbler) are **rift-only**. See [[mounts]].
- **The legendary chase** — **S-rank only** carries the two legendary rolls, the top prize of the whole system.

---

## Tips

- **Match the rank to your group.** C is a gearing-up lap; push toward **A/S** once you're in heroic epics and want mounts or the legendaries.
- **Scout the open portals.** With one per zone on an hourly cycle, there's usually a rank you want open somewhere — hop zones to find it.
- **Race, don't dawdle.** Only the first clear pays completion loot. Learn the boss and cut the trash you can.
- **Bind deliberately.** Your first mob kill locks the instance to your group — form up fully before you start if you want a clean shared run.

---

*See also: [[mounts]] for what rifts award, [[heroic-dungeons]] for the epic loot table rifts draw from, and [[heroic-nythraxis]] for the raid at the top of the PvE ladder.*
