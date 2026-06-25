# How combat works

The exact maths the game runs, pulled straight from its source — so the bestiary and gear numbers add up.

## Mob stats by level

A mob's stats scale linearly from its template, per level **L**:

```
Health = round((hpBase + hpPerLevel·(L−1)) × eliteMult)
Damage = (dmgBase + dmgPerLevel·(L−1)) × eliteMult   (swing 0.8×–1.25×)
Armor  = round(armorPerLevel·(L−1))
```

**Elite** mobs use a multiplier of **2.3× health** and **1.5× damage** (and double XP). Normal mobs are 1×.

## Armor & physical mitigation

Armor reduces *physical* damage only (spells ignore it). Against an attacker of level **L**:

```
damage reduction = min(0.75, armor / (armor + 85·L + 400))
```

So mitigation is capped at **75%**, and the same armor is worth less against higher-level attackers. This is the "% mitigation" shown in the bestiary.

## Health from Stamina

Stamina on gear adds to your health pool: the first 20 points give **+1 HP each**, and every point beyond 20 gives **+10 HP**:

```
bonusHP = min(sta, 20) + max(0, sta − 20) × 10
```

## Experience curve

XP needed to clear each level (level cap is **20**):

| Level | XP to next | Cumulative |
|---:|---:|---:|
| 1 | 400 | 400 |
| 2 | 900 | 1,300 |
| 3 | 1,400 | 2,700 |
| 4 | 2,100 | 4,800 |
| 5 | 2,800 | 7,600 |
| 6 | 3,600 | 11,200 |
| 7 | 4,500 | 15,700 |
| 8 | 5,400 | 21,100 |
| 9 | 6,500 | 27,600 |
| 10 | 7,600 | 35,200 |
| 11 | 8,800 | 44,000 |
| 12 | 10,100 | 54,100 |
| 13 | 11,400 | 65,500 |
| 14 | 12,900 | 78,400 |
| 15 | 14,400 | 92,800 |
| 16 | 16,000 | 108,800 |
| 17 | 17,700 | 126,500 |
| 18 | 19,400 | 145,900 |
| 19 | 21,300 | 167,200 |
| 20 | 23,200 | 190,400 |

## Group XP

Killing in a party splits XP but adds a bonus that makes grouping efficient. Multiplier by party size:

| Players | XP multiplier |
|---:|---:|
| 1 | 1× |
| 2 | 1× |
| 3 | 1.166× |
| 4 | 1.3× |
| 5 | 1.43× |

_Party members must be within ~80 yards to share a kill's XP and credit._
