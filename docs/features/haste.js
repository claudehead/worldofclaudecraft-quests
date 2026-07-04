'use strict';
// Haste stat-weight cheat sheet — #/haste. v0.20 made haste a real stat (speeds melee,
// ranged and spell). This computes, per class, how much DPS one point of haste is worth
// at level 20 — from the same combat model as the tier list / DPS calc — plus where to
// get haste. Haste is ~linear on sustained DPS, so 1% haste ≈ 1% more DPS.
(function () {
  const { el, esc, registerView, loadJSON, reveal, app } = window.WOC;
  const CLASS_COLOR = { warrior: '#C79C6E', mage: '#69CCF0', rogue: '#FFF569', paladin: '#F58CBA', hunter: '#ABD473', priest: '#E7E7E7', shaman: '#3390DE', warlock: '#9482C9', druid: '#FF7D0A' };

  function dpsOf(c, K, L) {
    const s = {}; for (const k of ['str', 'agi', 'int']) s[k] = (c.baseStats[k] || 0) + (c.statsPerLevel[k] || 0) * (L - 1);
    const ap = c.apRule === 'str2' ? s.str * 2 : c.apRule === 'stragi' ? s.str + s.agi : s.str;
    const crit = K.baseCrit + (c.baseStats.agi + c.statsPerLevel.agi * (L - 1)) * K.critPerAgi;
    const spellCrit = K.baseCrit + s.int * K.spellCritPerInt;
    const sp = s.int * (K.spellPowerPerInt || 0.5);
    const melee = (10 + (ap / K.apToDamageDivisor) * 2.5) / 2.5 * (1 + crit * (K.meleeCritMult - 1)) * 2.2;
    const spell = (12 + sp) / 2 * (1 + spellCrit * (K.spellCritMult - 1));
    return c.caster ? spell : melee;
  }

  async function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Tools · combat</span>
      <h1 class="reveal">Haste — what it's worth ⚡</h1>
      <p class="sub reveal">Haste (v0.20) speeds up melee swings, ranged shots and casts alike. It's roughly <b>linear</b> — <b>1% haste ≈ 1% more sustained DPS/HPS</b>. Below: how much a point of haste buys each class at level 20.</p>
      <div id="hasteBody"><div class="spinner"></div></div>
    </div></section>`));
    let cs; try { cs = await loadJSON('classstats.json'); } catch (e) { document.getElementById('hasteBody').innerHTML = `<p class="meta">Couldn't load class stats (${esc(e.message)}).</p>`; return; }
    const K = cs.constants, L = cs.maxLevel;
    const rows = Object.values(cs.classes).map(c => { const dps = dpsOf(c, K, L); return { c, dps, per: dps * 0.01 }; }).sort((a, b) => b.per - a.per);
    document.getElementById('hasteBody').innerHTML = `
      <table class="haste-table reveal"><thead><tr><th>Class</th><th>Base DPS (L${L})</th><th>DPS per 1% haste</th><th>15% set = +DPS</th></tr></thead><tbody>
        ${rows.map(r => `<tr><td style="color:${CLASS_COLOR[r.c.id]}">${esc(r.c.name)}</td><td>${r.dps.toFixed(1)}</td><td><b>${r.per.toFixed(2)}</b></td><td class="meta">+${(r.dps * 0.15).toFixed(1)}</td></tr>`).join('')}
      </tbody></table>
      <div class="haste-src reveal">
        <h3>Where to get haste</h3>
        <ul>
          <li><b>Tier-2 3-piece sets</b> — every Tier-2 set (Crownforged, Nighttalon, Soulflame, Stormcaller's) grants <b>15% haste</b> at 3 pieces. See <a data-go="#/sets">item sets</a>.</li>
          <li><b>Leveling haste kits</b> — three world-drop sets grant haste alone at 3 pieces: <b>Vale Arcanist's Regalia</b>, <b>Boundstone Vanguard</b>, and <b>Greyjaw Stalker's Kit</b>.</li>
        </ul>
        <p class="meta">Spell haste shortens cast &amp; channel time (tick count unchanged; the GCD isn't hasted). Melee/ranged haste shortens swing intervals. Plug a haste % into the <a data-go="#/calc">DPS calculator</a> to see it on your own gear.</p>
      </div>`;
    reveal();
  }
  registerView('haste', view);
})();
