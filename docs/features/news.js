'use strict';
// What's New — #/news. A curated changelog: the guide-relevant highlights of the
// latest World of Claudecraft game release, plus the new tools & games added to the
// guide itself. Editorial (hand-curated) with deep links into the relevant pages.
(function () {
  const { el, esc, registerView, app } = window.WOC;

  const GAME = [
    ['🏔️', 'Terrain & water overhaul', 'The world got a facelift: mountains are more jagged and terraced, and water now follows the terrain and features instead of sitting on one flat plane — with shore tint, foliage, grass, fog, fish and lakes all made terrain-aware. See it in the 3D maps.', '#/zone3d', 'Explore the 3D world'],
    ['🎁', 'Daily delve rewards', 'Delves now grant daily reward points — a fresh reason to run the Collapsed Reliquary and Drowned Litany each day.', '#/delves', 'Delve guides'],
    ['🔌', 'Reconnect grace', "Drop connection and your character now lingers in-world for five minutes (\"linkdead grace\"), with a cleaner reconnect overlay and liveness checks — so a blip no longer means a death.", '#/patches', 'Patch notes'],
    ['💻', 'macOS desktop launcher', 'The desktop launcher download now points at the v0.22.0 build for macOS (Linux is briefly held back while its AppImage bakes).', '#/patches', 'Full patch notes'],
    ['⚙️', 'Server re-architecture', 'Mostly under the hood: the whole server API was rebuilt on a shared route registry with structured logging, request IDs, stable localized error codes, security headers and metrics. You should notice fewer hiccups and cleaner error messages.', '#/patches', 'Technical changelog'],
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

      <h2 class="news-h reveal">🎮 Game — v0.22.0 <span class="news-tag">platform &amp; polish · 526 commits</span></h2>
      <p class="meta reveal">A big infrastructure release — most of it is a server rebuild under the hood — but the world also got a terrain/water glow-up, delves gained daily rewards, and reconnecting got a lot friendlier. Here's what's relevant to players:</p>
      <div class="news-grid">${GAME.map(gCard).join('')}</div>

      <h2 class="news-h reveal">📚 The guide — new tools</h2>
      <p class="meta reveal">Beyond the reference, the guide now has new tools built on the real game data:</p>
      <div class="news-grid">${GUIDE.map(uCard).join('')}</div>

      <p class="meta" style="margin-top:2rem">Catching up? The <b>v0.21</b> gathering &amp; professions pass and the <b>v0.20</b> Drowned Litany delve, first world boss, haste and bags are all in the <a data-go="#/patches">patch notes</a>.</p>
    </div></section>`));
  }
  registerView('news', view);
})();
