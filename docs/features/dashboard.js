'use strict';
// Stats Dashboard — #/stats. Visual, data-rich charts built straight from the guide
// data (manifest zones, questxp, mobstats, classstats). Pure CSS bars — no chart lib,
// no external calls — so it's self-contained and themes with the site.
(function () {
  const { el, esc, registerView, loadJSON, app } = window.WOC;
  const BIOME = { vale: '#7bbf6a', forest: '#4f9d5a', marsh: '#6a8f4f', mountain: '#9a8c7a', desert: '#d8b45c', tundra: '#8fb8c8', volcanic: '#d3703a', coast: '#4fa3c8', swamp: '#6a8f4f' };
  const CLASS_COLOR = { warrior: '#C79C6E', mage: '#69CCF0', rogue: '#FFF569', paladin: '#F58CBA', hunter: '#ABD473', priest: '#E7E7E7', shaman: '#3390DE', warlock: '#9482C9', druid: '#FF7D0A' };
  const PALETTE = ['#e8c86a', '#c98b4b', '#8f6ad3', '#4fa3c8', '#5cb85c', '#d3703a'];

  const barRows = (items, fmt) => {
    const max = Math.max(...items.map(i => i.value), 1);
    return `<div class="dash-bars">${items.map(i => `<div class="dash-brow"><span class="dash-blabel">${esc(i.label)}</span><span class="dash-btrack"><span class="dash-bfill" style="width:${(i.value / max * 100).toFixed(1)}%;background:${i.color || 'var(--gold,#e8c86a)'}"></span></span><span class="dash-bval">${fmt ? fmt(i.value) : i.value}</span></div>`).join('')}</div>`;
  };
  const rangeRows = (items, scaleMax) => `<div class="dash-bars">${items.map(i => `<div class="dash-brow"><span class="dash-blabel">${esc(i.label)}</span><span class="dash-btrack"><span class="dash-bseg" style="left:${((i.min - 1) / scaleMax * 100).toFixed(1)}%;width:${((i.max - i.min + 1) / scaleMax * 100).toFixed(1)}%;background:${i.color}"></span></span><span class="dash-bval">${i.min}–${i.max}</span></div>`).join('')}</div>`;
  const card = (title, sub, body) => `<div class="dash-card"><h3>${esc(title)}</h3>${sub ? `<p class="meta">${esc(sub)}</p>` : ''}${body}</div>`;

  function deriveClass(c, K, L) {
    const s = {}; for (const k of ['str', 'agi', 'sta', 'int', 'armor']) s[k] = (c.baseStats[k] || 0) + (c.statsPerLevel[k] || 0) * (L - 1);
    const ap = c.apRule === 'str2' ? s.str * 2 : c.apRule === 'stragi' ? s.str + s.agi : s.str;
    const crit = K.baseCrit + s.agi * K.critPerAgi, spellCrit = K.baseCrit + s.int * K.spellCritPerInt;
    const hp = c.baseHp + c.hpPerLevel * (L - 1) + Math.min(s.sta, K.staLowCap) * K.staHpLow + Math.max(0, s.sta - K.staLowCap) * K.staHpHigh;
    const sp = s.int * (K.spellPowerPerInt || 0.5);
    const meleeDps = ((10) + (ap / K.apToDamageDivisor) * 2.5) / 2.5 * (1 + crit * (K.meleeCritMult - 1));
    const spellDps = (12 + sp) / 2 * (1 + spellCrit * (K.spellCritMult - 1));
    return { hp, offense: c.caster ? spellDps : meleeDps * 2.2 };
  }

  async function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">By the numbers</span>
      <h1 class="reveal">Stats Dashboard</h1>
      <p class="sub reveal">The whole world of Claudecraft, charted — zones, leveling, threats and classes at a glance.</p>
      <div id="dashBody"><div class="spinner"></div></div>
    </div></section>`));

    let mf, qx, ms, cs;
    try { [mf, qx, ms, cs] = await Promise.all([loadJSON('manifest.json'), loadJSON('questxp.json'), loadJSON('mobstats.json'), loadJSON('classstats.json')]); }
    catch (e) { document.getElementById('dashBody').innerHTML = `<p class="meta">Couldn't load the data (${esc(e.message)}).</p>`; return; }

    const zones = mf.zones || [];
    const maxLvl = (mf.levelRange && mf.levelRange[1]) || 20;

    // 1. zone level ranges
    const zoneRanges = zones.map((z, i) => ({ label: z.title, min: z.levelRange[0], max: z.levelRange[1], color: BIOME[z.biome] || PALETTE[i % PALETTE.length] }));
    const c1 = card('Zone level ranges', 'Where each zone sits on the 1–' + maxLvl + ' journey.', rangeRows(zoneRanges, maxLvl));

    // 2. quest XP + count by zone
    const byZone = {};
    Object.values(qx.quests || {}).forEach(q => { const z = q.zone || '—'; (byZone[z] = byZone[z] || { xp: 0, n: 0 }); byZone[z].xp += q.xp || 0; byZone[z].n++; });
    const zoneOrder = zones.map(z => z.title).filter(t => byZone[t]);
    const xpItems = zoneOrder.map((t, i) => ({ label: t, value: byZone[t].xp, color: BIOME[zones[i] && zones[i].biome] || PALETTE[i % PALETTE.length] }));
    const c2 = card('Quest XP by zone', 'Total experience on offer from each zone\'s quests.', barRows(xpItems, v => (v / 1000).toFixed(1) + 'k'));
    const cntItems = zoneOrder.map((t, i) => ({ label: t, value: byZone[t].n, color: PALETTE[i % PALETTE.length] }));
    const c2b = card('Quests per zone', null, barRows(cntItems));

    // 3. mob threat by zone (avg dps)
    const mobs = ms.mobs || [];
    const zt = {};
    mobs.forEach(m => (m.zones || []).forEach(z => { (zt[z] = zt[z] || { dps: 0, n: 0, mx: 0 }); zt[z].dps += m.dps || 0; zt[z].n++; zt[z].mx = Math.max(zt[z].mx, m.dps || 0); }));
    const threatItems = zoneOrder.filter(t => zt[t]).map((t, i) => ({ label: t, value: +(zt[t].dps / zt[t].n).toFixed(1), color: '#d3703a' }));
    const c3 = card('Average mob threat by zone', 'Mean damage-per-second of the creatures you\'ll face.', barRows(threatItems, v => v + ' dps'));

    // 4. bestiary composition
    const comp = { Normal: 0, Elite: 0, Rare: 0, Boss: 0 };
    mobs.forEach(m => { if (m.boss) comp.Boss++; else if (m.rare) comp.Rare++; else if (m.elite) comp.Elite++; else comp.Normal++; });
    const compItems = Object.entries(comp).map(([k, v], i) => ({ label: k, value: v, color: ['#c8c8cf', '#e6803a', '#46b8da', '#e6bb6a'][i] }));
    const c4 = card('Bestiary composition', mobs.length + ' creatures across the world.', barRows(compItems));

    // 5. class HP + offense at max level
    const K = cs.constants, classes = Object.values(cs.classes);
    const derived = classes.map(c => ({ c, d: deriveClass(c, K, maxLvl) }));
    const hpItems = derived.slice().sort((a, b) => b.d.hp - a.d.hp).map(x => ({ label: x.c.name, value: Math.round(x.d.hp), color: CLASS_COLOR[x.c.id] }));
    const offItems = derived.slice().sort((a, b) => b.d.offense - a.d.offense).map(x => ({ label: x.c.name, value: +x.d.offense.toFixed(1), color: CLASS_COLOR[x.c.id] }));
    const c5 = card('Class health at level ' + maxLvl, 'Base survivability with no gear.', barRows(hpItems));
    const c6 = card('Class offense at level ' + maxLvl, 'Neutral-weapon DPS / spell DPS — see the <a data-go="#/tiers">tier list</a>.', barRows(offItems, v => v.toFixed(1)));

    document.getElementById('dashBody').innerHTML = `<div class="dash-grid">${c1}${c2}${c2b}${c3}${c4}${c5}${c6}</div>`;
  }
  registerView('stats', view);
})();
