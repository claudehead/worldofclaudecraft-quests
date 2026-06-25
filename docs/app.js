'use strict';
const app = document.getElementById('app');
let M = null;            // manifest
let RAW = '';            // raw.githubusercontent base
const mdCache = new Map();

// ---------- helpers ----------
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dirOf = (p) => p.replace(/[^/]*$/, '');
function resolvePath(base, rel) {
  if (/^https?:/.test(rel) || rel.startsWith('#')) return rel;
  const out = [];
  for (const seg of (base + rel).split('/')) {
    if (seg === '..') out.pop();
    else if (seg !== '.' && seg !== '') out.push(seg);
  }
  return out.join('/');
}
const raw = (path) => RAW + path;

async function getMd(path) {
  if (mdCache.has(path)) return mdCache.get(path);
  const res = await fetch(raw(path));
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  const text = await res.text();
  mdCache.set(path, text);
  return text;
}

function reveal(scope) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.08 });
  (scope || document).querySelectorAll('.reveal').forEach(n => io.observe(n));
}

// ---------- markdown rendering ----------
function renderMarkdown(container, md, docPath) {
  const base = dirOf(docPath);
  container.innerHTML = marked.parse(md, { mangle: false, headerIds: false });
  // rewrite images to raw URLs
  container.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || '';
    if (src && !/^https?:/.test(src)) img.src = raw(resolvePath(base, src));
    img.loading = 'lazy';
  });
  // rewrite links: .md -> in-app route, assets -> raw, external -> new tab
  container.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#/')) return;
    if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; return; }
    if (href.startsWith('#')) return; // same-doc anchor (handled by ids)
    const [pathPart, anchor] = href.split('#');
    if (/\.md$/.test(pathPart)) {
      const tgt = resolvePath(base, pathPart);
      a.setAttribute('href', `#/doc/${encodeURIComponent(tgt)}${anchor ? '/' + encodeURIComponent(anchor) : ''}`);
    } else if (/\.(svg|png|jpg|jpeg)$/.test(pathPart)) {
      a.href = raw(resolvePath(base, pathPart)); a.target = '_blank'; a.rel = 'noopener';
    }
  });
}

// ---------- views ----------
function home() {
  const c = M.counts;
  const featureCards = [
    ['#/quests', '🗺️', 'Quests', `${c.quests} quests across ${c.zones} zones, sorted by level — with maps, rewards, and exact objectives.`],
    ['#/route', '🧭', 'Leveling route', `The fastest 1→20 questing path, zone by zone in level order.`],
    ['#/map', '🗺️', 'World map', `Pan and zoom the whole world — towns, dungeons, delves, camps and quest-givers.`],
    ['#/bestiary', '🐺', 'Bestiary', `Every creature with a model render, stats, kill tactics, and a full loot table.`],
    ['#/gear', '🛡️', 'Gear', `Every weapon and armor piece — rarity, stats, and where to get it.`],
    ['#/bis', '✨', 'Best in Slot', `The strongest gear in every slot, per class — with where to get it.`],
    ['#/consumables', '🍖', 'Consumables', `Food, drink, potions and elixirs — what they restore and where to buy them.`],
    ['#/classes', '⚔️', 'Classes', `${c.classes} classes — specs, abilities by learn-level, and model portraits.`],
    ['#/talents', '🌳', 'Talents', `Interactive talent calculator — spend points across class and spec trees.`],
    ['#/dungeons', '🏰', 'Dungeons', `Route maps, rosters and bosses for every instance.`],
    ['#/delves', '🔮', 'Delves', `Tiers, affixes, companions and the Marks vendor.`],
  ];
  app.innerHTML = '';
  app.append(el(`
    <div class="hero">
      <span class="eyebrow reveal">The complete field guide</span>
      <h1 class="reveal">World of<br><span class="accent">Claudecraft</span></h1>
      <p class="sub reveal">Every quest, creature, class, dungeon and delve — rendered live from the source data. Pick a quest at your level and go.</p>
      <div class="cta reveal">
        <span class="btn primary" data-go="#/quests">Browse quests →</span>
        <span class="btn ghost" data-go="#/bestiary">Open the bestiary</span>
      </div>
      <div class="stats reveal">
        <div class="stat"><div class="n">${c.quests}</div><div class="l">Quests</div></div>
        <div class="stat"><div class="n">${c.zones}</div><div class="l">Zones</div></div>
        <div class="stat"><div class="n">${c.classes}</div><div class="l">Classes</div></div>
        <div class="stat"><div class="n">1–20</div><div class="l">Levels</div></div>
      </div>
    </div>`));
  const sec = el(`<section class="block"><div class="wrap"><div class="grid g-3"></div></div></section>`);
  const grid = sec.querySelector('.grid');
  featureCards.forEach(([go, ico, title, desc]) => {
    const card = el(`<div class="card feature reveal" data-go="${go}">
      <div class="ico">${ico}</div>
      <h3>${title}</h3><div class="meta">${desc}</div>
      <div class="arrow">Explore →</div></div>`);
    grid.append(card);
  });
  app.append(sec);
  reveal();
}

function questsView() {
  const allQuests = M.zones.flatMap(z => z.quests.map(q => ({ ...q, zoneTitle: z.title, zoneDir: z.dir })));
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">${M.counts.quests} quests</span><h2>Quests by level</h2>
      <p>Filter by zone or search, then open any quest for objectives, rewards, and where to go.</p></div>
    <div class="controls reveal">
      <input class="search" id="q-search" placeholder="Search quests…">
      <div class="pills" id="q-zones"></div>
    </div>
    <div class="grid g-3" id="q-grid"></div>
  </div></section>`));
  const zonesPills = app.querySelector('#q-zones');
  const grid = app.querySelector('#q-grid');
  const search = app.querySelector('#q-search');
  let zoneFilter = 'all', term = '';

  const pills = [['all', 'All zones'], ...M.zones.map(z => [z.dir, z.title])];
  pills.forEach(([id, label], i) => {
    const p = el(`<span class="pill ${i === 0 ? 'active' : ''}">${esc(label)}</span>`);
    p.onclick = () => { zoneFilter = id; zonesPills.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); draw(); };
    zonesPills.append(p);
  });
  search.oninput = () => { term = search.value.toLowerCase(); draw(); };

  function draw() {
    const list = allQuests
      .filter(q => zoneFilter === 'all' || q.zoneDir === zoneFilter)
      .filter(q => !term || q.name.toLowerCase().includes(term))
      .sort((a, b) => a.level - b.level);
    grid.innerHTML = '';
    list.forEach(q => {
      const card = el(`<div class="card" data-go="#/doc/${encodeURIComponent(q.file)}">
        <h3>${esc(q.name)}</h3>
        <div class="meta">${esc(q.zoneTitle)}</div>
        <div class="tags">
          <span class="tag lvl">Lv ${q.level}+</span>
          ${q.group ? '<span class="tag group">Group</span>' : ''}
          ${q.chain ? '<span class="tag">Chain</span>' : ''}
        </div></div>`);
      grid.append(card);
    });
    if (!list.length) grid.append(el('<div class="meta">No quests match.</div>'));
  }
  draw(); reveal();
}

function zonesView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Bestiary</span><h2>Creatures by zone</h2>
      <p>Each zone's bestiary: model renders, health and armor, the best way to kill every mob, and full loot tables.</p></div>
    <div class="grid g-2" id="z-grid"></div></div></section>`));
  const grid = app.querySelector('#z-grid');
  M.zones.forEach(z => {
    const card = el(`<div class="card reveal" data-go="#/doc/${encodeURIComponent(z.bestiary)}">
      <h3>${esc(z.title)}</h3>
      <div class="meta">Levels ${z.levelRange[0]}–${z.levelRange[1]}${z.hub ? ' · Hub: ' + esc(z.hub) : ''}</div>
      <div class="tags"><span class="tag lvl">${z.quests.length} quests</span><span class="tag">Bestiary →</span></div></div>`);
    grid.append(card);
  });
  reveal();
}

function classesView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">${M.classes.length} classes</span><h2>Choose your class</h2>
      <p>Specs, signature abilities, and every spell with the level you learn it.</p></div>
    <div class="grid g-3" id="c-grid"></div></div></section>`));
  const grid = app.querySelector('#c-grid');
  M.classes.forEach(c => {
    const card = el(`<div class="card classcard reveal" data-go="#/doc/${encodeURIComponent(c.file)}">
      <img src="${raw(c.render)}" alt="${esc(c.name)}" loading="lazy">
      <h3>${esc(c.name)}</h3>
      <div class="meta">${esc((c.roles || []).join(' · '))} · ${esc(c.resource)}</div>
      <div class="tags" style="justify-content:center">${(c.specs || []).map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div></div>`);
    grid.append(card);
  });
  reveal();
}

const QUALITY_COLOR = { legendary: '#e6803a', epic: '#a86bd6', rare: '#46b8da', uncommon: '#5cb85c', common: '#c8c8cf', poor: '#7a7a82' };
// Render an item source; for drops, link each mob to its bestiary entry.
function sourceHTML(src) {
  if (!src) return '';
  if (src.type === 'drop' && Array.isArray(src.mobs)) {
    const parts = src.mobs.slice(0, 3).map(m => m.dir
      ? `<a href="#/doc/${encodeURIComponent('quests/zones/' + m.dir + '/bestiary.md')}/${encodeURIComponent('mob-' + m.id)}">${esc(m.name)}</a>`
      : esc(m.name));
    const more = src.mobs.length > 3 ? ` +${src.mobs.length - 3} more` : '';
    return 'Drops from ' + parts.join(', ') + more;
  }
  return esc(src.label || '');
}
let gearData = null;
async function gearView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Gear</span><h2>Equipment</h2>
      <p>Every weapon and armor piece — its rarity, stats, and where to get it. Filter by slot or quality, or search.</p></div>
    <div class="controls reveal">
      <input class="search" id="gsearch" placeholder="Search gear…">
      <div class="pills" id="gslots"></div>
    </div>
    <div class="controls reveal" style="margin-top:-12px"><div class="pills" id="gquals"></div></div>
    <div class="controls reveal" style="margin-top:-12px"><div class="pills" id="gsources"></div></div>
    <div class="gearcount meta" id="gcount" style="margin-bottom:14px"></div>
    <div class="grid g-3" id="ggrid"></div>
  </div></section>`));
  if (!gearData) {
    try { gearData = await (await fetch(raw('gear/gear.json'))).json(); }
    catch (e) { app.querySelector('#ggrid').innerHTML = `<div class="meta">Couldn't load gear (${esc(e.message)}).</div>`; return; }
  }
  const grid = app.querySelector('#ggrid'), count = app.querySelector('#gcount');
  let slot = 'all', qual = 'all', src = 'all', term = '';
  const mkPills = (host, items, onPick) => {
    items.forEach(([id, label], i) => {
      const p = el(`<span class="pill ${i === 0 ? 'active' : ''}">${esc(label)}</span>`);
      p.onclick = () => { host.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); onPick(id); };
      host.append(p);
    });
  };
  mkPills(app.querySelector('#gslots'), [['all', 'All slots'], ...gearData.slots.map(s => [s.id, s.label])], v => { slot = v; draw(); });
  mkPills(app.querySelector('#gquals'), [['all', 'All rarities'], ...gearData.qualities.map(q => [q, q[0].toUpperCase() + q.slice(1)])], v => { qual = v; draw(); });
  mkPills(app.querySelector('#gsources'), [['all', 'Any source'], ['quest', '🗺️ Quest reward'], ['drop', 'Drop'], ['vendor', 'Vendor'], ['delve', 'Delve']], v => { src = v; draw(); });
  app.querySelector('#gsearch').oninput = (e) => { term = e.target.value.toLowerCase(); draw(); };

  function draw() {
    const list = gearData.gear
      .filter(g => slot === 'all' || g.slot === slot)
      .filter(g => qual === 'all' || g.quality === qual)
      .filter(g => src === 'all' || g.sources.some(s => s.type === src))
      .filter(g => !term || g.name.toLowerCase().includes(term));
    count.textContent = `${list.length} of ${gearData.count} items`;
    grid.innerHTML = '';
    list.slice(0, 240).forEach(g => {
      const col = QUALITY_COLOR[g.quality] || '#ccc';
      const src = sourceHTML(g.sources[0]);
      const card = el(`<div class="card gearcard">
        <div class="gearhead">
          <img class="gicon" src="${raw(g.icon)}" alt="" loading="lazy" style="border-color:${col}">
          <div><h3 style="color:${col}">${esc(g.name)}</h3>
            <div class="meta">${esc(g.qualityName)} · ${esc(g.slotLabel)}${g.armorType ? ' · ' + esc(g.armorType[0].toUpperCase() + g.armorType.slice(1)) : ''}</div></div>
        </div>
        ${g.stats ? `<div class="gstats">${esc(g.stats)}</div>` : ''}
        <div class="gsrc">${src}</div>
      </div>`);
      grid.append(card);
    });
    if (!list.length) grid.append(el('<div class="meta">No gear matches.</div>'));
    if (list.length > 240) grid.append(el(`<div class="meta">Showing first 240 — refine with filters.</div>`));
  }
  draw(); reveal();
}

const MARKER = {
  town: { color: '#f0d89a', r: 7, label: 'Towns' },
  dungeon: { color: '#9b59b6', r: 7, label: 'Dungeons' },
  delve: { color: '#46b8da', r: 7, label: 'Delves' },
  npc: { color: '#5cb85c', r: 4.5, label: 'Quest givers' },
  camp: { color: '#d9534f', r: 4.5, label: 'Mob camps' },
  poi: { color: '#7fa890', r: 3, label: 'Places' },
};
let worldData = null;
async function worldMapView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">World map</span><h2>The world of Claudecraft</h2>
      <p>All four zones, north to south. Drag to pan, scroll to zoom, hover a marker for its name, click to open its page. Toggle layers below.</p></div>
    <div class="controls reveal"><div class="pills" id="wlayers"></div></div>
    <div class="worldmap reveal" id="wmap"><div class="wtip" id="wtip"></div></div>
  </div></section>`));
  if (!worldData) {
    try { worldData = await (await fetch('world-map.json', { cache: 'no-cache' })).json(); }
    catch (e) { app.querySelector('#wmap').innerHTML = `<div class="meta" style="padding:30px">Couldn't load the map (${esc(e.message)}).</div>`; return; }
  }
  const W = worldData, b = W.bounds;
  const host = app.querySelector('#wmap'), tip = app.querySelector('#wtip');
  const on = { town: true, dungeon: true, delve: true, npc: true, camp: true, poi: true };

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `${b.minX} ${b.minZ} ${b.maxX - b.minX} ${b.maxZ - b.minZ}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('wsvg');
  const mk = (n, a) => { const e = document.createElementNS(svgNS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };

  // zone bands
  W.bands.forEach((bd, i) => {
    svg.append(mk('rect', { x: b.minX, y: bd.zMin, width: b.maxX - b.minX, height: bd.zMax - bd.zMin, fill: i % 2 ? '#12161a' : '#15191d', opacity: 0.6 }));
    const t = mk('text', { x: b.minX + 8, y: bd.zMin + 22, fill: '#3f5247', 'font-size': 22, 'font-weight': 'bold' }); t.textContent = `${bd.title} · ${bd.levelRange[0]}–${bd.levelRange[1]}`; svg.append(t);
  });
  for (const l of W.lakes) svg.append(mk('circle', { cx: l.x, cy: l.z, r: l.r, fill: '#2f6f8f', opacity: 0.4 }));
  for (const seg of W.roads) { const p = mk('path', { d: seg.map((q, i) => `${i ? 'L' : 'M'}${q[0]} ${q[1]}`).join(' '), fill: 'none', stroke: '#6f6244', 'stroke-width': 2, opacity: 0.5, 'vector-effect': 'non-scaling-stroke' }); svg.append(p); }

  const layers = {};
  for (const type of Object.keys(MARKER)) { const g = mk('g', {}); layers[type] = g; svg.append(g); }
  for (const m of W.markers) {
    const cfg = MARKER[m.type]; if (!cfg) continue;
    const c = mk('circle', { cx: m.x, cy: m.z, r: cfg.r, fill: cfg.color, stroke: '#0a0c0e', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' });
    c.style.cursor = m.link ? 'pointer' : 'default';
    c.addEventListener('mouseenter', (e) => { tip.textContent = m.label; tip.style.opacity = 1; moveTip(e); });
    c.addEventListener('mousemove', moveTip);
    c.addEventListener('mouseleave', () => { tip.style.opacity = 0; });
    if (m.link) c.addEventListener('click', () => {
      const [p, anc] = m.link.split('#');
      location.hash = `#/doc/${encodeURIComponent(p)}${anc ? '/' + encodeURIComponent(anc) : ''}`;
    });
    layers[m.type].append(c);
  }
  function moveTip(e) { const r = host.getBoundingClientRect(); tip.style.left = (e.clientX - r.left + 12) + 'px'; tip.style.top = (e.clientY - r.top + 12) + 'px'; }
  host.append(svg);

  // pan/zoom via viewBox
  let vb = { x: b.minX, y: b.minZ, w: b.maxX - b.minX, h: b.maxZ - b.minZ };
  const apply = () => svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  const fullW = vb.w, fullH = vb.h;
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    const wx = vb.x + px * vb.w, wy = vb.y + py * vb.h;
    const f = e.deltaY < 0 ? 0.85 : 1.18;
    vb.w = Math.min(fullW, Math.max(fullW * 0.06, vb.w * f));
    vb.h = Math.min(fullH, Math.max(fullH * 0.06, vb.h * f));
    vb.x = wx - px * vb.w; vb.y = wy - py * vb.h; apply();
  }, { passive: false });
  let drag = null;
  svg.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return; const r = svg.getBoundingClientRect();
    vb.x -= (e.clientX - drag.x) / r.width * vb.w; vb.y -= (e.clientY - drag.y) / r.height * vb.h;
    drag = { x: e.clientX, y: e.clientY }; apply();
  });
  svg.addEventListener('pointerup', () => { drag = null; });
  svg.addEventListener('pointerleave', () => { drag = null; });

  // layer toggles
  const lh = app.querySelector('#wlayers');
  for (const type of Object.keys(MARKER)) {
    const cfg = MARKER[type];
    const p = el(`<span class="pill active"><span class="ldot" style="background:${cfg.color}"></span> ${cfg.label}</span>`);
    p.onclick = () => { on[type] = !on[type]; p.classList.toggle('active', on[type]); layers[type].style.display = on[type] ? '' : 'none'; };
    lh.append(p);
  }
  reveal();
}

let abilityData = null;
async function abilitiesView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Abilities</span><h2>Spellbook</h2>
      <p>Every ability with its real icon, the level you learn it, cost, cast, cooldown, range and effect. Filter by class or search.</p></div>
    <div class="controls reveal"><input class="search" id="absearch" placeholder="Search abilities…"><div class="pills" id="abclass"></div></div>
    <div class="meta" id="abcount" style="margin-bottom:14px"></div>
    <div id="abbody"></div>
  </div></section>`));
  if (!abilityData) {
    try { abilityData = await (await fetch(raw('abilities/abilities.json'))).json(); }
    catch (e) { app.querySelector('#abbody').innerHTML = `<div class="meta">Couldn't load abilities (${esc(e.message)}).</div>`; return; }
  }
  const host = app.querySelector('#abbody'), count = app.querySelector('#abcount');
  let cls = 'all', term = '';
  const pillHost = app.querySelector('#abclass');
  [['all', 'All classes'], ...abilityData.classes.map(c => [c.id, c.name])].forEach(([id, label], i) => {
    const p = el(`<span class="pill ${i === 0 ? 'active' : ''}">${esc(label)}</span>`);
    p.onclick = () => { cls = id; pillHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); draw(); };
    pillHost.append(p);
  });
  app.querySelector('#absearch').oninput = e => { term = e.target.value.toLowerCase(); draw(); };
  function draw() {
    host.innerHTML = ''; let n = 0;
    for (const c of abilityData.classes) {
      if (cls !== 'all' && c.id !== cls) continue;
      const list = c.abilities.filter(a => !term || a.name.toLowerCase().includes(term));
      if (!list.length) continue;
      n += list.length;
      const sec = el(`<div class="absec"><h3>${esc(c.name)}</h3><div class="abgrid"></div></div>`);
      const grid = sec.querySelector('.abgrid');
      for (const a of list) {
        grid.append(el(`<div class="card abcard">
          <div class="gearhead"><img class="gicon" src="${raw(a.icon)}" alt="" loading="lazy">
            <div><h3 style="font-size:15px">${esc(a.name)}</h3><div class="meta">Learn at level ${a.learnLevel}${a.rankLevels.length ? ` · ranks ${a.rankLevels.join(', ')}` : ''}</div></div></div>
          <div class="abmeta">${a.cost ? a.cost + ' cost · ' : ''}${esc(a.cast)} · ${esc(a.cooldown)} CD · ${esc(a.range)} · ${esc(a.school)}</div>
          <div class="gstats">${esc(a.description)}</div></div>`));
      }
      host.append(sec);
    }
    count.textContent = `${n} abilities`;
    reveal(host);
  }
  draw(); reveal(); applyPendingSearch();
}

let talentData = null;
async function talentsView(initClass, initSpec, initAlloc) {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Talents</span><h2>Talent calculator</h2>
      <p>Pick a class and spec, then click talents to spend points (right-click to remove). Respects ranks, prerequisites, and tree gates.</p></div>
    <div class="controls reveal"><div class="pills" id="tclass"></div></div>
    <div class="controls reveal" style="margin-top:-12px"><div class="pills" id="tspec"></div>
      <span class="tbudget" id="tbudget"></span>
      <span class="pill" id="treset">Reset</span>
      <span class="pill" id="tshare">🔗 Copy link</span>
      <span class="pill" id="tsave">★ Save</span></div>
    <div class="tsaved" id="tsaved"></div>
    <div id="ttrees" class="ttrees"></div>
  </div></section>`));
  if (!talentData) {
    try { talentData = await (await fetch('talents.json', { cache: 'no-cache' })).json(); }
    catch (e) { app.querySelector('#ttrees').innerHTML = `<div class="meta">Couldn't load talents (${esc(e.message)}).</div>`; return; }
  }
  const classIds = Object.keys(talentData.classes);
  let classId = classIds.includes(initClass) ? initClass : classIds[0], specIdx = 0;
  let alloc = {}; // nodeId -> rank
  const maxPoints = talentData.maxPoints;

  // restore a shared build (#/talents/<class>/<spec>/<digits>)
  function nodeOrder(cid, si) { const c = talentData.classes[cid]; return [...c.classTree, ...c.specs[si].nodes]; }
  function decode(cid, sid, digits) {
    const c = talentData.classes[cid]; const si = Math.max(0, c.specs.findIndex(s => s.id === sid));
    specIdx = si; alloc = {};
    const order = nodeOrder(cid, si);
    [...(digits || '')].forEach((d, i) => { const r = parseInt(d, 36); if (order[i] && r > 0) alloc[order[i].id] = Math.min(r, order[i].maxRank); });
  }
  function encode() {
    const order = nodeOrder(classId, specIdx);
    return order.map(n => (alloc[n.id] || 0).toString(36)).join('').replace(/0+$/, '');
  }
  function buildHash() { return `#/talents/${classId}/${talentData.classes[classId].specs[specIdx].id}/${encode()}`; }
  if (initClass) decode(classId, initSpec, initAlloc);

  const clsHost = app.querySelector('#tclass'), specHost = app.querySelector('#tspec');
  classIds.forEach((id) => {
    const p = el(`<span class="pill ${id === classId ? 'active' : ''}">${esc(talentData.classes[id].name)}</span>`);
    p.onclick = () => { classId = id; specIdx = 0; alloc = {}; clsHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); buildSpecs(); draw(); };
    clsHost.append(p);
  });
  app.querySelector('#treset').onclick = () => { alloc = {}; draw(); };

  function buildSpecs() {
    specHost.innerHTML = '';
    talentData.classes[classId].specs.forEach((s, i) => {
      const p = el(`<span class="pill ${i === specIdx ? 'active' : ''}">${esc(s.icon || '')} ${esc(s.name)}</span>`);
      p.onclick = () => { specIdx = i; alloc = {}; specHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); draw(); };
      specHost.append(p);
    });
  }
  const spent = () => Object.values(alloc).reduce((a, b) => a + b, 0);
  const treeSpent = (nodes) => nodes.reduce((a, n) => a + (alloc[n.id] || 0), 0);

  function canAdd(node, treeNodes) {
    if ((alloc[node.id] || 0) >= node.maxRank) return false;
    if (spent() >= maxPoints) return false;
    if (node.pointsGate && treeSpent(treeNodes) < node.pointsGate) return false;
    if (node.requires) for (const r of node.requires) { const dep = treeNodes.find(n => n.id === r); if (dep && (alloc[r] || 0) < dep.maxRank) return false; }
    return true;
  }
  function treeGrid(nodes, title) {
    const cols = Math.max(...nodes.map(n => n.col)) + 1;
    const rows = Math.max(...nodes.map(n => n.row)) + 1;
    const wrap = el(`<div class="ttree"><div class="ttreehead">${esc(title)} <span class="ttreepts">${treeSpent(nodes)}</span></div><div class="tgrid" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},auto)"></div></div>`);
    const grid = wrap.querySelector('.tgrid');
    const at = {};
    for (const n of nodes) at[n.row + ',' + n.col] = n;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const n = at[r + ',' + c];
      if (!n) { grid.append(el('<div></div>')); continue; }
      const rank = alloc[n.id] || 0;
      const maxed = rank >= n.maxRank;
      const avail = canAdd(n, nodes) || rank > 0;
      const cell = el(`<div class="tnode ${rank > 0 ? (maxed ? 'maxed' : 'partial') : ''} ${avail ? '' : 'locked'}" title="${esc(n.name)} — ${esc(n.description || '')}">
        <img class="ticon-img" src="${n.iconImg || ''}" alt="" loading="lazy">
        <span class="tname">${esc(n.name)}</span>
        <span class="trank">${rank}/${n.maxRank}</span></div>`);
      cell.oncontextmenu = (e) => { e.preventDefault(); if (rank > 0) { alloc[n.id] = rank - 1; if (!alloc[n.id]) delete alloc[n.id]; draw(); } };
      cell.onclick = () => { if (canAdd(n, nodes)) { alloc[n.id] = rank + 1; draw(); } };
      grid.append(cell);
    }
    return wrap;
  }
  function draw() {
    const cls = talentData.classes[classId];
    const spec = cls.specs[specIdx];
    app.querySelector('#tbudget').innerHTML = `<b>${spent()}</b> / ${maxPoints} points`;
    const host = app.querySelector('#ttrees');
    host.innerHTML = '';
    host.append(treeGrid(cls.classTree, 'Class'));
    host.append(treeGrid(spec.nodes, spec.name));
    if (spec.mastery) host.append(el(`<div class="tmastery"><b>${esc(spec.name)} mastery — ${esc(spec.mastery.name)}:</b> ${esc(spec.mastery.description)}</div>`));
  }
  // share + save
  app.querySelector('#tshare').onclick = () => {
    const hash = buildHash();
    history.replaceState(null, '', hash);
    const url = location.href;
    navigator.clipboard?.writeText(url).then(() => toast('Build link copied')).catch(() => toast('Link in address bar'));
  };
  app.querySelector('#tsave').onclick = () => {
    const name = prompt('Name this build:', `${talentData.classes[classId].name} ${talentData.classes[classId].specs[specIdx].name}`);
    if (!name) return;
    const saved = loadBuilds(); saved.unshift({ name, hash: buildHash() });
    localStorage.setItem('wc_builds', JSON.stringify(saved.slice(0, 30))); drawSaved();
  };
  function loadBuilds() { try { return JSON.parse(localStorage.getItem('wc_builds') || '[]'); } catch { return []; } }
  function drawSaved() {
    const host = app.querySelector('#tsaved'); host.innerHTML = '';
    const saved = loadBuilds();
    if (!saved.length) return;
    host.append(el('<span class="meta" style="font-size:12px">Saved builds:</span>'));
    saved.forEach((b, i) => {
      const chip = el(`<span class="pill savedbuild">${esc(b.name)} <span class="rm" title="delete">×</span></span>`);
      chip.onclick = (e) => { if (e.target.classList.contains('rm')) { const s = loadBuilds(); s.splice(i, 1); localStorage.setItem('wc_builds', JSON.stringify(s)); drawSaved(); } else location.hash = b.hash; };
      host.append(chip);
    });
  }
  drawSaved();
  buildSpecs(); draw(); reveal();
}

function toast(msg) {
  const t = el(`<div class="toast">${esc(msg)}</div>`); document.body.append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 1800);
}

function routeView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Leveling route</span><h2>Fastest path to 20</h2>
      <p>Work top to bottom: each zone in level order, quests grouped by the level they unlock. Do everything in a zone before moving to the next — they're level-gated. 👥 = group · chains do prerequisites first.</p></div>
    <div id="routebody"></div>
  </div></section>`));
  const body = app.querySelector('#routebody');
  let step = 0;
  for (const z of M.zones) {
    const sec = el(`<div class="routezone reveal">
      <h3>${esc(z.title)} <span class="meta" style="font-weight:400">· levels ${z.levelRange[0]}–${z.levelRange[1]}${z.hub ? ' · ' + esc(z.hub) : ''}</span></h3>
      <div class="routelist"></div></div>`);
    const list = sec.querySelector('.routelist');
    let curLevel = null;
    for (const q of z.quests) {
      if (q.level !== curLevel) { curLevel = q.level; list.append(el(`<div class="routelevel">Level ${curLevel}+</div>`)); }
      step++;
      const row = el(`<a class="routeitem" href="#/doc/${encodeURIComponent(q.file)}">
        <span class="routenum">${step}</span>
        <span class="routename">${esc(q.name)}${q.group ? ' 👥' : ''}${q.chain ? ' <span class="routechain">chain</span>' : ''}</span>
        <span class="routearrow">→</span></a>`);
      list.append(row);
    }
    body.append(sec);
  }
  reveal();
}

let bisData = null;
async function bisView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Best in slot</span><h2>Best gear per class</h2>
      <p>The strongest item for each slot, picked per class by a stat-weight model (primary stats first, then armor, weapon DPS, and rarity). A guide, not gospel — spec and playstyle shift the edges.</p></div>
    <div class="controls reveal"><div class="pills" id="bisclasses"></div></div>
    <div id="bisbody"></div>
  </div></section>`));
  if (!bisData) {
    try { bisData = await (await fetch(raw('gear/bis.json'))).json(); }
    catch (e) { app.querySelector('#bisbody').innerHTML = `<div class="meta">Couldn't load BiS (${esc(e.message)}).</div>`; return; }
  }
  const pillHost = app.querySelector('#bisclasses'), body = app.querySelector('#bisbody');
  let active = bisData.classes[0].id;
  bisData.classes.forEach((c, i) => {
    const p = el(`<span class="pill ${i === 0 ? 'active' : ''}">${esc(c.name)}</span>`);
    p.onclick = () => { active = c.id; pillHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); draw(); };
    pillHost.append(p);
  });
  function draw() {
    const c = bisData.classes.find(x => x.id === active);
    body.innerHTML = '';
    const head = el(`<div class="bishead reveal">
      <img src="${raw(c.render)}" alt="${esc(c.name)}" class="bisportrait">
      <div><h3>${esc(c.name)}</h3><div class="meta">${esc((c.roles || []).join(' · '))}</div></div></div>`);
    body.append(head);
    const grid = el(`<div class="grid g-4"></div>`);
    c.slots.forEach(s => {
      const col = QUALITY_COLOR[s.item.quality] || '#ccc';
      grid.append(el(`<div class="card gearcard reveal">
        <div class="bisslot">${esc(s.slotLabel)}</div>
        <div class="gearhead"><img class="gicon" src="${raw(s.item.icon)}" alt="" loading="lazy" style="border-color:${col}">
          <div><h3 style="color:${col};font-size:15px">${esc(s.item.name)}</h3><div class="meta">${esc(s.item.qualityName)}</div></div></div>
        ${s.item.stats ? `<div class="gstats">${esc(s.item.stats)}</div>` : ''}
        <div class="gsrc">${sourceHTML(s.item.sources[0])}</div></div>`));
    });
    body.append(grid);
    reveal(body);
  }
  draw(); reveal(); applyPendingSearch();
}

let consData = null;
async function consumablesView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Consumables</span><h2>Food, drink & potions</h2>
      <p>Everything you eat, drink or quaff — what it restores and where to get it.</p></div>
    <div class="controls reveal"><input class="search" id="csearch" placeholder="Search consumables…"><div class="pills" id="ccats"></div></div>
    <div class="controls reveal" style="margin-top:-12px"><div class="pills" id="csources"></div></div>
    <div class="meta" id="ccount" style="margin-bottom:14px"></div>
    <div class="grid g-3" id="cgrid"></div>
  </div></section>`));
  if (!consData) {
    try { consData = await (await fetch(raw('consumables/consumables.json'))).json(); }
    catch (e) { app.querySelector('#cgrid').innerHTML = `<div class="meta">Couldn't load consumables (${esc(e.message)}).</div>`; return; }
  }
  const grid = app.querySelector('#cgrid'), count = app.querySelector('#ccount');
  let cat = 'all', src = 'all', term = '';
  const mkPills = (host, items, onPick) => items.forEach(([id, label], i) => {
    const p = el(`<span class="pill ${i === 0 ? 'active' : ''}">${esc(label)}</span>`);
    p.onclick = () => { host.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); onPick(id); };
    host.append(p);
  });
  mkPills(app.querySelector('#ccats'), [['all', 'All types'], ...consData.categories.map(c => [c.id, c.label])], v => { cat = v; draw(); });
  mkPills(app.querySelector('#csources'), [['all', 'Any source'], ['vendor', 'Vendor'], ['quest', '🗺️ Quest'], ['drop', 'Drop'], ['delve', 'Delve']], v => { src = v; draw(); });
  app.querySelector('#csearch').oninput = (e) => { term = e.target.value.toLowerCase(); draw(); };
  function draw() {
    const list = consData.items
      .filter(i => cat === 'all' || i.kind === cat)
      .filter(i => src === 'all' || i.sources.some(s => s.type === src))
      .filter(i => !term || i.name.toLowerCase().includes(term));
    count.textContent = `${list.length} of ${consData.count} consumables`;
    grid.innerHTML = '';
    list.forEach(it => {
      const col = QUALITY_COLOR[it.quality] || '#ccc';
      const card = el(`<div class="card gearcard">
        <div class="gearhead">
          <img class="gicon" src="${raw(it.icon)}" alt="" loading="lazy" style="border-color:${col}">
          <div><h3 style="color:${col}">${esc(it.name)}</h3><div class="meta">${esc(it.category)}${it.quality !== 'common' ? ' · ' + esc(it.qualityName) : ''}</div></div>
        </div>
        ${it.effect ? `<div class="gstats">${esc(it.effect)}</div>` : ''}
        <div class="gsrc">${sourceHTML(it.sources[0])}</div></div>`);
      grid.append(card);
    });
    if (!list.length) grid.append(el('<div class="meta">No consumables match.</div>'));
  }
  draw(); reveal(); applyPendingSearch();
}

function simpleListView(title, eyebrow, blurb, items) {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(title)}</h2><p>${esc(blurb)}</p></div>
    <div class="grid g-2" id="l-grid"></div></div></section>`));
  const grid = app.querySelector('#l-grid');
  items.forEach(it => {
    const card = el(`<div class="card reveal" data-go="#/doc/${encodeURIComponent(it.file)}">
      <h3>${esc(it.name)}</h3><div class="meta">${esc(it.meta || '')}</div>
      ${it.tags ? `<div class="tags">${it.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}</div>`);
    grid.append(card);
  });
  reveal();
}

let questMaps = null; // lazy-loaded quest-maps.json
async function getQuestMaps() {
  if (questMaps) return questMaps;
  try { questMaps = await (await fetch(raw('quests/quest-maps.json'))).json(); }
  catch { questMaps = {}; }
  return questMaps;
}

// Turn an embedded per-quest map into an interactive, clickable route.
async function enhanceQuestMap(body) {
  const img = [...body.querySelectorAll('img')].find(i => /qmap-[^/]+\.svg$/.test(i.getAttribute('src') || i.src));
  if (!img) return;
  const mapPath = img.src.replace(RAW, '');
  const qm = await getQuestMaps();
  const entry = Object.values(qm).find(e => e.map === mapPath);
  if (!entry) return;
  // inline the SVG so its markers become clickable DOM
  let svgText;
  try { svgText = await (await fetch(img.src)).text(); } catch { return; }
  const holder = el(`<div class="qmap"></div>`);
  holder.innerHTML = svgText;
  const svg = holder.querySelector('svg');
  svg.removeAttribute('width'); svg.removeAttribute('height');
  // clickable step chips
  const stepsBar = el(`<div class="qsteps"></div>`);
  const KIND_COLOR = { giver: '#f0c419', turnin: '#5cb85c', kill: '#d9534f', collect: '#46b8da', interact: '#9b8cff' };
  entry.steps.forEach(st => {
    const chip = el(`<button class="qchip"><span class="dot" style="background:${KIND_COLOR[st.kind] || '#999'}">${st.n}</span> ${esc(st.label)}</button>`);
    chip.onmouseenter = chip.onclick = () => focusStep(svg, st.n, chip, stepsBar);
    stepsBar.append(chip);
  });
  const panel = el(`<div class="qmap-panel"></div>`);
  panel.append(el(`<div class="qmap-hint">Tap a step to highlight it on the map</div>`), stepsBar, holder);
  img.replaceWith(panel);
}
function focusStep(svg, n, chip, bar) {
  bar.querySelectorAll('.qchip').forEach(c => c.classList.remove('on'));
  chip.classList.add('on');
  svg.querySelectorAll('.qstep').forEach(g => {
    const steps = (g.getAttribute('data-steps') || '').split(',');
    g.classList.toggle('flash', steps.includes(String(n)));
    g.style.opacity = steps.includes(String(n)) ? '1' : '0.32';
  });
}

let voiceData = null;
async function getVoice() {
  if (voiceData) return voiceData;
  try { voiceData = await (await fetch('voice.json', { cache: 'no-cache' })).json(); }
  catch { voiceData = { base: '', quests: {} }; }
  return voiceData;
}
// Add quest voice-over players (offer + completion) to a quest doc.
async function enhanceVoice(body, docPath) {
  const m = /quests\/zones\/[^/]+\/(q-[^/]+)\.md$/.exec(docPath);
  if (!m) return;
  const id = m[1].replace(/-/g, '_');
  const v = await getVoice();
  const entry = v.quests[id];
  if (!entry) return;
  const panel = el(`<div class="voice"><span class="voicelabel">🔊 Voice-over</span></div>`);
  const add = (kind, label) => {
    if (!entry[kind]) return;
    const wrap = el(`<div class="voiceclip"><span>${label}</span></div>`);
    const audio = el(`<audio controls preload="none" src="${v.base}${entry[kind]}"></audio>`);
    wrap.append(audio); panel.append(wrap);
  };
  add('offer', 'Offer'); add('complete', 'Completion');
  const h1 = body.querySelector('h1');
  if (h1) h1.after(panel); else body.prepend(panel);
}

async function docView(path, anchor) {
  app.innerHTML = '<div class="spinner"></div>';
  let md;
  try { md = await getMd(path); }
  catch (e) { app.innerHTML = `<section class="block"><div class="wrap"><p class="meta">Couldn't load <code>${esc(path)}</code> (${esc(e.message)}).</p><p><span class="btn ghost" data-go="#/">← Home</span></p></div></section>`; return; }
  const wrap = el(`<section class="block"><div class="wrap"><div class="doc"><span class="back">← Back</span><div class="body"></div></div></div></section>`);
  wrap.querySelector('.back').onclick = () => history.length > 1 ? history.back() : (location.hash = '#/');
  const body = wrap.querySelector('.body');
  renderMarkdown(body, md, path);
  app.innerHTML = '';
  app.append(wrap);
  window.scrollTo(0, 0);
  enhanceVoice(body, path);
  enhanceQuestMap(body);
  if (anchor) {
    const t = document.getElementById(anchor);
    if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
}

// ---------- router ----------
function router() {
  const h = location.hash || '#/';
  setActiveNav(h);
  const parts = h.slice(2).split('/');
  const head = parts[0] || '';
  if (head === 'quests') return questsView();
  if (head === 'map') return worldMapView();
  if (head === 'route') return routeView();
  if (head === 'bestiary') return zonesView();
  if (head === 'gear') return gearView();
  if (head === 'bis') return bisView();
  if (head === 'consumables') return consumablesView();
  if (head === 'classes') return classesView();
  if (head === 'abilities') return abilitiesView();
  if (head === 'talents') return talentsView(parts[1] ? decodeURIComponent(parts[1]) : null, parts[2] ? decodeURIComponent(parts[2]) : null, parts[3] ? decodeURIComponent(parts[3]) : '');
  if (head === 'dungeons') return simpleListView('Dungeons', 'Instanced content', 'Route maps, full rosters and bosses for every dungeon.',
    M.dungeons.map(d => ({ name: d.name, file: d.file, meta: d.suggestedPlayers ? `Suggested players: ${d.suggestedPlayers}` : '', tags: d.hasMap ? ['Map', 'Roster'] : ['Roster'] })));
  if (head === 'delves') return simpleListView('Delves', 'Replayable', 'Scalable mini-instances with tiers, affixes, companions and a Marks vendor.',
    M.delves.map(d => ({ name: d.name, file: d.file, meta: `Minimum level ${d.minLevel}`, tags: ['Tiers', 'Vendor'] })));
  if (head === 'doc') return docView(decodeURIComponent(parts[1] || ''), parts[2] ? decodeURIComponent(parts[2]) : '');
  return home();
}

function setActiveNav(h) {
  document.querySelectorAll('nav .link').forEach(a => {
    const go = a.getAttribute('data-go');
    a.classList.toggle('active', h.startsWith(go) && go !== '#/');
  });
}

// ---------- global search ----------
let searchIndex = null, pendingSearch = null;
async function openSearch() {
  if (document.getElementById('searchov')) return;
  const ov = el(`<div class="searchov" id="searchov">
    <div class="searchbox">
      <input class="searchin" id="searchin" placeholder="Search quests, mobs, gear, abilities…" autocomplete="off">
      <div class="searchres" id="searchres"></div>
      <div class="searchhint">↑↓ to move · Enter to open · Esc to close</div>
    </div></div>`);
  document.body.append(ov);
  const input = ov.querySelector('#searchin'), res = ov.querySelector('#searchres');
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  if (!searchIndex) { try { searchIndex = await (await fetch('search.json', { cache: 'no-cache' })).json(); } catch { searchIndex = []; } }
  let hits = [], sel = 0;
  function draw() {
    res.innerHTML = '';
    hits.forEach((h, i) => {
      const r = el(`<div class="searchhit ${i === sel ? 'on' : ''}"><span class="searchtype">${esc(h.t)}</span> ${esc(h.n)}</div>`);
      r.onclick = () => choose(h); r.onmouseenter = () => { sel = i; [...res.children].forEach((c, j) => c.classList.toggle('on', j === i)); };
      res.append(r);
    });
  }
  function run(q) {
    q = q.trim().toLowerCase(); sel = 0;
    if (!q) { hits = []; res.innerHTML = ''; return; }
    hits = searchIndex.filter(e => e.nl.includes(q))
      .sort((a, b) => (a.nl.startsWith(q) ? 0 : 1) - (b.nl.startsWith(q) ? 0 : 1) || a.n.length - b.n.length)
      .slice(0, 40);
    draw();
  }
  function choose(h) { close(); if (h.pre) pendingSearch = { go: h.go, term: h.pre }; location.hash = h.go; }
  function close() { ov.remove(); document.removeEventListener('keydown', onKey); }
  function onKey(e) {
    if (e.key === 'Escape') return close();
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, hits.length - 1); draw(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
    if (e.key === 'Enter' && hits[sel]) choose(hits[sel]);
  }
  input.addEventListener('input', () => run(input.value));
  document.addEventListener('keydown', onKey);
  input.focus();
}
document.addEventListener('keydown', e => {
  if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || '') && !document.getElementById('searchov')) { e.preventDefault(); openSearch(); }
});
// apply a pending search term once the target tab has rendered its input
function applyPendingSearch() {
  if (!pendingSearch) return;
  const sel = { '#/gear': '#gsearch', '#/consumables': '#csearch', '#/abilities': '#absearch' }[pendingSearch.go];
  const term = pendingSearch.term; pendingSearch = null;
  if (!sel) return;
  setTimeout(() => { const inp = document.querySelector(sel); if (inp) { inp.value = term; inp.dispatchEvent(new Event('input')); } }, 300);
}

// global click handler for [data-go]
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go]');
  if (t) { e.preventDefault(); location.hash = t.getAttribute('data-go'); }
});
document.getElementById('navsearch')?.addEventListener('click', openSearch);
(function theme() {
  const btn = document.getElementById('navtheme');
  const set = (t) => { document.documentElement.dataset.theme = t === 'light' ? 'light' : ''; if (btn) btn.textContent = t === 'light' ? '☀️' : '🌙'; try { localStorage.setItem('wc_theme', t); } catch (e) {} document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'light' ? '#f5f5f7' : '#07070b'); };
  let cur = (() => { try { return localStorage.getItem('wc_theme') || 'dark'; } catch (e) { return 'dark'; } })();
  set(cur);
  btn?.addEventListener('click', () => { cur = cur === 'light' ? 'dark' : 'light'; set(cur); });
})();
window.addEventListener('hashchange', router);
window.addEventListener('scroll', () => document.body.classList.toggle('scrolled', window.scrollY > 10));

// ---------- boot ----------
(async function boot() {
  try {
    M = await (await fetch('manifest.json', { cache: 'no-cache' })).json();
    RAW = `https://raw.githubusercontent.com/${M.repo}/${M.branch}/`;
    router();
  } catch (e) {
    app.innerHTML = `<section class="block"><div class="wrap"><p class="meta">Failed to load the guide manifest. ${esc(e.message)}</p></div></section>`;
  }
})();
