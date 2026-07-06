'use strict';
// What's New — #/news. A curated changelog: the guide-relevant highlights of the
// latest World of Claudecraft game release, plus the new tools & games added to the
// guide itself. Editorial (hand-curated) with deep links into the relevant pages.
(function () {
  const { el, esc, registerView, app } = window.WOC;

  const GAME = [
    ['🌿', 'Gathering & Professions', 'The first professions pass — herb, ore and logging nodes now dot the world with per-player respawns, gathering proficiency that scales material rarity, monster-corpse harvesting, and crafted tool tiers.', '#/patches', 'See the patch notes'],
    ['⛰️', 'Thunzharr, tightened up', 'The world boss now rises at server start and respawns on a fast cadence (about hourly, down from every 3 hours). A new Howling Gale snare pins you at 70% speed even while it chases — so hunters can no longer kite it forever — plus a telegraphed Stormcall nova. Our guide is updated.', '#/doc/' + encodeURIComponent('reference/world-bosses.md'), 'World boss guide'],
    ['🎨', 'Painted equipment icons', 'Armor and equipment now join consumables and resources with hand-painted item art across the catalog.', '#/gear', 'Browse gear'],
    ['⚡', 'Lightning Bolt & render polish', 'Lightning Bolt gets a real bolt-shaped electric projectile and cast loop, nameplates declutter instead of overlapping, stacked corpses disambiguate, and priest/mage silhouettes read clearer.', '#/patches', 'Full patch notes'],
    ['🌍', 'Localization at zero pending', 'The full release localization gate is green again — all 21 locales filled. The guide now shows in-game names in 13 languages too (use the 🌐 picker).', '#/patches', 'Patch notes'],
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

      <h2 class="news-h reveal">🎮 Game — v0.21.0 <span class="news-tag">gathering &amp; professions · 72 commits</span></h2>
      <p class="meta reveal">A systems-and-polish release headlined by the first gathering/professions pass, a much harder-to-kite Thunzharr, and painted equipment art. Here's what's relevant to the guide:</p>
      <div class="news-grid">${GAME.map(gCard).join('')}</div>

      <h2 class="news-h reveal">📚 The guide — new tools</h2>
      <p class="meta reveal">Beyond the reference, the guide now has new tools built on the real game data:</p>
      <div class="news-grid">${GUIDE.map(uCard).join('')}</div>

      <p class="meta" style="margin-top:2rem">Missed the last big one? The <b>v0.20</b> Drowned Litany delve, first world boss, haste, bags and ghost mode are all in the <a data-go="#/patches">patch notes</a> — along with the full v0.21 changelog.</p>
    </div></section>`));
  }
  registerView('news', view);
})();
