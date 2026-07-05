# 🔭 Sneak Peek — what's in the works

Unmerged branches and open pull requests on the [upstream game repo](https://github.com/levy-street/world-of-claudecraft) — a look at what *might* be coming. **Nothing here is in the game yet**, and branches that have sat untouched for months may never land. Sorted by how recently each was updated.

_As of 2026-07-05 · 154 branches in flight._

## 🟢 Fresh — actively in progress (updated this week)

| What | Type | Last update | PR |
|---|---|---|---|
| pr-1472: 02-world-map.png | • | today | — |
| point donate buttons to Ko-fi | ⚙️ Chore | today | [#1457](https://github.com/levy-street/world-of-claudecraft/pull/1457) |
| AI asset generation pipeline (Tripo + gpt-image-2) [WIP] | ✨ Feature | today | [#1405](https://github.com/levy-street/world-of-claudecraft/pull/1405) _(draft)_ |
| the Gravemarch, a 5v5 lane battleground with spectate (WIP) | ✨ Feature | today | [#1456](https://github.com/levy-street/world-of-claudecraft/pull/1456) _(draft)_ |
| merge(release): refresh desktop launcher branch | ✨ Feature | today | — |
| localize desktop download labels | ✨ Feature | today | — |
| satisfy Biome after release rebase | ✨ Feature | today | — |
| stack transitive nameplate overlap chains, not just direct pairs | ✨ Feature | today | — |
| add effect recharge with original-crafter discount | ✨ Feature | today | [#1200](https://github.com/levy-street/world-of-claudecraft/pull/1200) |
| recover stranded Drowned Reliquary loot on interact | 🔧 Fix | today | — |
| keep the held emote wheel open when its own suspension begins | 🔧 Fix | today | — |
| anchor mail indicator to bottom-right minimap rim so it never stacks on the raid-lockout badge | 🔧 Fix | today | — |
| align fullscreen mouselook and diagonal movement visuals | • | today | [#1458](https://github.com/levy-street/world-of-claudecraft/pull/1458) |
| housekeeping section for deep game-config overrides (reland of #1340) | ✨ Feature | yesterday | [#1399](https://github.com/levy-street/world-of-claudecraft/pull/1399) |
| merge: release/v0.20.0 tip (craft skill, global invite) into feature/ip-pivot; regen artifacts | ✨ Feature | yesterday | — |
| one online character per account | ✨ Feature | yesterday | — |
| prevent pets inheriting evade immunity | 🔧 Fix | yesterday | — |
| keep the site menu bar on the character screens; card layout for wallet and developer sections | 🔧 Fix | yesterday | — |
| account bar no longer covers the roster on character select | 🔧 Fix | yesterday | — |
| copy editor.html and svelte.config.js into the image build | 🔧 Fix | yesterday | — |
| de-IP the non-English locale overlays missed by the ip-pivot | 🔧 Fix | yesterday | — |
| lock cast and channel targets at cast start | 🔧 Fix | yesterday | — |
| resolve release i18n gate drift | 🔧 Fix | yesterday | — |
| mailbox coin inputs select on focus; repaint bags on send/collect | 🔧 Fix | yesterday | — |
| clear stale held-key state when menu suspends movement | 🔧 Fix | yesterday | — |
| drop stray debug script committed by accident | 🔧 Fix | yesterday | — |
| Edda Reedhand uses the druid player rig | 🔧 Fix | yesterday | — |
| telegraph the Reedbound Acolyte's vial so the throw animation leads the release | 🔧 Fix | yesterday | — |
| translate daily rewards chest toggle | 🔧 Fix | yesterday | — |
| the world boss rises at realm boot | 🔧 Fix | yesterday | — |
| fork PRs skip the screenshot comment entirely (read-only token) | • | yesterday | — |
| tooling(ci): use Codex for the AI PR reviewer on main (review + comment commands) | • | yesterday | — |
| default Show My Nameplate off per the issue #1235 and PR contract | ✨ Feature | 2 days ago | — |
| swap in custom-rigged wolf models | ✨ Feature | 2 days ago | [#1334](https://github.com/levy-street/world-of-claudecraft/pull/1334) |
| refresh dialect auth email labels | 🔧 Fix | 2 days ago | — |
| lock in Vanguard as the battle theme, drop audition variants | ✨ Feature | 3 days ago | — |
| use a dedicated internal secret, no RESTART_COUNTDOWN_SECRET fallback | ✨ Feature | 3 days ago | — |
| extract isSoftwareRenderer for the GPU diagnostic | ⚡ Perf | 3 days ago | — |
| build(desktop): regenerate package-lock with npm 10 to match CI | ✨ Feature | 3 days ago | — |
| instance corpse-run death loop, no Spirit Healer inside instances | ✨ Feature | 3 days ago | — |
| tune the Atlantis night-sea lighting and Tidegate arrival | ✨ Feature | 3 days ago | — |
| pass GitHub OAuth env through to the game service | 🔧 Fix | 3 days ago | — |
| auto-join the guild on OAuth link/login via guilds.join | ✨ Feature | 4 days ago | — |
| make the Discord menu a rebindable keybind (default U) | ✨ Feature | 4 days ago | — |
| add a Discord link/unlink entry to the touch More menu | ✨ Feature | 4 days ago | — |
| format fbx to glb converter | ✨ Feature | 4 days ago | — |
| carry aura magnitude on the wire so buff/debuff tooltips show real values | 🔧 Fix | 4 days ago | — |
| match failed-avatar fallback to each surface's no-avatar state | 🔧 Fix | 4 days ago | — |
| match failed-avatar fallback to each surface's no-avatar state | 🔧 Fix | 4 days ago | — |
| pass DISCORD_BOT_TOKEN to the game service for auto-join | 🔧 Fix | 4 days ago | — |
| make the link-Discord CTA banner responsive on phones | 🔧 Fix | 4 days ago | — |
| style(ui): drop stray em dash from a hud.ts comment | 🔧 Fix | 4 days ago | — |
| skip .claude/worktrees copies in the release malware scan | 🔧 Fix | 4 days ago | — |
| fill v0.17.0 release locales and widen scanner-determinism timeout | • | 4 days ago | — |
| allow Discord bot to boot without dotenv file | • | 5 days ago | — |
| avoid compose env lint warnings | • | 5 days ago | — |
| include Discord bot build script in Docker context | ⚙️ Chore | 5 days ago | — |
| align cross-platform-sync M16 wording with the other i18n docs | ✨ Feature | 6 days ago | — |
| satisfy changed-file biome | ✨ Feature | 6 days ago | — |
| resync package-lock.json so npm ci passes (restore nested picomatch) | ✨ Feature | 6 days ago | — |
| translate whitepaper footer label | ✨ Feature | 6 days ago | — |
| apply biome to armor content | 🔧 Fix | 6 days ago | — |
| set vcs.defaultBranch so the local pre-push gate resolves a base | 🛠 Refactor | 6 days ago | — |
| unblock v0.16.0 checks | • | 6 days ago | — |
| Revert "feat(content): rogue Stealth and Vanish move at 50% speed (#997)" | ✨ Feature | 6 days ago | — |

## 🟡 Recent — within the last month

| What | Type | Last update | PR |
|---|---|---|---|
| biome format + lint the refactor diff to pass the CI ratchet | 🛠 Refactor | 9 days ago | — |
| improve admin metrics | ✨ Feature | 11 days ago | — |
| harden public origins and consent payload | ✨ Feature | 11 days ago | — |
| sync native app version to 0.14.1 | • | 11 days ago | — |
| key market sellers by character id | 🔧 Fix | 11 days ago | — |
| ci: skip biome ratchet on main pushes | 🔧 Fix | 11 days ago | — |
| include private bot detector in docker builds | 🔧 Fix | 11 days ago | — |
| restore full raid frame ordering | 🔧 Fix | 11 days ago | — |
| satisfy release repair typecheck | 🔧 Fix | 11 days ago | — |
| add old cragmaw pelt data migration | • | 11 days ago | — |
| format admin locale files | • | 11 days ago | — |
| add codex project workflow surface | ⚙️ Chore | 12 days ago | [#867](https://github.com/levy-street/world-of-claudecraft/pull/867) |
| add IndexNow key file | ⚙️ Chore | 12 days ago | — |
| [codex] Refactor mob behavior systems | • | 12 days ago | [#879](https://github.com/levy-street/world-of-claudecraft/pull/879) _(draft)_ |
| drop duplicate hudChrome.perf.groups.input from the v0.14.0 merge | ✨ Feature | 12 days ago | — |
| include guide html in docker build | 🔧 Fix | 12 days ago | — |
| include wiki build scripts in docker context | 🔧 Fix | 12 days ago | — |
| format quest audit graph script | • | 12 days ago | — |
| satisfy biome changed-file check | • | 12 days ago | — |
| fix PR gate typecheck failures | • | 13 days ago | — |
| align ultra default CI expectations | • | 13 days ago | — |
| include docker build inputs | 🔧 Fix | 13 days ago | — |
| keep low quality loot out of need greed rolls | • | 13 days ago | — |
| add travel form live diagnostics | • | 13 days ago | — |
| image-based ability icons for all 9 classes | ✨ Feature | 13 days ago | — |
| stabilize abandon quest confirmation | 🔧 Fix | 13 days ago | — |
| despawn idle bound guardian | 🔧 Fix | 13 days ago | — |
| layer loot roll tooltips above roll panels | 🔧 Fix | 13 days ago | — |
| translate Nythraxis raid dungeon names | • | 13 days ago | — |
| refine Wallet Standard UX and i18n | 🔧 Fix | 14 days ago | — |
| keep dev card images on dev origin | • | 15 days ago | — |
| keep dev card images on dev origin | • | 15 days ago | — |
| restore skin preload contract wording | ✨ Feature | 15 days ago | — |
| add mobile input zoom regression check | 🔧 Fix | 15 days ago | — |
| guard character saves during relog | 🔧 Fix | 15 days ago | — |
| tune fast rare drops and market mech plates | 🔧 Fix | 15 days ago | [#756](https://github.com/levy-street/world-of-claudecraft/pull/756) _(draft)_ |
| retire Aldric fallen star quest | 🔧 Fix | 15 days ago | — |
| record the pure-core + thin-consumer extraction pattern | 🔧 Fix | 15 days ago | — |
| align market catalog locale shape | 🔧 Fix | 15 days ago | — |
| apply final dot ticks | • | 15 days ago | — |
| prevent fleeing mobs from evade-resetting | • | 15 days ago | — |
| Revert "fix: return tradable mech cosmetic on unequip" | • | 15 days ago | — |
| Limited-addition-skin-select-+-wheel | • | 16 days ago | — |
| route Aldric reward through mech spinner | ✨ Feature | 16 days ago | — |
| kickoff spec for first cosmetic skin (Skyfall, event-gated) | ✨ Feature | 16 days ago | — |
| merge(delves): integrate origin/release/v0.10.0 (consolidated content pack) | ✨ Feature | 16 days ago | — |
| kickoff spec for need/greed raid loot rolls | ✨ Feature | 16 days ago | — |
| stabilize prediction under jitter | ⚡ Perf | 16 days ago | — |
| kickoff spec for 10-man raid groups + normal-dungeon gating | ✨ Feature | 16 days ago | — |
| add 2v2 Fiesta party mode | ✨ Feature | 16 days ago | — |
| tune mech spinner rarity rates | 🔧 Fix | 16 days ago | — |
| return tradable mech cosmetic on unequip | 🔧 Fix | 16 days ago | — |
| revert(arena): remove 2v2 fiesta from v0.10 | 🔧 Fix | 16 days ago | — |
| ci: restore release gate | 🔧 Fix | 16 days ago | — |
| ci: temporarily disable release gate | • | 16 days ago | — |
| localize stray "Wyrm" in CJK/Cyrillic quests and copy polish | ✨ Feature | 17 days ago | — |
| KayKit asset expansion — dungeon/resource/tools bits, skeleton enemies, weapon icons | ✨ Feature | 17 days ago | — |
| NPC voice-over from ElevenLabs-generated voices | ✨ Feature | 17 days ago | — |
| add Nythraxis attunement chain | ✨ Feature | 17 days ago | — |
| polish attunement questline | • | 17 days ago | — |
| harden HUD packets per validation report (canvas shim, CI integration, online-mode QA, token premise, touch-action) | ✨ Feature | 17 days ago | — |
| keep desktop community links visible | 🔧 Fix | 17 days ago | — |
| complete mergeExtra.es/fr_FR item set to satisfy typecheck | 🔧 Fix | 17 days ago | — |
| bypass follow-cam in Mouse Camera mode | 🔧 Fix | 17 days ago | — |
| merge: re-integrate onto advanced release/v0.9 (b5124f8); regenerate i18n | • | 17 days ago | — |
| Merged main in | • | 17 days ago | — |
| Revert "feat(items): Inventory 2.0 — 4 equipment slots + 11 items" | ✨ Feature | 17 days ago | — |
| [codex] separate 1v1 and 2v2 arena standings | • | 18 days ago | [#521](https://github.com/levy-street/world-of-claudecraft/pull/521) |
| complete arena deaths and targeting | ✨ Feature | 18 days ago | — |
| correct it_IT chatFilter.hardHint gender agreement | ✨ Feature | 18 days ago | — |
| translate /links page into all supported locales | ⚙️ Chore | 18 days ago | — |
| restore Brother Aldric's pre-v0.7 character model | 🔧 Fix | 18 days ago | — |
| list chat-moderated accounts on the chat-filter tab | 🔧 Fix | 18 days ago | — |
| polish release menu screens | 🔧 Fix | 18 days ago | — |
| reverse Ghost Wolf backpedal animation | 🔧 Fix | 18 days ago | — |
| allow two active account sessions | 🔧 Fix | 18 days ago | — |
| remove i18n-scaling planning scaffolding | 🛠 Refactor | 18 days ago | — |
| keep space as gameplay input | 🔧 Fix | 18 days ago | — |
| add chroma selection previews | • | 19 days ago | [#403](https://github.com/levy-street/world-of-claudecraft/pull/403) _(draft)_ |
| MediaWiki fandom community site | • | 19 days ago | — |
| populate class trees and polish nodes | • | 20 days ago | — |
| Block offensive names and add character deletion | • | 21 days ago | — |
| Remove the World Market — keep this PR focused on the Ashen Coliseum | 🔧 Fix | 21 days ago | — |
| Add friend invite links | ✨ Feature | 21 days ago | [#190](https://github.com/levy-street/world-of-claudecraft/pull/190) |
| Add ad blocker performance tip | • | 22 days ago | — |
| Rate limit chat and add ignore action | • | 22 days ago | — |
| deny unused electron permissions | • | 22 days ago | — |
| make healing threat party agnostic | ✨ Feature | 22 days ago | — |
| crowd netcode — identity deltas, keep lists, distance-tiered rates | ⚡ Perf | 22 days ago | — |

---
_Auto-generated from the upstream repo's branches; refreshes with each build. A fan view — branch names and plans can change or be dropped at any time._
