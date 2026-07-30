'use strict';
// What's New — #/news. A curated changelog: the guide-relevant highlights of the
// latest World of Claudecraft game release, plus the new tools & games added to the
// guide itself. Editorial (hand-curated) with deep links into the relevant pages.
(function () {
  const { el, esc, registerView, app } = window.WOC;

  const GAME = [
    ['🌀', 'Rifts — the endgame race', 'Procedural dungeons behind natural portals that open across the new zones — one per zone, cycling hourly. Every portal is a shared race: many groups run their own instance of the same dungeon, but only the first to clear takes the full loot. Four ranks (C/B/A/S) climb from normal-dungeon rares to heroic epics, with S-rank carrying the two legendary chase rolls.', '#/doc/' + encodeURIComponent('reference/rifts.md'), 'Rifts guide'],
    ['🗺️', 'A world that got much bigger', 'The map expands well beyond the original three zones — a wave of new level-15-to-20 regions (the Drakelands, Frostveil Reach, Amberfall, Nightbloom, Wraithwood, Palmreach, Evergarden, Galecrest, Farshore and more), every previously-unvoiced NPC across them now voiced, and a remastered new-zone soundtrack.', '#/map', 'Explore the map'],
    ['🐎', 'Rideable mounts', 'Seven ground mounts, from the vendor-bought Valorsteed (+60% speed) up to two rift-only epics (+80%). Mounts are now usable reins items — hold the reins to own the mount; the old mount picker is retired. Uncommon mounts drop from heroic dungeons, rares from the raid, epics only from rifts.', '#/doc/' + encodeURIComponent('reference/mounts.md'), 'Mounts guide'],
    ['🧗', 'The parkour physics engine', 'One deterministic character-physics engine — continuous swept collision, multi-pass sliding, depenetration and step-up — now runs in the offline sim, the server and the client alike, and the world is made physically honest so every drawn model collides exactly as drawn. A traversal ladder by obstacle height: stride, silent vault, a real ledge-climb pull-up, then wall.', '#/patches', 'Technical changelog'],
    ['🖼️', 'Painted item art', 'The legacy procedural item icons are replaced with hand-painted art across the whole catalog — hundreds of weapons, armor pieces and consumables get real illustrations, visible everywhere gear shows in the guide.', '#/gear', 'Browse gear'],
    ['🗂️', 'Map, market & meters', 'An interactive continent overview for the world map, the Auction House gains armor-type and primary-stat gear filters plus a Bags category, and the combat-meter panels become movable, resizable and separable.', '#/map', 'World map'],
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

      <h2 class="news-h reveal">🎮 Game — v0.32.1 <span class="news-tag">rifts · expansion zones · mounts · 868 commits</span></h2>
      <p class="meta reveal">The big one: Rifts, a procedural endgame race for gear, mounts and legendaries; a wave of new expansion zones roughly doubling the world; rideable mounts; and, carried over from v0.31, the parkour physics engine and hand-painted item art. Here's what made it into the guide:</p>
      <div class="news-grid">${GAME.map(gCard).join('')}</div>

      <h2 class="news-h reveal">📚 The guide — new tools</h2>
      <p class="meta reveal">Beyond the reference, the guide now has new tools built on the real game data:</p>
      <div class="news-grid">${GUIDE.map(uCard).join('')}</div>

      <p class="meta" style="margin-top:2rem">Catching up? <b>v0.31</b> shipped the parkour physics engine and hand-painted item art; <b>v0.28</b> rebuilt <a data-go="#/doc/reference%2Fprofessions.md">professions</a> (tier ladders, masterwork procs, Artisan Row) and reworked <a data-go="#/talents">talents</a> into choice rows; <b>v0.26</b> added the <a data-go="#/doc/reference%2Fdungeon-finder.md">Dungeon Finder</a>. Full history in the <a data-go="#/patches">patch notes</a>.</p>
    </div></section>`));
  }
  registerView('news', view);
})();
