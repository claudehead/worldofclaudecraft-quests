'use strict';
// Bag & Inventory planner — #/bags. v0.20 added equippable bags (kind:'bag'). You have
// a 16-slot backpack + 4 bag sockets; pick your bags to see total carry capacity, and
// where each drops. Data from gear.json (the generated gear catalog).
(function () {
  const { el, esc, registerView, loadJSON, reveal, app } = window.WOC;
  const BACKPACK = 16, SOCKETS = 4;
  const QCOL = { legendary: '#e6803a', epic: '#a86bd6', rare: '#46b8da', uncommon: '#5cb85c', common: '#c8c8cf' };
  let BAGS = null, picks = [0, 0, 0, 0];

  const total = () => BACKPACK + picks.reduce((s, i) => s + (BAGS[i] ? BAGS[i].bagSlots : 0), 0);
  const srcOf = (b) => (b.sources && b.sources[0] ? b.sources[0].label : '—');

  function render() {
    const host = document.getElementById('bagBody');
    host.innerHTML = `
      <div class="bag-total reveal">🎒 <b>${total()}</b> inventory slots <span class="meta">= ${BACKPACK} backpack + your ${SOCKETS} bags</span></div>
      <div class="bag-sockets reveal">
        ${picks.map((p, i) => `<label class="bag-socket"><span class="meta">Bag ${i + 1}</span><select data-slot="${i}">${BAGS.map((b, j) => `<option value="${j}"${j === p ? ' selected' : ''}>${esc(b.name)} — ${b.bagSlots}</option>`).join('')}</select></label>`).join('')}
      </div>
      <p class="meta reveal">Fill all four sockets with the biggest bags you can get — the max is <b>${BACKPACK + SOCKETS * BAGS[0].bagSlots}</b> slots.</p>
      <h3 class="reveal" style="margin-top:1.4rem">Every bag</h3>
      <table class="bag-table reveal"><thead><tr><th>Bag</th><th>Slots</th><th>Where to get</th></tr></thead><tbody>
        ${BAGS.map(b => `<tr><td><span style="color:${QCOL[b.quality] || '#c8c8cf'}">${esc(b.name)}</span></td><td><b>${b.bagSlots}</b></td><td class="meta">${esc(srcOf(b))}</td></tr>`).join('')}
      </tbody></table>`;
    host.querySelectorAll('select').forEach(s => s.onchange = () => { picks[+s.dataset.slot] = +s.value; render(); reveal(); });
  }

  async function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Tools · inventory</span>
      <h1 class="reveal">Bag &amp; Inventory Planner 🎒</h1>
      <p class="sub reveal">New in v0.20 — equippable bags expand your carry space. You get a <b>16-slot backpack</b> plus <b>4 bag sockets</b>. Plan your loadout below.</p>
      <div id="bagBody"><div class="spinner"></div></div>
    </div></section>`));
    if (!BAGS) {
      try { const g = await loadJSON('gear/gear.json'); BAGS = (g.gear || []).filter(x => x.kind === 'bag').sort((a, b) => b.bagSlots - a.bagSlots); }
      catch (e) { document.getElementById('bagBody').innerHTML = `<p class="meta">Couldn't load bags (${esc(e.message)}).</p>`; return; }
    }
    if (!BAGS.length) { document.getElementById('bagBody').innerHTML = '<p class="meta">No bags found.</p>'; return; }
    picks = [0, 0, 0, 0]; render();
  }
  registerView('bags', view);
})();
