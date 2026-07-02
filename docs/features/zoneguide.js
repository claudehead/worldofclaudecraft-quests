'use strict';
// Zone Guides — #/zone  (index)  ·  #/zone/<slug>  (one zone)
// Everything for a zone in one place: level range, hub, all quests by level,
// the bestiary, and the zone map — pulled straight from the game data.
(function () {
  const { el, esc, registerView, loadJSON, raw, app } = window.WOC;
  const slugOf = (z) => z.dir.replace(/^\d+-/, '');

  function zoneCard(z) {
    return `<a class="zone-card" data-go="#/zone/${slugOf(z)}">
      <b>${esc(z.title)}</b>
      <span class="meta">Lv ${z.levelRange ? z.levelRange.join('–') : '?'}${z.hub ? ' · ' + esc(z.hub) : ''}</span>
      <span class="meta">${(z.quests || []).length} quests${z.biome ? ' · ' + esc(z.biome) : ''}</span>
    </a>`;
  }

  function renderIndex(M) {
    const zones = (M.zones || []).slice().sort((a, b) => (a.levelRange ? a.levelRange[0] : 0) - (b.levelRange ? b.levelRange[0] : 0));
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">The world, zone by zone</span>
      <h1 class="reveal">Zone Guides</h1>
      <p class="sub reveal">Each zone in World of Claudecraft — level range, hub town, every quest by level, the bestiary and the map.</p>
      <div class="zone-grid">${zones.map(zoneCard).join('')}</div>
    </div></section>`));
  }

  function renderZone(M, z) {
    const zones = (M.zones || []).slice().sort((a, b) => (a.levelRange ? a.levelRange[0] : 0) - (b.levelRange ? b.levelRange[0] : 0));
    const idx = zones.indexOf(z), prev = zones[idx - 1], next = zones[idx + 1];
    const quests = (z.quests || []).slice().sort((a, b) => a.level - b.level);
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <p class="meta"><a data-go="#/zone">Zone guides</a> › ${esc(z.title)}</p>
      <h1 class="reveal">${esc(z.title)}</h1>
      <p class="sub reveal">Level ${z.levelRange ? z.levelRange.join('–') : '?'}${z.hub ? ' · Hub: ' + esc(z.hub) : ''}${z.biome ? ' · ' + esc(z.biome) : ''} · ${quests.length} quests</p>
      ${z.map ? `<img class="zone-map" loading="lazy" alt="${esc(z.title)} map" src="${raw(z.map)}">` : ''}
      <h2>Quests by level</h2>
      <ul class="zone-quests">${quests.map(q => `<li><span class="trk-lv">Lv ${q.level}</span> <a data-go="#/doc/${encodeURIComponent(q.file)}">${esc(q.name)}</a>${q.chain ? ' <span class="pill tiny">chain</span>' : ''}${q.group ? ' <span class="pill tiny">group</span>' : ''}</li>`).join('')}</ul>
      <p>${z.bestiary ? `<a class="btn ghost" data-go="#/doc/${encodeURIComponent(z.bestiary)}">🐺 ${esc(z.title)} bestiary</a> ` : ''}<a class="btn ghost" data-go="#/tracker">✅ Track these quests</a></p>
      <p class="zone-nav">${prev ? `<a data-go="#/zone/${slugOf(prev)}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a data-go="#/zone/${slugOf(next)}">${esc(next.title)} →</a>` : ''}</p>
    </div></section>`));
  }

  function zoneView(parts) {
    app.innerHTML = '<div class="spinner"></div>';
    loadJSON('manifest.json').then(M => {
      const slug = parts && parts[0];
      if (!slug) return renderIndex(M);
      const z = (M.zones || []).find(z => slugOf(z) === slug);
      z ? renderZone(M, z) : renderIndex(M);
    }).catch(() => { app.innerHTML = '<section class="block"><div class="wrap"><p class="meta">Could not load zone data.</p></div></section>'; });
  }
  registerView('zone', zoneView);
})();
