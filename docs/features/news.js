'use strict';
// What's New — #/news. A curated changelog: the guide-relevant highlights of the
// latest World of Claudecraft game release, plus the new tools & games added to the
// guide itself. Editorial (hand-curated) with deep links into the relevant pages.
(function () {
  const { el, esc, registerView, app } = window.WOC;

  const GAME = [
    ['📖', 'The Book of Deeds', '192 achievements worth 2,365 Renown across levelling, dungeons, delves, PvP, collecting, exploring and story Chronicles. Rewards are cosmetic — 19 titles, three nameplate badge borders, and public Renown standings.', '#/doc/' + encodeURIComponent('reference/book-of-deeds.md'), 'How it works'],
    ['⚔️', 'Heroic Nythraxis', 'The 10-player raid gains a Heroic tier: the summoned Deathless Court, a raid-heal channel you must crowd-control (Malric\'s Mending), raid-tier heroic gear, and three heroic-only weapons.', '#/doc/' + encodeURIComponent('reference/heroic-nythraxis.md'), 'Raid guide'],
    ['🎯', 'Talents 2.0 — specializations', 'Picking any of the 27 specs now grants a real signature ability and a level-scaled identity mastery — before you spend a single point. 24 brand-new abilities ship with it.', '#/doc/' + encodeURIComponent('reference/specializations.md'), 'Spec guide'],
    ['🏆', 'Honor & Warfare PvP', 'A PvP gear track: earn Honor from ranked arena and the Fiesta, spend it with the Honor Quartermaster on Warfare gear — four armor sets, necks, rings and weapons carrying a PvP-only offense/defense rating.', '#/doc/' + encodeURIComponent('reference/warfare.md'), 'How to play'],
    ['💄', 'Claudium & Season 1 Armory', 'A cosmetics storefront and the first seasonal armory — character skins, weapon skins and identity tools. Presentation-only: richer world models and bag art land alongside.', '#/patches', 'Technical changelog'],
    ['🎮', 'A rebuilt /play', 'The online entry point is rebuilt as online-only, with player mute and identity controls, a production sound workflow, and a broad reliability and operations pass.', '#/patches', 'Technical changelog'],
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

      <h2 class="news-h reveal">🎮 Game — v0.25.0 <span class="news-tag">progression · endgame · PvP · 350 commits</span></h2>
      <p class="meta reveal">The Book of Deeds achievement system, a Heroic tier for the Nythraxis raid, Talents 2.0 signature abilities and identity masteries for all 27 specs, Honor &amp; Warfare PvP progression, and the Claudium cosmetics store. Here's what made it into the guide:</p>
      <div class="news-grid">${GAME.map(gCard).join('')}</div>

      <h2 class="news-h reveal">📚 The guide — new tools</h2>
      <p class="meta reveal">Beyond the reference, the guide now has new tools built on the real game data:</p>
      <div class="news-grid">${GUIDE.map(uCard).join('')}</div>

      <p class="meta" style="margin-top:2rem">Catching up? <b>v0.24</b> was a polish &amp; infrastructure release (heroic-loot reliability, ready checks, sign-in), and <b>v0.23</b> brought the <a data-go="#/doc/reference%2Fvale-cup.md">Vale Cup</a>, <a data-go="#/doc/reference%2Fprotect-yumi.md">Protect Yumi</a>, <a data-go="#/doc/reference%2Fheroic-dungeons.md">Heroic dungeons</a>, <a data-go="#/doc/reference%2Fprofessions.md">professions</a> and the <a data-go="#/doc/reference%2Fbank.md">bank</a>. Full history in the <a data-go="#/patches">patch notes</a>.</p>
    </div></section>`));
  }
  registerView('news', view);
})();
