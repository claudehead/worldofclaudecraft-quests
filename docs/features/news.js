'use strict';
// What's New — #/news. A curated changelog: the guide-relevant highlights of the
// latest World of Claudecraft game release, plus the new tools & games added to the
// guide itself. Editorial (hand-curated) with deep links into the relevant pages.
(function () {
  const { el, esc, registerView, app } = window.WOC;

  const GAME = [
    ['🔨', 'The crafting overhaul', 'Professions get rebuilt: six crafts (weapon- and armorcrafting, tailoring, leatherworking, alchemy, cooking) each climb a skill-tier ladder that gates which recipes you can train. Craft outputs are deterministic, plus one masterwork proc per craft that bumps quality and adds bonus stats — swayed by trending reagent pairs.', '#/doc/' + encodeURIComponent('reference/professions.md'), 'Professions guide'],
    ['⚒️', 'Crafting masters & Artisan Row', 'Six crafting masters set up on Artisan Row, each with a typed crafting station. The single level-20 Highwatch hub is retired: you now craft at the station for your discipline, with a field station for crafting on the move.', '#/doc/' + encodeURIComponent('reference/professions.md'), 'Where to craft'],
    ['🌾', 'Real gather nodes & rare finds', 'Gather nodes now carry real material tables with a rarity ladder and rare gather events, and respawn per-viewer (two players can see the same node differently). Harvesting is wired into normal play — walk up and gather.', '#/doc/' + encodeURIComponent('reference/professions.md'), 'Gathering'],
    ['🃏', 'The Card Duel minigame', 'A new card-duel minigame lands with its own first set of sound effects — a side game to play between adventures.', '#/patches', 'Technical changelog'],
    ['🎯', 'Talents: the choice-row rework', 'The point-buy talent grid is gone. You now pick 1 of 3 specializations at level 5, then choose 1 of 3 options at each of six rows (levels 5/8/11/14/17/20). The guide\'s talent calculator and build planner are rebuilt to match.', '#/talents', 'Talent calculator'],
    ['💬', 'HUD & social QoL', 'The third action bar returns; the spellbook is a landscape tile grid and the Social window a wide layout. Chat gets class-colored names and a verified-streamer badge, plus clearer nameplates, player hover tooltips, a reconnect countdown, and confirm dialogs for revives and mark purchases.', '#/patches', 'Technical changelog'],
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

      <h2 class="news-h reveal">🎮 Game — v0.28.0 <span class="news-tag">crafting · talents · card duel · 620 commits</span></h2>
      <p class="meta reveal">A ground-up professions and crafting overhaul (skill-tier ladders, masterwork procs, crafting masters on Artisan Row, real gather nodes), the choice-row talent rework, a new Card Duel minigame, and a wave of HUD and social quality-of-life. Here's what made it into the guide:</p>
      <div class="news-grid">${GAME.map(gCard).join('')}</div>

      <h2 class="news-h reveal">📚 The guide — new tools</h2>
      <p class="meta reveal">Beyond the reference, the guide now has new tools built on the real game data:</p>
      <div class="news-grid">${GUIDE.map(uCard).join('')}</div>

      <p class="meta" style="margin-top:2rem">Catching up? <b>v0.26</b> added the <a data-go="#/doc/reference%2Fdungeon-finder.md">Dungeon Finder</a>, per-class tank defensive cooldowns and the new Hit combat-rating; <b>v0.25</b> brought the <a data-go="#/doc/reference%2Fbook-of-deeds.md">Book of Deeds</a>, a Heroic tier for <a data-go="#/doc/reference%2Fheroic-nythraxis.md">Nythraxis</a>, <a data-go="#/doc/reference%2Fspecializations.md">specializations</a> and the <a data-go="#/doc/reference%2Fwarfare.md">Honor &amp; Warfare</a> track. Full history in the <a data-go="#/patches">patch notes</a>.</p>
    </div></section>`));
  }
  registerView('news', view);
})();
