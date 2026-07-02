'use strict';
// Talent / build planner — #/planner[/class/spec/alloc]
// Interactive talent trees plus projected stats and ability modifiers at your level.
(function () {
  const { el, esc, reveal, registerView, loadJSON, STAT_LABEL } = window.WOC;

  let TALENTS = null, CLASS = null;

  function statsAtLevel(classId, level) {
    const c = CLASS.classes[classId];
    const K = CLASS.constants;
    const out = { ...c.baseStats };
    for (const [k, v] of Object.entries(c.statsPerLevel || {})) {
      out[k] = (out[k] || 0) + v * (level - 1);
    }
    const hpPerSta = level <= K.staLowCap ? K.staHpLow : K.staHpHigh;
    out.hp = Math.round(c.baseHp + c.hpPerLevel * (level - 1) + out.sta * hpPerSta);
    // Attack power (mirrors combat.md rules)
    if (c.apRule === 'str2') out.ap = out.str * 2;
    else if (c.apRule === 'stragi') out.ap = out.str + out.agi;
    else out.ap = out.str;
    out.crit = K.baseCrit + out.agi * K.critPerAgi;
    out.spellCrit = K.baseCrit + out.int * K.spellCritPerInt;
    out.armor += out.agi * K.armorPerAgi;
    return out;
  }

  function applyTalentStats(base, nodes, alloc) {
    const flat = { str: 0, agi: 0, sta: 0, int: 0, spi: 0, ap: 0, crit: 0, dodge: 0 };
    const pct = { armorPct: 0, apPct: 0, maxHpPct: 0, staPct: 0 };
    const abilities = [];
    for (const n of nodes) {
      const r = alloc[n.id] || 0;
      if (!r || !n.effect) continue;
      if (n.effect.stats) {
        for (const [k, v] of Object.entries(n.effect.stats)) {
          if (k in flat) flat[k] += v * r;
          else if (k in pct) pct[k] += v * r;
        }
      }
      if (n.effect.ability) {
        for (const a of n.effect.ability) {
          abilities.push({ talent: n.name, rank: r, ...a });
        }
      }
    }
    const out = { ...base };
    for (const [k, v] of Object.entries(flat)) if (v) out[k] = (out[k] || 0) + v;
    if (pct.staPct) out.sta = Math.round(out.sta * (1 + pct.staPct));
    if (pct.maxHpPct) out.hp = Math.round(out.hp * (1 + pct.maxHpPct));
    if (pct.apPct) out.ap = Math.round(out.ap * (1 + pct.apPct));
    if (pct.armorPct) out.armor = Math.round(out.armor * (1 + pct.armorPct));
    if (flat.crit) out.crit += flat.crit;
    return { stats: out, abilities, pct, flat };
  }

  async function plannerView(parts) {
    const app = window.WOC.app;
    app.innerHTML = '';
    try {
      if (!TALENTS) TALENTS = await loadJSON('talents.json');
      if (!CLASS) CLASS = await loadJSON('classstats.json');
    } catch (e) {
      app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load data (${esc(e.message)})</p></div></section>`));
      return;
    }

    const classIds = Object.keys(TALENTS.classes);
    let classId = classIds.includes(parts && parts[0]) ? parts[0] : classIds[0];
    let specIdx = 0;
    let level = 20;
    let alloc = {};

    function nodeOrder(cid, si) {
      const c = TALENTS.classes[cid];
      return [...c.classTree, ...c.specs[si].nodes];
    }
    function decode(cid, sid, digits) {
      const c = TALENTS.classes[cid];
      specIdx = Math.max(0, c.specs.findIndex(s => s.id === sid));
      alloc = {};
      const order = nodeOrder(cid, specIdx);
      [...(digits || '')].forEach((d, i) => {
        const r = parseInt(d, 36);
        if (order[i] && r > 0) alloc[order[i].id] = Math.min(r, order[i].maxRank);
      });
    }
    function encode() {
      return nodeOrder(classId, specIdx).map(n => (alloc[n.id] || 0).toString(36)).join('').replace(/0+$/, '');
    }
    function buildHash() {
      return `#/planner/${classId}/${TALENTS.classes[classId].specs[specIdx].id}/${encode()}`;
    }
    if (parts && parts[0]) decode(classId, parts[1], parts[2]);

    const maxPtsAtLevel = (lv) => TALENTS.pointsByLevel[String(lv)] ?? TALENTS.maxPoints;

    app.append(el(`<section class="block"><div class="wrap">
      <div class="shead reveal"><span class="eyebrow">Tools · builds</span><h2>Talent / build planner</h2>
        <p>Spend talent points, then see projected stats and ability modifiers at your level. Points unlock from level ${TALENTS.firstLevel} upward.</p></div>
      <div class="controls reveal"><div class="pills" id="pl-class"></div></div>
      <div class="controls reveal" style="margin-top:-12px;flex-wrap:wrap;gap:10px;align-items:center">
        <div class="pills" id="pl-spec"></div>
        <label class="meta" style="display:flex;align-items:center;gap:6px">Level
          <input id="pl-level" type="range" min="${TALENTS.firstLevel}" max="20" value="${level}" style="width:120px;accent-color:var(--gold,#e6bb6a)">
          <b id="pl-lvlabel">${level}</b></label>
        <span class="tbudget" id="pl-budget"></span>
        <span class="pill" id="pl-reset">Reset</span>
        <span class="pill" id="pl-share">🔗 Copy link</span>
      </div>
      <div style="display:grid;gap:18px;grid-template-columns:minmax(0,1fr) minmax(260px,.55fr);margin-top:14px" id="pl-grid" class="reveal">
        <div id="pl-trees" class="ttrees"></div>
        <div id="pl-side"></div>
      </div>
    </div></section>`));

    const clsHost = app.querySelector('#pl-class');
    const specHost = app.querySelector('#pl-spec');
    const lvRange = app.querySelector('#pl-level');
    const lvLabel = app.querySelector('#pl-lvlabel');

    classIds.forEach((id) => {
      const p = el(`<span class="pill ${id === classId ? 'active' : ''}">${esc(TALENTS.classes[id].name)}</span>`);
      p.onclick = () => { classId = id; specIdx = 0; alloc = {}; clsHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); buildSpecs(); draw(); };
      clsHost.append(p);
    });

    function buildSpecs() {
      specHost.innerHTML = '';
      TALENTS.classes[classId].specs.forEach((s, i) => {
        const p = el(`<span class="pill ${i === specIdx ? 'active' : ''}">${esc(s.icon || '')} ${esc(s.name)}</span>`);
        p.onclick = () => { specIdx = i; alloc = {}; specHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); draw(); };
        specHost.append(p);
      });
    }

    const spent = () => Object.values(alloc).reduce((a, b) => a + b, 0);
    const treeSpent = (nodes) => nodes.reduce((a, n) => a + (alloc[n.id] || 0), 0);
    const pointCap = () => maxPtsAtLevel(level);

    function canAdd(node, treeNodes) {
      if ((alloc[node.id] || 0) >= node.maxRank) return false;
      if (spent() >= pointCap()) return false;
      if (node.pointsGate && treeSpent(treeNodes) < node.pointsGate) return false;
      if (node.requires) {
        for (const r of node.requires) {
          const dep = treeNodes.find(n => n.id === r);
          if (dep && (alloc[r] || 0) < dep.maxRank) return false;
        }
      }
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

    function fmtPct(v) { return (v * 100).toFixed(1) + '%'; }

    function drawSide(cls, spec, bonus) {
      const s = bonus.stats;
      const base = statsAtLevel(classId, level);
      const statKeys = ['hp', 'str', 'agi', 'sta', 'int', 'spi', 'ap', 'armor', 'crit'];
      const rows = statKeys.map((k) => {
        const b = base[k];
        const a = s[k];
        const delta = a - b;
        const lbl = k === 'hp' ? 'Health' : (STAT_LABEL[k] || k);
        const fmt = k === 'crit' ? fmtPct : (v) => Math.round(v).toLocaleString();
        return `<div style="display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid var(--line,#262626)">
          <span class="meta">${lbl}</span><span><b>${fmt(a)}</b>${delta ? ` <span style="color:#5cb85c;font-size:12px">+${k === 'crit' ? fmtPct(delta) : Math.round(delta)}</span>` : ''}</span></div>`;
      }).join('');

      const abilRows = bonus.abilities.length
        ? bonus.abilities.map(a => {
            const bits = [];
            if (a.dmgPct) bits.push(`+${(a.dmgPct * 100 * a.rank).toFixed(0)}% dmg`);
            if (a.costPct) bits.push(`${(a.costPct * 100 * a.rank).toFixed(0)}% cost`);
            if (a.cooldownSec) bits.push(`${a.cooldownSec}s CD`);
            if (a.durationSec) bits.push(`${a.durationSec}s dur`);
            return `<li><b>${esc(a.talent)}</b> <span class="meta">(${a.rank}/${a.rank}) · ${esc(a.ability)}</span> — ${bits.join(', ') || 'modifier'}</li>`;
          }).join('')
        : '<li class="meta">No ability modifiers — pick damage or cost talents.</li>';

      app.querySelector('#pl-side').innerHTML = `
        <div class="card" style="padding:14px 16px;margin-bottom:12px">
          <h3 style="margin:0 0 10px;font-size:1rem">${esc(cls.name)} · ${esc(spec.name)} <span class="meta">@ Lv ${level}</span></h3>
          ${rows}
        </div>
        <div class="card" style="padding:14px 16px">
          <h3 style="margin:0 0 8px;font-size:1rem">Ability modifiers</h3>
          <ul style="margin:0;padding-left:18px;line-height:1.65;font-size:13px">${abilRows}</ul>
        </div>
        ${spec.mastery ? `<div class="tmastery" style="margin-top:12px"><b>${esc(spec.name)} mastery — ${esc(spec.mastery.name)}:</b> ${esc(spec.mastery.description)}</div>` : ''}
        <p class="meta" style="margin-top:12px;font-size:12px">Stats use <a href="#/doc/${encodeURIComponent('reference/combat.md')}">combat maths</a> formulas. Talent % bonuses apply to base stats before derived values.</p>`;
    }

    function draw() {
      level = parseInt(lvRange.value, 10);
      lvLabel.textContent = level;
      const cls = TALENTS.classes[classId];
      const spec = cls.specs[specIdx];
      const cap = pointCap();
      app.querySelector('#pl-budget').innerHTML = `<b>${spent()}</b> / ${cap} points`;
      const host = app.querySelector('#pl-trees');
      host.innerHTML = '';
      host.append(treeGrid(cls.classTree, 'Class'));
      host.append(treeGrid(spec.nodes, spec.name));
      const allNodes = nodeOrder(classId, specIdx);
      const bonus = applyTalentStats(statsAtLevel(classId, level), allNodes, alloc);
      drawSide(cls, spec, bonus);
      history.replaceState(null, '', buildHash());
    }

    lvRange.oninput = draw;
    app.querySelector('#pl-reset').onclick = () => { alloc = {}; draw(); };
    app.querySelector('#pl-share').onclick = () => {
      const url = location.origin + buildHash().replace(/^#/, '');
      navigator.clipboard?.writeText(url).then(() => {
        const t = el('<div class="toast in">Build link copied</div>');
        document.body.append(t);
        setTimeout(() => t.remove(), 1800);
      }).catch(() => {});
    };

    if (window.matchMedia('(max-width: 900px)').matches) {
      app.querySelector('#pl-grid').style.gridTemplateColumns = '1fr';
    }

    buildSpecs();
    draw();
    reveal();
  }

  registerView('planner', plannerView);
})();
