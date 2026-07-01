'use strict';
// Leveling pathfinder — #/pathfinder[/fromLevel[/toLevel]]
// Pick your level, check off quests you've done, and see exactly how much XP remains
// to hit your target. Auto-suggest fills in the fastest available quest picks.
(function () {
  const { el, esc, reveal, registerView, loadJSON } = window.WOC;

  // XP to clear each level (from reference/combat.md; cap is 20).
  const XP_TO_NEXT = [400, 900, 1400, 2100, 2800, 3600, 4500, 5400, 6500, 7600, 8800, 10100, 11400, 12900, 14400, 16000, 17700, 19400, 21300, 23200];
  const MAX_LEVEL = 20;
  const LS_KEY = 'woc_pathfinder_done';

  const xpForLevel = (level) => XP_TO_NEXT[Math.min(Math.max(level, 1), MAX_LEVEL) - 1] || 0;
  const xpToReach = (fromLevel, fromXp, toLevel) => {
    if (toLevel <= fromLevel) return 0;
    let need = -fromXp;
    for (let L = fromLevel; L < toLevel; L++) need += xpForLevel(L);
    return Math.max(0, need);
  };
  const levelAfterXp = (startLevel, startXp, gain) => {
    let L = startLevel, xp = startXp + gain;
    while (L < MAX_LEVEL && xp >= xpForLevel(L)) { xp -= xpForLevel(L); L++; }
    if (L >= MAX_LEVEL) xp = 0;
    return { level: L, xp };
  };

  let QUEST_DATA = null;
  let PREREQS = null; // questId -> prerequisite questId (or null)
  let ROUTE_ORDER = null; // quest ids in recommended route order (manifest)

  function buildPrereqs(chains) {
    const map = new Map();
    function walk(nodes, parentReq) {
      for (const n of nodes || []) {
        if (n.req) map.set(n.id, n.req);
        else if (parentReq) map.set(n.id, parentReq);
        walk(n.children, n.id);
      }
    }
    for (const z of chains.zones || []) walk(z.chains, null);
    return map;
  }

  function prereqMet(id, done) {
    const req = PREREQS.get(id);
    return !req || done.has(req);
  }

  async function pathfinderView(parts) {
    const app = window.WOC.app;
    app.innerHTML = '';
    try {
      if (!QUEST_DATA) {
        const [qx, chains, manifest] = await Promise.all([
          loadJSON('questxp.json'),
          loadJSON('questchains.json'),
          loadJSON('manifest.json'),
        ]);
        QUEST_DATA = qx;
        PREREQS = buildPrereqs(chains);
        ROUTE_ORDER = (manifest.zones || []).flatMap((z) => (z.quests || []).map((q) => q.id));
      }
    } catch (e) {
      app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load data (${esc(e.message)})</p></div></section>`));
      return;
    }

    const quests = Object.entries(QUEST_DATA.quests).map(([id, q]) => ({ id, ...q }));
    let done = new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      if (Array.isArray(saved)) done = new Set(saved.filter((id) => QUEST_DATA.quests[id]));
    } catch (e) { /* ignore corrupt save */ }

    const st = {
      from: Math.min(MAX_LEVEL, Math.max(1, parseInt(parts && parts[0], 10) || 1)),
      to: Math.min(MAX_LEVEL, Math.max(1, parseInt(parts && parts[1], 10) || MAX_LEVEL)),
      xp: 0,
      zone: 'all',
      term: '',
    };
    if (st.to < st.from) st.to = st.from;

    app.append(el(`<section class="block"><div class="wrap">
      <div class="shead reveal"><span class="eyebrow">Tools · leveling</span><h2>Leveling pathfinder</h2>
        <p>Track quest XP from where you are to your target level. Check off finished quests, see what's left, and let the planner suggest the highest-XP picks still available.</p></div>
      <div class="controls reveal" style="gap:14px;flex-wrap:wrap;align-items:flex-end">
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">Current level
          <select id="pf-from" style="padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></select></label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">XP in this level
          <input id="pf-xp" type="number" min="0" value="0" style="width:110px;padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">Target level
          <select id="pf-to" style="padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></select></label>
        <span class="pill" id="pf-suggest" title="Check the best XP quests you haven't done yet">✨ Auto-fill path</span>
        <span class="pill" id="pf-route" title="Check quests along the recommended leveling route">🧭 Use route order</span>
        <span class="pill" id="pf-clear">Clear checks</span>
      </div>
      <div id="pf-summary" class="reveal card" style="padding:14px 16px;margin-top:10px"></div>
      <div class="controls reveal" style="margin-top:10px;gap:10px;flex-wrap:wrap">
        <input class="search" id="pf-search" placeholder="Search quests…" style="flex:1;min-width:180px">
        <div class="pills" id="pf-zones"></div>
      </div>
      <div id="pf-list" class="reveal" style="margin-top:8px"></div>
    </div></section>`));

    const fromSel = app.querySelector('#pf-from');
    const toSel = app.querySelector('#pf-to');
    const xpIn = app.querySelector('#pf-xp');
    for (let i = 1; i <= MAX_LEVEL; i++) {
      fromSel.append(el(`<option value="${i}"${i === st.from ? ' selected' : ''}>Level ${i}</option>`));
      toSel.append(el(`<option value="${i}"${i === st.to ? ' selected' : ''}>Level ${i}</option>`));
    }
    xpIn.value = st.xp;

    const zones = ['all', ...Array.from(new Set(quests.map((q) => q.zone))).sort()];
    const zoneHost = app.querySelector('#pf-zones');
    zones.forEach((z, i) => {
      const p = el(`<span class="pill ${i === 0 ? 'active' : ''}">${z === 'all' ? 'All zones' : esc(z)}</span>`);
      p.onclick = () => { st.zone = z; zoneHost.querySelectorAll('.pill').forEach((x) => x.classList.remove('active')); p.classList.add('active'); renderList(); };
      zoneHost.append(p);
    });

    function syncHash() {
      history.replaceState(null, '', `#/pathfinder/${st.from}/${st.to}`);
    }

    function saveDone() {
      try { localStorage.setItem(LS_KEY, JSON.stringify([...done])); } catch (e) { /* quota */ }
    }

    function selectedXp() {
      return quests.filter((q) => done.has(q.id)).reduce((a, q) => a + q.xp, 0);
    }

    function availableQuests() {
      return quests.filter((q) => q.level <= st.from && prereqMet(q.id, done) && !done.has(q.id));
    }

    function renderSummary() {
      st.from = +fromSel.value;
      st.to = +toSel.value;
      st.xp = Math.max(0, parseInt(xpIn.value, 10) || 0);
      if (st.to < st.from) { st.to = st.from; toSel.value = st.to; }
      syncHash();

      const need = xpToReach(st.from, st.xp, st.to);
      const checked = selectedXp();
      const after = levelAfterXp(st.from, st.xp, checked);
      const remain = Math.max(0, xpToReach(st.from, st.xp, st.to) - checked);
      const pct = need > 0 ? Math.min(100, (checked / need) * 100) : 100;

      const bar = `<div style="background:var(--line,#262626);border-radius:6px;height:10px;margin:8px 0 4px;overflow:hidden">
        <div style="width:${pct.toFixed(1)}%;height:100%;background:linear-gradient(90deg,#e6bb6a,#b9822f);border-radius:6px"></div></div>`;

      app.querySelector('#pf-summary').innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:18px;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:1.35rem;font-weight:700">Level ${st.from}${st.xp ? ` <span class="meta" style="font-weight:400">(+${st.xp.toLocaleString()} XP)</span>` : ''}
              <span class="meta" style="font-weight:400"> → ${st.to}</span></div>
            <div class="meta" style="margin-top:4px">Need <b>${need.toLocaleString()} XP</b> to reach level ${st.to}${st.to >= MAX_LEVEL ? ' (cap)' : ''}</div>
            ${bar}
            <div class="meta">Checked quests: <b>${checked.toLocaleString()} XP</b>${remain > 0 ? ` · still need <b>${remain.toLocaleString()} XP</b>` : need > 0 ? ' · <b style="color:#36c275">target covered!</b>' : ''}</div>
          </div>
          <div style="text-align:right">
            <div class="meta">After checked quests</div>
            <div style="font-size:1.5rem;font-weight:700;color:#e6bb6a">Level ${after.level}${after.xp ? ` <span class="meta" style="font-size:.9rem;font-weight:400">+${after.xp.toLocaleString()}</span>` : ''}</div>
            ${after.level >= st.to ? '<div class="meta" style="color:#36c275">✓ hits your target</div>' : `<div class="meta">${st.to - after.level} level${st.to - after.level === 1 ? '' : 's'} short</div>`}
          </div>
        </div>`;
    }

    function renderList() {
      renderSummary();
      const term = (app.querySelector('#pf-search').value || '').toLowerCase();
      const list = quests
        .filter((q) => st.zone === 'all' || q.zone === st.zone)
        .filter((q) => !term || q.name.toLowerCase().includes(term) || q.zone.toLowerCase().includes(term))
        .sort((a, b) => a.level - b.level || b.xp - a.xp || a.name.localeCompare(b.name));

      const host = app.querySelector('#pf-list');
      if (!list.length) { host.innerHTML = '<p class="meta">No quests match.</p>'; return; }

      let curZone = null;
      host.innerHTML = '';
      for (const q of list) {
        if (q.zone !== curZone) {
          curZone = q.zone;
          host.append(el(`<h3 style="margin:18px 0 6px;font-size:1rem">${esc(curZone)}</h3>`));
        }
        const isDone = done.has(q.id);
        const locked = !isDone && (q.level > st.from || !prereqMet(q.id, done));
        const reqName = PREREQS.get(q.id);
        const reqQ = reqName && QUEST_DATA.quests[reqName];
        const row = el(`<label class="card" style="display:flex;gap:12px;align-items:flex-start;padding:10px 14px;margin-bottom:8px;cursor:pointer;opacity:${locked ? '.45' : '1'}">
          <input type="checkbox" ${isDone ? 'checked' : ''} ${locked ? 'disabled' : ''} style="margin-top:4px;flex:none">
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <strong${isDone ? ' style="text-decoration:line-through;opacity:.7"' : ''}>${esc(q.name)}</strong>
              <span style="color:#e6bb6a;font-weight:700;white-space:nowrap">${q.xp.toLocaleString()} XP</span>
            </div>
            <div class="meta" style="margin-top:2px">
              Lv ${q.level}+${q.group ? ' · 👥 group' : ''}${q.chain ? ' · chain' : ''}
              ${locked && reqQ ? ` · needs <em>${esc(reqQ.name)}</em>` : ''}
              ${locked && q.level > st.from ? ` · level ${q.level} required` : ''}
            </div>
          </div>
          <a href="#/doc/${encodeURIComponent(q.file)}" style="flex:none;font-size:.85rem;white-space:nowrap" onclick="event.stopPropagation()">Guide →</a>
        </label>`);
        const cb = row.querySelector('input');
        cb.onchange = () => {
          if (cb.checked) done.add(q.id); else done.delete(q.id);
          saveDone();
          renderList();
        };
        host.append(row);
      }
    }

    function autoFill(order) {
      const need = xpToReach(st.from, st.xp, st.to);
      let got = 0;
      for (const q of order) {
        if (got >= need) break;
        if (done.has(q.id)) continue;
        if (q.level > st.from) continue;
        if (!prereqMet(q.id, done)) continue;
        done.add(q.id);
        got += q.xp;
      }
      saveDone();
      renderList();
    }

    fromSel.onchange = () => { st.from = +fromSel.value; renderList(); };
    toSel.onchange = () => { st.to = +toSel.value; renderList(); };
    xpIn.oninput = renderList;
    app.querySelector('#pf-search').oninput = renderList;

    app.querySelector('#pf-suggest').onclick = () => {
      const order = availableQuests().slice().sort((a, b) => b.xp - a.xp);
      autoFill(order);
    };

    app.querySelector('#pf-route').onclick = () => {
      const byId = new Map(quests.map((q) => [q.id, q]));
      const order = (ROUTE_ORDER || []).map((id) => byId.get(id)).filter(Boolean);
      autoFill(order);
    };

    app.querySelector('#pf-clear').onclick = () => {
      done.clear();
      saveDone();
      renderList();
    };

    renderList();
    reveal();
  }

  registerView('pathfinder', pathfinderView);
})();
