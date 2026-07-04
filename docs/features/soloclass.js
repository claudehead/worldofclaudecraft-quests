'use strict';
// Ultimate Solo Class — #/soloclass. Simulates every class soloing the whole normal
// (and elite) mob population across levels 1-20, with and without BiS gear, and with
// and without pets, using the game's real combat math (solo.json + mobstats.json).
// Produces a composite "Solo Rating" plus the component metrics (kill speed,
// survivability, elite-soloing) and a per-level curve. Fully transparent — the model
// is disclosed on the page and every number derives from the same formulas /calc uses.
(function () {
  const { el, esc, registerView, loadJSON, reveal, app } = window.WOC;
  const COLOR = { warrior: '#C79C6E', mage: '#69CCF0', rogue: '#FFF569', paladin: '#F58CBA', hunter: '#ABD473', priest: '#E7E7E7', shaman: '#3390DE', warlock: '#9482C9', druid: '#FF7D0A' };
  const ROT = 2.2, SPELL = { base: 12, cast: 2.0 };
  // composite weights (disclosed on-page)
  const W = { coverage: 0.20, safety: 0.30, speed: 0.25, elite: 0.25 };
  let S = null, M = null;
  const st = { lens: 'overall', gear: 'leveling', pet: true, level: 'avg' };

  // ---- combat model (identical math to /calc and /tiers) ----
  const mit = (armor, atk, K) => Math.min(K.armorCap, armor / (armor + K.armorA * atk + K.armorB));
  const hpFromSta = (sta, K) => Math.min(sta, K.staLowCap) * K.staHpLow + Math.max(0, sta - K.staLowCap) * K.staHpHigh;
  function derive(c, L, gearMode) {
    const K = S.constants, g = gearMode === 'bis' ? S.bis[c.id][L] : null;
    const s = {}; for (const k of ['str', 'agi', 'sta', 'int', 'spi', 'armor']) s[k] = (c.baseStats[k] || 0) + (c.statsPerLevel[k] || 0) * (L - 1) + (g ? (g[k] || 0) : 0);
    const w = g ? { min: g.wMin, max: g.wMax, speed: g.wSpeed } : S.levelingWeapon[L];
    const ap = c.apRule === 'str2' ? s.str * 2 : c.apRule === 'stragi' ? s.str + s.agi : s.str;
    const crit = K.baseCrit + s.agi * K.critPerAgi, sCrit = K.baseCrit + s.int * K.spellCritPerInt;
    const hp = c.baseHp + c.hpPerLevel * (L - 1) + hpFromSta(s.sta, K);
    const armor = s.armor + s.agi * K.armorPerAgi, sp = s.int * (K.spellPowerPerInt || 0.5);
    const avg = (w.min + w.max) / 2, perHit = avg + (ap / K.apToDamageDivisor) * w.speed;
    const meleeDps = perHit / w.speed * (1 + crit * (K.meleeCritMult - 1)) * ROT;
    const spellDps = (SPELL.base + sp) / SPELL.cast * (1 + sCrit * (K.spellCritMult - 1));
    const offense = c.caster ? spellDps : meleeDps;
    const heal = (SPELL.base + sp) / SPELL.cast * (1 + sCrit * (K.spellCritMult - 1)) + s.spi * 0.4;
    return { hp, armor, offense, selfHeal: c.canHeal ? heal * 0.35 : 0 };
  }
  // 2-phase solo fight vs one mob: pet tanks until it dies, then you finish it
  function fight(d, pet, m, L) {
    const K = S.constants;
    const myInto = d.offense * (1 - mit(m.armor, L, K));
    const mobIntoMe = Math.max(0.1, m.dps * (1 - mit(d.armor, m.level, K)) - d.selfHeal);
    if (!pet) { const ttk = m.hp / myInto, ttd = d.hp / mobIntoMe; const win = ttk < ttd; return { win, ttk, hpLeft: win ? 1 - mobIntoMe * ttk / d.hp : 0 }; }
    const petInto = pet.dps * (1 - mit(m.armor, L, K)), team = myInto + petInto;
    const ttkTeam = m.hp / team, mobIntoPet = m.dps * (1 - mit(pet.armor, m.level, K)), petTtd = pet.hp / mobIntoPet;
    if (ttkTeam <= petTtd) return { win: true, ttk: ttkTeam, hpLeft: 1 };
    const remain = m.hp - team * petTtd, t2 = remain / myInto, dmg = mobIntoMe * t2, win = dmg < d.hp;
    return { win, ttk: petTtd + t2, hpLeft: win ? 1 - dmg / d.hp : 0 };
  }
  const near = (m, L) => { const a = m.minLevel || m.level, b = m.maxLevel || m.level; return b >= L - 3 && a <= L + 2; };
  function metricsAt(c, L, gearMode, petMode) {
    const d = derive(c, L, gearMode), pet = (petMode && c.petKind) ? S.pets[c.id].tank[L] : null;
    const normals = M.mobs.filter(m => !m.elite && !m.boss && !m.rare && near(m, L));
    const elites = M.mobs.filter(m => m.elite && !m.boss && near(m, L));
    let cov = 0, saf = 0, spd = 0, wins = 0;
    for (const m of normals) { const r = fight(d, pet, m, L); if (r.win) { cov++; saf += r.hpLeft; spd += 60 / r.ttk; wins++; } }
    const ec = elites.length ? elites.filter(m => fight(d, pet, m, L).win).length / elites.length : 0;
    return { coverage: normals.length ? cov / normals.length : 0, safety: wins ? saf / wins : 0, speed: wins ? spd / wins : 0, elite: ec };
  }
  function computeRows(gearMode, petMode, levelSel) {
    const levels = levelSel === 'avg' ? Array.from({ length: S.levelCap }, (_, i) => i + 1) : [levelSel];
    const rows = S.classes.map(c => {
      let cov = 0, saf = 0, spd = 0, el = 0;
      for (const L of levels) { const m = metricsAt(c, L, gearMode, petMode); cov += m.coverage; saf += m.safety; spd += m.speed; el += m.elite; }
      const n = levels.length; return { c, cov: cov / n, saf: saf / n, spd: spd / n, el: el / n };
    });
    const maxSpd = Math.max(...rows.map(r => r.spd)) || 1;
    rows.forEach(r => { r.spdN = r.spd / maxSpd; r.overall = 100 * (W.coverage * r.cov + W.safety * r.saf + W.speed * r.spdN + W.elite * r.el); });
    return rows;
  }
  // per-level overall rating for every class (each level normalized within itself)
  function ratingCurves(gearMode, petMode) {
    const out = {}; S.classes.forEach(c => out[c.id] = []);
    for (let L = 1; L <= S.levelCap; L++) {
      const rows = S.classes.map(c => ({ id: c.id, ...metricsAt(c, L, gearMode, petMode) }));
      const maxSpd = Math.max(...rows.map(r => r.speed)) || 1;
      rows.forEach(r => out[r.id].push(100 * (W.coverage * r.coverage + W.safety * r.safety + W.speed * (r.speed / maxSpd) + W.elite * r.elite)));
    }
    return out;
  }

  const LENSES = {
    overall: { label: 'Overall', key: 'overall', fmt: r => r.overall.toFixed(1), note: 'Composite: 30% survivability, 25% kill speed, 25% elite-soloing, 20% coverage.' },
    speed: { label: 'Leveling speed', key: 'spd', fmt: r => r.spd.toFixed(1) + ' k/m', note: 'Kills per minute of level-appropriate normal mobs — how fast you grind.' },
    survive: { label: 'Survivability', key: 'saf', fmt: r => (r.saf * 100).toFixed(0) + '%', note: 'Average health remaining after a solo kill — your safety margin.' },
    elite: { label: 'Elite soloing', key: 'el', fmt: r => (r.el * 100).toFixed(0) + '%', note: 'Share of near-level ELITE mobs you can solo — the real flex.' },
  };

  function whyText(r, petMode) {
    const bits = [];
    if (r.c.petKind && petMode) bits.push(`a ${r.c.petKind === 'beast' ? 'beast pet' : 'demon'} that tanks while you deal damage`);
    if (r.c.canHeal) bits.push('self-healing to outlast fights');
    if (r.saf >= 0.95) bits.push('almost never drops low');
    else if (r.saf < 0.75) bits.push('but finishes fights on fumes');
    if (r.spdN >= 0.9) bits.push('top-tier kill speed');
    if (r.el >= 0.5) bits.push('can even solo elites');
    return bits.length ? bits.join(', ') + '.' : 'a balanced solo profile.';
  }

  function curveChart(curves, order) {
    const wsvg = 680, hsvg = 240, padL = 34, padR = 10, padT = 14, padB = 24;
    const L = S.levelCap, allVals = Object.values(curves).flat();
    const maxV = Math.max(...allVals, 1), minV = Math.min(...allVals, 0);
    const x = i => padL + (i / (L - 1)) * (wsvg - padL - padR);
    const y = v => padT + (1 - (v - minV) / (maxV - minV || 1)) * (hsvg - padT - padB);
    const grid = [0, 0.25, 0.5, 0.75, 1].map(f => { const v = minV + f * (maxV - minV); const yy = y(v); return `<line x1="${padL}" y1="${yy}" x2="${wsvg - padR}" y2="${yy}" stroke="#2a3320" stroke-width="1"/><text x="${padL - 5}" y="${yy + 3}" text-anchor="end" font-size="9" fill="#7d8a6a">${v.toFixed(0)}</text>`; }).join('');
    const xlab = [1, 5, 10, 15, 20].filter(l => l <= L).map(l => `<text x="${x(l - 1)}" y="${hsvg - 8}" text-anchor="middle" font-size="9" fill="#7d8a6a">${l}</text>`).join('');
    const lines = order.map((id, idx) => {
      const pts = curves[id].map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
      const top = idx < 3;
      return `<polyline points="${pts}" fill="none" stroke="${COLOR[id]}" stroke-width="${top ? 2.6 : 1.3}" opacity="${top ? 1 : 0.4}"/>`;
    }).join('');
    return `<svg viewBox="0 0 ${wsvg} ${hsvg}" style="width:100%;height:auto;background:#12160f;border:1px solid #2a3320;border-radius:12px">
      ${grid}${xlab}${lines}
      <text x="${padL}" y="10" font-size="9" fill="#7d8a6a">Solo Rating</text>
      <text x="${wsvg - padR}" y="${hsvg - 8}" text-anchor="end" font-size="9" fill="#7d8a6a">level →</text>
    </svg>`;
  }

  function render() {
    const rows = computeRows(st.gear, st.pet, st.level);
    const lens = LENSES[st.lens];
    rows.sort((a, b) => (b[lens.key] ?? b.overall) - (a[lens.key] ?? a.overall));
    const top = rows[0], maxRating = Math.max(...rows.map(r => r.overall)) || 1;
    const curves = ratingCurves(st.gear, st.pet);
    const order = [...rows].map(r => r.c.id);
    const body = document.getElementById('scBody');
    const levLbl = st.level === 'avg' ? 'the whole 1–20 journey' : `level ${st.level}`;
    body.innerHTML = `
      <div class="sc-hero reveal" style="border-color:${COLOR[top.c.id]}66">
        <div class="sc-crown">🏆 Ultimate solo class ${st.gear === 'bis' ? '(at BiS)' : '(while leveling)'}</div>
        <div class="sc-win"><span style="color:${COLOR[top.c.id]}">${esc(top.c.name)}</span> <span class="sc-rating">${top.overall.toFixed(1)}</span></div>
        <p class="sc-why">Over ${levLbl}${st.pet ? '' : ', without pets'}: ${esc(whyText(top, st.pet))}</p>
      </div>
      <table class="sc-table reveal"><thead><tr>
        <th>#</th><th>Class</th><th>Solo Rating</th><th>Kill speed</th><th>Survive</th><th>Elite solo</th><th>Pet</th>
      </tr></thead><tbody>
        ${rows.map((r, i) => `<tr>
          <td class="sc-rank">${i + 1}</td>
          <td style="color:${COLOR[r.c.id]};font-weight:700">${esc(r.c.name)}</td>
          <td><div class="sc-bar"><span style="width:${(r.overall / maxRating * 100).toFixed(0)}%;background:${COLOR[r.c.id]}"></span></div><b>${r.overall.toFixed(1)}</b></td>
          <td>${r.spd.toFixed(1)} <span class="meta">k/m</span></td>
          <td>${(r.saf * 100).toFixed(0)}%</td>
          <td>${(r.el * 100).toFixed(0)}%</td>
          <td class="meta">${r.c.petKind ? (st.pet ? '✓ ' + r.c.petKind : '—') : '—'}</td>
        </tr>`).join('')}
      </tbody></table>
      <p class="meta reveal" style="margin-top:6px">Sorted by <b>${lens.label}</b>. ${esc(lens.note)}</p>
      <h3 class="reveal" style="margin-top:1.6rem">Solo Rating across the level journey</h3>
      <p class="meta reveal">Each class's overall solo power at every level (top 3 bold). ${st.gear === 'bis' ? 'BiS gear' : 'Leveling gear'}, ${st.pet ? 'pets on' : 'pets off'}.</p>
      <div class="reveal">${curveChart(curves, order)}</div>`;
    reveal();
  }

  function pillRow(host, opts, cur, on) {
    host.innerHTML = '';
    opts.forEach(([k, lbl]) => { const p = el(`<span class="pill${k === cur ? ' active' : ''}">${lbl}</span>`); p.onclick = () => on(k); host.append(p); });
  }

  async function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <style>
        .sc-hero{background:radial-gradient(120% 90% at 50% 0%,#1c2233,#12160f);border:1px solid #2a3320;border-radius:16px;padding:18px 20px;margin:14px 0 18px}
        .sc-crown{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#cdbb8e}
        .sc-win{font-size:30px;font-weight:800;margin:4px 0}
        .sc-rating{font-size:20px;color:#e6c15a;margin-left:8px}
        .sc-why{color:#9aa2b0;font-size:14px;margin:2px 0 0}
        .sc-table{width:100%;border-collapse:collapse;font-size:14px}
        .sc-table th{text-align:left;color:#9aa2b0;font-weight:600;padding:6px 8px;border-bottom:1px solid #2a3320;font-size:12px}
        .sc-table td{padding:7px 8px;border-bottom:1px solid #1e2416;vertical-align:middle}
        .sc-rank{color:#7d8a6a;font-weight:700}
        .sc-bar{display:inline-block;width:96px;height:8px;background:#20252f;border-radius:5px;overflow:hidden;vertical-align:middle;margin-right:7px}
        .sc-bar span{display:block;height:100%;border-radius:5px}
        .sc-table tr:first-child td .sc-rank{color:#e6c15a}
      </style>
      <span class="eyebrow reveal">Tools · combat</span>
      <h1 class="reveal">Ultimate Solo Class 🥇</h1>
      <p class="sub reveal">Every class simulated soloing the whole mob population, levels 1–20, with &amp; without BiS, with &amp; without pets — using the game's real combat math. Who levels fastest, survives best, and can solo elites?</p>
      <div class="controls reveal"><span class="meta" style="align-self:center">Rank by</span><div class="pills" id="scLens"></div></div>
      <div class="controls reveal" style="margin-top:-4px;gap:16px;flex-wrap:wrap">
        <span class="meta" style="align-self:center">Gear</span><div class="pills" id="scGear"></div>
        <label class="meta">Level <select id="scLevel"></select></label>
        <label class="meta"><input type="checkbox" id="scPet" ${st.pet ? 'checked' : ''}> pets (hunter/warlock)</label>
      </div>
      <div id="scBody"><div class="spinner"></div></div>
      <details class="reveal" style="margin-top:1.6rem"><summary class="meta">How this is calculated</summary>
        <div class="meta" style="line-height:1.6;margin-top:8px">
          <p>For each class × level × gear × mob we run the game's real formulas (same as the <a data-go="#/calc">DPS calculator</a> and <a data-go="#/tiers">tier lists</a>): attack power by class rule, armor mitigation both ways, health from stamina, crit from agility/intellect, caster spell power. Melee/hybrid white damage is scaled by a ${ROT}× rotation factor so it compares fairly to casters' rotation-inclusive spell DPS.</p>
          <p><b>Pets</b> are modeled exactly as the game scales them (a mob template at your level): the tank pet (warlock's Gloomshade demon; hunter's most durable tameable beast for your level) holds aggro while you deal damage. A fight is a two-phase race — the pet tanks until it dies, then you finish the mob yourself. Turn pets off to compare on raw class power.</p>
          <p><b>Metrics:</b> <b>Kill speed</b> = kills/min of level-appropriate normal mobs. <b>Survive</b> = average health left after a kill. <b>Elite solo</b> = share of near-level elites you can solo. <b>Coverage</b> = share of normal mobs you can kill without dying. <b>Solo Rating</b> = ${(W.safety * 100)}% survive + ${(W.speed * 100)}% speed + ${(W.elite * 100)}% elite + ${(W.coverage * 100)}% coverage, normalized across classes.</p>
          <p>Self-healing classes (paladin, priest, shaman, druid) offset ~35% of incoming damage. "Leveling" gear = base class stats + a level-appropriate white weapon; "BiS" = the best gear obtainable by that level from the <a data-go="#/bis">BiS lists</a>. A model, not gospel — abilities, procs and player skill shift the edges.</p>
        </div>
      </details>
    </div></section>`));
    try { [S, M] = await Promise.all([loadJSON('solo.json'), loadJSON('mobstats.json')]); }
    catch (e) { document.getElementById('scBody').innerHTML = `<p class="meta">Couldn't load data (${esc(e.message)}).</p>`; return; }

    const bindLens = () => pillRow(document.getElementById('scLens'), Object.entries(LENSES).map(([k, v]) => [k, v.label]), st.lens, k => { st.lens = k; bindLens(); render(); });
    const bindGear = () => pillRow(document.getElementById('scGear'), [['leveling', 'Leveling'], ['bis', 'BiS']], st.gear, k => { st.gear = k; bindGear(); render(); });
    bindLens(); bindGear();
    const lv = document.getElementById('scLevel');
    lv.append(el(`<option value="avg"${st.level === 'avg' ? ' selected' : ''}>Journey (1–${S.levelCap} avg)</option>`));
    for (let i = 1; i <= S.levelCap; i++) lv.append(el(`<option value="${i}"${st.level === i ? ' selected' : ''}>Level ${i}</option>`));
    lv.onchange = () => { st.level = lv.value === 'avg' ? 'avg' : +lv.value; render(); };
    document.getElementById('scPet').onchange = (e) => { st.pet = e.target.checked; render(); };
    render();
  }
  registerView('soloclass', view);
})();
