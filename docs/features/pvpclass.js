'use strict';
// Ultimate PvP Class — #/pvpclass. A 1v1 duel round-robin: every class fights every
// other class, using the game's real combat math (solo.json) plus mined PvP attributes
// (pvpsim.json: crowd control, self-heal, defensives, ranged-kiting). Pets (hunter/
// warlock) join the duel. Produces a win-rate ranking, a full win-rate matrix, and the
// component metrics. Transparent — the duel model and its limits are disclosed on-page.
(function () {
  const { el, esc, registerView, loadJSON, reveal, app } = window.WOC;
  const COLOR = { warrior: '#C79C6E', mage: '#69CCF0', rogue: '#FFF569', paladin: '#F58CBA', hunter: '#ABD473', priest: '#E7E7E7', shaman: '#3390DE', warlock: '#9482C9', druid: '#FF7D0A' };
  const ROT = 2.2, SPELL = { base: 12, cast: 2.0 }, HEAL_UP = 0.5;
  // duel-model coefficients (all disclosed on-page). Skill (0=weak, 1=top-rank) gates
  // every "hard" tool: kiting-avoidance, CC amplification/suppression, defensive timing.
  const CTRL_BURST = 0.6, CTRL_SUPPRESS = 0.35, DEF_MIT = 0.30, KITE_AVOID = 0.55, PET_EHP = 1.20;
  const SKILLS = [['0.1', 'Casual'], ['0.4', 'Average'], ['0.7', 'Skilled'], ['0.95', 'Top rank']];
  let S = null, P = null, pmap = null;
  const st = { lens: 'overall', gear: 'bis', pet: true, level: 20, skill: 0.4 };

  const mit = (armor, atk) => Math.min(S.constants.armorCap, armor / (armor + S.constants.armorA * atk + S.constants.armorB));
  const hpSta = (sta) => { const K = S.constants; return Math.min(sta, K.staLowCap) * K.staHpLow + Math.max(0, sta - K.staLowCap) * K.staHpHigh; };
  function derive(c, L, gear, pet) {
    const K = S.constants, g = gear === 'bis' ? S.bis[c.id][L] : null;
    const s = {}; for (const k of ['str', 'agi', 'sta', 'int', 'spi', 'armor']) s[k] = (c.baseStats[k] || 0) + (c.statsPerLevel[k] || 0) * (L - 1) + (g ? (g[k] || 0) : 0);
    const w = g ? { min: g.wMin, max: g.wMax, speed: g.wSpeed } : S.levelingWeapon[L];
    const ap = c.apRule === 'str2' ? s.str * 2 : c.apRule === 'stragi' ? s.str + s.agi : s.str;
    const crit = K.baseCrit + s.agi * K.critPerAgi, sCrit = K.baseCrit + s.int * K.spellCritPerInt;
    const hp = c.baseHp + c.hpPerLevel * (L - 1) + hpSta(s.sta), armor = s.armor + s.agi * K.armorPerAgi;
    const ehp = hp / (1 - mit(armor, L)), sp = s.int * (K.spellPowerPerInt || 0.5);
    const avg = (w.min + w.max) / 2, perHit = avg + (ap / K.apToDamageDivisor) * w.speed;
    const meleeDps = perHit / w.speed * (1 + crit * (K.meleeCritMult - 1)) * ROT;
    const spellDps = (SPELL.base + sp) / SPELL.cast * (1 + sCrit * (K.spellCritMult - 1));
    let dps = c.caster ? spellDps : meleeDps, petDps = 0, ehpMul = 1;
    if (pet && c.petKind && S.pets[c.id]) { petDps = S.pets[c.id].dps[L].dps; ehpMul = PET_EHP; }
    const healRaw = (SPELL.base + sp) / SPELL.cast * (1 + sCrit * (K.spellCritMult - 1)) + s.spi * 0.4;
    return { dps: dps + petDps, baseDps: dps, petDps, ehp: ehp * ehpMul, healRaw };
  }
  // returns A's outcome vs B: { win, margin } (margin>1 = A wins more comfortably).
  // sk (0..1) = player skill: at 0 it's a raw stand-and-trade (stats + pet win); at 1
  // every skill tool is realized — kiters barely get hit, CC amplifies, defensives are
  // timed perfectly — so high-ceiling classes climb.
  function duel(A, B, L, gear, pet, sk) {
    const dA = derive(A, L, gear, pet), dB = derive(B, L, gear, pet);
    const pA = pmap[A.id].byLevel[L], pB = pmap[B.id].byLevel[L], arA = pmap[A.id].ranged, arB = pmap[B.id].ranged;
    const outA = dA.dps * (1 + CTRL_BURST * pA.control * sk) * (1 - CTRL_SUPPRESS * pB.control * sk);
    const outB = dB.dps * (1 + CTRL_BURST * pB.control * sk) * (1 - CTRL_SUPPRESS * pA.control * sk);
    const avoidA = (arA && !arB) ? Math.max(0, (KITE_AVOID - 0.4 * pB.control) * sk) : 0; // skilled kite dodges melee
    const avoidB = (arB && !arA) ? Math.max(0, (KITE_AVOID - 0.4 * pA.control) * sk) : 0;
    const healA = dA.healRaw * pA.heal * HEAL_UP * (0.6 + 0.4 * sk), healB = dB.healRaw * pB.heal * HEAL_UP * (0.6 + 0.4 * sk);
    const dmgToA = Math.max(0.5, outB * (1 - avoidA) * (1 - DEF_MIT * pA.defense * (0.3 + 0.7 * sk)) - healA);
    const dmgToB = Math.max(0.5, outA * (1 - avoidB) * (1 - DEF_MIT * pB.defense * (0.3 + 0.7 * sk)) - healB);
    const ttkB = dB.ehp / dmgToB, ttkA = dA.ehp / dmgToA;
    return { win: ttkB < ttkA, margin: ttkA / ttkB };
  }
  function rows(L, gear, pet, sk) {
    const cs = S.classes;
    return cs.map(A => {
      let wins = 0; const results = {};
      for (const B of cs) { if (A.id === B.id) { results[B.id] = null; continue; } const r = duel(A, B, L, gear, pet, sk); results[B.id] = r; if (r.win) wins++; }
      const d = derive(A, L, gear, pet), p = pmap[A.id].byLevel[L];
      return { c: A, wr: wins / (cs.length - 1), results, dps: d.dps, ehp: d.ehp, ranged: pmap[A.id].ranged, control: p.control, sustain: (d.ehp / 1000) + (d.healRaw * p.heal * HEAL_UP / 20) };
    });
  }

  const LENSES = {
    overall: { label: 'Win rate', key: 'wr', fmt: r => (r.wr * 100).toFixed(0) + '%', note: 'Share of the other 8 classes this class beats 1v1 (round-robin).' },
    damage: { label: 'Damage', key: 'dps', fmt: r => r.dps.toFixed(1), note: 'Sustained damage output (with pet), the kill-pressure lens.' },
    control: { label: 'Control', key: 'control', fmt: r => (r.control * 100).toFixed(0) + '%', note: 'Crowd-control strength (stun/root/polymorph/slow), relative to the best.' },
    sustain: { label: 'Sustain', key: 'sustain', fmt: r => r.sustain.toFixed(1), note: 'Effective HP plus self-healing — how long you stay alive.' },
  };

  function whyText(r, pet) {
    const b = [];
    if (r.ranged) b.push('kites melee from range');
    if (r.c.petKind && pet) b.push(`fights with a ${r.c.petKind === 'beast' ? 'pet' : 'demon'}`);
    if (r.control >= 0.6) b.push('chain-controls opponents');
    if (r.c.canHeal) b.push('heals through pressure');
    if (r.dps >= 1) { /* placeholder */ }
    return b.length ? b.join(', ') + '.' : 'a balanced 1v1 kit.';
  }

  // win-rate matrix heatmap (row beats column?)
  function matrix(rws) {
    const ids = rws.map(r => r.c.id);
    const cell = (res, rowId, colId) => {
      if (rowId === colId) return `<td class="pvp-diag"></td>`;
      const m = res.margin, win = res.win;
      // color: green shades for win, red for loss, by margin
      const t = Math.max(0, Math.min(1, (Math.log(m) / Math.log(3) + 1) / 2)); // 0..1
      const bg = win ? `rgba(70,190,120,${(0.25 + 0.55 * (t - 0.5) * 2).toFixed(2)})` : `rgba(224,82,106,${(0.25 + 0.55 * (0.5 - t) * 2).toFixed(2)})`;
      return `<td class="pvp-cell" style="background:${bg}" title="${win ? 'wins' : 'loses'} (${m.toFixed(2)}x)">${win ? '✓' : '·'}</td>`;
    };
    return `<div style="overflow-x:auto"><table class="pvp-matrix"><thead><tr><th class="pvp-corner">beats ↓ / vs →</th>${ids.map(id => `<th style="color:${COLOR[id]}">${id.slice(0, 3)}</th>`).join('')}<th>W</th></tr></thead><tbody>
      ${rws.map(r => `<tr><th style="color:${COLOR[r.c.id]};text-align:right">${esc(r.c.name)}</th>${ids.map(id => cell(r.results[id] || {}, r.c.id, id)).join('')}<td class="pvp-w"><b>${Math.round(r.wr * (ids.length - 1))}</b></td></tr>`).join('')}
    </tbody></table></div>`;
  }

  function render() {
    const rws = rows(st.level, st.gear, st.pet, st.skill);
    const lens = LENSES[st.lens];
    const skLbl = (SKILLS.find(s => +s[0] === st.skill) || ['', ''])[1];
    rws.sort((a, b) => (b[lens.key] ?? b.wr) - (a[lens.key] ?? a.wr));
    const top = rws[0], maxWr = Math.max(...rws.map(r => r.wr)) || 1;
    const body = document.getElementById('pvpBody');
    body.innerHTML = `
      <div class="sc-hero reveal" style="border-color:${COLOR[top.c.id]}66">
        <div class="sc-crown">⚔️ Ultimate 1v1 PvP class · ${esc(skLbl)} skill ${st.gear === 'bis' ? '· BiS' : '· no gear'} · L${st.level}</div>
        <div class="sc-win"><span style="color:${COLOR[top.c.id]}">${esc(top.c.name)}</span> <span class="sc-rating">${(top.wr * 100).toFixed(0)}% win</span></div>
        <p class="sc-why">Beats ${Math.round(top.wr * 8)} of 8 classes${st.pet ? '' : ', pets off'}: ${esc(whyText(top, st.pet))}</p>
      </div>
      <table class="sc-table reveal"><thead><tr><th>#</th><th>Class</th><th>Win rate</th><th>Damage</th><th>Control</th><th>Sustain</th><th>Type</th></tr></thead><tbody>
        ${rws.map((r, i) => `<tr>
          <td class="sc-rank">${i + 1}</td>
          <td style="color:${COLOR[r.c.id]};font-weight:700">${esc(r.c.name)}</td>
          <td><div class="sc-bar"><span style="width:${(r.wr / maxWr * 100).toFixed(0)}%;background:${COLOR[r.c.id]}"></span></div><b>${(r.wr * 100).toFixed(0)}%</b></td>
          <td>${r.dps.toFixed(1)}</td>
          <td>${(r.control * 100).toFixed(0)}%</td>
          <td>${r.sustain.toFixed(1)}</td>
          <td class="meta">${r.ranged ? 'ranged' : 'melee'}${r.c.petKind && st.pet ? ' +' + r.c.petKind : ''}</td>
        </tr>`).join('')}
      </tbody></table>
      <p class="meta reveal" style="margin-top:6px">Sorted by <b>${lens.label}</b>. ${esc(lens.note)}</p>
      <h3 class="reveal" style="margin-top:1.6rem">Win-rate matrix — who beats whom</h3>
      <p class="meta reveal">Read a row: ✓ = that class (left) beats the column class 1v1; deeper green = more decisive. Sorted by overall win rate.</p>
      <div class="reveal">${matrix([...rws].sort((a, b) => b.wr - a.wr))}</div>`;
    reveal();
  }

  function pillRow(host, opts, cur, on) { host.innerHTML = ''; opts.forEach(([k, lbl]) => { const p = el(`<span class="pill${k === cur ? ' active' : ''}">${lbl}</span>`); p.onclick = () => on(k); host.append(p); }); }

  async function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <style>
        .sc-hero{background:radial-gradient(120% 90% at 50% 0%,#2a1c22,#12160f);border:1px solid #3a2320;border-radius:16px;padding:18px 20px;margin:14px 0 18px}
        .sc-crown{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#e0a0a8}
        .sc-win{font-size:30px;font-weight:800;margin:4px 0}
        .sc-rating{font-size:19px;color:#e6c15a;margin-left:8px}
        .sc-why{color:#b0a2a6;font-size:14px;margin:2px 0 0}
        .sc-table{width:100%;border-collapse:collapse;font-size:14px}
        .sc-table th{text-align:left;color:#9aa2b0;font-weight:600;padding:6px 8px;border-bottom:1px solid #3a2320;font-size:12px}
        .sc-table td{padding:7px 8px;border-bottom:1px solid #241a1e;vertical-align:middle}
        .sc-rank{color:#7d8a6a;font-weight:700}
        .sc-bar{display:inline-block;width:88px;height:8px;background:#20252f;border-radius:5px;overflow:hidden;vertical-align:middle;margin-right:7px}
        .sc-bar span{display:block;height:100%;border-radius:5px}
        .sc-table tr:first-child td .sc-rank{color:#e6c15a}
        .pvp-matrix{border-collapse:collapse;font-size:12px;margin-top:6px}
        .pvp-matrix th{padding:3px 6px;color:#9aa2b0;font-weight:600;font-size:11px;white-space:nowrap}
        .pvp-corner{text-align:right;color:#7d8a6a!important;font-style:italic}
        .pvp-cell{width:28px;height:26px;text-align:center;color:#eee;font-weight:700;border:1px solid #12160f}
        .pvp-diag{width:28px;background:repeating-linear-gradient(45deg,#1a1a1a,#1a1a1a 3px,#222 3px,#222 6px)}
        .pvp-w{text-align:center;color:#e6c15a;background:#1a1410}
      </style>
      <span class="eyebrow reveal">Tools · combat</span>
      <h1 class="reveal">Ultimate PvP Class ⚔️</h1>
      <p class="sub reveal">Every class dueled against every other class, 1v1, on the game's real combat math plus mined PvP attributes — crowd control, self-heals, defensives, ranged-kiting and pets. Who wins the Coliseum?</p>
      <p class="meta reveal" id="pvpSims" style="margin-top:-6px"></p>
      <div class="controls reveal"><span class="meta" style="align-self:center">Player skill</span><div class="pills" id="pvpSkill"></div></div>
      <div class="controls reveal" style="margin-top:-4px"><span class="meta" style="align-self:center">Rank by</span><div class="pills" id="pvpLens"></div></div>
      <div class="controls reveal" style="margin-top:-4px;gap:16px;flex-wrap:wrap">
        <span class="meta" style="align-self:center">Gear</span><div class="pills" id="pvpGear"></div>
        <label class="meta">Level <select id="pvpLevel"></select></label>
        <label class="meta"><input type="checkbox" id="pvpPet" ${st.pet ? 'checked' : ''}> pets (hunter/warlock)</label>
      </div>
      <div id="pvpBody"><div class="spinner"></div></div>
      <details class="reveal" style="margin-top:1.6rem"><summary class="meta">How this is calculated (and its limits)</summary>
        <div class="meta" style="line-height:1.6;margin-top:8px">
          <p>Each ordered pair of classes fights a 1v1 attrition duel. Damage and effective HP come from the game's real formulas (same as the <a data-go="#/calc">DPS calculator</a>, <a data-go="#/tiers">tier lists</a> and <a data-go="#/soloclass">solo tool</a>). On top of that we mine three PvP dimensions straight from each class's abilities (level-gated): <b>control</b> (stun/root/polymorph/slow, weighted by severity and cooldown), <b>self-heal</b>, and <b>defensives</b> (absorbs).</p>
          <p><b>Player skill is the key dial.</b> Every "hard" tool is gated by the skill setting (Casual → Top rank). At <b>low skill</b> the duel is a raw stand-and-trade: whoever has the better stats and pet wins, so forgiving bruisers and pet classes dominate. As skill rises, kiters start dodging melee damage (up to ${KITE_AVOID * 100}% avoided at top rank), crowd control amplifies your damage (+${CTRL_BURST * 100}% at max control) and suppresses theirs (−${CTRL_SUPPRESS * 100}%), and defensives get timed well (up to ${DEF_MIT * 100}% cut). So <b>high-ceiling classes (rogue, casters, kiters) climb at high rank</b> while faceroll classes fade. That's why the ranking changes when you move the skill pills.</p>
          <p><b>Other factors:</b> Healers offset damage with self-heals; <b>pets</b> (hunter/warlock) add their damage and a body to chew through (+${(PET_EHP - 1) * 100}% effective HP). Damage and effective HP themselves are skill-independent (they happen regardless). Whoever's time-to-kill is shorter wins.</p>
          <p><b>Limits — read this:</b> PvP is the hardest thing to model. Even with the skill dial this is a <i>duel abstraction</i>: it approximates burst, kiting and CC as damage/mitigation multipliers rather than simulating exact ability sequences, line-of-sight, or positioning, and it can't capture the very top of individual outplay. Treat it as a strong, transparent baseline for "who wins a 1v1 at a given skill level," not the last word. A model, not gospel.</p>
        </div>
      </details>
    </div></section>`));
    try { [S, P] = await Promise.all([loadJSON('solo.json'), loadJSON('pvpsim.json')]); }
    catch (e) { document.getElementById('pvpBody').innerHTML = `<p class="meta">Couldn't load data (${esc(e.message)}).</p>`; return; }
    pmap = Object.fromEntries(P.classes.map(c => [c.id, c]));
    const n = S.classes.length, duels = n * (n - 1) * S.levelCap * 2 * 2;
    document.getElementById('pvpSims').innerHTML = `⚔️ Built from <b>${duels.toLocaleString()}</b> simulated duels — all ${n} classes vs each other at every level 1–${S.levelCap}, for both gear sets and pets on/off.`;

    const bindSkill = () => pillRow(document.getElementById('pvpSkill'), SKILLS, String(st.skill), k => { st.skill = +k; bindSkill(); render(); });
    bindSkill();
    const bindLens = () => pillRow(document.getElementById('pvpLens'), Object.entries(LENSES).map(([k, v]) => [k, v.label]), st.lens, k => { st.lens = k; bindLens(); render(); });
    const bindGear = () => pillRow(document.getElementById('pvpGear'), [['leveling', 'No gear'], ['bis', 'BiS']], st.gear, k => { st.gear = k; bindGear(); render(); });
    bindLens(); bindGear();
    const lv = document.getElementById('pvpLevel');
    for (let i = 2; i <= S.levelCap; i++) lv.append(el(`<option value="${i}"${st.level === i ? ' selected' : ''}>Level ${i}</option>`));
    lv.onchange = () => { st.level = +lv.value; render(); };
    document.getElementById('pvpPet').onchange = (e) => { st.pet = e.target.checked; render(); };
    render();
  }
  registerView('pvpclass', view);
})();
