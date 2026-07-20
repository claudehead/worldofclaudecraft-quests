# Professions & the crafting endgame 🔨

v0.27–0.28 rebuild professions into a full crafting endgame: three gathering skills feeding ten crafts, a **skill-tier ladder** that gates which recipes you can train, a **masterwork proc** that can turn any craft into something better, crafting **masters on Artisan Row**, and ten **archetypes** that say who your character *is*. Exact reward numbers are still being tuned.

> 🔨 **The shape:** gather raw materials (Mining / Logging / Herbalism) → level a craft and climb its **tiers** → train recipes gated to your tier → craft at your discipline's **station**, hoping for a **masterwork** proc → declare an **archetype** that defines your identity.

---

## Gathering

Three gathering professions, tracked independently:

- **Mining** — ore and stone from veins
- **Logging** — timber from trees
- **Herbalism** — herbs and plants

Harvesting is wired into the **normal play controls** — walk up to a node and gather, no separate mode. **Proficiency** builds through successful harvests and shifts your output toward rarer grades (common → uncommon → rare → epic → legendary), though the very rarest grades stay rare no matter how skilled you are. Nodes now carry **real material tables** with **rare gather events**, and respawn **per-viewer** — two players can see the same node in different states.

**Tools matter.** Vendors sell basic gathering tools; better ones are crafted, and higher-tier tools unlock richer nodes and work them faster over a long session. You can slot **tool effects** onto them:

| Tool effect | Does |
|---|---|
| **Gatherer's Cache** | Extra quantity per node |
| **Artisan's Eye** | Higher material quality |
| **Quickening Charm** | Faster node respawns |

Each effect starts with **20 durability charges**, spent faster against equal-or-higher-rarity targets and barely at all on low-rarity ones.

---

## The crafts and the skill-tier ladder

Every craft runs its own recipe list and its own flat **skill** value. The ten crafts sit in a fixed **ring**, and *where* a craft sits matters — neighbours share recipes and trends, and each craft has an opposite five seats away.

| # | Craft | | # | Craft |
|---|---|---|---|---|
| 1 | Armorcrafting | | 6 | Cooking |
| 2 | Weaponcrafting | | 7 | Inscription |
| 3 | Jewelcrafting | | 8 | Enchanting |
| 4 | Alchemy | | 9 | Tailoring |
| 5 | Engineering | | 10 | Leatherworking |

The six core crafts — **weaponcrafting, armorcrafting, tailoring, leatherworking, alchemy, cooking** — carry the deepest **tier ladders**.

**Tiers, not a 0–300 bar.** Your skill in a craft buckets into a **tier every 25 points**: skill 0–24 is the free **common** tier, 25–49 is tier 1, 50–74 tier 2, and so on. Recipes are bucketed the same way, so a recipe's tier and your capability tier compare directly.

- **Recipe training is tier-gated:** you can only train recipes up to your current tier (recipes you already knew are **grandfathered** in).
- **Diminishing returns on skill-ups:** crafting at or above your tier gives full skill; a craft **one tier below** your capability gives reduced skill; **two or more tiers below** gives nothing. Common-tier crafting is always **free** (no cost).

**Enchanting & salvage** sit off the wheel: **disenchant** items into materials, then **apply an enchant** onto a specific instanced copy of an item.

---

## Masterwork procs

Craft outputs are **deterministic** at the recipe's defined quality — with one twist. Every successful craft rolls a single **masterwork proc** (base **3%**) that **bumps the item's quality** and adds **bonus stats**. The odds rise with the **tier of the materials** you feed in and with **trending reagents** (below), so investing in better mats and following the trend pays off.

> ⚙️ **Market throttles.** To stop maxed specialists flooding the economy, crafting carries a small **copper fee** scaled to item value and a cap of **~10 crafts per rolling 60 seconds**. Craft for use and trade, not for spam.

---

## Trending pairs & the Crafting Guild

Your flat craft skills are watched for the **adjacent pair** they're trending toward. Push a pair's **combined skill** past one full tier (**25 points**) and the **Crafting Guild** takes notice — it delivers a letter on your first trend crossing. Trending reagents tied to your pair also **raise your masterwork odds**, rewarding players who commit to two neighbouring trades rather than spreading thin.

---

## Where you craft — Artisan Row

The single level-20 Highwatch hub is **retired**. Six **crafting masters** now set up on **Artisan Row**, each tending a **typed station** for their discipline: you craft at the station that matches the recipe. A **field crafting station** lets you craft on the move when you're away from town.

---

## The ten archetypes

Each craft also stands for an **archetype** — a broader identity beyond just working the trade. You hold **one active archetype at a time**; it's a statement about who your character is, recognized in how the world addresses you.

- **Choosing one:** you declare your first archetype through an **early Zone 1 story quest** that formally accepts you into that identity. Until then you have no archetype.
- **Switching:** possible but not casual — you complete a repeatable **"make amends" quest** for your old archetype, and **each successive switch costs more**, so the choice stays meaningful.

Your active archetype gates your crafting direction and endgame power, and sets the **craft ceiling** for your identity. *(The exact rewards and recognition are still being filled in — expect this to grow.)*

---

## Getting started

1. Pick up **Mining, Logging or Herbalism** and gather while you level.
2. Feed those materials into a **craft** and push its skill up through the **tiers** to unlock better recipes.
3. Lean into an **adjacent pair** so the Crafting Guild notices your trend and your masterwork odds climb.
4. Declare your **archetype** via the Zone 1 story quest when you're ready to commit, and craft at your discipline's **station on Artisan Row**.

---

*See also: [Drops & materials](#/doc/reference%2Fmaterials.md), the [World Market](#/doc/reference%2Fworld-market.md), and the [Gilded Strongbox](#/doc/reference%2Fbank.md) to store everything you gather.*
