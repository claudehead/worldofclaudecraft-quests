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
// per-page-load cache-buster for DATA/markdown fetches (raw.githubusercontent +
// Pages both CDN-cache ~5–10 min). Images via raw() stay cacheable. A fresh
// reload always pulls the latest data; within a load it's still cached.
const BUST = Date.now();
const cb = (u) => u + (u.includes('?') ? '&' : '?') + 'cb=' + BUST;

// ---------- localization (the game's own translations) ----------
let LANG = (() => { try { return localStorage.getItem('wc_lang') || 'en'; } catch (e) { return 'en'; } })();
let I18N = {};
const tn = (group, id, fallback) => (LANG !== 'en' && I18N[`${group}:${id}`]) || fallback;
async function loadLang(code) {
  if (code === 'en') { I18N = {}; LANG = 'en'; }
  else { try { I18N = await (await fetch(`i18n/${code}.json`, { cache: 'force-cache' })).json(); LANG = code; } catch { I18N = {}; LANG = 'en'; } }
  try { localStorage.setItem('wc_lang', LANG); } catch (e) {}
}

async function getMd(path) {
  if (mdCache.has(path)) return mdCache.get(path);
  const res = await fetch(cb(raw(path)));
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
    ['#/doc/' + encodeURIComponent('reference/getting-started.md'), '🚀', 'Getting started', `New player? Controls, how to quest, group, trade, chat — and lag fixes.`],
    ['#/quests', '🗺️', 'Quests', `${c.quests} quests across ${c.zones} zones, sorted by level — with maps, rewards, and exact objectives.`],
    ['#/route', '🧭', 'Leveling route', `The fastest 1→20 questing path, zone by zone in level order.`],
    ['#/map', '🗺️', 'World map', `Pan and zoom the whole world — towns, dungeons, delves, camps and quest-givers.`],
    ['#/bestiary', '🐺', 'Bestiary', `Every creature with a model render, stats, kill tactics, and a full loot table.`],
    ['#/npcs', '🧑‍🌾', 'NPCs', `Quest-givers and vendors — where they are, what they offer and sell.`],
    ['#/gear', '🛡️', 'Gear', `Every weapon and armor piece — rarity, stats, and where to get it.`],
    ['#/bis', '✨', 'Best in Slot', `The strongest gear in every slot, per class — with where to get it.`],
    ['#/consumables', '🍖', 'Consumables', `Food, drink, potions and elixirs — what they restore and where to buy them.`],
    ['#/classes', '⚔️', 'Classes', `${c.classes} classes — specs, abilities by learn-level, and model portraits.`],
    ['#/talents', '🌳', 'Talents', `Interactive talent calculator — spend points across class and spec trees.`],
    ['#/dungeons', '🏰', 'Dungeons', `Route maps, rosters and bosses for every instance.`],
    ['#/delves', '🔮', 'Delves', `Tiers, affixes, companions and the Marks vendor.`],
    ['#/augments', '💠', 'Augments', `Class augments and world power-ups — tiers, classes, and effects.`],
    ['#/doc/' + encodeURIComponent('reference/combat.md'), '🧮', 'Combat maths', `How damage, armor, HP, XP and elite scaling actually work.`],
    ['#/doc/' + encodeURIComponent('reference/fishing.md'), '🎣', 'Fishing', `Per-water catch tables, the rare Glimmerfin Koi, and how to fish.`],
    ['#/doc/' + encodeURIComponent('reference/pvp.md'), '⚔️', 'PvP — Coliseum', `1v1, 2v2 and Fiesta arena, plus the mid-match power-ups.`],
    ['#/doc/' + encodeURIComponent('reference/tameable-beasts.md'), '🐾', 'Tameable beasts', `Every beast a Hunter can tame, by level and zone.`],
    ['#/doc/' + encodeURIComponent('reference/warlock-demons.md'), '😈', 'Warlock demons', `All 7 summonable demons, rendered, with stats and roles.`],
    ['#/doc/' + encodeURIComponent('reference/materials.md'), '📦', 'Drops & materials', `Quest items, tools and trade goods — where they drop and what they're for.`],
    ['#/doc/' + encodeURIComponent('reference/world-market.md'), '💰', 'World Market', `The auction house — buying, selling, the Merchant's cut and listing rules.`],
    ['#/assets', '🧊', '3D asset browser', `Spin and inspect every 3D model in the game — hundreds never shown in the guide.`],
    ['#/cosmetics', '🎨', 'Cosmetics', `Event skin tiers and the collectible Combat Mech chromas.`],
    ['#/patches', '📜', 'Patch notes', `What's new — official release notes for every game version.`],
  ];
  app.innerHTML = '';
  app.append(el(`
    <div class="hero">
      <span class="eyebrow reveal">The complete field guide</span>
      <h1 class="reveal">World of<br><span class="accent">Claudecraft</span></h1>
      <p class="sub reveal">Every quest, creature, class, dungeon and delve — rendered live from the source data. Pick a quest at your level and go.</p>
      <div class="cta reveal">
        <span class="btn primary" data-go="#/doc/reference%2Fgetting-started.md">New here? Start guide →</span>
        <span class="btn ghost" data-go="#/quests">Browse quests</span>
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
        <h3>${esc(tn('quests', q.id, q.name))}</h3>
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

let bestiaryData = null;
const RANK_COLOR = { boss: '#e6bb6a', elite: '#e6803a', rare: '#46b8da', normal: '#c8c8cf' };
async function mobsView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Bestiary</span><h2>Creatures</h2>
      <p>Every creature with its model render, level, health, where it lives, and loot. Filter by zone, type, or rank — or <a href="#/zones">browse by zone</a>.</p></div>
    <div class="controls reveal">
      <input class="search" id="msearch" placeholder="Search creatures…">
      <select id="msort" style="padding:9px 12px;border-radius:12px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"><option value="level">Sort: Level ↑</option><option value="levelDown">Level ↓</option><option value="name">Name A–Z</option></select>
      <div class="pills" id="mzones"></div>
    </div>
    <div class="controls reveal" style="margin-top:-12px"><div class="pills" id="mfams"></div></div>
    <div class="controls reveal" style="margin-top:-12px"><div class="pills" id="mranks"></div></div>
    <div class="gearcount meta" id="mcount" style="margin-bottom:14px"></div>
    <div class="grid g-3" id="mgrid"></div>
  </div></section>`));
  if (!bestiaryData) {
    try { bestiaryData = await (await fetch(cb(raw('bestiary/bestiary.json')))).json(); }
    catch (e) { app.querySelector('#mgrid').innerHTML = `<div class="meta">Couldn't load bestiary (${esc(e.message)}).</div>`; return; }
  }
  try { if (!mobStatData) mobStatData = await (await fetch(cb('mobstats.json'))).json(); } catch (e) {}
  try { if (!bossData) bossData = await (await fetch(cb('bosses.json'))).json(); } catch (e) {}
  const mobStatMap = {}; (mobStatData?.mobs || []).forEach((x) => { mobStatMap[x.id] = x; });
  const bossMap = {}; (bossData?.bosses || []).forEach((x) => { bossMap[x.id] = x; });
  const grid = app.querySelector('#mgrid'), count = app.querySelector('#mcount');
  let zone = 'all', fam = 'all', rank = 'all', term = '', sortBy = 'level';
  app.querySelector('#msort').onchange = (e) => { sortBy = e.target.value; draw(); };
  const mkPills = (host, items, onPick) => { items.forEach(([id, label], i) => { const p = el(`<span class="pill ${i === 0 ? 'active' : ''}">${esc(label)}</span>`); p.onclick = () => { host.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); onPick(id); }; host.append(p); }); };
  mkPills(app.querySelector('#mzones'), [['all', 'All zones'], ...bestiaryData.zones], v => { zone = v; draw(); });
  mkPills(app.querySelector('#mfams'), [['all', 'All types'], ...bestiaryData.families], v => { fam = v; draw(); });
  mkPills(app.querySelector('#mranks'), [['all', 'All ranks'], ['boss', 'Boss'], ['elite', 'Elite'], ['rare', 'Rare'], ['normal', 'Normal']], v => { rank = v; draw(); });
  app.querySelector('#msearch').oninput = (e) => { term = e.target.value.toLowerCase(); draw(); };
  function draw() {
    const list = bestiaryData.mobs
      .filter(m => zone === 'all' || m.zoneDir === zone)
      .filter(m => fam === 'all' || m.family === fam)
      .filter(m => rank === 'all' || m.rank === rank)
      .filter(m => !term || m.name.toLowerCase().includes(term));
    list.sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : (sortBy === 'levelDown' ? (b.level - a.level) : (a.level - b.level)) || a.name.localeCompare(b.name));
    count.textContent = `${list.length} of ${bestiaryData.count} creatures`;
    grid.innerHTML = '';
    list.slice(0, 240).forEach(m => {
      const col = RANK_COLOR[m.rank] || '#ccc';
      const rankTag = m.rank !== 'normal' ? `<span class="tag" style="color:${col}">${m.rank[0].toUpperCase() + m.rank.slice(1)}</span>` : '';
      const loot = m.loot.length ? ('Drops: ' + m.loot.slice(0, 3).map(l => esc(l.name) + (l.chance ? ` <span class="droppct">${Math.round(l.chance * 100)}%</span>` : '')).join(', ') + (m.loot.length > 3 ? ` +${m.loot.length - 3}` : '')) : 'No notable drops';
      const st = mobStatMap[m.id];
      const lvl = m.minLevel === m.maxLevel ? ('Lvl ' + m.level) : ('Lvl ' + m.minLevel + '–' + m.maxLevel);
      const card = el(`<div class="card gearcard" style="cursor:pointer">
        <div class="gearhead">
          ${m.render ? `<img class="gicon" src="${raw(m.render)}" alt="" loading="lazy" style="border-color:${col}">` : `<div class="gicon" style="border-color:${col}"></div>`}
          <div><h3 style="color:${col}">${esc(m.name)}</h3>
            <div class="meta">${lvl}${m.rank !== 'normal' ? ' · ' + m.rank[0].toUpperCase() + m.rank.slice(1) : ''} · ${esc(m.familyLabel)}</div></div>
        </div>
        <div class="gstats">❤ ${m.hp} HP${st ? ` · ⚔ ${st.dmgMin}–${st.dmgMax} · ${st.dps} dps` : ''}</div>
        <div class="gsrc">📍 ${esc(m.zoneTitle || (st && st.zones ? st.zones.join(', ') : '—'))}${m.loot.length ? ` · ${m.loot.length} drop${m.loot.length === 1 ? '' : 's'}` : ''} ${rankTag}</div>
      </div>`);
      card.onclick = () => openMobDetail(m, mobStatMap[m.id], bossMap[m.id]);
      grid.append(card);
    });
    if (!list.length) grid.append(el('<div class="meta">No creatures match.</div>'));
    if (list.length > 240) grid.append(el(`<div class="meta">Showing first 240 — refine with filters.</div>`));
  }
  draw(); reveal();
}

const QUALITY_COLOR = { legendary: '#e6803a', epic: '#a86bd6', rare: '#46b8da', uncommon: '#5cb85c', common: '#c8c8cf', poor: '#7a7a82' };

// Bestiary creature detail — a modal pulling together portrait, combat stats,
// full loot, and (for bosses) mechanics.
function openMobDetail(m, st, boss) {
  const col = RANK_COLOR[m.rank] || '#ccc';
  const lvl = m.minLevel === m.maxLevel ? ('Level ' + m.level) : ('Level ' + m.minLevel + '–' + m.maxLevel);
  const sRow = (k, v) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:4px 0;border-bottom:1px solid var(--line,#262626)"><span class="meta">${k}</span><b>${v}</b></div>`;
  const combat = st
    ? sRow('Health', st.hp + ' HP') + sRow('Damage', st.dmgMin + '–' + st.dmgMax + ' @ ' + st.attackSpeed + 's') + sRow('DPS', st.dps) + sRow('Armor', st.armor) + (st.spawns ? sRow('Spawns in world', st.spawns) : '')
    : (m.hp ? sRow('Health', m.hp + ' HP') + '<p class="meta" style="margin:6px 0 0">Detailed damage/armor stats aren\'t published for dungeon-only mobs.</p>' : '<p class="meta" style="margin:4px 0">No combat stats.</p>');
  const loot = m.loot && m.loot.length
    ? m.loot.map((l) => `<li style="color:${QUALITY_COLOR[l.quality] || '#fff'}">${esc(l.name)}${l.chance ? ` <span class="meta" style="color:var(--muted-2,#888)">${Math.round(l.chance * 100)}%</span>` : ''}</li>`).join('')
    : '<li class="meta">No notable drops</li>';
  const mech = boss && boss.tips && boss.tips.length
    ? `<h4 style="margin:16px 0 6px;font-size:15px">Mechanics</h4><ul style="margin:0;padding-left:18px;line-height:1.7">${boss.tips.map((t) => `<li>${esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('')}</ul>`
    : '';
  const ov = el(`<div style="position:fixed;inset:0;z-index:120;background:rgba(6,8,6,.72);backdrop-filter:blur(6px);display:flex;justify-content:center;align-items:flex-start;padding:7vh 16px;overflow-y:auto">
    <div class="card" style="width:min(560px,94vw);cursor:default;padding:20px 22px">
      <div style="display:flex;gap:16px;align-items:flex-start">
        ${m.render ? `<img src="${raw(m.render)}" alt="" loading="lazy" style="width:96px;height:96px;object-fit:contain;border:2px solid ${col};border-radius:12px;background:rgba(0,0,0,.25);flex:none">` : ''}
        <div style="min-width:0"><h2 style="margin:0;color:${col};font-size:22px">${esc(m.name)}</h2>
          <div class="meta" style="margin-top:4px">${lvl} · ${m.rank[0].toUpperCase() + m.rank.slice(1)} · ${esc(m.familyLabel)}</div>
          <div class="meta" style="margin-top:2px">📍 ${esc(m.zoneTitle || (st && st.zones ? st.zones.join(', ') : '—'))}${m.location ? ' · ' + esc(m.location) : ''}</div></div>
      </div>
      <h4 style="margin:16px 0 6px;font-size:15px">Combat</h4>${combat}
      <h4 style="margin:16px 0 6px;font-size:15px">Loot ${m.loot && m.loot.length ? `<span class="meta" style="font-weight:400">(${m.loot.length})</span>` : ''}</h4>
      <ul style="margin:0;padding-left:18px;line-height:1.75">${loot}</ul>
      ${mech}
      <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">
        <span class="btn ghost" data-go="#/solo" style="font-size:13px;padding:8px 14px">⚔ Can I solo this?</span>
        <span class="btn ghost mobclose" style="font-size:13px;padding:8px 14px">Close ✕</span>
      </div>
    </div></div>`);
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
  // close only on a true backdrop click — don't stopPropagation inside the card,
  // or the global [data-go] navigation handler on document never fires.
  ov.onclick = (e) => { if (e.target === ov) close(); };
  ov.querySelector('.mobclose').onclick = close;
  // the data-go link navigates via the global handler; just dismiss the modal too
  ov.querySelector('[data-go]').addEventListener('click', close);
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  document.body.append(ov);
}
// Render an item source; for drops, link each mob to its bestiary entry.
function sourceHTML(src) {
  if (!src) return '';
  if (src.type === 'drop' && Array.isArray(src.mobs)) {
    const pct = (c) => c ? ` <span class="droppct">${Math.round(c * 100)}%</span>` : '';
    const parts = src.mobs.slice(0, 3).map(m => (m.dir
      ? `<a href="#/doc/${encodeURIComponent('quests/zones/' + m.dir + '/bestiary.md')}/${encodeURIComponent('mob-' + m.id)}">${esc(m.name)}</a>`
      : esc(m.name)) + pct(m.chance));
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
    <div class="controls reveal" style="margin-top:-12px"><div class="pills" id="gclasses"></div></div>
    <div class="gearcount meta" id="gcount" style="margin-bottom:14px"></div>
    <div class="grid g-3" id="ggrid"></div>
  </div></section>`));
  if (!gearData) {
    try { gearData = await (await fetch(cb(raw('gear/gear.json')))).json(); }
    catch (e) { app.querySelector('#ggrid').innerHTML = `<div class="meta">Couldn't load gear (${esc(e.message)}).</div>`; return; }
  }
  const grid = app.querySelector('#ggrid'), count = app.querySelector('#gcount');
  let slot = 'all', qual = 'all', src = 'all', term = '', cls = 'all';
  const CLASSES = ['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest', 'Shaman', 'Mage', 'Warlock', 'Druid'];
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
  mkPills(app.querySelector('#gclasses'), [['all', 'Any class'], ...CLASSES.map(c => [c, c])], v => { cls = v; draw(); });
  app.querySelector('#gsearch').oninput = (e) => { term = e.target.value.toLowerCase(); draw(); };

  function draw() {
    const list = gearData.gear
      .filter(g => slot === 'all' || g.slot === slot)
      .filter(g => qual === 'all' || g.quality === qual)
      .filter(g => src === 'all' || g.sources.some(s => s.type === src))
      .filter(g => cls === 'all' || g.usable === null || g.usable.includes(cls))
      .filter(g => !term || g.name.toLowerCase().includes(term));
    count.textContent = `${list.length} of ${gearData.count} items`;
    grid.innerHTML = '';
    list.slice(0, 240).forEach(g => {
      const col = QUALITY_COLOR[g.quality] || '#ccc';
      const src = sourceHTML(g.sources[0]);
      const card = el(`<div class="card gearcard">
        <div class="gearhead">
          <img class="gicon" src="${raw(g.icon)}" alt="" loading="lazy" style="border-color:${col}">
          <div><h3 style="color:${col}">${esc(tn("items",g.id,g.name))}</h3>
            <div class="meta">${esc(g.qualityName)} · ${esc(g.slotLabel)}${g.armorType ? ' · ' + esc(g.armorType[0].toUpperCase() + g.armorType.slice(1)) : ''}</div></div>
        </div>
        ${g.stats ? `<div class="gstats">${esc(g.stats)}</div>` : ''}
        <div class="grestrict">${g.restrict ? '🔒 ' + esc(g.restrict) : 'Usable by all classes'}${g.reqLevel ? ' · Requires level ' + g.reqLevel : ''}${g.ilvl ? ' · ilvl ' + g.ilvl : ''}</div>
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
async function worldMapView(fx, fz) {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">World map</span><h2>The world of Claudecraft</h2>
      <p>All four zones, north to south. Drag to pan, scroll to zoom, hover a marker for its name, click to open its page. Toggle layers below.</p></div>
    <div class="controls reveal"><div class="pills" id="wlayers"></div></div>
    <div class="worldmap reveal" id="wmap"><div class="wtip" id="wtip"></div></div>
  </div></section>`));
  if (!worldData) {
    try { worldData = await (await fetch(cb('world-map.json'))).json(); }
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
    const t = mk('text', { x: b.minX + 8, y: bd.zMin + 22, fill: '#cfe3d6', 'font-size': 22, 'font-weight': 'bold', stroke: '#0a0c0e', 'stroke-width': 0.7, 'paint-order': 'stroke', opacity: 0.85 }); t.textContent = `${bd.title} · ${bd.levelRange[0]}–${bd.levelRange[1]}`; svg.append(t);
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
    const t = mk('text', { x: m.x + cfg.r + 2, y: m.z + 3.5, fill: '#e8e8ea', 'font-size': 9, stroke: '#0a0c0e', 'stroke-width': 0.5, 'paint-order': 'stroke', class: 'wlabel' });
    t.textContent = m.label; t.style.pointerEvents = 'none';
    layers[m.type].append(t);
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

  // labels toggle (off by default — names show on hover otherwise)
  const lh = app.querySelector('#wlayers');
  const lblPill = el(`<span class="pill">🏷 Labels</span>`);
  lblPill.onclick = () => { const on2 = svg.classList.toggle('labels'); lblPill.classList.toggle('active', on2); };
  lh.append(lblPill);
  // layer toggles
  for (const type of Object.keys(MARKER)) {
    const cfg = MARKER[type];
    const p = el(`<span class="pill active"><span class="ldot" style="background:${cfg.color}"></span> ${cfg.label}</span>`);
    p.onclick = () => { on[type] = !on[type]; p.classList.toggle('active', on[type]); layers[type].style.display = on[type] ? '' : 'none'; };
    lh.append(p);
  }

  // focus on a spawn point (deep-linked from the bestiary: #/map/<x>/<z>)
  const tx = Number(fx), tz = Number(fz);
  if (Number.isFinite(tx) && Number.isFinite(tz)) {
    const span = 220; // zoomed-in window around the point
    vb = { x: tx - span / 2, y: tz - span / 2, w: span, h: span }; apply();
    const ring = mk('circle', { cx: tx, cy: tz, r: 14, fill: 'none', stroke: '#ffd479', 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke', class: 'mapfocus' });
    svg.append(ring);
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
    try { abilityData = await (await fetch(cb(raw('abilities/abilities.json')))).json(); }
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
            <div><h3 style="font-size:15px">${esc(tn("abilities",a.id,a.name))}</h3><div class="meta">Learn at level ${a.learnLevel}${a.rankLevels.length ? ` · ranks ${a.rankLevels.join(', ')}` : ''}</div></div></div>
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
    try { talentData = await (await fetch(cb('talents.json'))).json(); }
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

let patchData = null;
async function patchesView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Patch notes</span><h2>What's new in the game</h2>
      <p>Official release notes for World of Claudecraft, newest first — pulled straight from the upstream releases.</p></div>
    <div class="patchlayout">
      <div class="patchnav" id="patchnav"></div>
      <div class="doc" id="patchbody"></div>
    </div>
  </div></section>`));
  if (!patchData) {
    try { patchData = await (await fetch(cb('patches.json'))).json(); }
    catch (e) { app.querySelector('#patchbody').innerHTML = `<div class="meta">Couldn't load patch notes (${esc(e.message)}).</div>`; return; }
  }
  const nav = app.querySelector('#patchnav'), body = app.querySelector('#patchbody');
  const patches = patchData.patches;
  if (!patches.length) { body.innerHTML = '<div class="meta">No patch notes.</div>'; return; }
  let active = 0;
  patches.forEach((p, i) => {
    const it = el(`<div class="patchitem ${i === 0 ? 'on' : ''}"><span class="pv">${esc(p.version)}</span><span class="pd">${esc(p.date)}</span></div>`);
    it.onclick = () => { active = i; nav.querySelectorAll('.patchitem').forEach(x => x.classList.remove('on')); it.classList.add('on'); draw(); };
    nav.append(it);
  });
  function draw() {
    const p = patches[active];
    body.innerHTML = marked.parse(p.body, { mangle: false, headerIds: false });
    body.querySelectorAll('a').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
    body.prepend(el(`<div class="patchsrc"><a href="${esc(p.url)}" target="_blank" rel="noopener">View ${esc(p.version)} on GitHub →</a></div>`));
    body.scrollIntoView({ block: 'nearest' });
  }
  draw(); reveal();
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
        <span class="routename">${esc(tn('quests', q.id, q.name))}${q.group ? ' 👥' : ''}${q.chain ? ' <span class="routechain">chain</span>' : ''}</span>
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
      <p>The strongest item for each slot your class can get by a given level, picked by a stat-weight model (primary stats first, then armor, weapon DPS, rarity). A guide, not gospel — spec and playstyle shift the edges.</p></div>
    <div class="controls reveal"><div class="pills" id="bisclasses"></div></div>
    <div class="controls reveal" style="margin-top:-4px"><div class="pills" id="bisbuilds"></div></div>
    <div class="controls reveal" style="margin-top:-4px"><div class="pills" id="biszones"></div></div>
    <div id="bisbody"></div>
  </div></section>`));
  if (!bisData) {
    try { bisData = await (await fetch(cb(raw('gear/bis.json')))).json(); }
    catch (e) { app.querySelector('#bisbody').innerHTML = `<div class="meta">Couldn't load BiS (${esc(e.message)}).</div>`; return; }
  }
  const pillHost = app.querySelector('#bisclasses'), body = app.querySelector('#bisbody'), zoneHost = app.querySelector('#biszones'), buildHost = app.querySelector('#bisbuilds');
  // gear-bearing zones, cumulative: best you can have by the END of each zone
  const brackets = M.zones.filter(z => z.key && z.key !== 'temple').map(z => ({ label: z.title, maxLevel: z.levelRange[1], range: z.levelRange }));
  let active = bisData.classes[0].id, bi = brackets.length - 1, bd = 0; // class / zone / build
  // builds() and a build-pill row that rebuilds when the class changes
  const builds = () => (bisData.classes.find(x => x.id === active).builds) || [];
  function renderBuildPills() {
    buildHost.innerHTML = ''; bd = 0;
    const bl = builds();
    buildHost.style.display = bl.length > 1 ? '' : 'none';
    bl.forEach((b, i) => {
      const p = el(`<span class="pill ${i === 0 ? 'active' : ''}">${esc(b.label)}${b.specs && b.specs.length ? ` <span class="bisfromlvl">${esc(b.specs.join('/'))}</span>` : ''}</span>`);
      p.onclick = () => { bd = i; buildHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); draw(); };
      buildHost.append(p);
    });
  }
  bisData.classes.forEach((c, i) => {
    const p = el(`<span class="pill ${i === 0 ? 'active' : ''}">${esc(c.name)}</span>`);
    p.onclick = () => { active = c.id; pillHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); renderBuildPills(); draw(); };
    pillHost.append(p);
  });
  brackets.forEach((b, i) => {
    const p = el(`<span class="pill ${i === bi ? 'active' : ''}">${esc(b.label)} <span class="bisfromlvl">${b.range[0]}–${b.range[1]}</span></span>`);
    p.onclick = () => { bi = i; zoneHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); draw(); };
    zoneHost.append(p);
  });
  // best slot item obtainable by the end of the selected zone (cumulative)
  const itemAt = (s) => {
    const level = brackets[bi].maxLevel;
    if (!s.progression) return s.item;
    let pick = null;
    for (const p of s.progression) { if (p.level <= level) pick = p.item; }
    return pick;
  };
  function draw() {
    const c = bisData.classes.find(x => x.id === active);
    const build = (c.builds || [])[bd] || c.builds[0];
    body.innerHTML = '';
    const head = el(`<div class="bishead reveal">
      <img src="${raw(c.render)}" alt="${esc(c.name)}" class="bisportrait">
      <div><h3>${esc(c.name)} — ${esc(build.label)}</h3><div class="meta">${esc((build.specs || []).join(' · '))} · best gear through ${esc(brackets[bi].label)}</div></div></div>`);
    body.append(head);
    const grid = el(`<div class="grid g-4"></div>`);
    build.slots.forEach(s => {
      const it = itemAt(s);
      if (!it) { grid.append(el(`<div class="card gearcard" style="opacity:.55"><div class="bisslot">${esc(s.slotLabel)}</div><div class="meta">No upgrade yet — quest/vendor gear.</div></div>`)); return; }
      const col = QUALITY_COLOR[it.quality] || '#ccc';
      grid.append(el(`<div class="card gearcard reveal">
        <div class="bisslot">${esc(s.slotLabel)} <span class="bisfromlvl">Lv ${it.level}+</span></div>
        <div class="gearhead"><img class="gicon" src="${raw(it.icon)}" alt="" loading="lazy" style="border-color:${col}">
          <div><h3 style="color:${col};font-size:15px">${esc(tn("items", it.id, it.name))}</h3><div class="meta">${esc(it.qualityName)}</div></div></div>
        ${it.stats ? `<div class="gstats">${esc(it.stats)}</div>` : ''}
        <div class="gsrc">${sourceHTML(it.sources[0])}</div></div>`));
    });
    body.append(grid);
    reveal(body);
  }
  renderBuildPills(); draw(); reveal(); applyPendingSearch();
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
    try { consData = await (await fetch(cb(raw('consumables/consumables.json')))).json(); }
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
          <div><h3 style="color:${col}">${esc(tn("items",it.id,it.name))}</h3><div class="meta">${esc(it.category)}${it.quality !== 'common' ? ' · ' + esc(it.qualityName) : ''}</div></div>
        </div>
        ${it.effect ? `<div class="gstats">${esc(it.effect)}</div>` : ''}
        <div class="gsrc">${sourceHTML(it.sources[0])}</div></div>`);
      grid.append(card);
    });
    if (!list.length) grid.append(el('<div class="meta">No consumables match.</div>'));
  }
  draw(); reveal(); applyPendingSearch();
}

const TIER_COLOR = { silver: '#c8c8cf', gold: '#e6bb6a', prismatic: '#c08bff' };
let augData = null;
async function augmentsView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Augments</span><h2>Augments & power-ups</h2>
      <p>Permanent class augments (slot them to empower your character) and the temporary world power-ups you grab mid-fight.</p></div>
    <div class="controls reveal"><div class="pills" id="augclass"></div></div>
    <div class="grid g-3" id="auggrid"></div>
    <div class="shead reveal" style="margin-top:50px"><h2>World power-ups</h2><p>Temporary buffs from power-up orbs in the world.</p></div>
    <div class="grid g-4" id="powgrid"></div>
  </div></section>`));
  if (!augData) {
    try { augData = await (await fetch(cb(raw('augments/augments.json')))).json(); }
    catch (e) { app.querySelector('#auggrid').innerHTML = `<div class="meta">Couldn't load augments (${esc(e.message)}).</div>`; return; }
  }
  const classes = [...new Set(augData.augments.flatMap(a => a.classes))].sort();
  let cls = 'all';
  const ph = app.querySelector('#augclass'), grid = app.querySelector('#auggrid');
  [['all', 'All classes'], ...classes.map(c => [c, c[0].toUpperCase() + c.slice(1)])].forEach(([id, label], i) => {
    const p = el(`<span class="pill ${i === 0 ? 'active' : ''}">${esc(label)}</span>`);
    p.onclick = () => { cls = id; ph.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); draw(); };
    ph.append(p);
  });
  function draw() {
    grid.innerHTML = '';
    augData.augments.filter(a => cls === 'all' || a.classes.includes(cls))
      .sort((a, b) => augData.tiers.indexOf(b.tier) - augData.tiers.indexOf(a.tier) || a.name.localeCompare(b.name))
      .forEach(a => {
        const col = TIER_COLOR[a.tier] || '#ccc';
        grid.append(el(`<div class="card augcard">
          <div class="augtop"><h3 style="color:${col}">${esc(a.name)}</h3><span class="tag" style="border-color:${col}55;color:${col}">${esc(a.tier)}</span></div>
          <div class="gstats">${esc(a.description)}</div>
          <div class="gsrc">${esc(a.category)} · ${a.classes.length >= 6 ? 'most classes' : a.classes.map(c => c[0].toUpperCase() + c.slice(1)).join(', ')}</div></div>`));
      });
  }
  draw();
  const pg = app.querySelector('#powgrid');
  augData.powerups.forEach(p => pg.append(el(`<div class="card"><h3>${esc(p.name)}</h3><div class="meta">${p.duration}s</div><div class="gstats">${p.effects.map(esc).join('<br>')}</div></div>`)));
  reveal();
}

let cosmeticData = null;
async function cosmeticsView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Cosmetics</span><h2>Skins & chromas</h2>
      <p>The cosmetic system — event skin tiers and the collectible Combat Mech colour chromas.</p></div>
    <div id="cosbody"></div></div></section>`));
  if (!cosmeticData) {
    try { cosmeticData = await (await fetch(cb(raw('cosmetics/cosmetics.json')))).json(); }
    catch (e) { app.querySelector('#cosbody').innerHTML = `<div class="meta">Couldn't load cosmetics (${esc(e.message)}).</div>`; return; }
  }
  const body = app.querySelector('#cosbody');
  const RC = { uncommon: '#5cb85c', rare: '#46b8da', epic: '#a86bd6', legendary: '#e6803a' };
  body.append(el(`<h3 style="margin:0 0 12px">Event skins</h3>`));
  const et = el('<div class="grid g-3" style="margin-bottom:40px"></div>');
  cosmeticData.eventTiers.forEach(t => et.append(el(`<div class="card"><h3 style="color:${RC[t.rank] || '#ccc'}">${t.rank[0].toUpperCase() + t.rank.slice(1)}</h3><div class="meta">Skin variant ${t.skin}</div></div>`)));
  body.append(et);
  body.append(el(`<h3 style="margin:0 0 12px">Combat Mech chromas <span class="meta" style="font-weight:400">· ${cosmeticData.mechChromas.length}</span></h3>`));
  const cg = el('<div class="grid g-4"></div>');
  cosmeticData.mechChromas.forEach(c => {
    const col = RC[c.rank] || '#ccc';
    cg.append(el(`<div class="card" style="text-align:center"><img class="chromaimg" src="${raw(c.render)}" alt="${esc(c.name)}" loading="lazy" style="border-color:${col}"><h3 style="font-size:15px;text-transform:capitalize">${esc(c.name)}</h3><div class="meta" style="color:${col}">${esc(c.rank)}</div></div>`));
  });
  body.append(cg);
  reveal();
}

// ---------- 3D asset browser ----------
let assetData = null, _threeMods = null;
async function ensureThree() {
  if (_threeMods) return _threeMods;
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js');
  _threeMods = { THREE, GLTFLoader, OrbitControls, MeshoptDecoder };
  return _threeMods;
}
async function assetsView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">3D assets</span><h2>Asset browser</h2>
      <p>Every 3D model in the game — spin, zoom and inspect them live. Most never appear in the guide: creatures, foliage, props, weapons and dungeon pieces. Drag to orbit, scroll to zoom.</p></div>
    <div class="controls reveal"><input class="search" id="asearch" placeholder="Search models…"><div class="pills" id="acats"></div></div>
    <div class="assetwrap reveal">
      <div class="assetviewer"><div id="aviewer" class="aviewer"></div><div class="amodelname" id="amodelname">Pick a model →</div></div>
      <div class="assetlist" id="alist"></div>
    </div>
  </div></section>`));
  if (!assetData) {
    try { assetData = await (await fetch(cb('assets.json'))).json(); }
    catch (e) { app.querySelector('#alist').innerHTML = `<div class="meta">Couldn't load assets (${esc(e.message)}).</div>`; return; }
  }
  const list = app.querySelector('#alist'), catHost = app.querySelector('#acats'), nameEl = app.querySelector('#amodelname');
  const base = `https://raw.githubusercontent.com/${assetData.repo}/${assetData.ref}/public/`;
  let cat = 'all', term = '';
  [['all', `All (${assetData.count})`], ...assetData.categories.map(c => [c.id, `${c.label} (${c.count})`])].forEach(([id, label], i) => {
    const p = el(`<span class="pill ${i === 0 ? 'active' : ''}">${esc(label)}</span>`);
    p.onclick = () => { cat = id; catHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); draw(); };
    catHost.append(p);
  });
  app.querySelector('#asearch').oninput = e => { term = e.target.value.toLowerCase(); draw(); };

  // viewer (created lazily on first model open, reused after)
  let viewer = null;
  async function openModel(a) {
    nameEl.textContent = a.name + ' · ' + (assetData.categories.find(c => c.id === a.cat)?.label || a.cat);
    const host = app.querySelector('#aviewer');
    host.innerHTML = '<div class="aspin"><div class="spinner"></div></div>';
    let mods;
    try { mods = await ensureThree(); } catch (e) { host.innerHTML = `<div class="meta" style="padding:20px">3D viewer needs internet to load three.js. ${esc(e.message)}</div>`; return; }
    const { THREE, GLTFLoader, OrbitControls, MeshoptDecoder } = mods;
    if (!viewer) {
      const canvas = document.createElement('canvas');
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 5000);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 1.1));
      const k = new THREE.DirectionalLight(0xffffff, 1.4); k.position.set(3, 5, 4); scene.add(k);
      const f = new THREE.DirectionalLight(0xffffff, 0.5); f.position.set(-4, 1, -2); scene.add(f);
      const controls = new OrbitControls(camera, canvas); controls.enableDamping = true;
      const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
      viewer = { canvas, renderer, scene, camera, controls, loader, cur: null };
      viewer.resize = () => { const r = host.getBoundingClientRect(); const w = r.width || 480, h = r.height || 380; renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
      (function loop() { if (!document.contains(host)) { renderer.dispose(); viewer = null; return; } controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); })();
    }
    const v = viewer;
    host.innerHTML = ''; host.append(v.canvas); v.resize();
    try {
      const gltf = await v.loader.loadAsync(base + a.path);
      if (v.cur) v.scene.remove(v.cur);
      const model = gltf.scene; v.scene.add(model); v.cur = model;
      if (gltf.animations && gltf.animations.length) { const m = new THREE.AnimationMixer(model); m.clipAction(gltf.animations[0]).play(); m.update(0.5); }
      model.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(model), size = new THREE.Vector3(), c = new THREE.Vector3();
      box.getSize(size); box.getCenter(c); model.position.sub(c);
      const r = Math.max(size.x, size.y, size.z) || 1, d = r / Math.tan(v.camera.fov * Math.PI / 360) * 1.4;
      v.camera.position.set(d * 0.6, r * 0.5, d); v.camera.near = r / 100; v.camera.far = r * 100; v.camera.updateProjectionMatrix();
      v.controls.target.set(0, 0, 0); v.controls.update();
    } catch (e) { host.innerHTML = `<div class="meta" style="padding:20px">Couldn't load this model (${esc(e.message)}).</div>`; }
  }

  function draw() {
    list.innerHTML = '';
    const items = assetData.assets.filter(a => cat === 'all' || a.cat === cat).filter(a => !term || a.name.toLowerCase().includes(term) || a.path.toLowerCase().includes(term));
    for (const a of items.slice(0, 400)) {
      const b = el(`<button class="assetrow"><span class="assetname">${esc(a.name)}</span><span class="assetcat">${esc(a.sub || a.cat)}</span></button>`);
      b.onclick = () => { list.querySelectorAll('.assetrow').forEach(x => x.classList.remove('on')); b.classList.add('on'); openModel(a); };
      list.append(b);
    }
    if (items.length > 400) list.append(el(`<div class="meta" style="padding:8px">+${items.length - 400} more — narrow with search.</div>`));
    if (!items.length) list.append(el('<div class="meta" style="padding:8px">No models match.</div>'));
  }
  draw(); reveal();
}

let npcData = null;
async function npcsView() {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">NPCs</span><h2>Who's who</h2>
      <p>Every quest-giver and vendor — where to find them, what quests they offer, and what they sell.</p></div>
    <div class="controls reveal"><input class="search" id="nsearch" placeholder="Search NPCs…"><div class="pills" id="nzones"></div></div>
    <div class="grid g-3" id="ngrid"></div>
  </div></section>`));
  if (!npcData) {
    try { npcData = await (await fetch(cb(raw('npcs/npcs.json')))).json(); }
    catch (e) { app.querySelector('#ngrid').innerHTML = `<div class="meta">Couldn't load NPCs (${esc(e.message)}).</div>`; return; }
  }
  const grid = app.querySelector('#ngrid'); let zone = 'all', term = '';
  const zh = app.querySelector('#nzones');
  [['all', 'All zones'], ...npcData.zones.map(z => [z, z])].forEach(([id, label], i) => {
    const p = el(`<span class="pill ${i === 0 ? 'active' : ''}">${esc(label)}</span>`);
    p.onclick = () => { zone = id; zh.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); draw(); };
    zh.append(p);
  });
  app.querySelector('#nsearch').oninput = e => { term = e.target.value.toLowerCase(); draw(); };
  function draw() {
    grid.innerHTML = '';
    npcData.npcs.filter(n => zone === 'all' || n.zone === zone).filter(n => !term || n.name.toLowerCase().includes(term) || (n.title || '').toLowerCase().includes(term)).forEach(n => {
      const quests = n.quests.length ? `<div class="npcquests"><span class="npclbl">Quests</span>${n.quests.map(q => `<a href="#/doc/${encodeURIComponent(q.file)}">${esc(q.name)}</a>`).join('')}</div>` : '';
      const vend = n.market ? `<div class="npcvend"><span class="npclbl">Sells</span> the World Market (auction house)</div>` : (n.vendorItems.length ? `<div class="npcvend"><span class="npclbl">Sells</span> ${n.vendorItems.slice(0, 6).map(esc).join(', ')}${n.vendorItems.length > 6 ? `, +${n.vendorItems.length - 6} more` : ''}</div>` : '');
      grid.append(el(`<div class="card npccard">
        <div class="npchead"><img class="npcimg" src="${raw(n.render)}" alt="" loading="lazy">
          <div><h3>${esc(n.name)}</h3><div class="meta">${esc(n.title)}</div>
            <div class="npcloc">${esc(n.zone)} · ~x:${n.pos.x}, z:${n.pos.z}</div></div></div>
        ${n.greeting ? `<div class="npcgreet">“${esc(n.greeting)}”</div>` : ''}
        ${quests}${vend}</div>`));
    });
    if (!grid.children.length) grid.append(el('<div class="meta">No NPCs match.</div>'));
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
  try { questMaps = await (await fetch(cb(raw('quests/quest-maps.json')))).json(); }
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
  try { voiceData = await (await fetch(cb('voice.json'))).json(); }
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

// ---------- walkable 3D dungeon ----------
let dungeon3dData = null;
const _d3dModels = {};
// WebXR "Enter VR" button — appends to `wrap`, manages the immersive session,
// and calls onState(true/false) on enter/exit. No-op if the device/browser
// has no immersive-vr support (so desktop visitors never see it).
async function addVrButton(renderer, wrap, onState) {
  if (!navigator.xr || !navigator.xr.isSessionSupported) return;
  let ok = false; try { ok = await navigator.xr.isSessionSupported('immersive-vr'); } catch (e) {}
  if (!ok) return;
  const btn = el(`<button class="vrbtn" style="position:absolute;right:14px;top:14px;z-index:6;padding:8px 14px;border-radius:8px;border:1px solid #888;background:#111;color:#fff;font:600 13px system-ui;cursor:pointer">🥽 Enter VR</button>`);
  let session = null;
  btn.onclick = async () => {
    if (session) { session.end(); return; }
    try { session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] }); }
    catch (e) { btn.textContent = 'VR unavailable'; return; }
    renderer.xr.setReferenceSpaceType('local-floor');
    await renderer.xr.setSession(session);
    btn.textContent = '🚪 Exit VR'; onState && onState(true);
    session.addEventListener('end', () => { session = null; btn.textContent = '🥽 Enter VR'; onState && onState(false); });
  };
  wrap.append(btn);
}
// Per-frame XR controller read: left stick -> {fwd, strafe}, right stick X -> snap-turn step (debounced).
function readXrSticks(renderer, snap) {
  const out = { fwd: 0, strafe: 0, turn: 0 };
  if (!renderer.xr.isPresenting) return out;
  const s = renderer.xr.getSession(); if (!s) return out;
  for (const src of s.inputSources) {
    const gp = src.gamepad; if (!gp || !gp.axes) continue;
    const ax = gp.axes, x = ax.length > 2 ? ax[2] : ax[0] || 0, y = ax.length > 3 ? ax[3] : ax[1] || 0;
    if (src.handedness === 'right') { if (Math.abs(x) > 0.7 && !snap.armed) { out.turn = Math.sign(x); snap.armed = true; } if (Math.abs(x) < 0.3) snap.armed = false; }
    else { out.fwd += -y; out.strafe += x; }
  }
  return out;
}
async function dungeon3dView(sel) {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">3D · walkable</span><h2>Explore a dungeon</h2>
      <p>Walk the real instance in first person. <b>Click the scene</b> to look, <b>WASD</b> / arrows to move, <b>Esc</b> to release. Models are the actual enemies (gold = boss). Press Esc, then <b>click a minimap dot</b> to open that page.</p></div>
    <div class="controls reveal"><div class="pills" id="d3dpick"></div></div>
    <div class="d3dwrap" style="position:relative;border:1px solid var(--line,#222);border-radius:12px;overflow:hidden;background:#05060a">
      <canvas id="d3dcanvas" style="display:block;width:100%;height:70vh;touch-action:none"></canvas>
      <div id="d3dhint" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 16px system-ui;color:#eee;background:rgba(0,0,0,.45);cursor:pointer;text-align:center">Click to enter · WASD to move · mouse to look · Esc to exit</div>
      <canvas id="d3dmap" width="170" height="230" title="Click a dot for its page" style="position:absolute;right:10px;top:10px;background:rgba(5,6,10,.72);border:1px solid #333;border-radius:8px;cursor:pointer"></canvas>
      <div id="d3dhud" class="meta" style="position:absolute;left:10px;bottom:8px;font-size:12px;color:#cfcfd6;text-shadow:0 1px 2px #000"></div>
      <div id="d3dload" style="position:absolute;left:10px;top:10px;font:600 12px system-ui;color:#e6bb6a;background:rgba(0,0,0,.5);padding:4px 8px;border-radius:6px">Loading models…</div>
    </div>
  </div></section>`));
  if (!dungeon3dData) {
    try { dungeon3dData = await (await fetch(cb(raw('docs/dungeon3d.json')))).json(); }
    catch (e) { app.querySelector('#d3dhint').textContent = `Couldn't load dungeon (${esc(e.message)})`; return; }
  }
  const mods = await ensureThree();
  const SkeletonUtils = await import('three/addons/utils/SkeletonUtils.js');
  const { THREE, GLTFLoader, MeshoptDecoder } = mods;
  const MODEL_BASE = `https://raw.githubusercontent.com/${dungeon3dData.modelRepo}/${dungeon3dData.modelRef}/public/`;
  const loader = new GLTFLoader(); try { loader.setMeshoptDecoder(MeshoptDecoder); } catch (e) {}
  const loadModel = (url) => _d3dModels[url] || (_d3dModels[url] = loader.loadAsync(MODEL_BASE + url).then(g => g.scene).catch(() => null));

  const list = dungeon3dData.dungeons;
  let current = list.find(d => d.id === sel) || list[0];
  const pick = app.querySelector('#d3dpick');
  list.forEach((d) => {
    const p = el(`<span class="pill ${d.id === current.id ? 'active' : ''}">${esc(d.name)}</span>`);
    p.onclick = () => { location.hash = `#/explore/${d.id}`; };
    pick.append(p);
  });

  const canvas = app.querySelector('#d3dcanvas');
  const hint = app.querySelector('#d3dhint');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.xr.enabled = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  scene.fog = new THREE.Fog(0x0a0c12, 60, 260);
  const cam = new THREE.PerspectiveCamera(75, 1, 0.1, 600);
  const rig = new THREE.Object3D(); rig.position.set(0, 3, 0); rig.add(cam); scene.add(rig);
  const snap = { armed: false };
  let inVR = false;
  addVrButton(renderer, app.querySelector('.d3dwrap'), (on) => { inVR = on; rig.position.y = on ? 0 : 3; });
  let yaw = Math.PI, pitch = 0; // rig.rotation.y = yaw, cam.rotation.x = pitch
  const lamp = new THREE.PointLight(0xffe6b0, 1.3, 70, 1.4); lamp.position.set(0, 1.5, 0); cam.add(lamp); // head-lamp follows the view
  const INTERIOR_TINT = { crypt: 0x3a3f4a, sanctum: 0x4a4036, temple: 0x2f3a44, nythraxis: 0x402a3a };
  const stone = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 });
  const labelSprite = (text, color) => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const x = cv.getContext('2d');
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, 256, 64); x.font = 'bold 26px system-ui'; x.fillStyle = color; x.textAlign = 'center'; x.fillText(text.slice(0, 18), 128, 42);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }));
  };

  async function build(d) {
    scene.add(new THREE.AmbientLight(0x9aa6b8, 1.2));
    const dl = new THREE.DirectionalLight(0xfff2d8, 0.95); dl.position.set(10, 40, 5); scene.add(dl);
    const f = d.floor, len = f.z1 - f.z0, wid = f.x1 - f.x0, cz = (f.z0 + f.z1) / 2, cxw = (f.x0 + f.x1) / 2;
    const tint = INTERIOR_TINT[d.interior] || 0x3a3f4a;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(wid + 2, 1, len), stone(tint)); floor.position.set(cxw, -0.5, cz); scene.add(floor);
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(wid + 2, 0.5, len), stone(0x14161c)); ceil.position.set(cxw, d.wall.height, cz); scene.add(ceil);
    const wallMat = stone(0x6b7079);
    const mkWall = (w, h, dd, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), wallMat); m.position.set(x, y, z); scene.add(m); };
    mkWall(2, d.wall.height, len, d.wall.x, d.wall.height / 2, cz);
    mkWall(2, d.wall.height, len, -d.wall.x, d.wall.height / 2, cz);
    mkWall(wid + 6, d.wall.height, 2, cxw, d.wall.height / 2, f.z0);
    mkWall(wid + 6, d.wall.height, 2, cxw, d.wall.height / 2, f.z1);
    // interior props — real KayKit dungeon models, with box fallbacks
    const pr = d.props || {}, PM = dungeon3dData.propModels || {};
    const pillarMat = stone(0x52565d), tombMat = stone(0x5a5f66);
    const placeProp = async (url, x, z, { targetH = null, rotY = 0 } = {}) => {
      const tmpl = url ? await loadModel(url) : null; if (!tmpl) return false;
      const o = tmpl.clone(true);
      let box = new THREE.Box3().setFromObject(o); const bh = (box.max.y - box.min.y) || 1;
      if (targetH) o.scale.setScalar(targetH / bh);
      box = new THREE.Box3().setFromObject(o); o.position.set(x, -box.min.y, z); o.rotation.y = rotY;
      scene.add(o); return true;
    };
    let torchBudget = 8;
    for (let i = 0; i < (pr.pillars || []).length; i++) {
      const p = pr.pillars[i];
      const ok = await placeProp(PM.pillar, p.x, p.z, { targetH: d.wall.height });
      if (!ok) { const c = new THREE.Mesh(new THREE.CylinderGeometry((pr.pillarR || 1) * 1.4, (pr.pillarR || 1) * 1.6, d.wall.height, 12), pillarMat); c.position.set(p.x, d.wall.height / 2, p.z); scene.add(c); }
      if (i % 2 === 0 && torchBudget > 0) { // torch + warm light on every other pillar (capped)
        const tx = p.x + (p.x < 0 ? 1.4 : -1.4);
        await placeProp(PM.torch, tx, p.z, { targetH: 2.4 });
        const pl = new THREE.PointLight(0xffa64d, 1.1, 26, 1.6); pl.position.set(tx, 4.2, p.z); scene.add(pl); torchBudget--;
      }
    }
    for (const t of (pr.tombs || [])) {
      const ok = await placeProp(PM.tomb, t.x, t.z, { targetH: 1.4, rotY: t.x < 0 ? Math.PI / 2 : -Math.PI / 2 });
      if (!ok) { const b = new THREE.Mesh(new THREE.BoxGeometry((pr.tombHW || 1.1) * 2, 1.6, (pr.tombHD || 2.1) * 2), tombMat); b.position.set(t.x, 0.8, t.z); scene.add(b); }
    }
    if (pr.dais) { const da = new THREE.Mesh(new THREE.CylinderGeometry(pr.dais.r, pr.dais.r + 0.5, 1, 32), new THREE.MeshStandardMaterial({ color: 0x3a2f44, emissive: 0x140d1c, roughness: 0.9 })); da.position.set(pr.dais.x, 0.5, pr.dais.z); scene.add(da); await placeProp(PM.chest, pr.dais.x, pr.dais.z - pr.dais.r * 0.5, { targetH: 1.4 }); }
    // entry pad + exit ring
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.2, 24), new THREE.MeshStandardMaterial({ color: 0x4caf50, emissive: 0x1b5e20 })); pad.position.set(d.entry.x, 0.1, d.entry.z); scene.add(pad);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2, 0.3, 12, 32), new THREE.MeshStandardMaterial({ color: 0xe6bb6a, emissive: 0x6a4a16 })); ring.rotation.x = Math.PI / 2; ring.position.set(d.exit.x, 2, d.exit.z); scene.add(ring);
    // camera at entry, facing down the corridor (+z)
    rig.position.set(d.entry.x, 3, d.entry.z); yaw = Math.PI; pitch = 0;
    // spawns: real models (fallback marker)
    for (const s of d.spawns) {
      let placed = false;
      if (s.model && s.model.glb) {
        const tmpl = await loadModel(s.model.glb);
        if (tmpl) {
          const obj = SkeletonUtils.clone(tmpl);
          const tcol = s.model.tint ? new THREE.Color(s.model.tint) : null, ts = s.model.tintStrength || 0;
          obj.traverse(o => { if (o.isMesh && o.material) { o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { if (tcol && m.color) m.color.lerp(tcol, ts); }); } });
          let box = new THREE.Box3().setFromObject(obj); const bh = (box.max.y - box.min.y) || 1;
          obj.scale.setScalar(((s.model.height || 2.2) * (s.scale || 1)) / bh);
          box = new THREE.Box3().setFromObject(obj); obj.position.set(s.x, -box.min.y, s.z); obj.rotation.y = Math.PI;
          scene.add(obj); placed = true;
        }
      }
      if (!placed) { const isB = s.rank === 'boss'; const h = (isB ? 4 : 2.2) * (s.scale || 1); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, isB ? 1.4 : 0.8, h, 12), new THREE.MeshStandardMaterial({ color: isB ? 0xe6bb6a : 0x99aaaa, emissive: isB ? 0x4a3410 : 0 })); body.position.set(s.x, h / 2, s.z); scene.add(body); }
      if (s.rank === 'boss' || s.rank === 'elite') { const lab = labelSprite(s.name, s.rank === 'boss' ? '#ffd98a' : '#ffb27a'); lab.scale.set(8, 2, 1); lab.position.set(s.x, ((s.model && s.model.height) || 3) * (s.scale || 1) + 1.6, s.z); scene.add(lab); }
    }
    app.querySelector('#d3dload').style.display = 'none';
  }
  await build(current);

  // minimap
  const map = app.querySelector('#d3dmap'), mctx = map.getContext('2d');
  let mapHits = [];
  function drawMap() {
    const f = current.floor, W = map.width, H = map.height, pad = 8;
    const sx = (W - 2 * pad) / (f.x1 - f.x0), sz = (H - 2 * pad) / (f.z1 - f.z0);
    const X = x => pad + (x - f.x0) * sx, Z = z => pad + (z - f.z0) * sz;
    mctx.clearRect(0, 0, W, H);
    mctx.fillStyle = 'rgba(255,255,255,.06)'; mctx.fillRect(pad, pad, W - 2 * pad, H - 2 * pad);
    mctx.fillStyle = '#3a3d44'; (current.props.pillars || []).forEach(p => mctx.fillRect(X(p.x) - 1, Z(p.z) - 1, 2, 2));
    mctx.fillStyle = '#4a4d54'; (current.props.tombs || []).forEach(p => mctx.fillRect(X(p.x) - 2, Z(p.z) - 2, 4, 4));
    const dot = (x, z, c, r) => { mctx.fillStyle = c; mctx.beginPath(); mctx.arc(X(x), Z(z), r, 0, 7); mctx.fill(); };
    dot(current.entry.x, current.entry.z, '#4caf50', 3); dot(current.exit.x, current.exit.z, '#e6bb6a', 3);
    mapHits = [];
    current.spawns.forEach(s => { const c = s.rank === 'boss' ? '#ffd98a' : s.rank === 'elite' ? '#ffb27a' : '#9aa'; const r = s.rank === 'boss' ? 4 : 2; dot(s.x, s.z, c, r); mapHits.push({ x: X(s.x), y: Z(s.z), r: r + 4, s }); });
    const p = rig.position; const hx = -Math.sin(yaw), hz = -Math.cos(yaw);
    mctx.strokeStyle = '#fff'; mctx.lineWidth = 1.5; mctx.beginPath(); mctx.moveTo(X(p.x), Z(p.z)); mctx.lineTo(X(p.x + hx * 8), Z(p.z + hz * 8)); mctx.stroke();
    dot(p.x, p.z, '#fff', 3);
  }
  map.onclick = (e) => {
    const r = map.getBoundingClientRect(); const mx = (e.clientX - r.left) * map.width / r.width, my = (e.clientY - r.top) * map.height / r.height;
    const hit = mapHits.find(h => Math.hypot(h.x - mx, h.y - my) <= h.r);
    if (hit) location.hash = `#/doc/${encodeURIComponent('dungeons/' + current.id + '.md')}`;
  };

  // ---- unified look + move controls (mouse drag + touch + on-screen joystick) ----
  const isTouch = matchMedia('(pointer: coarse)').matches;
  hint.textContent = isTouch ? 'Tap to start · drag to look · use the stick to move' : 'Click & drag to look · WASD / arrows to move';
  const hideHint = () => { hint.style.display = 'none'; };
  hint.onclick = hideHint;
  // drag-to-look (pointer events cover mouse + touch on the canvas)
  let dragId = null, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', e => { hideHint(); dragId = e.pointerId; lx = e.clientX; ly = e.clientY; });
  canvas.addEventListener('pointermove', e => { if (e.pointerId !== dragId) return; yaw -= (e.clientX - lx) * 0.005; pitch -= (e.clientY - ly) * 0.005; pitch = Math.max(-1.2, Math.min(1.2, pitch)); lx = e.clientX; ly = e.clientY; });
  const endDrag = e => { if (e.pointerId === dragId) dragId = null; };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
  // keyboard (desktop)
  const keys = {};
  const kd = e => { keys[e.code] = true; }, ku = e => { keys[e.code] = false; };
  addEventListener('keydown', kd); addEventListener('keyup', ku);
  // on-screen joystick (touch)
  const joy = { vx: 0, vy: 0, on: false };
  const jbase = el(`<div style="position:absolute;left:18px;bottom:18px;width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,.08);border:1px solid #555;touch-action:none;z-index:5;${isTouch ? '' : 'display:none'}"></div>`);
  const jknob = el(`<div style="position:absolute;left:35px;top:35px;width:40px;height:40px;border-radius:50%;background:rgba(230,187,106,.85);pointer-events:none"></div>`);
  jbase.append(jknob); app.querySelector('.d3dwrap').append(jbase);
  const jmove = (cx, cy) => { const r = jbase.getBoundingClientRect(); let dx = cx - (r.left + 55), dy = cy - (r.top + 55); const m = Math.hypot(dx, dy) || 1, cl = Math.min(m, 45); dx = dx / m * cl; dy = dy / m * cl; joy.vx = dx / 45; joy.vy = dy / 45; jknob.style.left = (35 + dx) + 'px'; jknob.style.top = (35 + dy) + 'px'; };
  const jend = () => { joy.on = false; joy.vx = joy.vy = 0; jknob.style.left = '35px'; jknob.style.top = '35px'; };
  jbase.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); joy.on = true; jbase.setPointerCapture(e.pointerId); jmove(e.clientX, e.clientY); });
  jbase.addEventListener('pointermove', e => { if (joy.on) jmove(e.clientX, e.clientY); });
  jbase.addEventListener('pointerup', jend); jbase.addEventListener('pointercancel', jend);
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  resize(); addEventListener('resize', resize);
  const hud = app.querySelector('#d3dhud');
  const bossSpawn = current.spawns.find(s => s.rank === 'boss');

  let last = performance.now();
  function loop(now) {
    if (!document.body.contains(canvas)) { removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('resize', resize); renderer.setAnimationLoop(null); renderer.dispose(); return; }
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const speed = 16 * dt;
    const xr = readXrSticks(renderer, snap);
    if (xr.turn) yaw -= xr.turn * (Math.PI / 6); // 30° snap-turn
    rig.rotation.y = yaw; if (!inVR) cam.rotation.x = pitch; // in VR the headset drives pitch
    let mfwd = 0, ms = 0;
    if (keys['KeyW'] || keys['ArrowUp']) mfwd += 1;
    if (keys['KeyS'] || keys['ArrowDown']) mfwd -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) ms += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) ms -= 1;
    mfwd -= joy.vy; ms += joy.vx;
    mfwd += xr.fwd; ms += xr.strafe;
    if (mfwd || ms) {
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      const p = rig.position, f = current.floor;
      p.x = Math.max(f.x0 + 1, Math.min(f.x1 - 1, p.x + (fx * mfwd + rx * ms) * speed));
      p.z = Math.max(f.z0 + 1.5, Math.min(f.z1 - 1.5, p.z + (fz * mfwd + rz * ms) * speed));
      p.y = inVR ? 0 : 3;
    }
    const p = rig.position;
    let hudText = `${esc(current.name)} · ${current.spawns.length} spawns`;
    if (bossSpawn) hudText += ` · 🟡 ${esc(bossSpawn.name)} ${Math.round(Math.hypot(p.x - bossSpawn.x, p.z - bossSpawn.z))}yd`;
    hud.innerHTML = hudText;
    drawMap();
    renderer.render(scene, cam);
  }
  renderer.setAnimationLoop(loop);
  reveal();
}

// ---------- 3D quest route ----------
let quest3dData = null;
const QSTEP_COLOR = { giver: 0xf0c419, turnin: 0x5cb85c, kill: 0xd9534f, collect: 0x46b8da, interact: 0x9b8cff };
const QSTEP_CSS = { giver: '#f0c419', turnin: '#5cb85c', kill: '#d9534f', collect: '#46b8da', interact: '#9b8cff' };
async function quest3dView(id) {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">3D · in-game route</span><h2>Quest paths</h2>
      <p>The quest rendered in the world — terrain, foliage, NPCs and mobs from the game, with a hero walking the route from giver → objectives → turn-in. Drag to orbit, scroll to zoom. Pick a quest:</p></div>
    <div class="controls reveal" style="position:relative;z-index:30"><select id="qrpick" style="max-width:420px;position:relative;z-index:30;padding:8px 10px;border-radius:8px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></select></div>
    <div style="position:relative;z-index:1;border:1px solid var(--line,#222);border-radius:12px;overflow:hidden;background:#9fbcd6;margin-bottom:14px">
      <canvas id="qrcanvas" style="display:block;width:100%;height:62vh;touch-action:none"></canvas>
      <div id="qrload" style="position:absolute;left:10px;top:10px;font:600 12px system-ui;color:#fff;background:rgba(0,0,0,.5);padding:4px 8px;border-radius:6px">Building the world…</div>
    </div>
    <div id="qrsteps" class="meta"></div>
  </div></section>`));
  if (!quest3dData) {
    try { quest3dData = await (await fetch(cb(raw('docs/quest3d.json')))).json(); }
    catch (e) { app.querySelector('#qrsteps').textContent = `Couldn't load quest world (${esc(e.message)})`; return; }
  }
  const Q = quest3dData.quests, ids = Object.keys(Q);
  const cur = Q[id] ? id : ids[0];
  const q = Q[cur];
  const sel = app.querySelector('#qrpick');
  const byZone = {};
  ids.forEach(k => { const z = Q[k].zone; (byZone[z] = byZone[z] || []).push(k); });
  sel.innerHTML = Object.keys(byZone).sort().map(z => `<optgroup label="${esc(z)}">` + byZone[z].map(k => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(Q[k].name || k)}</option>`).join('') + '</optgroup>').join('');
  sel.onchange = () => { location.hash = `#/questroute/${sel.value}`; };
  app.querySelector('#qrsteps').innerHTML = '<b>Route:</b> ' + q.steps.map((s, i) => `<span style="display:inline-block;margin:2px 8px 2px 0"><span style="display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;border-radius:50%;background:${QSTEP_CSS[s.kind] || '#888'};color:#000;font-weight:700;font-size:11px">${i + 1}</span> ${esc(s.label)}</span>`).join(' → ');

  const mods = await ensureThree(); const SkeletonUtils = await import('three/addons/utils/SkeletonUtils.js');
  const { THREE, GLTFLoader, OrbitControls, MeshoptDecoder } = mods;
  const MODEL_BASE = `https://raw.githubusercontent.com/${quest3dData.modelRepo}/${quest3dData.modelRef}/public/`;
  const loader = new GLTFLoader(); try { loader.setMeshoptDecoder(MeshoptDecoder); } catch (e) {}
  const cache = {}; const loadGLTF = (u) => cache[u] || (cache[u] = loader.loadAsync(MODEL_BASE + u).catch(() => null));
  const canvas = app.querySelector('#qrcanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const b = q.bounds, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, span = Math.max(b.x1 - b.x0, b.z1 - b.z0);
  const scene = new THREE.Scene();
  const skc = document.createElement('canvas'); skc.width = 2; skc.height = 256; const sgx = skc.getContext('2d');
  const grd = sgx.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, '#4a6ea5'); grd.addColorStop(0.55, '#a9b6b2'); grd.addColorStop(1, '#ecd6a4'); sgx.fillStyle = grd; sgx.fillRect(0, 0, 2, 256);
  const skyTex = new THREE.CanvasTexture(skc); try { skyTex.colorSpace = THREE.SRGBColorSpace; } catch (e) {}
  scene.background = skyTex; scene.fog = new THREE.Fog(0xe0d0a6, span * 1.4, span * 4.2);
  const cam = new THREE.PerspectiveCamera(58, 1, 0.5, span * 8);
  scene.add(new THREE.HemisphereLight(0xffe9c8, 0x3a2f1e, 1.0));
  const sun = new THREE.DirectionalLight(0xffdca0, 1.4); sun.position.set(cx - span * 0.5, span * 0.5, cz - span * 0.32); sun.target.position.set(cx, 0, cz); scene.add(sun); scene.add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006;
  { const sc = sun.shadow.camera, R = span * 0.72; sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = span * 0.05; sc.far = span * 2.4; sc.updateProjectionMatrix(); }
  // real baked terrain (matches the live overworld) + bilinear sampler
  const T = q.terrain;
  const sampleH = (x, z) => {
    if (!T) return 0;
    const fx = Math.max(0, Math.min(T.res - 1.001, (x - T.x0) / (T.x1 - T.x0) * (T.res - 1)));
    const fz = Math.max(0, Math.min(T.res - 1.001, (z - T.z0) / (T.z1 - T.z0) * (T.res - 1)));
    const j = Math.floor(fx), i = Math.floor(fz), tj = fx - j, ti = fz - i, w = T.res, H = T.heights;
    return (H[i * w + j] * (1 - tj) + H[i * w + j + 1] * tj) * (1 - ti) + (H[(i + 1) * w + j] * (1 - tj) + H[(i + 1) * w + j + 1] * tj) * ti;
  };
  const gw = T ? T.x1 - T.x0 : span, gd = T ? T.z1 - T.z0 : span, seg = T ? T.res - 1 : 1;
  const gGeo = new THREE.PlaneGeometry(gw, gd, seg, seg); const gp = gGeo.attributes.position;
  for (let k = 0; k < gp.count; k++) { gp.setZ(k, sampleH(cx + gp.getX(k), cz - gp.getY(k))); }
  gGeo.computeVertexNormals();
  const ground = new THREE.Mesh(gGeo, new THREE.MeshStandardMaterial({ color: q.biome || '#3f5a33', roughness: 1, flatShading: true }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(cx, 0, cz); scene.add(ground);
  // lakes + roads
  for (const l of (q.lakes || [])) { const m = new THREE.Mesh(new THREE.CircleGeometry(l.r, 40), new THREE.MeshStandardMaterial({ color: 0x2f6a86, transparent: true, opacity: 0.82, roughness: 0.05, metalness: 0.45 })); m.rotation.x = -Math.PI / 2; m.position.set(l.x, sampleH(l.x, l.z) + 0.3, l.z); m.receiveShadow = true; scene.add(m); }
  for (const r of (q.roads || [])) { if (r.length < 2) continue; const c = new THREE.CatmullRomCurve3(r.map(p => new THREE.Vector3(p.x, sampleH(p.x, p.z) + 0.4, p.z))); scene.add(new THREE.Mesh(new THREE.TubeGeometry(c, Math.max(20, r.length * 8), 0.9, 6, false), new THREE.MeshStandardMaterial({ color: 0x9c8157, roughness: 1 }))); }
  // model placement helper (clone + tint + scale to height)
  async function place(url, x, z, { targetH = 2, tint = null, ts = 0, rotY = 0 } = {}) {
    const g = await loadGLTF(url); if (!g) return null;
    const o = SkeletonUtils.clone(g.scene);
    if (tint) { const tc = new THREE.Color(tint); o.traverse(n => { if (n.isMesh && n.material) { n.material = Array.isArray(n.material) ? n.material.map(m => m.clone()) : n.material.clone(); (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => { if (m.color) m.color.lerp(tc, ts); }); } }); }
    let bx = new THREE.Box3().setFromObject(o); const h = (bx.max.y - bx.min.y) || 1; o.scale.setScalar(targetH / h);
    bx = new THREE.Box3().setFromObject(o); o.position.set(x, sampleH(x, z) - bx.min.y, z); o.rotation.y = rotY; scene.add(o); return o;
  }
  const LBL = Math.max(3, Math.min(9, span * 0.02));
  const textLabel = (text, fg = '#fff', bg = 'rgba(0,0,0,.62)') => {
    const font = 'bold 30px system-ui'; const mc = document.createElement('canvas').getContext('2d'); mc.font = font;
    const w = Math.ceil(mc.measureText(text).width) + 24, h = 46; const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, w, h); x.font = font; x.fillStyle = fg; x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillText(text, w / 2, h / 2 + 1);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false, transparent: true })); sp.scale.set(LBL * (w / h), LBL, 1); return sp;
  };
  const addLabel = (text, x, y, z, fg) => { const s = textLabel(text, fg); s.position.set(x, y, z); scene.add(s); return s; };
  // foliage, NPCs, mob camps — the actual world
  for (const pl of (q.places || [])) { const s = textLabel(pl.name, '#fff6d8', 'rgba(10,12,18,.4)'); s.scale.multiplyScalar(1.7); s.position.set(pl.x, sampleH(pl.x, pl.z) + LBL * 2.6, pl.z); scene.add(s); }
  for (const f of (q.foliage || [])) await place(f.url, f.x, f.z, { targetH: f.h || 2, rotY: (f.x * 0.7 + f.z) % 6.28 });
  for (const d of (q.decor || [])) await place(d.url, d.x, d.z, { targetH: d.h || 2, rotY: d.rotY || 0 });
  for (const n of (q.npcs || [])) { const th = n.model.height || 2; await place(n.model.glb, n.x, n.z, { targetH: th, tint: n.model.tint, ts: n.model.tintStrength, rotY: Math.PI }); addLabel(n.name, n.x, sampleH(n.x, n.z) + th + LBL * 0.7, n.z, '#ffe9b0'); }
  for (const c of (q.camps || [])) { const cn = c.count || 4; for (let i = 0; i < cn; i++) { const a = (i / cn) * 6.28 + i, rr = (c.r || 8) * (0.3 + 0.6 * ((i * 0.618) % 1)); await place(c.model.glb, c.x + Math.cos(a) * rr, c.z + Math.sin(a) * rr, { targetH: c.model.height || 2, tint: c.model.tint, ts: c.model.tintStrength, rotY: a + Math.PI }); } addLabel(`${c.name} ×${c.count}`, c.x, sampleH(c.x, c.z) + (c.model.height || 2) + LBL * 0.9, c.z, '#ff9a9a'); }
  // quest path (gold arc) + numbered pins
  const pathLift = Math.max(1.5, span * 0.01), arcLift = span * 0.08, pinH = Math.max(6, span * 0.04), labScale = Math.max(4, Math.min(11, span * 0.028));
  const wps = q.steps.map(s => new THREE.Vector3(s.x, sampleH(s.x, s.z) + pathLift, s.z)); const cpts = [];
  for (let i = 0; i < wps.length; i++) { cpts.push(wps[i]); if (i < wps.length - 1) { const a = wps[i], bb = wps[i + 1]; cpts.push(new THREE.Vector3((a.x + bb.x) / 2, (a.y + bb.y) / 2 + arcLift, (a.z + bb.z) / 2)); } }
  let curve = null;
  if (cpts.length >= 2) { curve = new THREE.CatmullRomCurve3(cpts, false, 'catmullrom', 0.25); scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(40, cpts.length * 24), Math.max(0.6, span * 0.006), 8, false), new THREE.MeshStandardMaterial({ color: 0xe6bb6a, emissive: 0x6a4a16, emissiveIntensity: 0.6, roughness: 0.4 }))); }
  const numSprite = (n, col) => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'); x.fillStyle = col; x.beginPath(); x.arc(32, 32, 28, 0, 7); x.fill(); x.lineWidth = 4; x.strokeStyle = '#000'; x.stroke(); x.fillStyle = '#000'; x.font = 'bold 38px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 32, 34); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false })); sp.scale.set(labScale, labScale, 1); return sp; };
  q.steps.forEach((s, i) => { const gy = sampleH(s.x, s.z); const col = QSTEP_COLOR[s.kind] || 0x999999; const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, pinH, 8), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.3 })); pole.position.set(s.x, gy + pinH / 2, s.z); scene.add(pole); const lab = numSprite(i + 1, QSTEP_CSS[s.kind] || '#999'); lab.position.set(s.x, gy + pinH + labScale * 0.5, s.z); scene.add(lab); });
  app.querySelector('#qrload').style.display = 'none';
  // hero character that walks the path
  let hero = null, mixer = null, heroLabel = null;
  (async () => { const g = await loadGLTF(q.character); if (!g) return; hero = SkeletonUtils.clone(g.scene); let bx = new THREE.Box3().setFromObject(hero); const h = (bx.max.y - bx.min.y) || 1; hero.scale.setScalar(2.4 / h); scene.add(hero); heroLabel = textLabel('You', '#bfe9ff'); scene.add(heroLabel); if (g.animations && g.animations.length) { mixer = new THREE.AnimationMixer(hero); mixer.clipAction(g.animations.find(a => /walk|run|move/i.test(a.name)) || g.animations[0]).play(); } })();

  cam.position.set(cx + span * 0.5, span * 0.6, cz + span * 1.0); cam.lookAt(cx, 0, cz);
  const controls = new OrbitControls(cam, canvas); controls.target.set(cx, sampleH(cx, cz), cz); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49; controls.autoRotate = true; controls.autoRotateSpeed = 0.5;
  canvas.addEventListener('pointerdown', () => { controls.autoRotate = false; });
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  resize(); addEventListener('resize', resize);
  const travelMs = curve ? Math.max(10000, curve.getLength() * 90) : 0; let last = performance.now();
  (function loop(now) {
    if (!document.body.contains(canvas)) { removeEventListener('resize', resize); renderer.dispose(); return; }
    const dt = Math.min((now - last) / 1000, 0.05); last = now; if (mixer) mixer.update(dt);
    if (hero && curve) { const t = ((now || 0) % travelMs) / travelMs; const p = curve.getPointAt(t), tan = curve.getTangentAt(t); const gy = sampleH(p.x, p.z); hero.position.set(p.x, gy, p.z); hero.lookAt(p.x + tan.x, gy, p.z + tan.z); if (heroLabel) heroLabel.position.set(p.x, gy + 4.5, p.z); }
    controls.update(); renderer.render(scene, cam); requestAnimationFrame(loop);
  })(performance.now());
  reveal();
}

// ---------- 3D whole-zone world ----------
let zone3dData = null;
async function zone3dView(dir) {
  app.innerHTML = '';
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">3D · zone</span><h2>Explore the zone</h2>
      <p>A whole zone rendered in 3D — real terrain, towns, mob camps, roads, lakes and named places. Drag to orbit, scroll to zoom.</p></div>
    <div class="controls reveal" style="position:relative;z-index:30"><select id="z3pick" style="max-width:420px;position:relative;z-index:30;padding:8px 10px;border-radius:8px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></select></div>
    <div style="position:relative;z-index:1;border:1px solid var(--line,#222);border-radius:12px;overflow:hidden;background:#9fbcd6">
      <canvas id="z3canvas" style="display:block;width:100%;height:70vh;touch-action:none"></canvas>
      <div id="z3load" style="position:absolute;left:10px;top:10px;font:600 12px system-ui;color:#fff;background:rgba(0,0,0,.5);padding:4px 8px;border-radius:6px">Building the zone…</div>
      <div style="position:absolute;left:10px;bottom:10px;z-index:5;display:flex;gap:14px;flex-wrap:wrap;font:600 11px system-ui;color:#fbf3dd;background:rgba(12,19,14,.5);padding:6px 11px;border-radius:8px;backdrop-filter:blur(4px)"><span>🟡 NPC</span><span>🔴 Mob camp</span><span>🏷️ Place</span><span style="opacity:.75;font-weight:400">drag · scroll/pinch to zoom</span></div>
    </div>
  </div></section>`));
  if (!zone3dData) {
    try { zone3dData = await (await fetch(cb(raw('docs/zone3d.json')))).json(); }
    catch (e) { app.querySelector('#z3load').textContent = `Couldn't load zone (${esc(e.message)})`; return; }
  }
  const Z = zone3dData.zones, ids = Object.keys(Z), cur = Z[dir] ? dir : ids[0], q = Z[cur];
  const sel = app.querySelector('#z3pick');
  sel.innerHTML = ids.map(k => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(Z[k].name)}</option>`).join('');
  sel.onchange = () => { location.hash = `#/zone3d/${sel.value}`; };

  const mods = await ensureThree(); const SkeletonUtils = await import('three/addons/utils/SkeletonUtils.js');
  const { THREE, GLTFLoader, OrbitControls, MeshoptDecoder } = mods;
  const MODEL_BASE = `https://raw.githubusercontent.com/${zone3dData.modelRepo}/${zone3dData.modelRef}/public/`;
  const loader = new GLTFLoader(); try { loader.setMeshoptDecoder(MeshoptDecoder); } catch (e) {}
  const cache = {}; const loadGLTF = (u) => cache[u] || (cache[u] = loader.loadAsync(MODEL_BASE + u).catch(() => null));
  const canvas = app.querySelector('#z3canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const b = q.bounds, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, span = Math.max(b.x1 - b.x0, b.z1 - b.z0);
  const scene = new THREE.Scene();
  // golden-hour gradient sky + warm atmospheric haze
  const skc = document.createElement('canvas'); skc.width = 2; skc.height = 256; const sgx = skc.getContext('2d');
  const grd = sgx.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, '#4a6ea5'); grd.addColorStop(0.55, '#a9b6b2'); grd.addColorStop(1, '#ecd6a4'); sgx.fillStyle = grd; sgx.fillRect(0, 0, 2, 256);
  const skyTex = new THREE.CanvasTexture(skc); try { skyTex.colorSpace = THREE.SRGBColorSpace; } catch (e) {}
  scene.background = skyTex; scene.fog = new THREE.Fog(0xe0d0a6, span * 0.7, span * 2.2);
  const cam = new THREE.PerspectiveCamera(58, 1, 0.5, span * 8);
  scene.add(new THREE.HemisphereLight(0xffe9c8, 0x3a2f1e, 1.0));
  const sun = new THREE.DirectionalLight(0xffdca0, 1.4); sun.position.set(cx - span * 0.5, span * 0.5, cz - span * 0.32); sun.target.position.set(cx, 0, cz); scene.add(sun); scene.add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006;
  { const sc = sun.shadow.camera, R = span * 0.72; sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = span * 0.05; sc.far = span * 2.4; sc.updateProjectionMatrix(); }
  const T = q.terrain;
  const sampleH = (x, z) => { if (!T) return 0; const fx = Math.max(0, Math.min(T.res - 1.001, (x - T.x0) / (T.x1 - T.x0) * (T.res - 1))), fz = Math.max(0, Math.min(T.res - 1.001, (z - T.z0) / (T.z1 - T.z0) * (T.res - 1))); const j = Math.floor(fx), i = Math.floor(fz), tj = fx - j, ti = fz - i, w = T.res, H = T.heights; return (H[i * w + j] * (1 - tj) + H[i * w + j + 1] * tj) * (1 - ti) + (H[(i + 1) * w + j] * (1 - tj) + H[(i + 1) * w + j + 1] * tj) * ti; };
  const gGeo = new THREE.PlaneGeometry(T.x1 - T.x0, T.z1 - T.z0, T.res - 1, T.res - 1); const gp = gGeo.attributes.position;
  for (let k = 0; k < gp.count; k++) gp.setZ(k, sampleH(cx + gp.getX(k), cz - gp.getY(k)));
  gGeo.computeVertexNormals();
  { const gp2 = gGeo.attributes.position; let mn = 1e9, mx = -1e9; for (let k = 0; k < gp2.count; k++) { const y = gp2.getZ(k); if (y < mn) mn = y; if (y > mx) mx = y; } const rng = (mx - mn) || 1; const cA = new THREE.Color('#4c6b33'), cB = new THREE.Color('#6d6238'), cC = new THREE.Color('#918776'), tc = new THREE.Color(); const carr = new Float32Array(gp2.count * 3); for (let k = 0; k < gp2.count; k++) { const t = (gp2.getZ(k) - mn) / rng; if (t < 0.5) tc.copy(cA).lerp(cB, t * 2); else tc.copy(cB).lerp(cC, (t - 0.5) * 2); carr[k * 3] = tc.r; carr[k * 3 + 1] = tc.g; carr[k * 3 + 2] = tc.b; } gGeo.setAttribute('color', new THREE.BufferAttribute(carr, 3)); }
  const ground = new THREE.Mesh(gGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })); ground.rotation.x = -Math.PI / 2; ground.position.set(cx, 0, cz); ground.receiveShadow = true; scene.add(ground);
  for (const l of (q.lakes || [])) { const m = new THREE.Mesh(new THREE.CircleGeometry(l.r, 40), new THREE.MeshStandardMaterial({ color: 0x2f6a86, transparent: true, opacity: 0.82, roughness: 0.05, metalness: 0.45 })); m.rotation.x = -Math.PI / 2; m.position.set(l.x, sampleH(l.x, l.z) + 0.3, l.z); m.receiveShadow = true; scene.add(m); }
  for (const r of (q.roads || [])) { if (r.length < 2) continue; const c = new THREE.CatmullRomCurve3(r.map(p => new THREE.Vector3(p.x, sampleH(p.x, p.z) + 0.4, p.z))); scene.add(new THREE.Mesh(new THREE.TubeGeometry(c, Math.max(20, r.length * 8), 0.9, 6, false), new THREE.MeshStandardMaterial({ color: 0x9c8157, roughness: 1 }))); }
  async function place(url, x, z, { targetH = 2, tint = null, ts = 0, rotY = 0 } = {}) { const g = await loadGLTF(url); if (!g) return; const o = SkeletonUtils.clone(g.scene); if (tint) { const tc = new THREE.Color(tint); o.traverse(n => { if (n.isMesh && n.material) { n.material = Array.isArray(n.material) ? n.material.map(m => m.clone()) : n.material.clone(); (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => { if (m.color) m.color.lerp(tc, ts); }); } }); } let bx = new THREE.Box3().setFromObject(o); const h = (bx.max.y - bx.min.y) || 1; o.scale.setScalar(targetH / h); bx = new THREE.Box3().setFromObject(o); o.position.set(x, sampleH(x, z) - bx.min.y, z); o.rotation.y = rotY; o.traverse((n) => { if (n.isMesh) n.castShadow = true; }); scene.add(o); }
  const LBL = Math.max(4, Math.min(11, span * 0.012));
  const textLabel = (text, fg, bg) => { const font = 'bold 30px system-ui'; const mc = document.createElement('canvas').getContext('2d'); mc.font = font; const w = Math.ceil(mc.measureText(text).width) + 24, h = 46; const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, w, h); x.font = font; x.fillStyle = fg; x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillText(text, w / 2, h / 2 + 1); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false, transparent: true })); sp.scale.set(LBL * (w / h), LBL, 1); return sp; };
  const addLabel = (text, x, y, z, fg, bg = 'rgba(0,0,0,.6)', f = 1) => { const s = textLabel(text, fg, bg); s.scale.multiplyScalar(f); s.position.set(x, y, z); scene.add(s); };
  for (const f of (q.foliage || [])) await place(f.url, f.x, f.z, { targetH: f.h || 2, rotY: (f.x * 0.7 + f.z) % 6.28 });
  for (const d of (q.decor || [])) await place(d.url, d.x, d.z, { targetH: d.h || 2, rotY: d.rotY || 0 });
  for (const n of (q.npcs || [])) { const th = n.model.height || 2; await place(n.model.glb, n.x, n.z, { targetH: th, tint: n.model.tint, ts: n.model.tintStrength, rotY: Math.PI }); addLabel(n.name, n.x, sampleH(n.x, n.z) + th + LBL * 0.7, n.z, '#ffe9b0'); }
  for (const c of (q.camps || [])) { const cn = c.count || 3; for (let i = 0; i < cn; i++) { const a = (i / cn) * 6.28 + i, rr = (c.r || 8) * (0.3 + 0.6 * ((i * 0.618) % 1)); await place(c.model.glb, c.x + Math.cos(a) * rr, c.z + Math.sin(a) * rr, { targetH: c.model.height || 2, tint: c.model.tint, ts: c.model.tintStrength, rotY: a + Math.PI }); } addLabel(c.name, c.x, sampleH(c.x, c.z) + (c.model.height || 2) + LBL * 0.9, c.z, '#ff9a9a'); }
  for (const pl of (q.places || [])) addLabel(pl.name, pl.x, sampleH(pl.x, pl.z) + LBL * 3, pl.z, '#fff6d8', 'rgba(10,12,18,.4)', 1.8);
  app.querySelector('#z3load').style.display = 'none';
  cam.position.set(cx + span * 0.4, span * 0.6, cz + span * 0.8); cam.lookAt(cx, 0, cz);
  const controls = new OrbitControls(cam, canvas); controls.target.set(cx, sampleH(cx, cz), cz); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49; controls.autoRotate = true; controls.autoRotateSpeed = 0.4;
  canvas.addEventListener('pointerdown', () => { controls.autoRotate = false; });
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  resize(); addEventListener('resize', resize);
  (function loop() { if (!document.body.contains(canvas)) { removeEventListener('resize', resize); renderer.dispose(); return; } controls.update(); renderer.render(scene, cam); requestAnimationFrame(loop); })();
  reveal();
}

// ---------- farming calculator ----------
let farmingData = null;
async function farmingView(levelArg) {
  app.innerHTML = '';
  if (!farmingData) {
    try { farmingData = await (await fetch(cb('farming.json'))).json(); }
    catch (e) { app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load farming data (${esc(e.message)})</p></div></section>`)); return; }
  }
  const maxL = farmingData.maxLevel;
  const L = Math.min(maxL - 1, Math.max(1, parseInt(levelArg, 10) || 1));
  const opts = [];
  for (let i = 1; i < maxL; i++) opts.push(`<option value="${i}"${i === L ? ' selected' : ''}>Level ${i} → ${i + 1}</option>`);
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Tools · leveling</span><h2>Farming calculator</h2>
      <p>How many of each mob you must kill to reach the next level — using the game's real XP curve and level-difference scaling. Pick your level; the best repeatable grind is highlighted.</p></div>
    <div class="controls reveal"><label class="meta" style="display:flex;gap:8px;align-items:center">I am
      <select id="flevel" style="padding:8px 10px;border-radius:8px;border:1px solid #888;background:#fff;color:#111;color-scheme:light">${opts.join('')}</select></label></div>
    <div id="fbody" class="reveal"></div>
    <p class="meta reveal" style="margin-top:14px;opacity:.8">Kills assume no rested XP (<b>rested halves the kills</b>) and don't count quest XP — turning in quests is far faster than pure grinding. Elite mobs award ×2 XP. Mobs more than your level + 3 are shown greyed (too dangerous to farm solo); grey-level mobs give 0 XP and are omitted.</p>
  </div></section>`));
  const sel = app.querySelector('#flevel');
  sel.onchange = () => { location.hash = `#/farming/${sel.value}`; };
  const p = farmingData.perLevel.find((x) => x.level === L);
  const rows = p.mobs.slice(0, 18).map((m, i) => {
    const best = i === 0 && !m.tooHigh;
    const tags = [m.elite ? '<span class="pill" style="background:#7a4dff;color:#fff">elite ×2</span>' : '', m.rare ? '<span class="pill" style="background:#c0852a;color:#fff">rare</span>' : '', m.tooHigh ? '<span class="pill" style="background:#a33;color:#fff">too high</span>' : ''].filter(Boolean).join(' ');
    return `<tr style="${best ? 'background:rgba(255,210,80,.14);font-weight:600' : (m.tooHigh ? 'opacity:.5' : '')}">
      <td>${best ? '⭐ ' : ''}${esc(m.name)} ${tags}</td>
      <td style="text-align:center">${m.minLevel === m.maxLevel ? m.level : m.minLevel + '–' + m.maxLevel}</td>
      <td>${esc((m.zones || []).join(', ') || '—')}</td>
      <td style="text-align:right">${m.xpPerKill}</td>
      <td style="text-align:right"><b>${m.kills.toLocaleString()}</b></td>
      <td style="text-align:right">${m.spawns}</td></tr>`;
  }).join('');
  app.querySelector('#fbody').innerHTML = `
    <p class="meta" style="margin:6px 0 12px">Level ${L} → ${L + 1} needs <b>${p.xpNeeded.toLocaleString()} XP</b>.</p>
    <div style="overflow-x:auto"><table id="ftable" style="width:100%;border-collapse:collapse;font-size:.95rem">
      <thead><tr style="text-align:left"><th>Mob</th><th style="text-align:center">Lvl</th><th>Where</th>
        <th style="text-align:right">XP/kill</th><th style="text-align:right">Kills to level</th><th style="text-align:right">Spawns</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  app.querySelectorAll('#ftable td, #ftable th').forEach((c) => { c.style.padding = '6px 8px'; c.style.borderBottom = '1px solid var(--line,#2a2a2a)'; });
  reveal();
}

// ---------- drop / farm locator ----------
let dropsData = null;
const QCOL = { poor: '#9d9d9d', common: '#ffffff', uncommon: '#1eff00', rare: '#0070dd', epic: '#a335ee', legendary: '#ff8000' };
async function dropsView() {
  app.innerHTML = '';
  if (!dropsData) {
    try { dropsData = await (await fetch(cb('drops.json'))).json(); }
    catch (e) { app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load drop data (${esc(e.message)})</p></div></section>`)); return; }
  }
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Tools · items</span><h2>Where do I get it?</h2>
      <p>Search any item to see every source — which mobs drop it (with chance, level, zone and spawn density), which ground objects contain it, and which vendors sell it.</p></div>
    <div class="controls reveal"><input class="search" id="dsearch" placeholder="Search an item… (e.g. pelt, ore, hide, ring)"></div>
    <div class="dcount meta reveal" id="dcount"></div>
    <div id="dlist" class="reveal"></div>
  </div></section>`));
  const list = app.querySelector('#dlist'), count = app.querySelector('#dcount'), input = app.querySelector('#dsearch');
  const srcLine = (s) => {
    if (s.type === 'mob') { const flags = [s.boss ? 'boss' : '', s.elite ? 'elite' : '', s.rare ? 'rare' : ''].filter(Boolean).join(' '); return `<li>🗡 <b>${esc(s.name)}</b> <span class="meta">lv ${s.level}${flags ? ' · ' + flags : ''}</span> — ${s.chance}%${s.zones.length ? ' · ' + esc(s.zones.join(', ')) : ''}${s.spawns ? ` · ${s.spawns} spawns` : ''}${s.questId ? ' <span class="meta">(only while on that quest)</span>' : ''}</li>`; }
    if (s.type === 'object') return `<li>📦 <b>${esc(s.name)}</b> <span class="meta">ground object${s.zones.length ? ' · ' + esc(s.zones.join(', ')) : ''} · ${s.count} spots</span></li>`;
    return `<li>🛒 <b>${esc(s.name)}</b> <span class="meta">vendor${s.zones.length ? ' · ' + esc(s.zones.join(', ')) : ''}</span></li>`;
  };
  function render(q) {
    q = (q || '').trim().toLowerCase();
    const matches = q ? dropsData.items.filter((i) => i.nl ? i.nl.includes(q) : i.name.toLowerCase().includes(q)) : dropsData.items;
    const shown = matches.slice(0, 150);
    count.textContent = `${matches.length} item${matches.length === 1 ? '' : 's'}${matches.length > shown.length ? ` (showing ${shown.length})` : ''}`;
    list.innerHTML = shown.map((i) => `<div class="card" style="margin-bottom:10px;padding:12px 14px">
      <div style="font-weight:700;color:${QCOL[i.quality] || '#fff'}">${esc(i.name)} <span class="meta" style="font-weight:400;color:var(--muted,#999)">${esc(i.kind)}${i.slot ? ' · ' + esc(i.slot) : ''}</span></div>
      <ul style="margin:8px 0 0;padding-left:18px;line-height:1.7">${i.sources.map(srcLine).join('')}</ul></div>`).join('') || '<p class="meta">No items match.</p>';
  }
  input.oninput = () => render(input.value);
  render('');
  reveal();
}

// ---------- quest chain visualizer ----------
let chainData = null;
async function questChainsView() {
  app.innerHTML = '';
  if (!chainData) {
    try { chainData = await (await fetch(cb('questchains.json'))).json(); }
    catch (e) { app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load quest chains (${esc(e.message)})</p></div></section>`)); return; }
  }
  const renderNode = (n) => `<li><a class="qlink" href="${n.href}">${esc(n.name)}</a>${n.minLevel ? ` <span class="meta">lv ${n.minLevel}</span>` : ''}${n.giver ? ` <span class="meta">· ${esc(n.giver)}</span>` : ''}${n.children && n.children.length ? `<ul>${n.children.map(renderNode).join('')}</ul>` : ''}</li>`;
  const zones = chainData.zones.map((z) => `<div class="card reveal" style="margin-bottom:16px;padding:14px 16px">
    <h3 style="margin:0 0 6px">${esc(z.name)} <span class="meta" style="font-weight:400">· ${z.chains.length} chain${z.chains.length === 1 ? '' : 's'}</span></h3>
    ${z.chains.map((c) => `<ul class="qchain">${renderNode(c)}</ul>`).join('')}</div>`).join('');
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">World · storylines</span><h2>Quest chains</h2>
      <p>Multi-step quest storylines, in order — follow each branch from the first quest to its conclusion. Click any quest for its full page.</p></div>
    ${zones}
    <style>.qchain{list-style:none;padding-left:0;margin:6px 0}.qchain ul{list-style:none;margin:2px 0 2px 0;padding-left:20px;border-left:2px solid var(--line,#333)}.qchain li{margin:4px 0;position:relative;padding-left:14px}.qchain li::before{content:'↳';position:absolute;left:-2px;opacity:.5}.qchain>li::before{content:'';padding:0}.qlink{font-weight:600}</style>
  </div></section>`));
  reveal();
}

// ---------- DPS / EHP calculator ----------
let statData = null;
async function calcView() {
  app.innerHTML = '';
  if (!statData) {
    try { statData = await (await fetch(cb('classstats.json'))).json(); }
    catch (e) { app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load class stats (${esc(e.message)})</p></div></section>`)); return; }
  }
  const K = statData.constants, cls = Object.values(statData.classes);
  const st = { cls: 'warrior', level: statData.maxLevel, g: { str: 0, agi: 0, sta: 0, int: 0, ap: 0, armor: 0, crit: 0 }, w: { min: 8, max: 14, speed: 2.5 } };
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Tools · combat</span><h2>DPS &amp; survivability calculator</h2>
      <p>Estimates attack power, crit, health, armor mitigation and white-hit DPS using the game's real combat formulas. Pick a class and level, then add your gear's bonuses.</p></div>
    <div class="controls reveal"><div class="pills" id="cclass"></div></div>
    <div class="controls reveal" style="margin-top:-8px;gap:16px;flex-wrap:wrap">
      <label class="meta">Level <select id="clevel"></select></label>
    </div>
    <div class="reveal" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-top:8px">
      <div class="card" style="padding:14px 16px"><h3 style="margin:0 0 10px">Gear bonuses</h3><div id="cgear" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"></div></div>
      <div class="card" style="padding:14px 16px"><h3 style="margin:0 0 10px">Weapon</h3><div id="cweap" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"></div></div>
      <div class="card" id="cout" style="padding:14px 16px"></div>
    </div>
  </div></section>`));
  const classHost = app.querySelector('#cclass');
  cls.forEach((c) => { const p = el(`<span class="pill${c.id === st.cls ? ' active' : ''}">${esc(c.name)}</span>`); p.onclick = () => { st.cls = c.id; classHost.querySelectorAll('.pill').forEach((x) => x.classList.remove('active')); p.classList.add('active'); render(); }; classHost.append(p); });
  const lv = app.querySelector('#clevel'); for (let i = 1; i <= statData.maxLevel; i++) lv.append(el(`<option value="${i}"${i === st.level ? ' selected' : ''}>${i}</option>`)); lv.onchange = () => { st.level = +lv.value; render(); };
  const numField = (label, get, set) => { const w = el(`<label class="meta" style="display:flex;flex-direction:column;gap:2px">${label}<input type="number" value="${get()}" style="padding:6px 8px;border-radius:6px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></label>`); w.querySelector('input').oninput = (e) => { set(parseFloat(e.target.value) || 0); render(); }; return w; };
  const gh = app.querySelector('#cgear');
  [['+ Strength', 'str'], ['+ Agility', 'agi'], ['+ Stamina', 'sta'], ['+ Intellect', 'int'], ['+ Attack Power', 'ap'], ['+ Armor', 'armor'], ['+ Crit %', 'crit']].forEach(([l, k]) => gh.append(numField(l, () => st.g[k], (v) => st.g[k] = v)));
  const wh = app.querySelector('#cweap');
  [['Min dmg', 'min'], ['Max dmg', 'max'], ['Speed (s)', 'speed']].forEach(([l, k]) => wh.append(numField(l, () => st.w[k], (v) => st.w[k] = v)));
  function render() {
    const c = statData.classes[st.cls], L = st.level;
    const base = {}; for (const k of ['str', 'agi', 'sta', 'int', 'armor']) base[k] = c.baseStats[k] + c.statsPerLevel[k] * (L - 1);
    const str = base.str + st.g.str, agi = base.agi + st.g.agi, sta = base.sta + st.g.sta, int = base.int + st.g.int;
    const ap = (c.apRule === 'str2' ? str * 2 : c.apRule === 'stragi' ? str + agi : str) + st.g.ap;
    const crit = K.baseCrit + agi * K.critPerAgi + st.g.crit / 100;
    const spellCrit = K.baseCrit + int * K.spellCritPerInt;
    const hpSta = Math.min(sta, K.staLowCap) * K.staHpLow + Math.max(0, sta - K.staLowCap) * K.staHpHigh;
    const hp = c.baseHp + c.hpPerLevel * (L - 1) + hpSta;
    const armor = base.armor + st.g.armor + agi * K.armorPerAgi;
    const mit = Math.min(K.armorCap, armor / (armor + K.armorA * L + K.armorB));
    const ehp = hp / (1 - mit);
    const avg = (st.w.min + st.w.max) / 2, perHit = avg + (ap / K.apToDamageDivisor) * st.w.speed;
    const dpsWhite = st.w.speed > 0 ? perHit / st.w.speed : 0;
    const dps = dpsWhite * (1 + crit * (K.meleeCritMult - 1));
    const row = (a, b) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:3px 0;border-bottom:1px solid var(--line,#262626)"><span class="meta">${a}</span><b>${b}</b></div>`;
    app.querySelector('#cout').innerHTML = `<h3 style="margin:0 0 10px">${esc(c.name)} · level ${L}</h3>
      ${row('Strength / Agility', `${str} / ${agi}`)}${row('Stamina / Intellect', `${sta} / ${int}`)}
      ${row('Attack power', Math.round(ap))}${row('Melee crit', (crit * 100).toFixed(1) + '%')}${c.caster ? row('Spell crit', (spellCrit * 100).toFixed(1) + '%') + row('Spell power', Math.round(int * (K.spellPowerPerInt || 0.5))) : ''}
      ${row('Health', Math.round(hp))}${row('Armor', Math.round(armor))}${row('Mitigation (vs lv ' + L + ')', (mit * 100).toFixed(1) + '%')}${row('Effective HP', Math.round(ehp))}
      ${row('White-hit damage', Math.round(perHit))}${row('White DPS (with crit)', dps.toFixed(1))}
      <p class="meta" style="margin:10px 0 0;opacity:.75">DPS is raw weapon/auto-attack output before the target's armor; abilities and ${c.caster ? 'spell coefficients' : 'rotation'} add more. Talents not included.</p>`;
  }
  render();
  reveal();
}

// ---------- can I solo this? ----------
let mobStatData = null;
async function soloView() {
  app.innerHTML = '';
  try {
    if (!statData) statData = await (await fetch(cb('classstats.json'))).json();
    if (!mobStatData) mobStatData = await (await fetch(cb('mobstats.json'))).json();
  } catch (e) { app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load data (${esc(e.message)})</p></div></section>`)); return; }
  const K = statData.constants, cls = Object.values(statData.classes);
  const st = { cls: 'warrior', level: 10, ap: 0, armor: 0, sta: 0, w: { min: 8, max: 14, speed: 2.5 }, near: true };
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Tools · combat</span><h2>Can I solo this?</h2>
      <p>Pits your damage and survivability against each mob — time-to-kill vs time-to-die — for a quick "safe to pull?" verdict. Uses the game's real combat math.</p></div>
    <div class="controls reveal"><div class="pills" id="sclass"></div></div>
    <div class="controls reveal" style="margin-top:-8px;gap:14px;flex-wrap:wrap">
      <label class="meta">Level <select id="slevel"></select></label>
      <label class="meta">Wpn min <input id="swmin" type="number" value="8" style="width:60px"></label>
      <label class="meta">max <input id="swmax" type="number" value="14" style="width:60px"></label>
      <label class="meta">speed <input id="swspd" type="number" value="2.5" step="0.1" style="width:60px"></label>
      <label class="meta">+AP <input id="sap" type="number" value="0" style="width:60px"></label>
      <label class="meta">+Armor <input id="sarm" type="number" value="0" style="width:60px"></label>
      <label class="meta">+Sta <input id="ssta" type="number" value="0" style="width:60px"></label>
      <label class="meta"><input id="snear" type="checkbox" checked> near my level only</label>
    </div>
    <div id="sout" class="reveal" style="margin-top:8px"></div>
  </div></section>`));
  app.querySelectorAll('#sclass,#slevel input,select,input').forEach(() => {});
  const classHost = app.querySelector('#sclass');
  cls.forEach((c) => { const p = el(`<span class="pill${c.id === st.cls ? ' active' : ''}">${esc(c.name)}</span>`); p.onclick = () => { st.cls = c.id; classHost.querySelectorAll('.pill').forEach((x) => x.classList.remove('active')); p.classList.add('active'); render(); }; classHost.append(p); });
  const lv = app.querySelector('#slevel'); for (let i = 1; i <= statData.maxLevel; i++) lv.append(el(`<option value="${i}"${i === st.level ? ' selected' : ''}>${i}</option>`)); lv.onchange = () => { st.level = +lv.value; render(); };
  const bind = (id, fn) => { const e = app.querySelector(id); e.oninput = () => { fn(e.type === 'checkbox' ? e.checked : (parseFloat(e.value) || 0)); render(); }; };
  bind('#swmin', (v) => st.w.min = v); bind('#swmax', (v) => st.w.max = v); bind('#swspd', (v) => st.w.speed = v);
  bind('#sap', (v) => st.ap = v); bind('#sarm', (v) => st.armor = v); bind('#ssta', (v) => st.sta = v); bind('#snear', (v) => st.near = v);
  const mitig = (armor, atkLevel) => Math.min(K.armorCap, armor / (armor + K.armorA * atkLevel + K.armorB));
  function render() {
    const c = statData.classes[st.cls], L = st.level;
    const b = {}; for (const k of ['str', 'agi', 'sta', 'int', 'armor']) b[k] = c.baseStats[k] + c.statsPerLevel[k] * (L - 1);
    const agi = b.agi, sta = b.sta + st.sta;
    const ap = (c.apRule === 'str2' ? b.str * 2 : c.apRule === 'stragi' ? b.str + agi : b.str) + st.ap;
    const crit = K.baseCrit + agi * K.critPerAgi;
    const hp = c.baseHp + c.hpPerLevel * (L - 1) + (Math.min(sta, K.staLowCap) * K.staHpLow + Math.max(0, sta - K.staLowCap) * K.staHpHigh);
    const pArmor = b.armor + st.armor + agi * K.armorPerAgi;
    const perHit = (st.w.min + st.w.max) / 2 + (ap / K.apToDamageDivisor) * st.w.speed;
    const pDpsRaw = st.w.speed > 0 ? (perHit / st.w.speed) * (1 + crit * (K.meleeCritMult - 1)) : 0;
    let mobs = mobStatData.mobs;
    if (st.near) mobs = mobs.filter((m) => m.level >= L - 6 && m.level <= L + 4);
    const rows = mobs.map((m) => {
      const pDps = pDpsRaw * (1 - mitig(m.armor, L)); // my dps into mob armor
      const ttk = pDps > 0 ? m.hp / pDps : Infinity;
      const mDps = m.dps * (1 - mitig(pArmor, m.level)); // mob dps into my armor
      const ttd = mDps > 0 ? hp / mDps : Infinity;
      const ratio = ttd / ttk;
      const verdict = ttk > ttd ? '☠️ deadly' : ratio >= 2.5 ? '✅ easy' : ratio >= 1.3 ? '👍 doable' : '⚠️ risky';
      const color = ttk > ttd ? '#e0526a' : ratio >= 2.5 ? '#36c275' : ratio >= 1.3 ? '#8bd24f' : '#e0a23a';
      return { m, ttk, ttd, verdict, color, ratio };
    }).sort((a, b2) => b2.ratio - a.ratio);
    app.querySelector('#sout').innerHTML = `<div style="overflow-x:auto"><table id="stable" style="width:100%;border-collapse:collapse;font-size:.93rem">
      <thead><tr style="text-align:left"><th>Mob</th><th style="text-align:center">Lvl</th><th>Where</th><th style="text-align:right">Mob HP</th><th style="text-align:right">Kill (s)</th><th style="text-align:right">Die (s)</th><th style="text-align:center">Verdict</th></tr></thead>
      <tbody>${rows.map((r) => `<tr${r.m.elite ? ' style="font-weight:600"' : ''}>
        <td>${esc(r.m.name)}${r.m.elite ? ' <span class="pill" style="background:#7a4dff;color:#fff">elite</span>' : ''}${r.m.rare ? ' <span class="pill" style="background:#c0852a;color:#fff">rare</span>' : ''}</td>
        <td style="text-align:center">${r.m.minLevel === r.m.maxLevel ? r.m.level : r.m.minLevel + '–' + r.m.maxLevel}</td>
        <td>${esc(r.m.zones.join(', ') || '—')}</td>
        <td style="text-align:right">${r.m.hp}</td>
        <td style="text-align:right">${isFinite(r.ttk) ? r.ttk.toFixed(1) : '∞'}</td>
        <td style="text-align:right">${isFinite(r.ttd) ? r.ttd.toFixed(1) : '∞'}</td>
        <td style="text-align:center;color:${r.color};font-weight:700">${r.verdict}</td></tr>`).join('')}</tbody></table></div>
      <p class="meta" style="margin-top:10px;opacity:.75">White-hit DPS only (abilities add more), no miss/dodge, 1v1. "Kill" = time to kill the mob; "Die" = time it kills you. Verdict compares the two.</p>`;
    app.querySelectorAll('#stable td, #stable th').forEach((x) => { x.style.padding = '5px 8px'; x.style.borderBottom = '1px solid var(--line,#2a2a2a)'; });
  }
  render();
  reveal();
}

// ---------- item compare + upgrade finder ----------
let gearAll = null;
const STAT_LABEL = { str: 'Strength', agi: 'Agility', sta: 'Stamina', int: 'Intellect', spi: 'Spirit', armor: 'Armor', ap: 'Attack Power', crit: 'Crit', dodge: 'Dodge' };
const wDps = (w) => w && w.speed ? ((w.min + w.max) / 2) / w.speed : 0;
const gearScore = (g) => Object.values(g.bonuses || {}).reduce((a, b) => a + (+b || 0), 0) + wDps(g.weapon) * 3;
const srcText = (g) => (g.sources || []).map((s) => s.label || s.type).join(' · ') || '—';
async function ensureGear() { if (!gearAll) gearAll = await (await fetch(cb(raw('gear/gear.json')))).json(); return gearAll; }

async function compareView() {
  app.innerHTML = '';
  try { await ensureGear(); } catch (e) { app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load gear (${esc(e.message)})</p></div></section>`)); return; }
  const SEL = 'padding:8px 10px;border-radius:8px;border:1px solid #888;background:#fff;color:#111;color-scheme:light';
  const slotOpts = `<option value="all">All slots</option>` + gearAll.slots.map((s) => `<option value="${s.id}">${esc(s.label)}</option>`).join('');
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Items · compare</span><h2>Compare gear</h2><p>Pick a slot to narrow the lists, choose two pieces, and read the <b>Δ</b> column: green ▲ = the right item wins that stat, red ▼ = it loses.</p></div>
    <div class="controls reveal" style="gap:12px;flex-wrap:wrap;align-items:center">
      <label class="meta">Slot <select id="cmpslot" style="${SEL}">${slotOpts}</select></label>
      <select id="cmpA" style="${SEL};min-width:200px"></select>
      <span class="pill" id="cmpswap" title="Swap">⇄</span>
      <select id="cmpB" style="${SEL};min-width:200px"></select>
    </div>
    <div id="cmpOut" class="reveal" style="margin-top:12px"></div>
  </div></section>`));
  const slotSel = app.querySelector('#cmpslot'), A = app.querySelector('#cmpA'), B = app.querySelector('#cmpB');
  const find = (id) => gearAll.gear.find((g) => g.id === id);
  const listFor = () => gearAll.gear.filter((g) => slotSel.value === 'all' || g.slot === slotSel.value);
  function fill(keepA, keepB) {
    const items = listFor();
    const opts = items.map((g) => `<option value="${g.id}">${esc(g.name)} · ${esc(g.qualityName)}</option>`).join('');
    A.innerHTML = opts; B.innerHTML = opts;
    A.value = keepA && items.some((g) => g.id === keepA) ? keepA : (items[0]?.id || '');
    B.value = keepB && items.some((g) => g.id === keepB) ? keepB : (items[Math.min(1, items.length - 1)]?.id || '');
    render();
  }
  const card = (g) => `<div class="card" style="padding:14px 16px;cursor:default">
    <div style="font-weight:700;font-size:16px;color:${QCOL[g.quality] || '#fff'}">${esc(g.name)}${g.set ? ' <span class="pill" style="background:#a335ee;color:#fff;padding:1px 7px">set</span>' : ''}</div>
    <div class="meta" style="margin-top:3px">${esc(g.slotLabel)} · ${esc(g.qualityName)}${g.armorType ? ' · ' + esc(g.armorType) : ''}${g.reqLevel ? ' · Req lvl ' + g.reqLevel : ''}${g.ilvl ? ' · ilvl ' + g.ilvl : ''}</div>
    <div class="meta" style="margin-top:4px">${g.usable ? esc(g.usable.join(', ')) : 'All classes'}</div>
    <div class="meta" style="margin-top:10px;border-top:1px solid var(--line,#262626);padding-top:8px">${esc(srcText(g))}</div></div>`;
  function render() {
    const a = find(A.value), b = find(B.value); if (!a || !b) { app.querySelector('#cmpOut').innerHTML = ''; return; }
    const keys = [...new Set([...Object.keys(a.bonuses || {}), ...Object.keys(b.bonuses || {})])].sort();
    if (a.weapon || b.weapon) keys.unshift('__dps');
    const valA = (k) => k === '__dps' ? +wDps(a.weapon).toFixed(1) : (a.bonuses?.[k] || 0);
    const valB = (k) => k === '__dps' ? +wDps(b.weapon).toFixed(1) : (b.bonuses?.[k] || 0);
    let aw = 0, bw = 0;
    const rows = keys.map((k) => {
      const x = valA(k), y = valB(k), d = +(y - x).toFixed(1);
      if (d > 0) bw++; else if (d < 0) aw++;
      const chip = d === 0 ? '<span class="meta">—</span>' : `<span style="color:${d > 0 ? '#36c275' : '#e0526a'};font-weight:700">${d > 0 ? '▲ +' + d : '▼ ' + d}</span>`;
      return `<tr><td>${k === '__dps' ? 'Weapon DPS' : STAT_LABEL[k] || k}</td><td style="text-align:right">${x || '—'}</td><td style="text-align:right">${y || '—'}</td><td style="text-align:right">${chip}</td></tr>`;
    }).join('');
    const verdict = !keys.length ? 'No stats to compare.' : bw && !aw ? `<b style="color:#36c275">${esc(b.name)} is a straight upgrade</b> over ${esc(a.name)}.` : aw && !bw ? `<b style="color:#36c275">${esc(a.name)} is a straight upgrade</b> over ${esc(b.name)}.` : `Mixed — ${esc(a.name)} wins ${aw} stat${aw === 1 ? '' : 's'}, ${esc(b.name)} wins ${bw}.`;
    app.querySelector('#cmpOut').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">${card(a)}${card(b)}</div>
      <div style="overflow-x:auto"><table id="cmpTbl" style="width:100%;border-collapse:collapse;font-size:.95rem">
        <thead><tr style="text-align:left"><th>Stat</th><th style="text-align:right;max-width:40%">${esc(a.name.split(',')[0])}</th><th style="text-align:right">${esc(b.name.split(',')[0])}</th><th style="text-align:right">Δ</th></tr></thead>
        <tbody>${rows || '<tr><td colspan=4 class="meta">Neither item has stats.</td></tr>'}</tbody></table></div>
      <p class="meta" style="margin-top:10px">${verdict}</p>`;
    app.querySelectorAll('#cmpTbl td, #cmpTbl th').forEach((c) => { c.style.padding = '6px 10px'; c.style.borderBottom = '1px solid var(--line,#2a2a2a)'; });
  }
  slotSel.onchange = () => fill();
  A.onchange = render; B.onchange = render;
  app.querySelector('#cmpswap').onclick = () => { const t = A.value; A.value = B.value; B.value = t; render(); };
  fill();
  reveal();
}

async function upgradesView() {
  app.innerHTML = '';
  try { await ensureGear(); } catch (e) { app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load gear (${esc(e.message)})</p></div></section>`)); return; }
  const CLS = ['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest', 'Shaman', 'Mage', 'Warlock', 'Druid'];
  const st = { cls: 'Warrior', slot: gearAll.slots[0].id };
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Items · upgrades</span><h2>Gear upgrade finder</h2><p>Pick your class and a slot to see the best gear you can equip there, ranked by stat value, with where to get each.</p></div>
    <div class="controls reveal"><div class="pills" id="ucls"></div></div>
    <div class="controls reveal" style="margin-top:-8px"><label class="meta">Slot <select id="uslot" style="padding:8px;border-radius:8px;border:1px solid #888;background:#fff;color:#111;color-scheme:light">${gearAll.slots.map((s) => `<option value="${s.id}">${esc(s.label)}</option>`).join('')}</select></label></div>
    <div id="uout" class="reveal" style="margin-top:8px"></div>
  </div></section>`));
  const ch = app.querySelector('#ucls');
  CLS.forEach((c) => { const p = el(`<span class="pill${c === st.cls ? ' active' : ''}">${esc(c)}</span>`); p.onclick = () => { st.cls = c; ch.querySelectorAll('.pill').forEach((x) => x.classList.remove('active')); p.classList.add('active'); render(); }; ch.append(p); });
  app.querySelector('#uslot').onchange = (e) => { st.slot = e.target.value; render(); };
  function render() {
    const list = gearAll.gear.filter((g) => g.slot === st.slot && (!g.usable || g.usable.includes(st.cls)))
      .map((g) => ({ g, score: gearScore(g) })).sort((a, b) => b.score - a.score).slice(0, 20);
    const rows = list.map((x, i) => { const g = x.g; const stats = Object.entries(g.bonuses || {}).map(([k, v]) => `+${v} ${STAT_LABEL[k] || k}`).join(', ');
      const wp = g.weapon ? `${g.weapon.min}–${g.weapon.max} @ ${g.weapon.speed}s (${wDps(g.weapon).toFixed(1)} dps)` : '';
      return `<tr${i === 0 ? ' style="background:rgba(255,210,80,.14);font-weight:600"' : ''}><td style="color:${QCOL[g.quality] || '#fff'}">${i === 0 ? '⭐ ' : ''}${esc(g.name)}${g.set ? ' <span class="pill" style="background:#a335ee;color:#fff;padding:1px 7px">set</span>' : ''}${g.reqLevel ? ` <span class="meta" style="font-weight:400">· lvl ${g.reqLevel}</span>` : ''}</td><td>${esc([wp, stats].filter(Boolean).join(' · ')) || '—'}</td><td class="meta">${esc(srcText(g))}</td></tr>`; }).join('');
    app.querySelector('#uout').innerHTML = `<div style="overflow-x:auto"><table id="utbl" style="width:100%;border-collapse:collapse;font-size:.93rem"><thead><tr style="text-align:left"><th>Item</th><th>Stats</th><th>Where</th></tr></thead><tbody>${rows || '<tr><td colspan=3 class="meta">No gear for this class in this slot.</td></tr>'}</tbody></table></div>`;
    app.querySelectorAll('#utbl td, #utbl th').forEach((c) => { c.style.padding = '5px 8px'; c.style.borderBottom = '1px solid var(--line,#2a2a2a)'; });
  }
  render();
  reveal();
}

// ---------- boss strategy cards ----------
let bossData = null;
async function bossesView() {
  app.innerHTML = '';
  if (!bossData) {
    try { bossData = await (await fetch(cb('bosses.json'))).json(); }
    catch (e) { app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load bosses (${esc(e.message)})</p></div></section>`)); return; }
  }
  const bold = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const RC = { Boss: '#ff8000', Elite: '#a335ee', Rare: '#0070dd' };
  const cards = bossData.bosses.map((b) => `<div class="card reveal" style="margin-bottom:14px;padding:14px 16px">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline">
      <h3 style="margin:0">${esc(b.name)} <span class="pill" style="background:${RC[b.rank] || '#555'};color:#fff">${b.rank}</span></h3>
      <span class="meta">lv ${b.level} · ${b.hp.toLocaleString()} HP · ${esc(b.where)}</span></div>
    ${b.tips.length ? `<ul style="margin:10px 0 0;padding-left:18px;line-height:1.7">${b.tips.map((t) => `<li>${bold(t)}</li>`).join('')}</ul>` : '<p class="meta" style="margin:8px 0 0">No special mechanics — straight tank &amp; spank.</p>'}
  </div>`).join('');
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">World · encounters</span><h2>Boss strategies</h2>
      <p>Every boss and special-mechanic enemy, with how to handle their abilities — derived from the game's real mechanic data.</p></div>
    <div class="controls reveal"><input class="search" id="bsearch" placeholder="Search a boss…"></div>
    <div id="blist">${cards}</div>
  </div></section>`));
  const list = app.querySelector('#blist'), all = list.innerHTML;
  app.querySelector('#bsearch').oninput = (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) { list.innerHTML = all; reveal(); return; }
    list.innerHTML = bossData.bosses.filter((b) => b.name.toLowerCase().includes(q)).map((b) => `<div class="card" style="margin-bottom:14px;padding:14px 16px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline"><h3 style="margin:0">${esc(b.name)} <span class="pill" style="background:${RC[b.rank] || '#555'};color:#fff">${b.rank}</span></h3><span class="meta">lv ${b.level} · ${b.hp.toLocaleString()} HP · ${esc(b.where)}</span></div>${b.tips.length ? `<ul style="margin:10px 0 0;padding-left:18px;line-height:1.7">${b.tips.map((t) => `<li>${bold(t)}</li>`).join('')}</ul>` : ''}</div>`).join('') || '<p class="meta">No boss matches.</p>';
  };
  reveal();
}

// ---------- time-to-level estimator ----------
async function levelTimeView(startArg) {
  app.innerHTML = '';
  if (!farmingData) {
    try { farmingData = await (await fetch(cb('farming.json'))).json(); }
    catch (e) { app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load data (${esc(e.message)})</p></div></section>`)); return; }
  }
  const maxL = farmingData.maxLevel, start = Math.min(maxL - 1, Math.max(1, parseInt(startArg, 10) || 1));
  const opts = []; for (let i = 1; i < maxL; i++) opts.push(`<option value="${i}"${i === start ? ' selected' : ''}>Level ${i}</option>`);
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">World · leveling</span><h2>Time to max level</h2>
      <p>Grinding from your level to ${maxL}: total XP and how many mob kills it takes if you only grind the best spot each level. <b>Quests cut this dramatically</b> — treat it as the slow-path ceiling.</p></div>
    <div class="controls reveal"><label class="meta">Starting at <select id="ltlevel">${opts.join('')}</select></label></div>
    <div id="ltout" class="reveal" style="margin-top:8px"></div>
  </div></section>`));
  const sel = app.querySelector('#ltlevel'); sel.onchange = () => { location.hash = `#/leveltime/${sel.value}`; };
  let totXp = 0, totKills = 0; const rows = [];
  for (let L = start; L < maxL; L++) {
    const p = farmingData.perLevel.find((x) => x.level === L); if (!p) continue;
    const best = p.mobs.find((m) => !m.tooHigh) || p.mobs[0];
    totXp += p.xpNeeded; totKills += best ? best.kills : 0;
    rows.push(`<tr><td>${L} → ${L + 1}</td><td style="text-align:right">${p.xpNeeded.toLocaleString()}</td><td>${best ? esc(best.name) : '—'}</td><td style="text-align:right">${best ? best.kills.toLocaleString() : '—'}</td><td style="text-align:right">${totKills.toLocaleString()}</td></tr>`);
  }
  app.querySelector('#ltout').innerHTML = `<p class="meta" style="margin:0 0 12px">From level ${start} to ${maxL}: <b>${totXp.toLocaleString()} XP</b> ≈ <b>${totKills.toLocaleString()} kills</b> grinding (½ that with rested XP, far less with quests).</p>
    <div style="overflow-x:auto"><table id="lttbl" style="width:100%;border-collapse:collapse;font-size:.93rem"><thead><tr style="text-align:left"><th>Level</th><th style="text-align:right">XP</th><th>Best grind</th><th style="text-align:right">Kills</th><th style="text-align:right">Cumulative</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  app.querySelectorAll('#lttbl td, #lttbl th').forEach((c) => { c.style.padding = '5px 8px'; c.style.borderBottom = '1px solid var(--line,#2a2a2a)'; });
  reveal();
}

// ---------- interactive 2D atlas (separate from #/map) ----------
async function atlasView(dir) {
  app.innerHTML = '';
  if (!zone3dData) {
    try { zone3dData = await (await fetch(cb(raw('docs/zone3d.json')))).json(); }
    catch (e) { app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load atlas (${esc(e.message)})</p></div></section>`)); return; }
  }
  const Z = zone3dData.zones, ids = Object.keys(Z), cur = Z[dir] ? dir : ids[0], q = Z[cur];
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">World · atlas</span><h2>Interactive map</h2>
      <p>A top-down, zoomable map of each zone — towns, mob camps, roads, lakes and named places. Drag to pan, scroll to zoom, click an NPC or camp.</p></div>
    <div class="controls reveal" style="position:relative;z-index:5"><select id="atpick" style="max-width:420px;padding:8px 10px;border-radius:8px;border:1px solid #888;background:#fff;color:#111;color-scheme:light">${ids.map((k) => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(Z[k].name)}</option>`).join('')}</select>
      <span class="pill" id="atreset">Reset view</span></div>
    <div style="position:relative;border:1px solid var(--line,#222);border-radius:12px;overflow:hidden;background:${q.biome || '#2b3a22'}">
      <svg id="atsvg" style="display:block;width:100%;height:72vh;touch-action:none;cursor:grab"></svg>
      <div id="attip" style="position:absolute;pointer-events:none;display:none;background:rgba(8,10,16,.92);color:#fff;font:600 12px system-ui;padding:4px 8px;border-radius:6px;z-index:6"></div>
    </div>
  </div></section>`));
  app.querySelector('#atpick').onchange = (e) => { location.hash = `#/atlas/${e.target.value}`; };
  const svg = app.querySelector('#atsvg'), tip = app.querySelector('#attip');
  const b = q.bounds, W = b.x1 - b.x0, H = b.z1 - b.z0;
  // world -> map: +X left (game convention), north (higher z) up
  const MX = (x) => (b.x1 - x), MZ = (z) => (b.z1 - z);
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const root = mk('g', {}); svg.append(root);
  const lbl = Math.max(3, W * 0.018);
  // lakes
  for (const l of (q.lakes || [])) root.append(mk('circle', { cx: MX(l.x), cy: MZ(l.z), r: l.r || l.radius || 6, fill: '#2b6fa6', 'fill-opacity': '0.8' }));
  // roads
  for (const r of (q.roads || [])) { if (r.length < 2) continue; root.append(mk('polyline', { points: r.map((p) => `${MX(p.x)},${MZ(p.z)}`).join(' '), fill: 'none', stroke: '#9c8157', 'stroke-width': Math.max(1, W * 0.006), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-opacity': '0.85' })); }
  // foliage as faint texture (capped)
  for (const f of (q.foliage || []).slice(0, 120)) root.append(mk('circle', { cx: MX(f.x), cy: MZ(f.z), r: lbl * 0.25, fill: '#000', 'fill-opacity': '0.12' }));
  const hov = (e, text) => { tip.textContent = text; tip.style.display = 'block'; const r = svg.getBoundingClientRect(); tip.style.left = (e.clientX - r.left + 12) + 'px'; tip.style.top = (e.clientY - r.top + 12) + 'px'; };
  const out = () => { tip.style.display = 'none'; };
  const pin = (x, z, color, r, text, href) => {
    const c = mk('circle', { cx: MX(x), cy: MZ(z), r, fill: color, stroke: '#000', 'stroke-width': r * 0.35, style: href ? 'cursor:pointer' : '' });
    c.addEventListener('pointerenter', (e) => hov(e, text)); c.addEventListener('pointermove', (e) => hov(e, text)); c.addEventListener('pointerleave', out);
    if (href) c.addEventListener('click', (ev) => { ev.stopPropagation(); location.hash = href; });
    root.append(c);
  };
  // camps (mobs)
  for (const c of (q.camps || [])) pin(c.x, c.z, '#e0526a', lbl * 0.45, `${c.name}${c.count ? ' ×' + c.count : ''}`, '#/bestiary');
  // npcs
  for (const n of (q.npcs || [])) pin(n.x, n.z, '#ffd24f', lbl * 0.5, n.name, '#/npcs');
  // place labels
  for (const pl of (q.places || [])) { const t = mk('text', { x: MX(pl.x), y: MZ(pl.z), fill: '#fff6d8', 'font-size': lbl, 'font-weight': '700', 'text-anchor': 'middle', stroke: '#000', 'stroke-width': lbl * 0.06, 'paint-order': 'stroke' }); t.textContent = pl.name; root.append(t); }
  // pan/zoom via viewBox (MX/MZ already produce 0..W / 0..H coordinates)
  const vb2 = { x: 0, y: 0, w: W, h: H }, home2 = { x: 0, y: 0, w: W, h: H };
  const set = () => svg.setAttribute('viewBox', `${vb2.x} ${vb2.y} ${vb2.w} ${vb2.h}`);
  svg.addEventListener('wheel', (e) => { e.preventDefault(); const r = svg.getBoundingClientRect(); const mxp = (e.clientX - r.left) / r.width, myp = (e.clientY - r.top) / r.height; const f = e.deltaY < 0 ? 0.85 : 1.18; const nw = Math.min(W * 1.2, Math.max(W * 0.08, vb2.w * f)), nh = nw * (H / W); vb2.x += (vb2.w - nw) * mxp; vb2.y += (vb2.h - nh) * myp; vb2.w = nw; vb2.h = nh; set(); }, { passive: false });
  let drag = null;
  svg.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; svg.style.cursor = 'grabbing'; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointermove', (e) => { if (!drag) return; const r = svg.getBoundingClientRect(); vb2.x -= (e.clientX - drag.x) / r.width * vb2.w; vb2.y -= (e.clientY - drag.y) / r.height * vb2.h; drag = { x: e.clientX, y: e.clientY }; set(); });
  const endDrag = () => { drag = null; svg.style.cursor = 'grab'; };
  svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);
  app.querySelector('#atreset').onclick = () => { Object.assign(vb2, home2); set(); };
  set();
  reveal();
}

// ---------- item sets (v0.16) ----------
let setData = null;
async function itemSetsView() {
  app.innerHTML = '';
  if (!setData) {
    try { setData = await (await fetch(cb('itemsets.json'))).json(); }
    catch (e) { app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load item sets (${esc(e.message)})</p></div></section>`)); return; }
  }
  const cards = setData.sets.map((s) => `<div class="card reveal" style="margin-bottom:16px;padding:16px 18px">
    <h3 style="margin:0 0 4px;color:${QCOL.epic}">${esc(s.name)} <span class="meta" style="font-weight:400">· ${s.pieces.length} pieces</span></h3>
    <div class="meta" style="margin:6px 0 10px">${s.pieces.map((p) => `${esc(p.name)} <span style="opacity:.6">(${esc(p.slotLabel)})</span>`).join(' · ')}</div>
    <ul style="margin:0;padding-left:18px;line-height:1.7">${s.bonuses.map((b) => `<li><b style="color:var(--gold)">(${b.pieces})</b> ${esc(b.text)}</li>`).join('')}</ul>
  </div>`).join('');
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Items · sets</span><h2>Item sets</h2>
      <p>Collect pieces of a set to unlock tiered bonuses (new in v0.16). Each tier activates once you're wearing that many pieces.</p></div>
    ${cards}
  </div></section>`));
  reveal();
}

// ---------- lockpicking practice: "Tumbler's Path" (faithful port of woc/src/sim/lockpick.ts) ----------
const LP_DELTA = { hardSet: -2, set: -1, steady: 0, ease: 1, drop: 2 };
const LP_ACTIONS = ['hardSet', 'set', 'steady', 'ease', 'drop'];
const LP_LABEL = { hardSet: 'Hard Set', set: 'Set', steady: 'Steady', ease: 'Ease', drop: 'Drop' };
const LP_GLYPH = { hardSet: '⤒', set: '↑', steady: '—', ease: '↓', drop: '⤓' };
const LP_TIERS = {
  normal: { cols: 12, rows: 6, width: 1, gateCount: 2, window: 4, trapCount: 3 },
  heroic: { cols: 16, rows: 6, width: 1, gateCount: 3, window: 3, trapCount: 5 },
};
const LP_DIFF = {
  easy: { tier: 'normal', ms: 9000, tries: 3, label: 'Easy' },
  medium: { tier: 'normal', ms: 6000, tries: 2, label: 'Medium' },
  hard: { tier: 'heroic', ms: 3000, tries: 1, label: 'Hard' },
};
function lpRng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function lpInt(rnd, a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
function lpGenerate(seed, tier) {
  const rnd = lpRng(seed), H = tier.rows, W = tier.cols, deltas = LP_ACTIONS.map((a) => LP_DELTA[a]);
  const path = new Array(W); path[0] = lpInt(rnd, 0, H - 1);
  for (let c = 1; c < W; c++) { const legal = deltas.filter((d) => path[c - 1] + d >= 0 && path[c - 1] + d <= H - 1); path[c] = path[c - 1] + (legal.length ? legal[Math.floor(rnd() * legal.length)] : 0); }
  const cand = []; for (let c = 1; c <= W - 2; c++) cand.push(c);
  for (let i = cand.length - 1; i > 0; i--) { const j = lpInt(rnd, 0, i);[cand[i], cand[j]] = [cand[j], cand[i]]; }
  const gates = cand.slice(0, Math.max(0, Math.min(tier.gateCount, cand.length))).sort((a, b) => a - b), gateSet = new Set(gates);
  const open = new Array(W);
  for (let c = 0; c < W; c++) { if (c === W - 1 || gateSet.has(c)) open[c] = [path[c]]; else { const band = []; for (let r = path[c] - tier.width; r <= path[c] + tier.width; r++) if (r >= 0 && r <= H - 1) band.push(r); open[c] = band; } }
  for (let c = 1; c < W; c++) { const prev = open[c - 1]; open[c] = open[c].filter((r) => prev.some((pr) => deltas.includes(r - pr))); }
  for (let c = W - 2; c >= 0; c--) { const next = open[c + 1]; open[c] = open[c].filter((r) => next.some((nr) => deltas.includes(nr - r))); }
  const traps = open.map(() => []), budget = Math.max(0, tier.trapCount || 0);
  if (budget > 0) { const tc = []; for (let c = 1; c < W - 1; c++) { if (gateSet.has(c)) continue; for (const r of open[c]) if (r !== path[c]) tc.push([c, r]); }
    for (let i = tc.length - 1; i > 0; i--) { const j = lpInt(rnd, 0, i);[tc[i], tc[j]] = [tc[j], tc[i]]; }
    for (const [c, r] of tc.slice(0, Math.min(budget, tc.length))) traps[c].push(r); traps.forEach((t) => t.sort((a, b) => a - b)); }
  return { tier, open, gates, traps, startRow: path[0], seatRow: path[W - 1] };
}
function lpStep(spec, col, row, action) {
  const H = spec.tier.rows, newRow = Math.max(0, Math.min(H - 1, row + LP_DELTA[action])), newCol = col + 1, colOpen = spec.open[newCol];
  if (!colOpen || !colOpen.includes(newRow)) return { result: spec.gates.includes(newCol) ? 'bind' : 'slip', col, row };
  if (spec.traps[newCol] && spec.traps[newCol].includes(newRow)) return { result: 'trap', col, row };
  if (newCol === spec.open.length - 1 && newRow === spec.seatRow) return { result: 'success', col: newCol, row: newRow };
  return { result: 'advanced', col: newCol, row: newRow };
}

function lockpickView() {
  app.innerHTML = '';
  let diff = 'easy', spec = null, col = 0, row = 0, tries = 0, done = false, timer = null, deadline = 0;
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Tools · practice</span><h2>Lockpicking — Tumbler's Path</h2>
      <p>Practice the delve lockpicking minigame. Thread the pick along the open channel (lit cells), seat it on each <b style="color:#e6bb6a">gold tumbler gate</b>, dodge the <b style="color:#e0526a">red ward-traps</b>, and reach the <b style="color:#36c275">green bolt seat</b>. Each move advances one column; pick a depth. You have a few seconds per move.</p></div>
    <div class="controls reveal"><div class="pills" id="lpdiff"></div><span class="pill" id="lpnew">↻ New lock</span></div>
    <div class="reveal" style="display:flex;gap:18px;flex-wrap:wrap;align-items:center;margin:-6px 0 8px"><span class="meta" id="lptries"></span><span class="meta" id="lpmsg" style="font-weight:600"></span></div>
    <div class="reveal" style="height:6px;border-radius:3px;background:var(--glass);overflow:hidden;margin-bottom:12px"><div id="lpbar" style="height:100%;width:100%;background:linear-gradient(90deg,#36c275,#e6bb6a,#e0526a);transition:width .1s linear"></div></div>
    <div id="lpgrid" class="reveal" style="overflow-x:auto;padding:6px 0;margin-bottom:14px"></div>
    <div class="controls reveal" id="lpactions"></div>
    <p class="meta reveal" style="margin-top:10px;opacity:.75">Keys: <b>1–5</b> for the depth actions. Fogged columns (▓) reveal as you advance. A slip, bind, trap, or timeout burns one try and resets the board.</p>
  </div></section>`));
  const $ = (s) => app.querySelector(s);
  const diffHost = $('#lpdiff');
  Object.entries(LP_DIFF).forEach(([k, d]) => { const p = el(`<span class="pill${k === diff ? ' active' : ''}">${d.label}</span>`); p.onclick = () => { diff = k; diffHost.querySelectorAll('.pill').forEach((x) => x.classList.remove('active')); p.classList.add('active'); newLock(); }; diffHost.append(p); });
  const actHost = $('#lpactions');
  actHost.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
  LP_ACTIONS.forEach((a, i) => {
    const btn = el(`<button style="flex:1;min-width:60px;min-height:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:6px 2px;background:#1a1410;border:1px solid #463a1c;border-radius:6px;color:#d4af37;cursor:pointer;font-family:inherit">
      <span style="font-size:10px;color:#c9b27a">${i + 1}</span><span style="font-size:19px;line-height:1">${LP_GLYPH[a]}</span><span style="font-size:10px">${LP_LABEL[a]}</span></button>`);
    btn.onmouseenter = () => { btn.style.borderColor = '#d4af37'; btn.style.background = '#2a2010'; };
    btn.onmouseleave = () => { btn.style.borderColor = '#463a1c'; btn.style.background = '#1a1410'; };
    btn.onclick = () => move(a);
    actHost.append(btn);
  });
  function clearTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function armTimer() {
    clearTimer(); const ms = LP_DIFF[diff].ms; deadline = performance.now() + ms;
    timer = setInterval(() => { const left = deadline - performance.now(); $('#lpbar').style.width = Math.max(0, (left / ms) * 100) + '%'; if (left <= 0) { clearTimer(); fail('⏱ Too slow — the pick slipped.'); } }, 80);
  }
  function newLock() { clearTimer(); spec = lpGenerate((Math.random() * 2 ** 31) >>> 0, LP_TIERS[LP_DIFF[diff].tier]); col = 0; row = spec.startRow; tries = LP_DIFF[diff].tries; done = false; $('#lpmsg').textContent = ''; render(); armTimer(); }
  function resetBoard() { col = 0; row = spec.startRow; render(); armTimer(); }
  function fail(msg) {
    tries--; clearTimer();
    if (tries <= 0) { done = true; $('#lpmsg').innerHTML = `<span style="color:#e0526a">✖ ${msg} The lock jammed for good.</span>`; render(); }
    else { $('#lpmsg').innerHTML = `<span style="color:#e0a23a">${msg} ${tries} ${tries === 1 ? 'try' : 'tries'} left — board reset.</span>`; resetBoard(); }
    updTries();
  }
  function move(a) {
    if (done || !spec) return;
    const r = lpStep(spec, col, row, a);
    if (r.result === 'slip') return fail('⟂ Ward slip — that depth is solid wall.');
    if (r.result === 'bind') return fail('⊗ Bind — you missed the tumbler gate.');
    if (r.result === 'trap') return fail('☠ Ward-trap — the lock seized.');
    col = r.col; row = r.row;
    if (r.result === 'success') { done = true; clearTimer(); $('#lpmsg').innerHTML = `<span style="color:#36c275">✔ The bolt turns — lock open!</span>`; $('#lpbar').style.width = '100%'; render(); return; }
    render(); armTimer();
  }
  function updTries() { $('#lptries').innerHTML = `Difficulty: <b>${LP_DIFF[diff].label}</b> · Tries left: <b style="color:${tries <= 1 ? '#e0526a' : '#e6bb6a'}">${'◆'.repeat(Math.max(0, tries))}${'◇'.repeat(Math.max(0, LP_DIFF[diff].tries - tries))}</b>`; }
  function render() {
    // "Tumbler's Path" board: a row of brass pin-tracks (one per lock column).
    // Only lit wards (open notch / gate / seat / trap) show; the rest is solid
    // metal; fogged columns are covered plates. Matches the in-game lp-board look.
    updTries();
    const W = spec.tier.cols, H = spec.tier.rows, win = spec.tier.window, BH = 188;
    const maxC = Math.min(W - 1, col + win);
    const topPct = (r) => (H <= 1 ? 50 : (r / (H - 1)) * 100);
    const tracks = [];
    for (let c = 0; c < W; c++) {
      const state = c < col ? 'set' : c === col ? 'active' : c <= maxC ? 'ahead' : 'fog';
      const isGate = spec.gates.includes(c);
      let track = 'position:relative;border-radius:3px;background:#1c160e;border:1px solid #2c2414;';
      if (state === 'set') track += 'background:#181208;opacity:.7;';
      else if (state === 'active') track += 'background:#241a0d;border-color:#d4af37;box-shadow:inset 0 0 8px rgba(212,175,55,.25),0 0 7px rgba(212,175,55,.35);';
      else if (isGate) track += 'border-color:rgba(212,175,55,.5);';
      let inner;
      if (state === 'fog') {
        inner = '<div style="position:absolute;inset:6px 0;border-radius:2px;background:repeating-linear-gradient(45deg,#0f0c08,#0f0c08 4px,#15110a 4px,#15110a 8px)"></div>';
      } else {
        let notches = '';
        for (const r of spec.open[c]) {
          const t = topPct(r), isSeat = c === W - 1, trap = spec.traps[c] && spec.traps[c].includes(r);
          let n;
          if (isSeat) n = `left:6%;right:6%;height:10px;background:#7fdc4f;box-shadow:0 0 7px #4f8c2f`;
          else if (trap) n = `left:8%;right:8%;height:8px;background:repeating-linear-gradient(90deg,#ff5a3a,#ff5a3a 3px,#7a1a0c 3px,#7a1a0c 6px);box-shadow:0 0 6px rgba(255,60,30,.6)`;
          else if (isGate) n = `left:6%;right:6%;height:9px;background:linear-gradient(90deg,#d4af37 0 44%,#1a1208 44% 56%,#d4af37 56% 100%);box-shadow:0 0 6px rgba(212,175,55,.5)`;
          else n = `left:14%;right:14%;height:7px;background:#5a4a28`;
          notches += `<div style="position:absolute;border-radius:3px;transform:translateY(-50%);top:${t}%;${n}"></div>`;
        }
        if (c === col) notches += `<div style="position:absolute;left:-3px;right:-3px;height:5px;border-radius:3px;transform:translateY(-50%);top:${topPct(row)}%;background:#fff;box-shadow:0 0 9px #fff,0 0 3px #000;z-index:2"></div>`;
        inner = `<div style="position:absolute;inset:6px 0">${notches}</div>`;
      }
      tracks.push(`<div style="${track}">${inner}</div>`);
    }
    $('#lpgrid').innerHTML = `<div style="display:grid;grid-template-columns:repeat(${W},1fr);gap:4px;padding:8px;height:${BH}px;background:linear-gradient(#0d0a07,#161009);border:1px solid #463a1c;border-radius:6px;min-width:${W * 20}px">${tracks.join('')}</div>`;
  }
  document.onkeydown = (e) => { if (!app.contains($('#lpgrid'))) { document.onkeydown = null; return; } const n = parseInt(e.key, 10); if (n >= 1 && n <= 5) { move(LP_ACTIONS[n - 1]); e.preventDefault(); } };
  $('#lpnew').onclick = newLock;
  newLock();
  reveal();
}

// ---------- developer badges (v0.18) ----------
let badgeData = null;
async function badgesView() {
  app.innerHTML = '';
  if (!badgeData) {
    try { badgeData = await (await fetch(cb('devbadges.json'))).json(); }
    catch (e) { app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load badges (${esc(e.message)})</p></div></section>`)); return; }
  }
  const badge = (t) => `<svg width="64" height="64" viewBox="0 0 64 64" style="flex:none">
    <circle cx="32" cy="32" r="26" fill="#14110c" stroke="${t.ring}" stroke-width="4"${t.significant ? ` style="filter:drop-shadow(0 0 5px ${t.glow})"` : ''}/>
    ${Array.from({ length: t.index + 1 }, (_, i) => `<circle cx="32" cy="${18 + i * 8}" r="2.6" fill="#fff6df"/>`).join('')}
    <line x1="32" y1="18" x2="32" y2="${18 + t.index * 8}" stroke="#fff6df" stroke-width="1.4" opacity=".6"/></svg>`;
  const cards = badgeData.tiers.map((t) => `<div class="card reveal" style="display:flex;gap:16px;align-items:center;padding:14px 16px;margin-bottom:12px;cursor:default">
    ${badge(t)}
    <div><div style="font-weight:700;font-size:17px;color:${t.ring}">${esc(t.name)} <span class="meta" style="font-weight:400">· ${t.threshold}+ merged PRs</span></div>
    <div class="meta" style="margin-top:3px;font-style:italic">${esc(t.flavor)}</div>
    ${t.significant ? `<div class="meta" style="margin-top:4px;color:${t.ring}">✦ Also grants a glowing nameplate outline in-game.</div>` : ''}</div></div>`).join('');
  app.append(el(`<section class="block"><div class="wrap">
    <div class="shead reveal"><span class="eyebrow">Community</span><h2>Developer badges</h2>
      <p>New in v0.18: contributors who land merged pull requests in the <a href="https://github.com/levy-street/world-of-claudecraft" target="_blank" rel="noopener" style="color:var(--gold)">open-source game repo</a> earn cosmetic badges, shown next to their nameplate and on a "Developers" leaderboard. Five rungs, by merged-PR count:</p></div>
    ${cards}
    <p class="meta reveal" style="opacity:.8">Link a verified GitHub account in-game (the "Link GitHub" control) to claim your rung. Counts come from GitHub's public contributor stats for the repo.</p>
  </div></section>`));
  reveal();
}

// ---------- router ----------
function router() {
  const h = location.hash || '#/';
  setActiveNav(h);
  if (window.goatcounter && window.goatcounter.count) { try { window.goatcounter.count({ path: location.pathname + h, title: document.title }); } catch (e) {} }
  const parts = h.slice(2).split('/');
  const head = parts[0] || '';
  if (head === 'quests') return questsView();
  if (head === 'map') return worldMapView(parts[1], parts[2]);
  if (head === 'route') return routeView();
  if (head === 'farming') return farmingView(parts[1]);
  if (head === 'drops') return dropsView();
  if (head === 'chains') return questChainsView();
  if (head === 'calc') return calcView();
  if (head === 'solo') return soloView();
  if (head === 'compare') return compareView();
  if (head === 'upgrades') return upgradesView();
  if (head === 'bosses') return bossesView();
  if (head === 'leveltime') return levelTimeView(parts[1]);
  if (head === 'atlas') return atlasView(parts[1]);
  if (head === 'sets') return itemSetsView();
  if (head === 'lockpick') return lockpickView();
  if (head === 'badges') return badgesView();
  if (head === 'patches') return patchesView();
  if (head === 'augments') return augmentsView();
  if (head === 'cosmetics') return cosmeticsView();
  if (head === 'bestiary') return mobsView();
  if (head === 'zones') return zonesView();
  if (head === 'npcs') return npcsView();
  if (head === 'assets') return assetsView();
  if (head === 'explore') return dungeon3dView(parts[1]);
  if (head === 'questroute') return quest3dView(parts[1]);
  if (head === 'zone3d') return zone3dView(parts[1]);
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
  if (!searchIndex) { try { searchIndex = await (await fetch(cb('search.json'))).json(); } catch { searchIndex = []; } }
  let hits = [], sel = 0;
  const localName = (e) => { if (LANG !== 'en' && e.k) { const [g, id] = e.k.split(':'); return tn(g, id, e.n); } return e.n; };
  function draw() {
    res.innerHTML = '';
    hits.forEach((h, i) => {
      const r = el(`<div class="searchhit ${i === sel ? 'on' : ''}"><span class="searchtype">${esc(h.t)}</span> ${esc(localName(h))}</div>`);
      r.onclick = () => choose(h); r.onmouseenter = () => { sel = i; [...res.children].forEach((c, j) => c.classList.toggle('on', j === i)); };
      res.append(r);
    });
  }
  function run(q) {
    q = q.trim().toLowerCase(); sel = 0;
    if (!q) { hits = []; res.innerHTML = ''; return; }
    hits = searchIndex.filter(e => e.nl.includes(q) || localName(e).toLowerCase().includes(q))
      .sort((a, b) => (localName(a).toLowerCase().startsWith(q) ? 0 : 1) - (localName(b).toLowerCase().startsWith(q) ? 0 : 1) || a.n.length - b.n.length)
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

// mobile hamburger menu
const navEl = document.querySelector('nav');
const navToggle = document.getElementById('navtoggle');
const closeMenu = () => { navEl?.classList.remove('open'); navToggle?.setAttribute('aria-expanded', 'false'); };
navToggle?.addEventListener('click', () => {
  const open = navEl.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});
document.getElementById('navlang')?.addEventListener('change', closeMenu);

// global click handler for [data-go]
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go]');
  if (t) { e.preventDefault(); closeMenu(); location.hash = t.getAttribute('data-go'); }
  else if (e.target.closest('#navsearch, #navtheme')) closeMenu();
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

// live visitor counter in the footer (GoatCounter public total; needs "allow viewing without login")
(async () => {
  const code = window.ANALYTICS_CODE; const elc = document.getElementById('visitcount');
  if (!code || !elc) return;
  try {
    const j = await (await fetch(`https://${code}.goatcounter.com/counter/TOTAL.json`)).json();
    elc.textContent = `· 👁 ${j.count} visits`; elc.hidden = false;
  } catch (e) { /* stats private or offline — stay hidden */ }
})();

// ---------- boot ----------
async function initLangSwitcher() {
  const sel = document.getElementById('navlang');
  if (!sel) return;
  let langs = [{ code: 'en', label: 'English' }];
  try { langs = await (await fetch('i18n/languages.json', { cache: 'force-cache' })).json(); } catch {}
  sel.innerHTML = langs.map(l => `<option value="${l.code}">${l.label}</option>`).join('');
  sel.value = LANG;
  sel.onchange = async () => { await loadLang(sel.value); router(); };
  if (LANG !== 'en') await loadLang(LANG);
}

(async function boot() {
  try {
    M = await (await fetch(cb('manifest.json'))).json();
    RAW = `https://raw.githubusercontent.com/${M.repo}/${M.branch}/`;
    await initLangSwitcher();
    router();
  } catch (e) {
    app.innerHTML = `<section class="block"><div class="wrap"><p class="meta">Failed to load the guide manifest. ${esc(e.message)}</p></div></section>`;
  }
})();
