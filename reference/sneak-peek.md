# 🔭 Sneak Peek — what's in the works

Unmerged branches and open pull requests on the [upstream game repo](https://github.com/levy-street/world-of-claudecraft) — a look at what *might* be coming. **Nothing here is in the game yet**, and branches that have sat untouched for months may never land. Sorted by how recently each was updated.

_As of 2026-07-09 · 198 branches in flight._

## 🟢 Fresh — actively in progress (updated this week)

| What | Type | Last update | PR |
|---|---|---|---|
| Prediction fix | 🔧 Fix | today | — |
| pr-1605: 02-world-map.png | • | today | — |
| expose game-state metrics on /metrics | ✨ Feature | today | — |
| The Gauntlet survival event, Phase 1 (framework + venue + Sentinel's Crossing), incl. Hodric's Castle #1562 | ✨ Feature | today | [#1581](https://github.com/levy-street/world-of-claudecraft/pull/1581) |
| WIP: Procedural infinite dungeons (Rifts) + dev commands | ✨ Feature | today | [#1584](https://github.com/levy-street/world-of-claudecraft/pull/1584) |
| extract the self-motion prediction gate into a pure module | ✨ Feature | today | — |
| you must possess the ball to kick, pass, or shoot it | ✨ Feature | today | — |
| weapon VFX layer + inspector tuning and scene presets [WIP] | ✨ Feature | today | [#1644](https://github.com/levy-street/world-of-claudecraft/pull/1644) _(draft)_ |
| centered read-view chat with a resizable, in-front panel | 🔧 Fix | today | — |
| give package.json author an email so the Linux deb build can publish | 🔧 Fix | today | — |
| equalize heroic dungeon difficulty at level 22 | 🔧 Fix | today | — |
| reposition loot and target tooltips | 🔧 Fix | today | — |
| touch-friendly quest UI on the map and bar | 🔧 Fix | today | — |
| give the full-match bot sims CI-safe timeouts | 🔧 Fix | today | — |
| db: preload pg_stat_statements for query monitoring | • | today | — |
| pass METRICS_TOKEN through to the game container | • | today | — |
| unstick the mobile-fixes integration branch gates | 🔧 Fix | today | — |
| equalize heroic dungeon difficulty at level 22 | • | today | — |
| revert pg_stat_statements preload from postgres | • | today | — |
| drop the orphaned Quaternius wolf.glb model | ✨ Feature | yesterday | — |
| restore the buffer reset and comment breaks lost to a merge line join | ✨ Feature | yesterday | — |
| fast-forward the empty-instance reset instead of 6000-tick loops | ✨ Feature | yesterday | — |
| throttle the server tick rate on the snapshot head to ~2 Hz | ⚡ Perf | yesterday | — |
| control the two build-drift inputs behind the v0.22 CPU incident | 🔧 Fix | yesterday | [#1619](https://github.com/levy-street/world-of-claudecraft/pull/1619) |
| death left channeling armed, turning the next cast into a per-tick bolt hose | 🔧 Fix | yesterday | [#1606](https://github.com/levy-street/world-of-claudecraft/pull/1606) |
| stop percent mods from rounding away ratio-valued aura buffs | 🔧 Fix | yesterday | [#1607](https://github.com/levy-street/world-of-claudecraft/pull/1607) |
| drop orphaned loading.reconnecting from 12 locale overlays | ⚡ Perf | yesterday | — |
| Claudium + cosmetics storefront, discounts, try-on and SKU inspect (release) | • | yesterday | [#1610](https://github.com/levy-street/world-of-claudecraft/pull/1610) |
| i18n: fill serverTick (Server Tick Rate) across all release locales | • | yesterday | — |
| prepare v0.22.0 for main | • | 2 days ago | — |
| in-game Claudium UI consuming the economy service SDK | ✨ Feature | 2 days ago | [#1522](https://github.com/levy-street/world-of-claudecraft/pull/1522) |
| Hodric's Castle, a 3-round elimination minigame (WIP) | ✨ Feature | 2 days ago | [#1562](https://github.com/levy-street/world-of-claudecraft/pull/1562) _(draft)_ |
| the Mirror World — a level-20 endgame zone (Vale of Glass), forward-ported to v0.23.0 | ✨ Feature | 2 days ago | [#1514](https://github.com/levy-street/world-of-claudecraft/pull/1514) |
| style(i18n): wrap the long download.linuxHint overlay lines per biome | ✨ Feature | 2 days ago | — |
| ci: cap vitest fork parallelism + raise testTimeout to de-flake gates | 🔧 Fix | 2 days ago | — |
| ci: cap vitest fork parallelism + raise testTimeout to de-flake gates | 🔧 Fix | 2 days ago | [#1561](https://github.com/levy-street/world-of-claudecraft/pull/1561) |
| harden update-track guards per review | 🔧 Fix | 2 days ago | — |
| disable linux launcher download | 🔧 Fix | 2 days ago | — |
| ci(pr-ai): split the /review command so anyone can use it safely | 🔧 Fix | 2 days ago | [#1585](https://github.com/levy-street/world-of-claudecraft/pull/1585) |
| merge: resync with release/v0.23.0 | 🛠 Refactor | 2 days ago | — |
| point launcher download at v0.22.0 | • | 2 days ago | — |
| add in-game X account linking | • | 3 days ago | [#1508](https://github.com/levy-street/world-of-claudecraft/pull/1508) _(draft)_ |
| localize the 18 custom ground-pickup deny/enough lines in all 20 locales | ✨ Feature | 3 days ago | — |
| AI asset generation pipeline (Tripo + gpt-image-2) [WIP] | ✨ Feature | 3 days ago | [#1405](https://github.com/levy-street/world-of-claudecraft/pull/1405) _(draft)_ |
| resume after black-holed drops (pong liveness + bounded conflict retry) | ✨ Feature | 3 days ago | — |
| satisfy Biome after release rebase | ✨ Feature | 3 days ago | — |
| drop the onCycleHotbarPage callback leftover from the excised base paging | ✨ Feature | 3 days ago | — |
| Timed casts resolve against the cast-start target | 🔧 Fix | 3 days ago | [#1515](https://github.com/levy-street/world-of-claudecraft/pull/1515) |
| align fullscreen mouselook and diagonal movement visuals | • | 3 days ago | [#1458](https://github.com/levy-street/world-of-claudecraft/pull/1458) |
| point donate buttons to Ko-fi | ⚙️ Chore | 4 days ago | [#1457](https://github.com/levy-street/world-of-claudecraft/pull/1457) |
| the Gravemarch, a 5v5 lane battleground with spectate (WIP) | ✨ Feature | 4 days ago | [#1456](https://github.com/levy-street/world-of-claudecraft/pull/1456) _(draft)_ |
| merge(release): refresh desktop launcher branch | ✨ Feature | 4 days ago | — |
| localize desktop download labels | ✨ Feature | 4 days ago | — |
| stack transitive nameplate overlap chains, not just direct pairs | ✨ Feature | 4 days ago | — |
| update inspect_command test to match colon HP separator | ✨ Feature | 4 days ago | — |
| account bar no longer covers the roster on character select | 🔧 Fix | 4 days ago | — |
| recover stranded Drowned Reliquary loot on interact | 🔧 Fix | 4 days ago | — |
| keep the held emote wheel open when its own suspension begins | 🔧 Fix | 4 days ago | — |
| anchor mail indicator to bottom-right minimap rim so it never stacks on the raid-lockout badge | 🔧 Fix | 4 days ago | — |
| the world boss rises at realm boot | 🔧 Fix | 4 days ago | — |
| housekeeping section for deep game-config overrides (reland of #1340) | ✨ Feature | 5 days ago | [#1399](https://github.com/levy-street/world-of-claudecraft/pull/1399) |
| merge: release/v0.20.0 tip (craft skill, global invite) into feature/ip-pivot; regen artifacts | ✨ Feature | 5 days ago | — |
| one online character per account | ✨ Feature | 5 days ago | — |
| prevent pets inheriting evade immunity | 🔧 Fix | 5 days ago | — |
| keep the site menu bar on the character screens; card layout for wallet and developer sections | 🔧 Fix | 5 days ago | — |
| copy editor.html and svelte.config.js into the image build | 🔧 Fix | 5 days ago | — |
| de-IP the non-English locale overlays missed by the ip-pivot | 🔧 Fix | 5 days ago | — |
| lock cast and channel targets at cast start | 🔧 Fix | 5 days ago | — |
| refresh dialect auth email labels | 🔧 Fix | 5 days ago | — |
| resolve release i18n gate drift | 🔧 Fix | 5 days ago | — |
| mailbox coin inputs select on focus; repaint bags on send/collect | 🔧 Fix | 5 days ago | — |
| clear stale held-key state when menu suspends movement | 🔧 Fix | 5 days ago | — |
| drop stray debug script committed by accident | 🔧 Fix | 5 days ago | — |
| Edda Reedhand uses the druid player rig | 🔧 Fix | 5 days ago | — |
| telegraph the Reedbound Acolyte's vial so the throw animation leads the release | 🔧 Fix | 5 days ago | — |
| translate daily rewards chest toggle | 🔧 Fix | 5 days ago | — |
| fork PRs skip the screenshot comment entirely (read-only token) | • | 5 days ago | — |
| tooling(ci): use Codex for the AI PR reviewer on main (review + comment commands) | • | 5 days ago | — |
| default Show My Nameplate off per the issue #1235 and PR contract | ✨ Feature | 6 days ago | — |
| lock in Vanguard as the battle theme, drop audition variants | ✨ Feature | 7 days ago | — |
| use a dedicated internal secret, no RESTART_COUNTDOWN_SECRET fallback | ✨ Feature | 7 days ago | — |
| extract isSoftwareRenderer for the GPU diagnostic | ⚡ Perf | 7 days ago | — |
| build(desktop): regenerate package-lock with npm 10 to match CI | ✨ Feature | 7 days ago | — |
| instance corpse-run death loop, no Spirit Healer inside instances | ✨ Feature | 7 days ago | — |
| tune the Atlantis night-sea lighting and Tidegate arrival | ✨ Feature | 7 days ago | — |
| carry aura magnitude on the wire so buff/debuff tooltips show real values | 🔧 Fix | 7 days ago | — |
| pass GitHub OAuth env through to the game service | 🔧 Fix | 7 days ago | — |

## 🟡 Recent — within the last month

| What | Type | Last update | PR |
|---|---|---|---|
| auto-join the guild on OAuth link/login via guilds.join | ✨ Feature | 8 days ago | — |
| make the Discord menu a rebindable keybind (default U) | ✨ Feature | 8 days ago | — |
| add a Discord link/unlink entry to the touch More menu | ✨ Feature | 8 days ago | — |
| format fbx to glb converter | ✨ Feature | 8 days ago | — |
| match failed-avatar fallback to each surface's no-avatar state | 🔧 Fix | 8 days ago | — |
| match failed-avatar fallback to each surface's no-avatar state | 🔧 Fix | 8 days ago | — |
| pass DISCORD_BOT_TOKEN to the game service for auto-join | 🔧 Fix | 8 days ago | — |
| make the link-Discord CTA banner responsive on phones | 🔧 Fix | 8 days ago | — |
| style(ui): drop stray em dash from a hud.ts comment | 🔧 Fix | 8 days ago | — |
| skip .claude/worktrees copies in the release malware scan | 🔧 Fix | 8 days ago | — |
| fill v0.17.0 release locales and widen scanner-determinism timeout | • | 8 days ago | — |
| allow Discord bot to boot without dotenv file | • | 9 days ago | — |
| avoid compose env lint warnings | • | 9 days ago | — |
| include Discord bot build script in Docker context | ⚙️ Chore | 9 days ago | — |
| resync package-lock.json so npm ci passes (restore nested picomatch) | ✨ Feature | 9 days ago | — |
| translate whitepaper footer label | ✨ Feature | 9 days ago | — |
| unblock v0.16.0 checks | • | 9 days ago | — |
| align cross-platform-sync M16 wording with the other i18n docs | ✨ Feature | 10 days ago | — |
| satisfy changed-file biome | ✨ Feature | 10 days ago | — |
| apply biome to armor content | 🔧 Fix | 10 days ago | — |
| set vcs.defaultBranch so the local pre-push gate resolves a base | 🛠 Refactor | 10 days ago | — |
| Revert "feat(content): rogue Stealth and Vanish move at 50% speed (#997)" | ✨ Feature | 10 days ago | — |
| biome format + lint the refactor diff to pass the CI ratchet | 🛠 Refactor | 13 days ago | — |
| include private bot detector in docker builds | 🔧 Fix | 14 days ago | — |
| format admin locale files | • | 14 days ago | — |
| [codex] Refactor mob behavior systems | • | 15 days ago | [#879](https://github.com/levy-street/world-of-claudecraft/pull/879) _(draft)_ |
| improve admin metrics | ✨ Feature | 15 days ago | — |
| harden public origins and consent payload | ✨ Feature | 15 days ago | — |
| sync native app version to 0.14.1 | • | 15 days ago | — |
| key market sellers by character id | 🔧 Fix | 15 days ago | — |
| ci: skip biome ratchet on main pushes | 🔧 Fix | 15 days ago | — |
| restore full raid frame ordering | 🔧 Fix | 15 days ago | — |
| satisfy release repair typecheck | 🔧 Fix | 15 days ago | — |
| add old cragmaw pelt data migration | • | 15 days ago | — |
| add codex project workflow surface | ⚙️ Chore | 16 days ago | [#867](https://github.com/levy-street/world-of-claudecraft/pull/867) |
| add IndexNow key file | ⚙️ Chore | 16 days ago | — |
| drop duplicate hudChrome.perf.groups.input from the v0.14.0 merge | ✨ Feature | 16 days ago | — |
| include guide html in docker build | 🔧 Fix | 16 days ago | — |
| include wiki build scripts in docker context | 🔧 Fix | 16 days ago | — |
| format quest audit graph script | • | 16 days ago | — |
| satisfy biome changed-file check | • | 16 days ago | — |
| fix PR gate typecheck failures | • | 17 days ago | — |
| align ultra default CI expectations | • | 17 days ago | — |
| include docker build inputs | 🔧 Fix | 17 days ago | — |
| keep low quality loot out of need greed rolls | • | 17 days ago | — |
| add travel form live diagnostics | • | 17 days ago | — |
| image-based ability icons for all 9 classes | ✨ Feature | 17 days ago | — |
| stabilize abandon quest confirmation | 🔧 Fix | 17 days ago | — |
| despawn idle bound guardian | 🔧 Fix | 17 days ago | — |
| layer loot roll tooltips above roll panels | 🔧 Fix | 17 days ago | — |
| translate Nythraxis raid dungeon names | • | 17 days ago | — |
| refine Wallet Standard UX and i18n | 🔧 Fix | 18 days ago | — |
| keep dev card images on dev origin | • | 19 days ago | — |
| keep dev card images on dev origin | • | 19 days ago | — |
| restore skin preload contract wording | ✨ Feature | 19 days ago | — |
| tune mech spinner rarity rates | 🔧 Fix | 19 days ago | — |
| return tradable mech cosmetic on unequip | 🔧 Fix | 19 days ago | — |
| add mobile input zoom regression check | 🔧 Fix | 19 days ago | — |
| guard character saves during relog | 🔧 Fix | 19 days ago | — |
| tune fast rare drops and market mech plates | 🔧 Fix | 19 days ago | [#756](https://github.com/levy-street/world-of-claudecraft/pull/756) _(draft)_ |
| ci: restore release gate | 🔧 Fix | 19 days ago | — |
| retire Aldric fallen star quest | 🔧 Fix | 19 days ago | — |
| record the pure-core + thin-consumer extraction pattern | 🔧 Fix | 19 days ago | — |
| align market catalog locale shape | 🔧 Fix | 19 days ago | — |
| apply final dot ticks | • | 19 days ago | — |
| prevent fleeing mobs from evade-resetting | • | 19 days ago | — |
| ci: temporarily disable release gate | • | 19 days ago | — |
| Revert "fix: return tradable mech cosmetic on unequip" | • | 19 days ago | — |
| Limited-addition-skin-select-+-wheel | • | 20 days ago | — |
| route Aldric reward through mech spinner | ✨ Feature | 20 days ago | — |
| kickoff spec for first cosmetic skin (Skyfall, event-gated) | ✨ Feature | 20 days ago | — |
| merge(delves): integrate origin/release/v0.10.0 (consolidated content pack) | ✨ Feature | 20 days ago | — |
| kickoff spec for need/greed raid loot rolls | ✨ Feature | 20 days ago | — |
| stabilize prediction under jitter | ⚡ Perf | 20 days ago | — |
| kickoff spec for 10-man raid groups + normal-dungeon gating | ✨ Feature | 20 days ago | — |
| add 2v2 Fiesta party mode | ✨ Feature | 20 days ago | — |
| revert(arena): remove 2v2 fiesta from v0.10 | 🔧 Fix | 20 days ago | — |
| localize stray "Wyrm" in CJK/Cyrillic quests and copy polish | ✨ Feature | 21 days ago | — |
| KayKit asset expansion — dungeon/resource/tools bits, skeleton enemies, weapon icons | ✨ Feature | 21 days ago | — |
| NPC voice-over from ElevenLabs-generated voices | ✨ Feature | 21 days ago | — |
| add Nythraxis attunement chain | ✨ Feature | 21 days ago | — |
| polish attunement questline | • | 21 days ago | — |
| harden HUD packets per validation report (canvas shim, CI integration, online-mode QA, token premise, touch-action) | ✨ Feature | 21 days ago | — |
| keep desktop community links visible | 🔧 Fix | 21 days ago | — |
| complete mergeExtra.es/fr_FR item set to satisfy typecheck | 🔧 Fix | 21 days ago | — |
| bypass follow-cam in Mouse Camera mode | 🔧 Fix | 21 days ago | — |
| merge: re-integrate onto advanced release/v0.9 (b5124f8); regenerate i18n | • | 21 days ago | — |
| Merged main in | • | 21 days ago | — |
| Revert "feat(items): Inventory 2.0 — 4 equipment slots + 11 items" | ✨ Feature | 21 days ago | — |
| [codex] separate 1v1 and 2v2 arena standings | • | 22 days ago | [#521](https://github.com/levy-street/world-of-claudecraft/pull/521) |
| complete arena deaths and targeting | ✨ Feature | 22 days ago | — |
| correct it_IT chatFilter.hardHint gender agreement | ✨ Feature | 22 days ago | — |
| translate /links page into all supported locales | ⚙️ Chore | 22 days ago | — |
| restore Brother Aldric's pre-v0.7 character model | 🔧 Fix | 22 days ago | — |
| list chat-moderated accounts on the chat-filter tab | 🔧 Fix | 22 days ago | — |
| polish release menu screens | 🔧 Fix | 22 days ago | — |
| reverse Ghost Wolf backpedal animation | 🔧 Fix | 22 days ago | — |
| allow two active account sessions | 🔧 Fix | 22 days ago | — |
| remove i18n-scaling planning scaffolding | 🛠 Refactor | 22 days ago | — |
| keep space as gameplay input | 🔧 Fix | 22 days ago | — |
| add chroma selection previews | • | 23 days ago | [#403](https://github.com/levy-street/world-of-claudecraft/pull/403) _(draft)_ |
| MediaWiki fandom community site | • | 23 days ago | — |
| populate class trees and polish nodes | • | 24 days ago | — |
| Block offensive names and add character deletion | • | 25 days ago | — |
| Remove the World Market — keep this PR focused on the Ashen Coliseum | 🔧 Fix | 25 days ago | — |
| Add friend invite links | ✨ Feature | 25 days ago | — |
| Add ad blocker performance tip | • | 26 days ago | — |
| Rate limit chat and add ignore action | • | 26 days ago | — |
| deny unused electron permissions | • | 26 days ago | — |
| make healing threat party agnostic | ✨ Feature | 26 days ago | — |
| crowd netcode — identity deltas, keep lists, distance-tiered rates | ⚡ Perf | 26 days ago | — |

---
_Auto-generated from the upstream repo's branches; refreshes with each build. A fan view — branch names and plans can change or be dropped at any time._
