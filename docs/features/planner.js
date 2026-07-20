'use strict';
// Talent / build planner — #/planner[/class/spec/picks]
// v0.27+ choice-row model: pick a spec + one option per row, see projected base
// stats at your level plus the ability modifiers your picks grant.
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
    if (c.apRule === 'str2') out.ap = out.str * 2;
    else if (c.apRule === 'stragi') out.ap = out.str + out.agi;
    else out.ap = out.str;
    out.crit = K.baseCrit + out.agi * K.critPerAgi;
    out.spellCrit = K.baseCrit + out.int * K.spellCritPerInt;
    out.armor += out.agi * K.armorPerAgi;
    return out;
  }

  // Human-readable summary of a talent option's effect (ability modifiers / flat stats).
  function effectSummary(effect) {
    if (!effect) return '';
    const bits = [];
    if (effect.stats) for (const [k, v] of Object.entries(effect.stats)) bits.push(`+${v} ${STAT_LABEL[k] || k}`);
    for (const a of (effect.ability || [])) {
      const mods = [];
      if (a.dmgPct) mods.push(`+${Math.round(a.dmgPct * 100)}% dmg`);
      if (a.costPct) mods.push(`${Math.round(a.costPct * 100)}% cost`);
      if (a.cooldownPct) mods.push(`${Math.round(a.cooldownPct * 100)}% CD`);
      if (a.cooldownFlat) mods.push(`${a.cooldownFlat > 0 ? '+' : ''}${a.cooldownFlat}s CD`);
      if (a.castPct) mods.push(`${Math.round(a.castPct * 100)}% cast`);
      if (a.critPct) mods.push(`+${Math.round(a.critPct * 100)}% crit`);
      if (a.bonusCharges) mods.push(`+${a.bonusCharges} charge${a.bonusCharges > 1 ? 's' : ''}`);
      if (a.buffPct) mods.push(`+${Math.round(a.buffPct * 100)}% effect`);
      bits.push(`${esc(a.ability)}${mods.length ? ' (' + mods.join(', ') + ')' : ''}`);
    }
    return bits.join(' · ');
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
    const NROWS = TALENTS.rowLevels.length;
    let picks = Array(NROWS).fill(-1);

    function decode(cid, sid, str) {
      const c = TALENTS.classes[cid];
      specIdx = Math.max(0, c.specs.findIndex(s => s.id === sid));
      picks = Array(NROWS).fill(-1);
      [...(str || '')].forEach((ch, i) => { const v = parseInt(ch, 10); if (i < NROWS && v >= 0 && v <= 2) picks[i] = v; });
    }
    function encode() { return picks.map(p => p < 0 ? '.' : p).join('').replace(/\.+$/, ''); }
    function buildHash() { return `#/planner/${classId}/${TALENTS.classes[classId].specs[specIdx].id}/${encode()}`; }
    if (parts && parts[0]) decode(classId, parts[1], parts[2]);

    app.append(el(`<section class="block"><div class="wrap">
      <div class="shead reveal"><span class="eyebrow">Tools · builds</span><h2>Talent / build planner</h2>
        <p>Pick a specialization and one option per row, then see projected stats at your level. Specialization unlocks at level ${TALENTS.specLevel}; rows open at levels ${TALENTS.rowLevels.join(', ')}.</p></div>
      <div class="controls reveal"><div class="pills" id="pl-class"></div></div>
      <div class="controls reveal" style="margin-top:-12px;flex-wrap:wrap;gap:10px;align-items:center">
        <div class="pills" id="pl-spec"></div>
        <label class="meta" style="display:flex;align-items:center;gap:6px">Level
          <input id="pl-level" type="range" min="${TALENTS.specLevel}" max="20" value="${level}" style="width:120px;accent-color:var(--gold,#e6bb6a)">
          <b id="pl-lvlabel">${level}</b></label>
        <span class="pill" id="pl-reset">Reset</span>
        <span class="pill" id="pl-share">🔗 Copy link</span>
      </div>
      <div style="display:grid;gap:18px;grid-template-columns:minmax(0,1fr) minmax(260px,.55fr);margin-top:14px" id="pl-grid" class="reveal">
        <div id="pl-trees" class="trows"></div>
        <div id="pl-side"></div>
      </div>
    </div></section>`));

    const clsHost = app.querySelector('#pl-class');
    const specHost = app.querySelector('#pl-spec');
    const lvRange = app.querySelector('#pl-level');
    const lvLabel = app.querySelector('#pl-lvlabel');

    classIds.forEach((id) => {
      const p = el(`<span class="pill ${id === classId ? 'active' : ''}">${esc(TALENTS.classes[id].name)}</span>`);
      p.onclick = () => { classId = id; specIdx = 0; picks = Array(NROWS).fill(-1); clsHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); buildSpecs(); draw(); };
      clsHost.append(p);
    });

    function buildSpecs() {
      specHost.innerHTML = '';
      TALENTS.classes[classId].specs.forEach((s, i) => {
        const p = el(`<span class="pill specpill ${i === specIdx ? 'active' : ''}"><img class="tspecicon" src="${esc(s.signatureIcon || '')}" alt="" loading="lazy">${esc(s.name)}</span>`);
        p.onclick = () => { specIdx = i; specHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); draw(); };
        specHost.append(p);
      });
    }

    function rowUnlocked(ri) { return level >= TALENTS.rowLevels[ri]; }

    function rowBlock(row, ri) {
      const locked = !rowUnlocked(ri);
      const wrap = el(`<div class="trow ${locked ? 'rowlocked' : ''}"><div class="trowhead"><span class="trowlvl">Lv ${row.level}</span>${row.decision ? `<span class="trowtheme">${esc(row.decision)}</span>` : (row.theme ? `<span class="trowtheme">${esc(row.theme)}</span>` : '')}${locked ? '<span class="trowtheme" style="opacity:.6">locked</span>' : ''}</div><div class="trowopts"></div></div>`);
      const opts = wrap.querySelector('.trowopts');
      row.options.forEach((o, oi) => {
        const sel = picks[ri] === oi;
        const cell = el(`<div class="topt ${sel ? 'picked' : ''}" title="${esc(o.name)} — ${esc(o.description || '')}">
          <img class="ticon-img" src="${o.iconImg || ''}" alt="" loading="lazy">
          <div class="toptbody"><span class="tname">${esc(o.name)}</span><span class="tdesc">${esc(o.description || '')}</span></div></div>`);
        cell.onclick = () => { if (!locked) { picks[ri] = sel ? -1 : oi; draw(); } };
        opts.append(cell);
      });
      return wrap;
    }

    function fmtPct(v) { return (v * 100).toFixed(1) + '%'; }

    function drawSide(cls, spec) {
      const base = statsAtLevel(classId, level);
      const statKeys = ['hp', 'str', 'agi', 'sta', 'int', 'spi', 'ap', 'armor', 'crit'];
      const rows = statKeys.map((k) => {
        const lbl = k === 'hp' ? 'Health' : (STAT_LABEL[k] || k);
        const fmt = k === 'crit' ? fmtPct : (v) => Math.round(v).toLocaleString();
        return `<div style="display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid var(--line,#262626)">
          <span class="meta">${lbl}</span><span><b>${fmt(base[k] || 0)}</b></span></div>`;
      }).join('');

      const chosen = [];
      cls.rows.forEach((row, ri) => { if (picks[ri] >= 0) chosen.push(row.options[picks[ri]]); });
      const pickRows = chosen.length
        ? chosen.map(o => `<li><b>${esc(o.name)}</b>${o.effect ? ` <span class="meta">— ${effectSummary(o.effect)}</span>` : ''}</li>`).join('')
        : '<li class="meta">No rows chosen yet — pick one option per row.</li>';

      app.querySelector('#pl-side').innerHTML = `
        <div class="card" style="padding:14px 16px;margin-bottom:12px">
          <h3 style="margin:0 0 10px;font-size:1rem">${esc(cls.name)} · ${esc(spec.name)} <span class="meta">@ Lv ${level}</span></h3>
          ${rows}
        </div>
        <div class="card" style="padding:14px 16px">
          <h3 style="margin:0 0 8px;font-size:1rem">Your picks (${chosen.length}/${NROWS})</h3>
          <ul style="margin:0;padding-left:18px;line-height:1.65;font-size:13px">${pickRows}</ul>
        </div>
        ${spec.mastery && spec.mastery.name ? `<div class="tmastery" style="margin-top:12px"><b>${esc(spec.name)} mastery — ${esc(spec.mastery.name)}:</b> ${esc(spec.mastery.description || '')}</div>` : ''}
        <p class="meta" style="margin-top:12px;font-size:12px">Base stats use <a href="#/doc/${encodeURIComponent('reference/combat.md')}">combat maths</a> formulas. Talent options are ability modifiers, not stat sticks.</p>`;
    }

    function draw() {
      level = parseInt(lvRange.value, 10);
      lvLabel.textContent = level;
      const cls = TALENTS.classes[classId];
      const spec = cls.specs[specIdx];
      const host = app.querySelector('#pl-trees');
      host.innerHTML = '';
      cls.rows.forEach((row, ri) => host.append(rowBlock(row, ri)));
      drawSide(cls, spec);
      history.replaceState(null, '', buildHash());
    }

    lvRange.oninput = draw;
    app.querySelector('#pl-reset').onclick = () => { picks = Array(NROWS).fill(-1); draw(); };
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
