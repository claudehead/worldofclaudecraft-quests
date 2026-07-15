'use strict';
// What's New — #/news. A curated changelog: the guide-relevant highlights of the
// latest World of Claudecraft game release, plus the new tools & games added to the
// guide itself. Editorial (hand-curated) with deep links into the relevant pages.
(function () {
  const { el, esc, registerView, app } = window.WOC;

  const GAME = [
    ['🔎', 'The Dungeon Finder', 'Automatic role-based matchmaking plus a premade listing board. Queue as tank / healer / DPS for any dungeon, heroic, the solo scenario or the 10-man raid; a full group fires a 30-second proposal (decline and you sit a 60-second lockout). Post or browse premade groups with structured tags.', '#/doc/' + encodeURIComponent('reference/dungeon-finder.md'), 'How it works'],
    ['🛡️', 'Tank defensive cooldowns', 'Each tank class gains a distinct level-20 emergency button: Warrior Ironhold (−40% damage for 8s), Paladin Sacred Bulwark (denies the next lethal hit, heal to 35%), Druid Primal Reflexes (+50% dodge for 6s). Dire Bruin bear form also gets +20% threat / +15% armor to close the tank-parity gap.', '#/doc/' + encodeURIComponent('reference/specializations.md'), 'Spec guide'],
    ['🎯', 'Hit rating & itemization', 'A new Hit combat-rating joins crit and haste (10 rating = +1% hit, cutting both physical miss and spell resist, down to a 0% floor). Gear is re-itemized around it, and the PvP gear track is rebalanced onto the Warfare offense/defense ratings.', '#/doc/' + encodeURIComponent('reference/warfare.md'), 'Warfare guide'],
    ['⛏️', 'Gather-node harvesting', 'Harvesting ore, herb and other gather nodes is now wired into the normal play controls — walk up and gather, no separate mode. Feeds straight into professions & crafting.', '#/doc/' + encodeURIComponent('reference/professions.md'), 'Professions'],
    ['🗡️', 'Weapon sheathing & QoL', 'Z-key sheathe/unsheathe with weapons worn on your back, an arm gesture and SFX. Plus: your own nameplate shows by default, the Attack action-bar button is removable, drag bag items straight onto the paperdoll, and a punchier on-kill XP floater.', '#/patches', 'Technical changelog'],
    ['🖥️', 'Windows client & Armory', 'The desktop client download is enabled for Windows, with a Store Armory promo card. Under the hood: safe player analytics, automated & moderated daily payouts, new mob voice families, and 11 procedural props replaced with real Tripo-generated models.', '#/patches', 'Technical changelog'],
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

      <h2 class="news-h reveal">🎮 Game — v0.26.0 <span class="news-tag">dungeon finder · tanks · itemization · 131 commits</span></h2>
      <p class="meta reveal">The Dungeon Finder role queue and premade board, a level-20 defensive cooldown for every tank class, a new Hit combat-rating with re-itemized gear, gather-node harvesting in normal play, Z-key weapon sheathing, and the Windows desktop client. Here's what made it into the guide:</p>
      <div class="news-grid">${GAME.map(gCard).join('')}</div>

      <h2 class="news-h reveal">📚 The guide — new tools</h2>
      <p class="meta reveal">Beyond the reference, the guide now has new tools built on the real game data:</p>
      <div class="news-grid">${GUIDE.map(uCard).join('')}</div>

      <p class="meta" style="margin-top:2rem">Catching up? <b>v0.25</b> brought the <a data-go="#/doc/reference%2Fbook-of-deeds.md">Book of Deeds</a> achievement system, a Heroic tier for <a data-go="#/doc/reference%2Fheroic-nythraxis.md">Nythraxis</a>, <a data-go="#/doc/reference%2Fspecializations.md">Talents 2.0 specializations</a> and the <a data-go="#/doc/reference%2Fwarfare.md">Honor &amp; Warfare</a> PvP track; <b>v0.23</b> added the <a data-go="#/doc/reference%2Fvale-cup.md">Vale Cup</a>, <a data-go="#/doc/reference%2Fprotect-yumi.md">Protect Yumi</a>, <a data-go="#/doc/reference%2Fheroic-dungeons.md">Heroic dungeons</a>, <a data-go="#/doc/reference%2Fprofessions.md">professions</a> and the <a data-go="#/doc/reference%2Fbank.md">bank</a>. Full history in the <a data-go="#/patches">patch notes</a>.</p>
    </div></section>`));
  }
  registerView('news', view);
})();
