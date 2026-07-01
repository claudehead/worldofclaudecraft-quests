'use strict';
// Loadout simulator — #/loadout[/class/level/slot:id,...]
// Paper-doll gear picker with projected stats, weapon DPS, and mitigation vs a mob level.
(function () {
  const { el, esc, raw, reveal, registerView, loadJSON, QUALITY_COLOR, STAT_LABEL } = window.WOC;

  const LS_KEY = 'woc_loadout';
  const CLASS_LABEL = {
    warrior: 'Warrior', paladin: 'Paladin', hunter: 'Hunter', rogue: 'Rogue',
    priest: 'Priest', shaman: 'Shaman', mage: 'Mage', warlock: 'Warlock', druid: 'Druid',
  };
  const SLOT_ORDER = ['mainhand', 'helmet', 'shoulder', 'chest', 'gloves', 'waist', 'legs', 'feet'];

  let GEAR = null, CLASS = null, BIS = null, BY_ID = null;

  function hpFromSta(sta) {
    const s = Math.max(0, sta);
    return Math.min(s, 20) + Math.max(0, s - 20) * 10;
  }

  function armorMit(armor, attackerLevel) {
    const K = CLASS.constants;
    return Math.min(K.armorCap, armor / (armor + K.armorA * attackerLevel + K.armorB));
  }

  function statsAtLevel(classId, level) {
    const c = CLASS.classes[classId];
    const K = CLASS.constants;
    const out = { ...c.baseStats };
    for (const [k, v] of Object.entries(c.statsPerLevel || {})) {
      out[k] = (out[k] || 0) + v * (level - 1);
    }
    out.hp = Math.round(c.baseHp + c.hpPerLevel * (level - 1) + hpFromSta(out.sta));
    if (c.apRule === 'str2') out.ap = out.str * 2;
    else if (c.apRule === 'stragi') out.ap = out.str + out.agi;
    else out.ap = out.str;
    out.crit = K.baseCrit + out.agi * K.critPerAgi;
    out.spellPower = Math.round(out.int * K.spellPowerPerInt);
    out.armor += out.agi * K.armorPerAgi;
    return out;
  }

  function gearBonus(equip) {
    const flat = { str: 0, agi: 0, sta: 0, int: 0, spi: 0, armor: 0 };
    let weapon = null;
    for (const slot of SLOT_ORDER) {
      const id = equip[slot];
      if (!id) continue;
      const g = BY_ID.get(id);
      if (!g) continue;
      for (const [k, v] of Object.entries(g.bonuses || {})) {
        if (k in flat) flat[k] += v;
      }
      if (slot === 'mainhand' && g.weapon) weapon = g.weapon;
    }
    return { flat, weapon };
  }

  function totalStats(classId, level, equip) {
    const base = statsAtLevel(classId, level);
    const { flat, weapon } = gearBonus(equip);
    const out = { ...base };
    for (const [k, v] of Object.entries(flat)) if (v) out[k] = (out[k] || 0) + v;
    out.hp = Math.round(CLASS.classes[classId].baseHp + CLASS.classes[classId].hpPerLevel * (level - 1) + hpFromSta(out.sta));
    const c = CLASS.classes[classId];
    if (c.apRule === 'str2') out.ap = out.str * 2;
    else if (c.apRule === 'stragi') out.ap = out.str + out.agi;
    else out.ap = out.str;
    const K = CLASS.constants;
    out.crit = K.baseCrit + out.agi * K.critPerAgi;
    out.spellPower = Math.round(out.int * K.spellPowerPerInt);
    return { stats: out, weapon, gearFlat: flat };
  }

  function usableGear(classId, level, slot) {
    const label = CLASS_LABEL[classId];
    return GEAR.gear.filter(g => g.slot === slot
      && (!g.reqLevel || g.reqLevel <= level)
      && (g.usable === null || g.usable.includes(label)));
  }

  function encodeEquip(equip) {
    return SLOT_ORDER.filter(s => equip[s]).map(s => `${s}:${equip[s]}`).join(',');
  }

  function decodeEquip(str) {
    const equip = {};
    if (!str) return equip;
    for (const part of str.split(',')) {
      const [slot, id] = part.split(':');
      if (slot && id && SLOT_ORDER.includes(slot)) equip[slot] = decodeURIComponent(id);
    }
    return equip;
  }

  function persist(st) {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ classId: st.classId, level: st.level, equip: st.equip, mobLevel: st.mobLevel })); } catch (e) {}
  }

  function bisEquip(classId, level, buildIdx) {
    const row = BIS.classes.find(c => c.id === classId);
    if (!row) return {};
    const build = (row.builds || [])[buildIdx] || row.builds[0];
    if (!build) return {};
    const equip = {};
    for (const s of build.slots) {
      let pick = s.item;
      if (s.progression) {
        for (const p of s.progression) { if (p.level <= level) pick = p.item; }
      }
      if (pick && pick.id) equip[s.slot] = pick.id;
    }
    return equip;
  }

  async function loadoutView(parts) {
    const app = window.WOC.app;
    app.innerHTML = '';
    try {
      if (!GEAR) {
        GEAR = await loadJSON('gear/gear.json', { raw: true });
        BY_ID = new Map(GEAR.gear.map(g => [g.id, g]));
      }
      if (!CLASS) CLASS = await loadJSON('classstats.json');
      if (!BIS) BIS = await loadJSON('gear/bis.json', { raw: true });
    } catch (e) {
      app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load data (${esc(e.message)})</p></div></section>`));
      return;
    }

    const classIds = Object.keys(CLASS.classes);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) {}

    const st = {
      classId: classIds.includes(parts[0]) ? parts[0] : (saved.classId && classIds.includes(saved.classId) ? saved.classId : classIds[0]),
      level: Math.min(20, Math.max(1, parseInt(parts[1], 10) || saved.level || 20)),
      equip: { ...(saved.equip || {}), ...decodeEquip(parts[2] || '') },
      mobLevel: saved.mobLevel || 20,
      activeSlot: 'mainhand',
      bisBuild: 0,
    };

    const slotLabel = (id) => (GEAR.slots.find(s => s.id === id) || {}).label || id;

    function buildHash() {
      const enc = encodeEquip(st.equip);
      return `#/loadout/${st.classId}/${st.level}${enc ? '/' + encodeURIComponent(enc) : ''}`;
    }

    app.append(el(`<section class="block"><div class="wrap">
      <div class="shead reveal"><span class="eyebrow">Tools · gear</span><h2>Loadout simulator</h2>
        <p>Equip items on a paper doll and see your projected stats, weapon DPS, and physical mitigation. Load a BiS preset or share a link.</p></div>
      <div class="controls reveal" style="gap:14px;flex-wrap:wrap;align-items:flex-end">
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">Class
          <select id="lo-class" style="padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light">${classIds.map(id => `<option value="${id}">${esc(CLASS.classes[id].name)}</option>`).join('')}</select>
        </label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px;min-width:160px">Level <span id="lo-lvl-lbl">${st.level}</span>
          <input id="lo-level" type="range" min="1" max="20" value="${st.level}" style="width:160px"></label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">Vs mob level (mitigation)
          <input id="lo-mob" type="number" min="1" max="20" value="${st.mobLevel}" style="width:72px;padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></label>
        <span class="btn ghost" id="lo-bis">Load BiS</span>
        <span class="btn ghost" id="lo-clear">Clear all</span>
        <span class="btn ghost" id="lo-share">Copy link</span>
      </div>
      <div id="lo-bis-builds" class="controls reveal" style="margin-top:-8px;display:none"></div>
      <div id="lo-grid" class="reveal" style="display:grid;grid-template-columns:minmax(220px,280px) 1fr minmax(240px,300px);gap:18px;margin-top:14px;align-items:start">
        <div id="lo-doll"></div>
        <div><div class="meta" style="margin-bottom:6px" id="lo-pick-lbl">Pick gear for <b>Weapon</b></div>
          <input id="lo-search" class="search" placeholder="Search this slot…" style="margin-bottom:10px">
          <div id="lo-pick" style="max-height:420px;overflow:auto;display:flex;flex-direction:column;gap:6px"></div></div>
        <div id="lo-stats"></div>
      </div>
    </div></section>`));

    const classSel = app.querySelector('#lo-class');
    const lvlRange = app.querySelector('#lo-level');
    const lvlLbl = app.querySelector('#lo-lvl-lbl');
    const mobIn = app.querySelector('#lo-mob');
    const bisBuildHost = app.querySelector('#lo-bis-builds');
    classSel.value = st.classId;

    function renderBisBuilds() {
      const row = BIS.classes.find(c => c.id === st.classId);
      const builds = (row && row.builds) || [];
      if (builds.length <= 1) { bisBuildHost.style.display = 'none'; bisBuildHost.innerHTML = ''; return; }
      bisBuildHost.style.display = '';
      bisBuildHost.innerHTML = '<span class="meta" style="margin-right:6px">BiS build:</span>';
      builds.forEach((b, i) => {
        const p = el(`<span class="pill ${i === st.bisBuild ? 'active' : ''}">${esc(b.label)}</span>`);
        p.onclick = () => { st.bisBuild = i; renderBisBuilds(); };
        bisBuildHost.append(p);
      });
    }

    function drawDoll() {
      const host = app.querySelector('#lo-doll');
      host.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${SLOT_ORDER.map(slot => {
          const g = st.equip[slot] ? BY_ID.get(st.equip[slot]) : null;
          const col = g ? (QUALITY_COLOR[g.quality] || '#c8c8cf') : '#444';
          const active = st.activeSlot === slot ? 'outline:2px solid #e6bb6a;' : '';
          return `<button type="button" class="card" data-slot="${slot}" style="padding:8px;text-align:left;cursor:pointer;${active}min-height:64px;display:flex;gap:8px;align-items:center;background:var(--card,#1a1d21);border:1px solid var(--line,#2a2e34)">
            ${g ? `<img src="${raw(g.icon)}" alt="" style="width:36px;height:36px;border:2px solid ${col};border-radius:4px;flex:none">` : `<div style="width:36px;height:36px;border:2px dashed #555;border-radius:4px;flex:none"></div>`}
            <div style="min-width:0"><div class="meta" style="font-size:11px">${esc(slotLabel(slot))}</div>
            <div style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${col}">${g ? esc(g.name) : '— empty —'}</div></div>
          </button>`;
        }).join('')}
      </div>`;
      host.querySelectorAll('[data-slot]').forEach(btn => {
        btn.onclick = () => { st.activeSlot = btn.dataset.slot; draw(); };
        btn.oncontextmenu = (e) => {
          e.preventDefault();
          delete st.equip[btn.dataset.slot];
          draw();
        };
      });
    }

    function drawPicker() {
      const list = usableGear(st.classId, st.level, st.activeSlot);
      const term = (app.querySelector('#lo-search').value || '').toLowerCase();
      const filtered = list.filter(g => !term || g.name.toLowerCase().includes(term))
        .sort((a, b) => (b.ilvl || b.reqLevel || 0) - (a.ilvl || a.reqLevel || 0) || a.name.localeCompare(b.name));
      app.querySelector('#lo-pick-lbl').innerHTML = `Pick gear for <b>${esc(slotLabel(st.activeSlot))}</b> · ${filtered.length} items · right-click slot to unequip`;
      const host = app.querySelector('#lo-pick');
      host.innerHTML = filtered.slice(0, 80).map(g => {
        const col = QUALITY_COLOR[g.quality] || '#c8c8cf';
        const on = st.equip[st.activeSlot] === g.id;
        return `<button type="button" class="card" data-gid="${g.id}" style="padding:8px 10px;text-align:left;cursor:pointer;display:flex;gap:10px;align-items:center;${on ? 'box-shadow:0 0 0 2px #e6bb6a inset;' : ''}">
          <img src="${raw(g.icon)}" alt="" style="width:32px;height:32px;border:2px solid ${col};border-radius:4px;flex:none">
          <div style="min-width:0;flex:1"><div style="color:${col};font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(g.name)}</div>
          <div class="meta" style="font-size:12px">${esc(g.stats || '')}${g.reqLevel ? ` · Lv ${g.reqLevel}+` : ''}</div></div></button>`;
      }).join('') + (filtered.length > 80 ? `<p class="meta">Showing top 80 — search to narrow.</p>` : '');
      host.querySelectorAll('[data-gid]').forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.gid;
          if (st.equip[st.activeSlot] === id) delete st.equip[st.activeSlot];
          else st.equip[st.activeSlot] = id;
          draw();
        };
      });
    }

    function drawStats() {
      const naked = statsAtLevel(st.classId, st.level);
      const { stats, weapon, gearFlat } = totalStats(st.classId, st.level, st.equip);
      const mit = armorMit(stats.armor, st.mobLevel);
      const K = CLASS.constants;
      const c = CLASS.classes[st.classId];

      let combatLine = '';
      if (weapon && weapon.speed) {
        const wDps = ((weapon.min + weapon.max) / 2) / weapon.speed;
        const apPerSwing = (stats.ap / K.apToDamageDivisor) * weapon.speed;
        const avgHit = ((weapon.min + weapon.max) / 2 + apPerSwing) * (1 - mit);
        const whiteDps = avgHit / weapon.speed;
        combatLine = `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line,#2a2e34)">
          <div class="meta">Weapon</div>
          <div><b>${weapon.min}–${weapon.max}</b> @ ${weapon.speed}s · <b>${wDps.toFixed(1)}</b> weapon DPS</div>
          <div class="meta" style="margin-top:4px">Est. white-hit vs Lv ${st.mobLevel} mob: <b>${avgHit.toFixed(0)}</b> dmg (${whiteDps.toFixed(1)} DPS) · ${(mit * 100).toFixed(1)}% mitigated</div></div>`;
      } else if (c.caster) {
        combatLine = `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line,#2a2e34)">
          <div class="meta">Caster</div>
          <div>Spell power <b>${stats.spellPower}</b> · spell crit <b>${(K.baseCrit + stats.int * K.spellCritPerInt) * 100}%</b></div>
          <div class="meta" style="margin-top:4px">${(mit * 100).toFixed(1)}% physical mitigation vs Lv ${st.mobLevel}</div></div>`;
      }

      const primaries = ['str', 'agi', 'sta', 'int', 'spi'];
      const rows = primaries.map(k => {
        const n = stats[k] || 0;
        const d = (gearFlat[k] || 0);
        return `<tr><td class="meta">${esc(STAT_LABEL[k] || k)}</td><td style="text-align:right"><b>${n}</b>${d ? ` <span class="meta" style="color:#5cb85c">(+${d})</span>` : ''}</td></tr>`;
      }).join('');

      const hpDelta = stats.hp - naked.hp;
      const apDelta = stats.ap - naked.ap;
      const armDelta = stats.armor - naked.armor;

      app.querySelector('#lo-stats').innerHTML = `<div class="card" style="padding:14px 16px">
        <h3 style="margin:0 0 10px;font-size:1rem">${esc(c.name)} <span class="meta">@ Lv ${st.level}</span></h3>
        <table style="width:100%;font-size:13px;border-collapse:collapse">${rows}</table>
        <div style="margin-top:10px;display:grid;gap:4px;font-size:13px">
          <div style="display:flex;justify-content:space-between"><span class="meta">Health</span><b>${stats.hp}</b>${hpDelta ? ` <span class="meta" style="color:#5cb85c">(+${hpDelta})</span>` : ''}</div>
          <div style="display:flex;justify-content:space-between"><span class="meta">Attack power</span><b>${stats.ap}</b>${apDelta ? ` <span class="meta" style="color:#5cb85c">(+${apDelta})</span>` : ''}</div>
          <div style="display:flex;justify-content:space-between"><span class="meta">Armor</span><b>${stats.armor}</b>${armDelta ? ` <span class="meta" style="color:#5cb85c">(+${armDelta})</span>` : ''}</div>
          <div style="display:flex;justify-content:space-between"><span class="meta">Melee crit</span><b>${(stats.crit * 100).toFixed(1)}%</b></div>
        </div>
        ${combatLine}
        <p class="meta" style="margin:12px 0 0;font-size:11px">Uses <a href="#/doc/${encodeURIComponent('reference/combat.md')}">combat maths</a> — HP from Stamina, AP by class, armor cap 75%.</p>
      </div>`;
    }

    function draw() {
      lvlLbl.textContent = st.level;
      st.mobLevel = Math.min(20, Math.max(1, parseInt(mobIn.value, 10) || 20));
      mobIn.value = st.mobLevel;
      drawDoll();
      drawPicker();
      drawStats();
      history.replaceState(null, '', buildHash());
      persist(st);
    }

    classSel.onchange = () => { st.classId = classSel.value; st.equip = {}; renderBisBuilds(); draw(); };
    lvlRange.oninput = () => { st.level = parseInt(lvlRange.value, 10); draw(); };
    mobIn.oninput = draw;
    app.querySelector('#lo-search').oninput = drawPicker;
    app.querySelector('#lo-clear').onclick = () => { st.equip = {}; draw(); };
    app.querySelector('#lo-bis').onclick = () => { st.equip = bisEquip(st.classId, st.level, st.bisBuild); draw(); };
    app.querySelector('#lo-share').onclick = () => {
      const url = location.origin + location.pathname + buildHash();
      navigator.clipboard?.writeText(url).then(() => {
        const t = el('<div class="toast in">Loadout link copied</div>');
        document.body.append(t);
        setTimeout(() => t.remove(), 1800);
      }).catch(() => {});
    };

    if (window.matchMedia('(max-width: 900px)').matches) {
      app.querySelector('#lo-grid').style.gridTemplateColumns = '1fr';
    }

    renderBisBuilds();
    draw();
    reveal();
  }

  registerView('loadout', loadoutView);
})();
