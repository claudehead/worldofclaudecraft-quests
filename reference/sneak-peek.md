# 🔭 Sneak Peek — what's in the works

Unmerged branches and open pull requests on the [upstream game repo](https://github.com/levy-street/world-of-claudecraft) — a look at what *might* be coming. **Nothing here is in the game yet**, and branches that have sat untouched for months may never land. Sorted by how recently each was updated.

_As of 2026-07-03 · 125 branches in flight._

## 🟢 Fresh — actively in progress (updated this week)

| What | Type | Last update | PR |
|---|---|---|---|
| use a dedicated internal secret, no RESTART_COUNTDOWN_SECRET fallback | ✨ Feature | today | — |
| Rename all Blizzard/WoW-derived display names (IP de-brand) | ✨ Feature | today | [#1341](https://github.com/levy-street/world-of-claudecraft/pull/1341) |
| swap in custom-rigged wolf models | ✨ Feature | today | [#1334](https://github.com/levy-street/world-of-claudecraft/pull/1334) |
| bump version to 0.19.0 | • | today | — |
| optionally show your own overhead nameplate | ✨ Feature | yesterday | [#1287](https://github.com/levy-street/world-of-claudecraft/pull/1287) |
| lock in Vanguard as the battle theme, drop audition variants | ✨ Feature | yesterday | — |
| show the Admin role in game and restore the Artist link | ✨ Feature | yesterday | [#1303](https://github.com/levy-street/world-of-claudecraft/pull/1303) |
| extract isSoftwareRenderer for the GPU diagnostic | ⚡ Perf | yesterday | — |
| build(desktop): regenerate package-lock with npm 10 to match CI | ✨ Feature | yesterday | — |
| tune the Atlantis night-sea lighting and Tidegate arrival | ✨ Feature | yesterday | — |
| in-game 3D map editor with realtime sculpting, biomes, playtest, and server-side maps (WIP) | ✨ Feature | yesterday | [#1306](https://github.com/levy-street/world-of-claudecraft/pull/1306) _(draft)_ |
| carry aura magnitude on the wire so buff/debuff tooltips show real values | 🔧 Fix | yesterday | — |
| pass GitHub OAuth env through to the game service | 🔧 Fix | yesterday | — |
| bump version to 0.18.0 | • | yesterday | — |
| auto-join the guild on OAuth link/login via guilds.join | ✨ Feature | 2 days ago | — |
| make the Discord menu a rebindable keybind (default U) | ✨ Feature | 2 days ago | — |
| add a Discord link/unlink entry to the touch More menu | ✨ Feature | 2 days ago | — |
| format fbx to glb converter | ✨ Feature | 2 days ago | — |
| match failed-avatar fallback to each surface's no-avatar state | 🔧 Fix | 2 days ago | — |
| match failed-avatar fallback to each surface's no-avatar state | 🔧 Fix | 2 days ago | — |
| pass DISCORD_BOT_TOKEN to the game service for auto-join | 🔧 Fix | 2 days ago | — |
| make the link-Discord CTA banner responsive on phones | 🔧 Fix | 2 days ago | — |
| style(ui): drop stray em dash from a hud.ts comment | 🔧 Fix | 2 days ago | — |
| skip .claude/worktrees copies in the release malware scan | 🔧 Fix | 2 days ago | — |
| fill v0.17.0 release locales and widen scanner-determinism timeout | • | 2 days ago | — |
| allow Discord bot to boot without dotenv file | • | 3 days ago | — |
| avoid compose env lint warnings | • | 3 days ago | — |
| include Discord bot build script in Docker context | ⚙️ Chore | 3 days ago | — |
| resync package-lock.json so npm ci passes (restore nested picomatch) | ✨ Feature | 3 days ago | — |
| translate whitepaper footer label | ✨ Feature | 3 days ago | — |
| unblock v0.16.0 checks | • | 3 days ago | — |
| align cross-platform-sync M16 wording with the other i18n docs | ✨ Feature | 4 days ago | — |
| satisfy changed-file biome | ✨ Feature | 4 days ago | — |
| apply biome to armor content | 🔧 Fix | 4 days ago | — |
| set vcs.defaultBranch so the local pre-push gate resolves a base | 🛠 Refactor | 4 days ago | — |
| Revert "feat(content): rogue Stealth and Vanish move at 50% speed (#997)" | ✨ Feature | 4 days ago | — |
| biome format + lint the refactor diff to pass the CI ratchet | 🛠 Refactor | 7 days ago | — |

## 🟡 Recent — within the last month

| What | Type | Last update | PR |
|---|---|---|---|
| key market sellers by character id | 🔧 Fix | 8 days ago | — |
| include private bot detector in docker builds | 🔧 Fix | 8 days ago | — |
| restore full raid frame ordering | 🔧 Fix | 8 days ago | — |
| format admin locale files | • | 8 days ago | — |
| [codex] Refactor mob behavior systems | • | 9 days ago | [#879](https://github.com/levy-street/world-of-claudecraft/pull/879) _(draft)_ |
| improve admin metrics | ✨ Feature | 9 days ago | — |
| harden public origins and consent payload | ✨ Feature | 9 days ago | — |
| sync native app version to 0.14.1 | • | 9 days ago | — |
| ci: skip biome ratchet on main pushes | 🔧 Fix | 9 days ago | — |
| satisfy release repair typecheck | 🔧 Fix | 9 days ago | — |
| add old cragmaw pelt data migration | • | 9 days ago | — |
| format quest audit graph script | • | 9 days ago | — |
| satisfy biome changed-file check | • | 9 days ago | — |
| add codex project workflow surface | ⚙️ Chore | 10 days ago | [#867](https://github.com/levy-street/world-of-claudecraft/pull/867) |
| add IndexNow key file | ⚙️ Chore | 10 days ago | — |
| keep low quality loot out of need greed rolls | • | 10 days ago | — |
| add travel form live diagnostics | • | 10 days ago | — |
| drop duplicate hudChrome.perf.groups.input from the v0.14.0 merge | ✨ Feature | 10 days ago | — |
| include guide html in docker build | 🔧 Fix | 10 days ago | — |
| include wiki build scripts in docker context | 🔧 Fix | 10 days ago | — |
| fix PR gate typecheck failures | • | 11 days ago | — |
| align ultra default CI expectations | • | 11 days ago | — |
| include docker build inputs | 🔧 Fix | 11 days ago | — |
| image-based ability icons for all 9 classes | ✨ Feature | 11 days ago | — |
| stabilize abandon quest confirmation | 🔧 Fix | 11 days ago | — |
| despawn idle bound guardian | 🔧 Fix | 11 days ago | — |
| layer loot roll tooltips above roll panels | 🔧 Fix | 11 days ago | — |
| translate Nythraxis raid dungeon names | • | 11 days ago | — |
| keep dev card images on dev origin | • | 12 days ago | — |
| keep dev card images on dev origin | • | 12 days ago | — |
| refine Wallet Standard UX and i18n | 🔧 Fix | 12 days ago | — |
| route Aldric reward through mech spinner | ✨ Feature | 13 days ago | — |
| restore skin preload contract wording | ✨ Feature | 13 days ago | — |
| tune mech spinner rarity rates | 🔧 Fix | 13 days ago | — |
| return tradable mech cosmetic on unequip | 🔧 Fix | 13 days ago | — |
| add mobile input zoom regression check | 🔧 Fix | 13 days ago | — |
| guard character saves during relog | 🔧 Fix | 13 days ago | — |
| tune fast rare drops and market mech plates | 🔧 Fix | 13 days ago | [#756](https://github.com/levy-street/world-of-claudecraft/pull/756) _(draft)_ |
| ci: restore release gate | 🔧 Fix | 13 days ago | — |
| retire Aldric fallen star quest | 🔧 Fix | 13 days ago | — |
| record the pure-core + thin-consumer extraction pattern | 🔧 Fix | 13 days ago | — |
| align market catalog locale shape | 🔧 Fix | 13 days ago | — |
| apply final dot ticks | • | 13 days ago | — |
| prevent fleeing mobs from evade-resetting | • | 13 days ago | — |
| ci: temporarily disable release gate | • | 13 days ago | — |
| Revert "fix: return tradable mech cosmetic on unequip" | • | 13 days ago | — |
| Limited-addition-skin-select-+-wheel | • | 14 days ago | — |
| kickoff spec for first cosmetic skin (Skyfall, event-gated) | ✨ Feature | 14 days ago | — |
| merge(delves): integrate origin/release/v0.10.0 (consolidated content pack) | ✨ Feature | 14 days ago | — |
| kickoff spec for need/greed raid loot rolls | ✨ Feature | 14 days ago | — |
| stabilize prediction under jitter | ⚡ Perf | 14 days ago | — |
| kickoff spec for 10-man raid groups + normal-dungeon gating | ✨ Feature | 14 days ago | — |
| add 2v2 Fiesta party mode | ✨ Feature | 14 days ago | — |
| revert(arena): remove 2v2 fiesta from v0.10 | 🔧 Fix | 14 days ago | — |
| localize stray "Wyrm" in CJK/Cyrillic quests and copy polish | ✨ Feature | 15 days ago | — |
| KayKit asset expansion — dungeon/resource/tools bits, skeleton enemies, weapon icons | ✨ Feature | 15 days ago | — |
| NPC voice-over from ElevenLabs-generated voices | ✨ Feature | 15 days ago | — |
| add Nythraxis attunement chain | ✨ Feature | 15 days ago | — |
| polish attunement questline | • | 15 days ago | — |
| harden HUD packets per validation report (canvas shim, CI integration, online-mode QA, token premise, touch-action) | ✨ Feature | 15 days ago | — |
| keep desktop community links visible | 🔧 Fix | 15 days ago | — |
| complete mergeExtra.es/fr_FR item set to satisfy typecheck | 🔧 Fix | 15 days ago | — |
| bypass follow-cam in Mouse Camera mode | 🔧 Fix | 15 days ago | — |
| merge: re-integrate onto advanced release/v0.9 (b5124f8); regenerate i18n | • | 15 days ago | — |
| Merged main in | • | 15 days ago | — |
| Revert "feat(items): Inventory 2.0 — 4 equipment slots + 11 items" | ✨ Feature | 15 days ago | — |
| [codex] separate 1v1 and 2v2 arena standings | • | 16 days ago | [#521](https://github.com/levy-street/world-of-claudecraft/pull/521) |
| complete arena deaths and targeting | ✨ Feature | 16 days ago | — |
| correct it_IT chatFilter.hardHint gender agreement | ✨ Feature | 16 days ago | — |
| translate /links page into all supported locales | ⚙️ Chore | 16 days ago | — |
| restore Brother Aldric's pre-v0.7 character model | 🔧 Fix | 16 days ago | — |
| list chat-moderated accounts on the chat-filter tab | 🔧 Fix | 16 days ago | — |
| polish release menu screens | 🔧 Fix | 16 days ago | — |
| reverse Ghost Wolf backpedal animation | 🔧 Fix | 16 days ago | — |
| allow two active account sessions | 🔧 Fix | 16 days ago | — |
| remove i18n-scaling planning scaffolding | 🛠 Refactor | 16 days ago | — |
| keep space as gameplay input | 🔧 Fix | 16 days ago | — |
| add chroma selection previews | • | 17 days ago | [#403](https://github.com/levy-street/world-of-claudecraft/pull/403) _(draft)_ |
| MediaWiki fandom community site | • | 17 days ago | — |
| Add friend invite links | ✨ Feature | 18 days ago | [#190](https://github.com/levy-street/world-of-claudecraft/pull/190) |
| populate class trees and polish nodes | • | 18 days ago | — |
| Block offensive names and add character deletion | • | 19 days ago | — |
| The Ashen Coliseum — 1v1 ranked arena, merged to main + bugfixed | 🔧 Fix | 19 days ago | [#117](https://github.com/levy-street/world-of-claudecraft/pull/117) |
| Add ad blocker performance tip | • | 20 days ago | — |
| Rate limit chat and add ignore action | • | 20 days ago | — |
| deny unused electron permissions | • | 20 days ago | — |
| make healing threat party agnostic | ✨ Feature | 20 days ago | — |
| crowd netcode — identity deltas, keep lists, distance-tiered rates | ⚡ Perf | 20 days ago | — |

---
_Auto-generated from the upstream repo's branches; refreshes with each build. A fan view — branch names and plans can change or be dropped at any time._
