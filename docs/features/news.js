'use strict';
// What's New — #/news. A curated changelog: the guide-relevant highlights of the
// latest World of Claudecraft game release, plus the new tools & games added to the
// guide itself. Editorial (hand-curated) with deep links into the relevant pages.
(function () {
  const { el, esc, registerView, app } = window.WOC;

  const GAME = [
    ['⚽', 'The Vale Cup', 'A full boarball (football) minigame at the Sowfield stadium in Eastbrook Vale — 1v1 to 5v5 queues, sport role kits, bot backfill, spectator betting, and player + guild leaderboards.', '#/patches', 'See the patch notes'],
    ['🛡️', 'Heroic dungeons', 'All four 5-player dungeons gain a Heroic difficulty (retuned level-22 mobs) dropping Heroic Marks — spend them at the new Heroic Quartermaster in Highwatch, the game\'s only source of neck and ring jewelry.', '#/dungeons', 'Dungeon guides'],
    ['🔨', 'Professions, completed', 'The professions endgame lands: your active archetype gates crafting power, with specialization perks, combo recipes, signed materials, town focus allocation, and a level-20 crafting hub at Highwatch.', '#/patches', 'Full patch notes'],
    ['🏦', 'The Gilded Strongbox', 'A personal bank vault at the bursar in every hub town — 24 slots to start, expandable to 96 (112 with bonuses), with an audit ledger. Somewhere, at last, to stash your loot.', '#/patches', 'Patch notes'],
    ['🐱', 'Protect Yumi', 'A new 3v3/5v5 objective PvP mode: each team guards a 5,000-HP cat familiar inside a braided maze, with simultaneous cat teleports and a sudden-death finish.', '#/doc/' + encodeURIComponent('reference/pvp.md'), 'PvP guide'],
    ['💎', 'Itemization wave', 'New Crit Rating and Haste Rating gear stats, signature procs on both legendary weapons, weapon-scaled Hunter Auto Shot, and a 4-piece proc bonus on every epic set. Our combat tools are recomputed to match.', '#/gear', 'Browse gear'],
    ['📱', 'A real mobile HUD', 'First-class touch controls — a proper mobile HUD, plus display-side movement prediction that makes online play feel as smooth as offline.', '#/patches', 'Technical changelog'],
  ];

  const GUIDE = [
    ['🧮', 'Real combat model', 'Our DPS is now each class\'s actual rotation — built from real abilities, cast times, crit and a resource-limited duel sim (energy/rage/mana), split into physical vs magic. It powers the tier list, solo and PvP tools, so casters are finally rated fairly.', '#/tiers'],
    ['🥇', 'Ultimate Solo Class', "Every class simulated soloing the whole mob population, levels 1–20, with and without BiS and pets — ranked by kill speed, survivability and elite-soloing. Who's the best soloer?", '#/soloclass'],
    ['⚔️', 'Ultimate PvP Class', 'Every class dueled 1v1 vs every other class — real combat math plus crowd control, self-heals, kiting, pets and a player-skill dial that flips the winner. A win-rate ranking and full matchup matrix.', '#/pvpclass'],
    ['🔔', 'Rite Trainer', "Practice the Drowned Litany's Simon-says shrine finale — the real sequence, replays, difficulty and loot ceiling — free, before you run the delve.", '#/rite'],
    ['🌐', 'Multilingual names', 'Item, mob, boss and NPC names now translate across 13 languages in the bestiary, gear, quests and search. Pick a language from the 🌐 menu.', '#/bestiary'],
    ['🏅', 'Class Tier Lists', 'S/A/B/C rankings computed from the game\'s real combat math — DPS, tank and healer lenses.', '#/tiers'],
  ];

  const gCard = (r) => `<a class="news-card" data-go="${esc(r[3])}"><span class="news-ico">${r[0]}</span><div><h3>${esc(r[1])}</h3><p class="meta">${r[2]}</p><span class="news-link">${esc(r[4])} →</span></div></a>`;
  const uCard = (r) => `<a class="news-card" data-go="${esc(r[3])}"><span class="news-ico">${r[0]}</span><div><h3>${esc(r[1])}</h3><p class="meta">${esc(r[2])}</p><span class="news-link">Open →</span></div></a>`;

  function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">What's new</span>
      <h1 class="reveal">What's New 🆕</h1>
      <p class="sub reveal">The latest from World of Claudecraft, and everything new in this guide.</p>

      <h2 class="news-h reveal">🎮 Game — v0.23.0 <span class="news-tag">the biggest content release yet · 680 commits</span></h2>
      <p class="meta reveal">Two new game modes (the Vale Cup and Protect Yumi), Heroic dungeons with fresh jewelry, the professions endgame, a personal bank, an itemization wave, and a real mobile HUD. Here's what made it into the guide:</p>
      <div class="news-grid">${GAME.map(gCard).join('')}</div>

      <h2 class="news-h reveal">📚 The guide — new tools</h2>
      <p class="meta reveal">Beyond the reference, the guide now has new tools built on the real game data:</p>
      <div class="news-grid">${GUIDE.map(uCard).join('')}</div>

      <p class="meta" style="margin-top:2rem">Catching up? The <b>v0.22</b> terrain overhaul, the <b>v0.21</b> gathering &amp; professions pass, and the <b>v0.20</b> Drowned Litany delve, first world boss and haste are all in the <a data-go="#/patches">patch notes</a>.</p>
    </div></section>`));
  }
  registerView('news', view);
})();
