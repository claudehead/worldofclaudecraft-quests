'use strict';
// What's New — #/news. A curated changelog: the guide-relevant highlights of the
// latest World of Claudecraft game release, plus the new tools & games added to the
// guide itself. Editorial (hand-curated) with deep links into the relevant pages.
(function () {
  const { el, esc, registerView, app } = window.WOC;

  const GAME = [
    ['🌊', 'The Drowned Litany', 'A second delve (levels 12–14) beneath the Mirefen marsh — seven flooded modules, a bell-rite puzzle, the Sinkhole Baptistry, and boss Sister Nhalia, with Edda Reedhand as the healer companion.', '#/doc/' + encodeURIComponent('delves/drowned_litany.md'), 'Read the delve guide'],
    ['⛰️', 'Thunzharr — the first world boss', 'A daily personal-loot epic encounter atop Thornpeak Heights, dropping Tier-2 set gloves and belts. We wrote a full strategy guide — mechanics, adds, enrage and loot.', '#/doc/' + encodeURIComponent('reference/world-bosses.md'), 'World boss guide'],
    ['⚡', 'Haste is a real stat', 'Melee, ranged and spell haste. Every Tier-2 3-piece now grants 15% haste. The DPS calculator + Build Compendium model it, and our new cheat sheet shows what a point is worth per class.', '#/haste', 'Haste stat weights'],
    ['🎒', 'Bags', 'Equippable bags expand your inventory — from the 6-slot Linen Pouch to the 14-slot Fogbinder\'s Duffel. Plan your loadout with the new bag planner.', '#/bags', 'Bag planner'],
    ['💀', 'Ghost mode & graveyards', 'Dying leaves a corpse and a ghost — run your spirit back, or take the Spirit Healer\'s res with Resurrection Sickness. Graveyards now dot the map (2D and 3D). Full death guide below.', '#/doc/' + encodeURIComponent('reference/death-and-graveyards.md'), 'Death & graveyards guide'],
    ['🌿', 'Talents 2.0', 'A casting overhaul and the choice-row talent redesign. The talent trees are regenerated to match.', '#/talents', 'Talent calculator'],
    ['😈', 'Warlock demons renamed', 'Emberkin, Gloomshade, Duskborn, Spellhound, Warfiend, Pyre Colossus and Wraithborn — new names and fresh 3D renders.', '#/doc/' + encodeURIComponent('reference/warlock-demons.md'), 'Warlock demons'],
    ['🏷️', 'The IP rename sweep', 'Every remaining legacy name moved to original IP across abilities, talents, items and mobs — display-only, so saves and builds are untouched.', '#/patches', 'Full patch notes'],
  ];

  const GUIDE = [
    ['🔔', 'Rite Trainer — new practice game', "The Drowned Litany's finale is a Simon-says shrine rite, not a lockpick. Practice the real thing — sequence, replays, difficulty and loot ceiling — free, before you run the delve.", '#/rite'],
    ['📖', 'Build Compendium — haste-updated', 'Top builds for every class with rotations and theoretical DPS/HPS — now recomputed to include the v0.20 15% haste from Tier-2 sets at BiS. The DPS calculator models haste too.', '#/builds'],
    ['🏅', 'Class Tier Lists', 'S/A/B/C rankings computed from the game\'s real combat math — DPS, tank and healer lenses.', '#/tiers'],
    ['📊', 'Stats Dashboard', 'The whole world charted — zone levels, quest XP, mob threat and class stats.', '#/stats'],
    ['🪙', '$WOC & Supporters', 'Live $WOC price + chart, an on-chain supporters wall, and the play-and-earn guide.', '#/woc'],
  ];

  const gCard = (r) => `<a class="news-card" data-go="${esc(r[3])}"><span class="news-ico">${r[0]}</span><div><h3>${esc(r[1])}</h3><p class="meta">${r[2]}</p><span class="news-link">${esc(r[4])} →</span></div></a>`;
  const uCard = (r) => `<a class="news-card" data-go="${esc(r[3])}"><span class="news-ico">${r[0]}</span><div><h3>${esc(r[1])}</h3><p class="meta">${esc(r[2])}</p><span class="news-link">Open →</span></div></a>`;

  function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">What's new</span>
      <h1 class="reveal">What's New 🆕</h1>
      <p class="sub reveal">The latest from World of Claudecraft, and everything new in this guide.</p>

      <h2 class="news-h reveal">🎮 Game — v0.20.0 <span class="news-tag">the biggest release yet · 379 commits</span></h2>
      <p class="meta reveal">Headlined by the Drowned Litany delve, the first world boss, haste, bags, ghost mode and Talents 2.0. Here's what made it into the guide:</p>
      <div class="news-grid">${GAME.map(gCard).join('')}</div>

      <h2 class="news-h reveal">📚 The guide — new tools</h2>
      <p class="meta reveal">Beyond the reference, the guide now has new tools built on the real game data:</p>
      <div class="news-grid">${GUIDE.map(uCard).join('')}</div>

      <p class="meta" style="margin-top:2rem">Want the full technical changelog? See the <a data-go="#/patches">patch notes</a>.</p>
    </div></section>`));
  }
  registerView('news', view);
})();
