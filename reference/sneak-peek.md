# 🔭 Sneak Peek — what's in the works

Unmerged branches and open pull requests on the [upstream game repo](https://github.com/levy-street/world-of-claudecraft) — a look at what *might* be coming. **Nothing here is in the game yet**, and branches that have sat untouched for months may never land. Sorted by how recently each was updated.

_As of 2026-07-01 · 116 branches in flight._

## 🟢 Fresh — actively in progress (updated this week)

| What | Type | Last update | PR |
|---|---|---|---|
| hide rewards on native mobile | ✨ Feature | today | — |
| auto-join the guild on OAuth link/login via guilds.join | ✨ Feature | today | — |
| make the Discord menu a rebindable keybind (default U) | ✨ Feature | today | — |
| add a Discord link/unlink entry to the touch More menu | ✨ Feature | today | — |
| format fbx to glb converter | ✨ Feature | today | — |
| resource item icons and fix for repeated hunter pet-bar icons | ✨ Feature | today | [#1202](https://github.com/levy-street/world-of-claudecraft/pull/1202) |
| carry aura magnitude on the wire so buff/debuff tooltips show real values | 🔧 Fix | today | — |
| pass GitHub OAuth env through to the game service | 🔧 Fix | today | — |
| match failed-avatar fallback to each surface's no-avatar state | 🔧 Fix | today | — |
| match failed-avatar fallback to each surface's no-avatar state | 🔧 Fix | today | — |
| pass DISCORD_BOT_TOKEN to the game service for auto-join | 🔧 Fix | today | — |
| style(ui): drop stray em dash from a hud.ts comment | 🔧 Fix | today | — |
| skip .claude/worktrees copies in the release malware scan | 🔧 Fix | today | — |
| bump version to 0.18.0 | • | today | — |
| allow Discord bot to boot without dotenv file | • | yesterday | — |
| avoid compose env lint warnings | • | yesterday | — |
| include Discord bot build script in Docker context | ⚙️ Chore | yesterday | — |
| make the link-Discord CTA banner responsive on phones | 🔧 Fix | yesterday | — |
| fill v0.17.0 release locales and widen scanner-determinism timeout | • | yesterday | — |
| satisfy changed-file biome | ✨ Feature | 2 days ago | — |
| resync package-lock.json so npm ci passes (restore nested picomatch) | ✨ Feature | 2 days ago | — |
| translate whitepaper footer label | ✨ Feature | 2 days ago | — |
| apply biome to armor content | 🔧 Fix | 2 days ago | — |
| set vcs.defaultBranch so the local pre-push gate resolves a base | 🛠 Refactor | 2 days ago | — |
| unblock v0.16.0 checks | • | 2 days ago | — |
| Revert "feat(content): rogue Stealth and Vanish move at 50% speed (#997)" | ✨ Feature | 2 days ago | — |
| align cross-platform-sync M16 wording with the other i18n docs | ✨ Feature | 3 days ago | — |
| biome format + lint the refactor diff to pass the CI ratchet | 🛠 Refactor | 5 days ago | — |
| improve admin metrics | ✨ Feature | 7 days ago | — |
| harden public origins and consent payload | ✨ Feature | 7 days ago | — |
| sync native app version to 0.14.1 | • | 7 days ago | — |
| key market sellers by character id | 🔧 Fix | 7 days ago | — |
| ci: skip biome ratchet on main pushes | 🔧 Fix | 7 days ago | — |
| include private bot detector in docker builds | 🔧 Fix | 7 days ago | — |
| restore full raid frame ordering | 🔧 Fix | 7 days ago | — |
| satisfy release repair typecheck | 🔧 Fix | 7 days ago | — |
| add old cragmaw pelt data migration | • | 7 days ago | — |
| format admin locale files | • | 7 days ago | — |

## 🟡 Recent — within the last month

| What | Type | Last update | PR |
|---|---|---|---|
| add codex project workflow surface | ⚙️ Chore | 8 days ago | [#867](https://github.com/levy-street/world-of-claudecraft/pull/867) |
| add IndexNow key file | ⚙️ Chore | 8 days ago | — |
| [codex] Refactor mob behavior systems | • | 8 days ago | [#879](https://github.com/levy-street/world-of-claudecraft/pull/879) _(draft)_ |
| drop duplicate hudChrome.perf.groups.input from the v0.14.0 merge | ✨ Feature | 8 days ago | — |
| include guide html in docker build | 🔧 Fix | 8 days ago | — |
| include wiki build scripts in docker context | 🔧 Fix | 8 days ago | — |
| format quest audit graph script | • | 8 days ago | — |
| satisfy biome changed-file check | • | 8 days ago | — |
| fix PR gate typecheck failures | • | 9 days ago | — |
| include docker build inputs | 🔧 Fix | 9 days ago | — |
| keep low quality loot out of need greed rolls | • | 9 days ago | — |
| add travel form live diagnostics | • | 9 days ago | — |
| image-based ability icons for all 9 classes | ✨ Feature | 9 days ago | — |
| stabilize abandon quest confirmation | 🔧 Fix | 9 days ago | — |
| despawn idle bound guardian | 🔧 Fix | 9 days ago | — |
| layer loot roll tooltips above roll panels | 🔧 Fix | 9 days ago | — |
| translate Nythraxis raid dungeon names | • | 9 days ago | — |
| align ultra default CI expectations | • | 10 days ago | — |
| keep dev card images on dev origin | • | 11 days ago | — |
| keep dev card images on dev origin | • | 11 days ago | — |
| restore skin preload contract wording | ✨ Feature | 11 days ago | — |
| tune fast rare drops and market mech plates | 🔧 Fix | 11 days ago | [#756](https://github.com/levy-street/world-of-claudecraft/pull/756) _(draft)_ |
| retire Aldric fallen star quest | 🔧 Fix | 11 days ago | — |
| record the pure-core + thin-consumer extraction pattern | 🔧 Fix | 11 days ago | — |
| refine Wallet Standard UX and i18n | 🔧 Fix | 11 days ago | — |
| align market catalog locale shape | 🔧 Fix | 11 days ago | — |
| apply final dot ticks | • | 11 days ago | — |
| prevent fleeing mobs from evade-resetting | • | 11 days ago | — |
| Limited-addition-skin-select-+-wheel | • | 12 days ago | — |
| route Aldric reward through mech spinner | ✨ Feature | 12 days ago | — |
| merge(delves): integrate origin/release/v0.10.0 (consolidated content pack) | ✨ Feature | 12 days ago | — |
| stabilize prediction under jitter | ⚡ Perf | 12 days ago | — |
| add 2v2 Fiesta party mode | ✨ Feature | 12 days ago | — |
| tune mech spinner rarity rates | 🔧 Fix | 12 days ago | — |
| return tradable mech cosmetic on unequip | 🔧 Fix | 12 days ago | — |
| add mobile input zoom regression check | 🔧 Fix | 12 days ago | — |
| guard character saves during relog | 🔧 Fix | 12 days ago | — |
| revert(arena): remove 2v2 fiesta from v0.10 | 🔧 Fix | 12 days ago | — |
| ci: restore release gate | 🔧 Fix | 12 days ago | — |
| ci: temporarily disable release gate | • | 12 days ago | — |
| Revert "fix: return tradable mech cosmetic on unequip" | • | 12 days ago | — |
| kickoff spec for first cosmetic skin (Skyfall, event-gated) | ✨ Feature | 13 days ago | — |
| localize stray "Wyrm" in CJK/Cyrillic quests and copy polish | ✨ Feature | 13 days ago | — |
| KayKit asset expansion — dungeon/resource/tools bits, skeleton enemies, weapon icons | ✨ Feature | 13 days ago | — |
| kickoff spec for need/greed raid loot rolls | ✨ Feature | 13 days ago | — |
| NPC voice-over from ElevenLabs-generated voices | ✨ Feature | 13 days ago | — |
| add Nythraxis attunement chain | ✨ Feature | 13 days ago | — |
| polish attunement questline | • | 13 days ago | — |
| kickoff spec for 10-man raid groups + normal-dungeon gating | ✨ Feature | 13 days ago | — |
| harden HUD packets per validation report (canvas shim, CI integration, online-mode QA, token premise, touch-action) | ✨ Feature | 13 days ago | — |
| keep desktop community links visible | 🔧 Fix | 13 days ago | — |
| complete mergeExtra.es/fr_FR item set to satisfy typecheck | 🔧 Fix | 13 days ago | — |
| bypass follow-cam in Mouse Camera mode | 🔧 Fix | 13 days ago | — |
| merge: re-integrate onto advanced release/v0.9 (b5124f8); regenerate i18n | • | 13 days ago | — |
| Merged main in | • | 13 days ago | — |
| [codex] separate 1v1 and 2v2 arena standings | • | 14 days ago | [#521](https://github.com/levy-street/world-of-claudecraft/pull/521) |
| complete arena deaths and targeting | ✨ Feature | 14 days ago | — |
| correct it_IT chatFilter.hardHint gender agreement | ✨ Feature | 14 days ago | — |
| restore Brother Aldric's pre-v0.7 character model | 🔧 Fix | 14 days ago | — |
| list chat-moderated accounts on the chat-filter tab | 🔧 Fix | 14 days ago | — |
| polish release menu screens | 🔧 Fix | 14 days ago | — |
| reverse Ghost Wolf backpedal animation | 🔧 Fix | 14 days ago | — |
| allow two active account sessions | 🔧 Fix | 14 days ago | — |
| remove i18n-scaling planning scaffolding | 🛠 Refactor | 14 days ago | — |
| keep space as gameplay input | 🔧 Fix | 14 days ago | — |
| Revert "feat(items): Inventory 2.0 — 4 equipment slots + 11 items" | ✨ Feature | 14 days ago | — |
| translate /links page into all supported locales | ⚙️ Chore | 15 days ago | — |
| add chroma selection previews | • | 15 days ago | [#403](https://github.com/levy-street/world-of-claudecraft/pull/403) _(draft)_ |
| MediaWiki fandom community site | • | 15 days ago | — |
| populate class trees and polish nodes | • | 16 days ago | — |
| The Ashen Coliseum — 1v1 ranked arena, merged to main + bugfixed | 🔧 Fix | 17 days ago | [#117](https://github.com/levy-street/world-of-claudecraft/pull/117) |
| Add friend invite links | ✨ Feature | 17 days ago | [#190](https://github.com/levy-street/world-of-claudecraft/pull/190) |
| Add ad blocker performance tip | • | 18 days ago | — |
| Rate limit chat and add ignore action | • | 18 days ago | — |
| Block offensive names and add character deletion | • | 18 days ago | — |
| deny unused electron permissions | • | 18 days ago | — |
| make healing threat party agnostic | ✨ Feature | 18 days ago | — |
| crowd netcode — identity deltas, keep lists, distance-tiered rates | ⚡ Perf | 18 days ago | — |

---
_Auto-generated from the upstream repo's branches; refreshes with each build. A fan view — branch names and plans can change or be dropped at any time._
