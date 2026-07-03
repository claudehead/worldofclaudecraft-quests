'use strict';
// Meta Tier Lists — #/tiers. S/A/B/C tiers COMPUTED from the game's real combat
// formulas + per-class stats (classstats.json), not hand-waved opinion. Pick a role
// lens (Overall / DPS / Tank / Healer) and a level; every class is scored with the
// same math the /calc tool uses, so the ranking is transparent and reproducible.
(function () {
  const { el, esc, registerView, loadJSON, app } = window.WOC;
  const CLASS_COLOR = { warrior: '#C79C6E', mage: '#69CCF0', rogue: '#FFF569', paladin: '#F58CBA', hunter: '#ABD473', priest: '#E7E7E7', shaman: '#3390DE', warlock: '#9482C9', druid: '#FF7D0A' };
  // neutral baselines so classes are compared on equal footing (no gear).
  const WEAPON = { min: 8, max: 12, speed: 2.5 };
  const SPELL = { base: 12, cast: 2.0, coef: 1.0 };
  // Melee/hybrids deal most of their damage through abilities, not white hits, so
  // their auto-attack DPS is scaled by this rotation factor to compare fairly against
  // casters, whose spell DPS already reflects their rotation. (Disclosed on the page.)
  const ROTATION = 2.2;
  let CS = null, ROLES = null, LEVEL = 20, LENS = 'overall';

  function derive(c, K, L) {
    const s = {}; for (const k of ['str', 'agi', 'sta', 'int', 'spi', 'armor']) s[k] = (c.baseStats[k] || 0) + (c.statsPerLevel[k] || 0) * (L - 1);
    const ap = c.apRule === 'str2' ? s.str * 2 : c.apRule === 'stragi' ? s.str + s.agi : s.str;
    const crit = K.baseCrit + s.agi * K.critPerAgi;
    const spellCrit = K.baseCrit + s.int * K.spellCritPerInt;
    const hpSta = Math.min(s.sta, K.staLowCap) * K.staHpLow + Math.max(0, s.sta - K.staLowCap) * K.staHpHigh;
    const hp = c.baseHp + c.hpPerLevel * (L - 1) + hpSta;
    const armor = s.armor + s.agi * K.armorPerAgi;
    const mit = Math.min(K.armorCap, armor / (armor + K.armorA * L + K.armorB));
    const ehp = hp / (1 - mit);
    const sp = s.int * (K.spellPowerPerInt || 0.5);
    const avg = (WEAPON.min + WEAPON.max) / 2, perHit = avg + (ap / K.apToDamageDivisor) * WEAPON.speed;
    const meleeDps = perHit / WEAPON.speed * (1 + crit * (K.meleeCritMult - 1));
    const spellDps = (SPELL.base + sp * SPELL.coef) / SPELL.cast * (1 + spellCrit * (K.spellCritMult - 1));
    const offense = c.caster ? spellDps : meleeDps * ROTATION;
    const heal = (SPELL.base + sp) / SPELL.cast * (1 + spellCrit * (K.spellCritMult - 1)) + s.spi * 0.4;
    return { s, ap, crit, hp, armor, mit, ehp, sp, offense, heal };
  }

  const LENSES = {
    overall: { label: 'Overall', metric: (d, r) => null, note: 'Blend of offense, effective HP and role versatility.' },
    dps: { label: 'DPS', role: 'dps', metric: (d) => d.offense, note: 'Sustained damage — melee white DPS or caster spell DPS on a neutral weapon/spell.' },
    tank: { label: 'Tank', role: 'tank', metric: (d) => d.ehp, note: 'Effective HP — health divided by armor mitigation at this level.' },
    healer: { label: 'Healer', role: 'healer', metric: (d) => d.heal, note: 'Throughput proxy from spell power + spirit.' },
  };

  function tierOf(pct) { return pct >= 85 ? 'S' : pct >= 70 ? 'A' : pct >= 55 ? 'B' : 'C'; }

  function build() {
    const K = CS.constants, classes = Object.values(CS.classes);
    const rows = classes.map(c => {
      const d = derive(c, K, LEVEL);
      const roles = (ROLES[c.id] || {}).roles || [];
      return { c, d, roles };
    });
    const lens = LENSES[LENS];
    let pool = rows, scoreOf;
    if (lens.role) {
      pool = rows.filter(r => r.roles.includes(lens.role));
      scoreOf = r => lens.metric(r.d);
    } else {
      const maxOff = Math.max(...rows.map(r => r.d.offense)), maxEhp = Math.max(...rows.map(r => r.d.ehp));
      scoreOf = r => 0.5 * (r.d.offense / maxOff) + 0.3 * (r.d.ehp / maxEhp) + 0.2 * (r.roles.length / 3);
    }
    const max = Math.max(...pool.map(scoreOf));
    pool = pool.map(r => { const sc = scoreOf(r); const pct = max ? sc / max * 100 : 0; return { ...r, sc, pct, tier: tierOf(pct) }; })
      .sort((a, b) => b.sc - a.sc);
    return { pool, lens };
  }

  function card(r) {
    const col = CLASS_COLOR[r.c.id] || '#aaa';
    return `<div class="tier-card" style="--cc:${col}" data-go="#/doc/${encodeURIComponent('classes/' + r.c.id + '.md')}">
      <span class="tier-dot"></span><span class="tier-name">${esc(r.c.name)}</span>
      <span class="tier-pct">${Math.round(r.pct)}</span></div>`;
  }

  function render() {
    const { pool, lens } = build();
    const host = document.getElementById('tierBody');
    const TIERS = ['S', 'A', 'B', 'C'];
    const grid = TIERS.map(t => {
      const cs = pool.filter(r => r.tier === t);
      if (!cs.length) return '';
      return `<div class="tier-row tier-${t}"><div class="tier-rank">${t}</div><div class="tier-cards">${cs.map(card).join('')}</div></div>`;
    }).join('');
    // transparent table
    const table = `<table class="tier-table"><thead><tr><th>Class</th><th>Roles</th><th>Offense</th><th>Eff. HP</th><th>Heal</th><th>Score</th></tr></thead><tbody>
      ${pool.map(r => `<tr><td style="color:${CLASS_COLOR[r.c.id]}">${esc(r.c.name)}</td><td class="meta">${r.roles.join(', ')}</td><td>${r.d.offense.toFixed(1)}</td><td>${Math.round(r.d.ehp)}</td><td>${Math.round(r.d.heal)}</td><td><b>${Math.round(r.pct)}</b></td></tr>`).join('')}
    </tbody></table>`;
    host.innerHTML = `<p class="meta tier-note">${esc(lens.note)} Computed at <b>level ${LEVEL}</b>, no gear.</p>${grid}
      <details class="tier-how"><summary>How these tiers are calculated</summary>
        <p class="meta">Every class is run through the game's real combat formulas (the same ones the <a data-go="#/calc">DPS &amp; survivability calculator</a> uses) at level ${LEVEL} with a neutral weapon/spell and no gear, so only class design differs. Offense = caster spell DPS, or melee/hybrid auto-attack DPS scaled by a rotation factor (they deal most damage through abilities); Eff. HP = health ÷ armor mitigation; Heal = spell power + spirit throughput. Scores are normalised to the best in the current lens (100), then S ≥ 85, A ≥ 70, B ≥ 55, else C.</p></details>
      ${table}`;
  }

  function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Meta</span>
      <h1 class="reveal">Class Tier Lists</h1>
      <p class="sub reveal">Ranked by the game's <b>actual combat math</b> — not vibes. Switch the lens and level to see how the meta shifts.</p>
      <div class="tier-controls">
        <div class="tier-lenses">${Object.entries(LENSES).map(([k, v]) => `<button class="tier-lens${k === LENS ? ' on' : ''}" data-lens="${k}">${esc(v.label)}</button>`).join('')}</div>
        <label class="tier-lvl">Level <input type="range" id="tierLvl" min="1" max="${CS ? CS.maxLevel : 20}" value="${LEVEL}"><b id="tierLvlN">${LEVEL}</b></label>
      </div>
      <div id="tierBody"><div class="spinner"></div></div>
    </div></section>`));
    (async () => {
      if (!CS) CS = await loadJSON('classstats.json');
      if (!ROLES) { const mf = await loadJSON('manifest.json'); ROLES = {}; (mf.classes || []).forEach(c => ROLES[c.id] = { roles: c.roles, specs: c.specs }); }
      if (LEVEL > CS.maxLevel) LEVEL = CS.maxLevel;
      document.querySelectorAll('.tier-lens').forEach(b => b.onclick = () => { LENS = b.dataset.lens; document.querySelectorAll('.tier-lens').forEach(x => x.classList.toggle('on', x === b)); render(); });
      const lv = document.getElementById('tierLvl'), lvn = document.getElementById('tierLvlN');
      lv.oninput = () => { LEVEL = +lv.value; lvn.textContent = LEVEL; render(); };
      render();
    })();
  }
  registerView('tiers', view);
})();
