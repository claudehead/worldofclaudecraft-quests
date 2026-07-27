'use strict';
// What's New — #/news. A curated changelog: the guide-relevant highlights of the
// latest World of Claudecraft game release, plus the new tools & games added to the
// guide itself. Editorial (hand-curated) with deep links into the relevant pages.
(function () {
  const { el, esc, registerView, app } = window.WOC;

  const GAME = [
    ['🧗', 'The parkour physics engine', 'One deterministic character-physics engine — continuous swept collision, multi-pass sliding, depenetration and step-up — now runs in the offline sim, the server and the client alike, and the world is made physically honest so every drawn model collides exactly as drawn. A traversal ladder by obstacle height: stride, silent vault, a real ledge-climb pull-up for lips above your head, then wall.', '#/patches', 'Technical changelog'],
    ['🖼️', 'Painted item art', 'The legacy procedural item icons are replaced with hand-painted art across the whole catalog — hundreds of weapons, armor pieces and consumables get real illustrations, visible everywhere gear shows in the guide.', '#/gear', 'Browse gear'],
    ['🔍', 'Auction House filters & Bags', 'The World Market\'s Auction House gains advanced gear filters — armor type (Cloth / Leather / Mail) and dominant primary stat (Str / Agi / Int, ties included) — plus a new Bags browse category sized from the catalog, so you can find exactly the piece you want.', '#/doc/' + encodeURIComponent('reference/world-market.md'), 'World Market'],
    ['✨', 'Replace an enchant', 'You can now overwrite an enchant on a piece you already enchanted — behind an explicit confirmation that spells out what it keeps and flags the row that gets destroyed (the old enchant is consumed, no refund). Masterwork gear stays fully enchantable on top of its maker bonus.', '#/doc/' + encodeURIComponent('reference/professions.md'), 'Professions guide'],
    ['🎯', 'Talents: the choice-row rework', 'The point-buy talent grid is gone. You now pick 1 of 3 specializations at level 5, then choose 1 of 3 options at each of six rows (levels 5/8/11/14/17/20). The guide\'s talent calculator and build planner are rebuilt to match.', '#/talents', 'Talent calculator'],
    ['🔊', 'Real sound & stacked nameplates', 'Real recordings land across gathering, crafting and enchanting, and for eating, drinking and quaffing potions. Overlapping nameplates now stack into a tidy vertical column instead of overprinting.', '#/patches', 'Technical changelog'],
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

      <h2 class="news-h reveal">🎮 Game — v0.31.0 <span class="news-tag">parkour · painted art · market · 833 commits</span></h2>
      <p class="meta reveal">A deterministic parkour physics engine (swept collision, a standable world, ledge climb), hand-painted item art replacing the legacy icons, Auction House filters and a Bags market category, enchant replacement, and real recorded sound across the professions. Here's what made it into the guide:</p>
      <div class="news-grid">${GAME.map(gCard).join('')}</div>

      <h2 class="news-h reveal">📚 The guide — new tools</h2>
      <p class="meta reveal">Beyond the reference, the guide now has new tools built on the real game data:</p>
      <div class="news-grid">${GUIDE.map(uCard).join('')}</div>

      <p class="meta" style="margin-top:2rem">Catching up? <b>v0.28</b> rebuilt <a data-go="#/doc/reference%2Fprofessions.md">professions</a> (tier ladders, masterwork procs, Artisan Row) and reworked <a data-go="#/talents">talents</a> into choice rows; <b>v0.26</b> added the <a data-go="#/doc/reference%2Fdungeon-finder.md">Dungeon Finder</a>, tank defensive cooldowns and the Hit combat-rating; <b>v0.25</b> brought the <a data-go="#/doc/reference%2Fbook-of-deeds.md">Book of Deeds</a> and <a data-go="#/doc/reference%2Fheroic-nythraxis.md">Heroic Nythraxis</a>. Full history in the <a data-go="#/patches">patch notes</a>.</p>
    </div></section>`));
  }
  registerView('news', view);
})();
