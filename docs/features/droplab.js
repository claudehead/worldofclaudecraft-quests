'use strict';
// Drop-rate probability lab — #/droplab
// Pick an item, see its drop sources, and for each mob source: expected kills,
// "kills needed for X% chance", a geometric drop-distribution histogram, and an
// estimated grind time from your DPS. Self-registers into the app router.
(function () {
  const { el, esc, cb, raw, reveal, registerView, loadJSON, QUALITY_COLOR } = window.WOC;

  let DROPS = null, MOBS = null;

  // n kills for a `conf` probability of at least one drop at per-kill chance p (0..1).
  const killsForConfidence = (p, conf) => (p <= 0 ? Infinity : Math.ceil(Math.log(1 - conf) / Math.log(1 - p)));

  async function droplabView(parts) {
    const app = window.WOC.app;
    app.innerHTML = '';
    try {
      if (!DROPS) DROPS = await loadJSON('drops.json');
      if (!MOBS) MOBS = await loadJSON('mobstats.json');
    } catch (e) {
      app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load data (${esc(e.message)})</p></div></section>`));
      return;
    }
    const mobByName = new Map(MOBS.mobs.map(m => [m.name, m]));
    // Only items that actually drop from a mob (have a % chance) are interesting here.
    const items = DROPS.items
      .filter(it => (it.sources || []).some(s => s.type === 'mob' && s.chance > 0))
      .sort((a, b) => a.name.localeCompare(b.name));

    const st = { itemId: parts && parts[0] ? decodeURIComponent(parts[0]) : (items[0] && items[0].id), dps: 25 };

    app.append(el(`<section class="block"><div class="wrap">
      <div class="shead reveal"><span class="eyebrow">Tools · loot</span><h2>Drop-rate lab</h2>
        <p>How many kills for that drop? Pick an item to see every source, the expected number of kills, the kills needed for a given confidence, and the full drop-by-drop probability curve.</p></div>
      <div class="controls reveal" style="gap:14px;flex-wrap:wrap;align-items:flex-end">
        <label class="meta" style="display:flex;flex-direction:column;gap:3px;min-width:260px">Item
          <input id="dl-search" list="dl-items" placeholder="Search an item…" style="padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light">
          <datalist id="dl-items">${items.map(it => `<option value="${esc(it.name)}">`).join('')}</datalist>
        </label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">Your DPS (for time estimate)
          <input id="dl-dps" type="number" value="${st.dps}" min="1" style="width:120px;padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></label>
      </div>
      <div id="dl-out" class="reveal" style="margin-top:10px"></div>
    </div></section>`));

    const search = app.querySelector('#dl-search');
    const dps = app.querySelector('#dl-dps');
    const cur = items.find(it => it.id === st.itemId) || items[0];
    if (cur) search.value = cur.name;

    function render() {
      const item = items.find(it => it.name === search.value) || items.find(it => it.id === st.itemId);
      const out = app.querySelector('#dl-out');
      if (!item) { out.innerHTML = `<p class="meta">Pick an item above.</p>`; return; }
      st.itemId = item.id;
      history.replaceState(null, '', `#/droplab/${encodeURIComponent(item.id)}`);
      const yourDps = Math.max(1, parseFloat(dps.value) || 25);
      const qcol = QUALITY_COLOR[item.quality] || '#c8c8cf';
      const mobSources = item.sources.filter(s => s.type === 'mob' && s.chance > 0).sort((a, b) => b.chance - a.chance);

      out.innerHTML = `<h3 style="margin:0 0 4px"><span style="color:${qcol}">${esc(item.name)}</span>
        <span class="meta" style="font-weight:400"> · ${esc(item.quality)}${item.slot ? ' · ' + esc(item.slot) : ''}${item.kind ? ' · ' + esc(item.kind) : ''}</span></h3>
        <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:10px">
        ${mobSources.map(s => sourceCard(s, yourDps)).join('')}</div>
        ${item.sources.some(s => s.type !== 'mob') ? `<p class="meta" style="margin-top:12px;opacity:.8">Also available from: ${item.sources.filter(s => s.type !== 'mob').map(s => `${esc(s.name)} (${esc(s.type)})`).join(', ')}.</p>` : ''}`;
    }

    function sourceCard(s, yourDps) {
      const p = s.chance / 100;
      const ev = Math.ceil(1 / p);                 // expected kills for the first drop
      const mob = mobByName.get(s.name);
      const killTime = mob ? mob.hp / yourDps : null; // seconds per kill (very rough)
      const confs = [0.5, 0.9, 0.99];
      const confRows = confs.map(c => {
        const n = killsForConfidence(p, c);
        const t = killTime ? fmtTime(n * killTime) : '—';
        return `<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px solid var(--line,#262626)">
          <span class="meta">${Math.round(c * 100)}% chance by</span><b>${n} kills${killTime ? ` · ~${t}` : ''}</b></div>`;
      }).join('');
      // Analytic geometric PMF: P(first drop exactly on kill k) = (1-p)^(k-1) * p
      const bars = 24;
      const pmf = Array.from({ length: bars }, (_, k) => Math.pow(1 - p, k) * p);
      const maxPmf = Math.max(...pmf);
      const flag = s.elite ? '<span class="pill" style="background:#7a4dff;color:#fff">elite</span>' : s.rare ? '<span class="pill" style="background:#c0852a;color:#fff">rare</span>' : '';
      return `<div class="card" style="padding:14px 16px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
          <h4 style="margin:0">${esc(s.name)} ${flag}</h4><span class="meta">lvl ${s.level}</span></div>
        <div style="display:flex;gap:14px;flex-wrap:wrap;margin:6px 0 10px">
          <b style="font-size:1.25rem;color:#e6bb6a">${s.chance}%</b>
          <span class="meta">drop chance · ~${ev} kills on average</span></div>
        <div class="meta" style="margin-bottom:4px">${esc((s.zones || []).join(', ') || '—')}${s.spawns ? ` · ${s.spawns} spawns` : ''}</div>
        ${confRows}
        <div style="margin-top:12px">
          <div class="meta" style="margin-bottom:4px">Chance the drop lands on the Nth kill</div>
          <div style="display:flex;align-items:flex-end;gap:2px;height:70px">
            ${pmf.map((v, i) => `<div title="kill ${i + 1}: ${(v * 100).toFixed(1)}%" style="flex:1;background:linear-gradient(180deg,#e6bb6a,#b9822f);border-radius:2px 2px 0 0;height:${Math.max(2, (v / maxPmf) * 100)}%"></div>`).join('')}
          </div>
          <div class="meta" style="display:flex;justify-content:space-between;margin-top:3px"><span>1</span><span>${bars}+ kills</span></div>
        </div></div>`;
    }

    const fmtTime = (sec) => sec < 90 ? `${Math.round(sec)}s` : sec < 5400 ? `${Math.round(sec / 60)} min` : `${(sec / 3600).toFixed(1)} h`;

    search.oninput = render;
    dps.oninput = render;
    render();
    reveal();
  }

  registerView('droplab', droplabView);
})();
