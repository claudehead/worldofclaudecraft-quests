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
    ['#/bestiary', '🐺', 'Bestiary', `Every creature with a model render, stats, kill tactics, and a full loot table.`],
    ['#/gear', '🛡️', 'Gear', `Every weapon and armor piece — rarity, stats, and where to get it.`],
    ['#/bis', '✨', 'Best in Slot', `The strongest gear in every slot, per class — with where to get it.`],
    ['#/consumables', '🍖', 'Consumables', `Food, drink, potions and elixirs — what they restore and where to buy them.`],
    ['#/classes', '⚔️', 'Classes', `${c.classes} classes — specs, abilities by learn-level, and model portraits.`],
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
      const src = g.sources[0] ? g.sources[0].label : '';
      const card = el(`<div class="card gearcard">
        <div class="gearhead">
          <img class="gicon" src="${raw(g.icon)}" alt="" loading="lazy" style="border-color:${col}">
          <div><h3 style="color:${col}">${esc(g.name)}</h3>
            <div class="meta">${esc(g.qualityName)} · ${esc(g.slotLabel)}${g.armorType ? ' · ' + esc(g.armorType[0].toUpperCase() + g.armorType.slice(1)) : ''}</div></div>
        </div>
        ${g.stats ? `<div class="gstats">${esc(g.stats)}</div>` : ''}
        <div class="gsrc">${esc(src)}</div>
      </div>`);
      grid.append(card);
    });
    if (!list.length) grid.append(el('<div class="meta">No gear matches.</div>'));
    if (list.length > 240) grid.append(el(`<div class="meta">Showing first 240 — refine with filters.</div>`));
  }
  draw(); reveal();
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
      const src = s.item.sources[0] ? s.item.sources[0].label : '';
      grid.append(el(`<div class="card gearcard reveal">
        <div class="bisslot">${esc(s.slotLabel)}</div>
        <div class="gearhead"><img class="gicon" src="${raw(s.item.icon)}" alt="" loading="lazy" style="border-color:${col}">
          <div><h3 style="color:${col};font-size:15px">${esc(s.item.name)}</h3><div class="meta">${esc(s.item.qualityName)}</div></div></div>
        ${s.item.stats ? `<div class="gstats">${esc(s.item.stats)}</div>` : ''}
        <div class="gsrc">${esc(src)}</div></div>`));
    });
    body.append(grid);
    reveal(body);
  }
  draw(); reveal();
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
        <div class="gsrc">${esc(it.sources[0] ? it.sources[0].label : '')}</div></div>`);
      grid.append(card);
    });
    if (!list.length) grid.append(el('<div class="meta">No consumables match.</div>'));
  }
  draw(); reveal();
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
  if (head === 'bestiary') return zonesView();
  if (head === 'gear') return gearView();
  if (head === 'bis') return bisView();
  if (head === 'consumables') return consumablesView();
  if (head === 'classes') return classesView();
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

// global click handler for [data-go]
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go]');
  if (t) { e.preventDefault(); location.hash = t.getAttribute('data-go'); }
});
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
