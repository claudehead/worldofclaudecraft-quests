# World Bosses

**v0.20** introduced the first **world boss** — a raid-tier overworld encounter that rises on a fixed cadence, bellows a **server-wide warning**, and rewards **every player who helps kill it** with personal loot, **once per day**.

Unlike dungeon and delve bosses, a world boss is out in the open world, needs a **gathered raid** (not a solo or small group), and uses **personal daily loot** — everyone who tagged it rolls their own loot, tracked per character per day. Because tagging is open, extra bodies never hurt — but the fight still needs the **roles below** covered to actually win.

---

## ⛰️ Thunzharr, the Waking Peak

The mountain at **Stormcrag**, in **Thornpeak Heights**, is no mountain at all — it's a primordial **storm elemental** the Gravecallers' chanting keeps stirring loose. On its cadence it wakes, warns the server, and demands a raid.

| | |
|---|---|
| **Zone** | Thornpeak Heights (Stormcrag) |
| **Level** | 20 · elite · CC-immune |
| **Health** | ~44,000 (raid-tier) |
| **Family** | Elemental (nature-school shields) |
| **Loot** | Tier-2 epic **gloves** and **belts** (personal, once/day) |
| **Spawn** | Fixed cadence; a server-wide warning heralds it |

### Raid composition

Thunzharr hits like a raid boss and summons adds twice, so cover these roles as your **core** (everyone else who tags in is bonus DPS):

| Role | Count | Job in one line |
|---|---|---|
| **Main Tank** | 1 | Holds Thunzharr, faces it away from the raid, plants it clear of the cliff |
| **Off Tank** | 1 | Peels both Roused Stormlings off the MT when they spawn (66% & 33%) — easy: they spawn stacked on the boss, threatless |
| **Healers** | 2–3 | Keep the MT alive; the OT during adds; spot-heal Thunderclap/Stomp splash |
| **DPS** | 5–6+ | Burn the boss; 2 assigned to swap onto adds; save cooldowns for the enrage |

A **10-player core (1 MT · 1 OT · 2–3 healers · 5–6 DPS)** clears it comfortably; scale healers/DPS up with the crowd. If only one tank shows, the MT tanks boss **and** adds stacked — doable, but the healers will sweat.

### Positioning

Tank Thunzharr at a **fixed spot with its back to the cliff**, raid stacked on the safe side. Stormcrag's ledges are lethal with **Tectonic Heave** — never let the boss face the raid.

<svg viewBox="0 0 640 400" style="width:100%;max-width:640px;height:auto;background:#12160f;border:1px solid #2a3320;border-radius:12px" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="46" height="400" fill="#5a1f1f"/>
  <text x="23" y="200" fill="#ffb3b3" font-size="12" font-family="system-ui" text-anchor="middle" transform="rotate(-90 23 200)">⚠ CLIFF EDGE — Tectonic Heave knockback</text>
  <!-- boss -->
  <circle cx="185" cy="200" r="40" fill="#c46a2e" stroke="#e6803a" stroke-width="3"/>
  <text x="185" y="205" font-size="26" text-anchor="middle">⛰️</text>
  <text x="185" y="258" fill="#e6803a" font-size="13" font-family="system-ui" text-anchor="middle" font-weight="700">Thunzharr</text>
  <!-- facing arrow toward cliff -->
  <path d="M145 200 L70 200" stroke="#e6803a" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#a)"/>
  <defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#e6803a"/></marker></defs>
  <text x="105" y="188" fill="#c9a" font-size="10" font-family="system-ui" text-anchor="middle">faces AWAY from raid</text>
  <!-- main tank -->
  <circle cx="120" cy="200" r="13" fill="#46b8da" stroke="#0a0c0e"/><text x="120" y="204" font-size="13" text-anchor="middle">🛡</text>
  <text x="120" y="232" fill="#8fd0ff" font-size="11" font-family="system-ui" text-anchor="middle">Main Tank</text>
  <!-- melee behind boss -->
  <circle cx="250" cy="175" r="10" fill="#e0526a"/><circle cx="255" cy="205" r="10" fill="#e0526a"/><circle cx="248" cy="232" r="10" fill="#e0526a"/>
  <text x="255" y="262" fill="#e0526a" font-size="11" font-family="system-ui" text-anchor="middle">Melee (behind)</text>
  <!-- ranged + healers spread right -->
  <circle cx="470" cy="120" r="10" fill="#4bbf7b"/><circle cx="520" cy="200" r="10" fill="#4bbf7b"/><circle cx="470" cy="280" r="10" fill="#4bbf7b"/>
  <text x="500" y="170" fill="#4bbf7b" font-size="11" font-family="system-ui" text-anchor="middle">Healers</text>
  <circle cx="410" cy="150" r="10" fill="#c9a34b"/><circle cx="435" cy="250" r="10" fill="#c9a34b"/><circle cx="400" cy="215" r="10" fill="#c9a34b"/>
  <text x="415" y="300" fill="#c9a34b" font-size="11" font-family="system-ui" text-anchor="middle">Ranged (spread 8y)</text>
  <!-- off tank + adds -->
  <circle cx="300" cy="345" r="13" fill="#46b8da" stroke="#0a0c0e"/><text x="300" y="349" font-size="13" text-anchor="middle">🛡</text>
  <circle cx="335" cy="340" r="9" fill="#9482c9"/><circle cx="335" cy="360" r="9" fill="#9482c9"/>
  <text x="335" y="384" fill="#b7a7e0" font-size="11" font-family="system-ui" text-anchor="middle">Off-Tank + Stormlings (~15y aside)</text>
</svg>

- **Melee** stack **behind** the boss (it doesn't cleave the back arc; you avoid the frontal Thunderclap).
- **Ranged + healers** spread **~8 yards apart** on the far side so a single Thunderclap can't chain the whole raid, and stay **off the cliff**.
- The **add pit** is off to one side, ~15y from the boss stack, so the Stormlings never eat the boss's Seismic Stomp heals or block melee.

### Phases

**Phase 1 — The Waking (100% → 66%)**
- **MT:** open with your hardest threat, settle the boss on its mark, never turn it toward the raid. **Mountainhide** gives it a 500-point nature stoneskin (~9s every ~18s) — call it so DPS don't waste burst/execute into the shield.
- **Healers:** the MT takes raid-tier melee; keep them topped. Splash-heal anyone clipped by **Thunderclap** (frontal lightning nova) or **Seismic Stomp** (ground slam).
- **DPS:** full uptime on the boss; drop burst *after* a Mountainhide shield pops, not during.

**Phase 2 — First Stormcall (66%)** — *"Rise, stormlings! Tear them loose from my slopes!"*
- **2 Roused Stormlings** spawn **stacked on the boss and already latched onto the Main Tank** with almost no threat — they don't run off at your healers, so there's no scramble.
- **Off-Tank peels them off the MT.** Taunt is **single-target**, so taunt one, then the other (two GCDs), and land a hit on each to hold — trivial since they start threatless. A cleave/AoE-threat tank snaps both at once. Then walk them to the add-pit.
- **2 assigned DPS** swap to the Stormlings and burn them fast; the rest **stay on the boss**.
- **Healers:** one healer shifts to the OT for the add window.

**Phase 3 — Second Stormcall (33%)**
- Another **2 Stormlings** — same drill: OT grabs, add-DPS burn, everyone else on the boss. Don't let adds pile up with the enrage looming.

**Phase 4 — The Peak Breaks (Enrage, below 20%)** — *"The peak breaks, and the sky falls with it!"*
- Thunzharr **enrages: +50% damage and +25% haste.**
- **Everyone pops cooldowns** — Bloodlust-type effects, trinkets, potions.
- **Healers** triage the MT (and OT if adds linger) through much faster, harder hits.
- **MT** uses defensive cooldowns on cadence; you're racing its damage now. Kill it before it kills the tank.

### Tank checklist

- **Main Tank:** face Thunzharr **into the cliff / away from the raid** at all times. Position so **Tectonic Heave** (30% chance, ~7y knockback on its target) shoves **you toward the fight**, never off the ledge. Watch **Mountainhide** and warn DPS. Save a big cooldown for the **enrage**.
- **Off Tank:** pre-position **on the boss** at ~67% and ~34% — that's exactly where the adds spawn, latched onto the MT. **Taunt one Stormling, then the other** (single-target taunt, ~2 GCDs) and swing on each to hold; they start threatless so it sticks instantly. Walk them to the add-pit, backs to the raid, then help cleave the boss.

### The loot

Thunzharr drops each set family's **Tier-2 gloves and belts** — the glove and belt that complete the four-piece (helm · shoulder · glove · belt) sets:

- **Crownforged Gauntlets** / **Crownforged Girdle**
- **Nighttalon Grips** / belt
- **Soulflame Gloves** / belt
- **Stormcaller's Handguards** / belt

Every Tier-2 3-piece grants **15% haste** (see the [item sets](#/sets) page), so these are a priority for any BiS build — worth showing up daily for.

## See also

- [Item sets](#/sets) — the Tier-2 sets Thunzharr completes
- [Boss strategies](#/bosses) · [Bestiary](#/bestiary)
- [Death & graveyards](#/doc/reference%2Fdeath-and-graveyards.md) — Thornpeak has four, for good reason
