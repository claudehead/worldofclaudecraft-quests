'use strict';
// Combat log simulator — #/combatlog[/class/level/mobId]
// Step through a 1v1 white-hit fight tick-by-tick using the game's combat formulas.
// Shows a scrolling event log (hits, crits, kills) plus DPS and time-to-kill summary.
(function () {
  const { el, esc, reveal, registerView, loadJSON } = window.WOC;

  const LS_KEY = 'woc_combatlog';
  const PLAYER = 'You';
  const SWING_VAR = [0.8, 1.25]; // per reference/combat.md mob damage swing range

  let CLASS = null;
  let MOBS = null;

  function hpFromSta(sta, K) {
    const s = Math.max(0, sta);
    return Math.min(s, K.staLowCap) * K.staHpLow + Math.max(0, s - K.staLowCap) * K.staHpHigh;
  }

  function armorMit(armor, attackerLevel, K) {
    return Math.min(K.armorCap, armor / (armor + K.armorA * attackerLevel + K.armorB));
  }

  function playerStats(classId, level, gear, K) {
    const c = CLASS.classes[classId];
    const base = {};
    for (const k of ['str', 'agi', 'sta', 'int', 'armor']) {
      base[k] = c.baseStats[k] + (c.statsPerLevel[k] || 0) * (level - 1);
    }
    const str = base.str + (gear.str || 0);
    const agi = base.agi + (gear.agi || 0);
    const sta = base.sta + (gear.sta || 0);
    let ap = c.apRule === 'str2' ? str * 2 : c.apRule === 'stragi' ? str + agi : str;
    ap += gear.ap || 0;
    const crit = K.baseCrit + agi * K.critPerAgi + (gear.crit || 0) / 100;
    const armor = base.armor + (gear.armor || 0) + agi * K.armorPerAgi;
    const hp = c.baseHp + c.hpPerLevel * (level - 1) + hpFromSta(sta, K);
    return { ap, crit, armor, hp, name: c.name };
  }

  function rollSwing(min, max, ap, speed, mit, crit, critMult, rng) {
    const base = (min + max) / 2 + (ap / CLASS.constants.apToDamageDivisor) * speed;
    const isCrit = rng() < crit;
    let dmg = base * (isCrit ? critMult : 1);
    dmg *= 1 - mit;
    return { dmg: Math.max(1, Math.round(dmg)), crit: isCrit };
  }

  function mobSwing(mob, mit, rng) {
    const base = (mob.dmgMin + mob.dmgMax) / 2;
    const swing = SWING_VAR[0] + rng() * (SWING_VAR[1] - SWING_VAR[0]);
    let dmg = base * swing * (1 - mit);
    return { dmg: Math.max(1, Math.round(dmg)), crit: false };
  }

  // Seeded PRNG (mulberry32) for shareable replays.
  function mulberry32(seed) {
    let t = seed >>> 0;
    return () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function simulate(st) {
    const K = CLASS.constants;
    const mob = MOBS.mobs.find(m => m.id === st.mobId) || MOBS.mobs[0];
    const ps = playerStats(st.classId, st.level, st.gear, K);
    const rng = st.seed ? mulberry32(st.seed) : Math.random;

    let pHp = ps.hp;
    let mHp = mob.hp;
    let t = 0;
    let pNext = 0;
    let mNext = 0;
    const pMit = armorMit(mob.armor, st.level, K);
    const mMit = armorMit(ps.armor, mob.level, K);

    const log = [];
    const tally = { pDealt: 0, mDealt: 0, pHits: 0, mHits: 0, pCrits: 0, mCrits: 0 };
    const fmt = (sec) => sec.toFixed(1);

    log.push({ t: 0, kind: 'start', text: `${PLAYER} (${ps.name} Lv ${st.level}, ${ps.hp} HP) engages ${mob.name} (Lv ${mob.level}, ${mob.hp} HP).` });

    while (pHp > 0 && mHp > 0 && t < st.maxTime) {
      const next = Math.min(pNext, mNext);
      t = next;

      if (t >= pNext && pHp > 0 && mHp > 0) {
        const hit = rollSwing(st.weapon.min, st.weapon.max, ps.ap, st.weapon.speed, pMit, ps.crit, K.meleeCritMult, rng);
        mHp = Math.max(0, mHp - hit.dmg);
        tally.pDealt += hit.dmg;
        tally.pHits++;
        if (hit.crit) tally.pCrits++;
        log.push({
          t,
          kind: hit.crit ? 'pcrit' : 'phit',
          text: `${PLAYER} ${hit.crit ? 'crit' : 'hit'} ${mob.name} for ${hit.dmg}${mHp ? ` (${mHp} HP left)` : ''}.`,
        });
        pNext += st.weapon.speed;
      }

      if (t >= mNext && pHp > 0 && mHp > 0) {
        const hit = mobSwing(mob, mMit, rng);
        pHp = Math.max(0, pHp - hit.dmg);
        tally.mDealt += hit.dmg;
        tally.mHits++;
        log.push({
          t,
          kind: 'mhit',
          text: `${mob.name} hits ${PLAYER} for ${hit.dmg}${pHp ? ` (${pHp} HP left)` : ''}.`,
        });
        mNext += mob.attackSpeed;
      }
    }

    if (mHp <= 0) {
      log.push({ t, kind: 'kill', text: `${mob.name} dies.` });
    } else if (pHp <= 0) {
      log.push({ t, kind: 'death', text: `${PLAYER} die.` });
    } else {
      log.push({ t, kind: 'timeout', text: `Fight timed out after ${st.maxTime}s — ${mob.name} at ${mHp} HP, ${PLAYER} at ${pHp} HP.` });
    }

    const duration = t || 0.001;
    return {
      mob,
      ps,
      log,
      tally,
      duration,
      pHp,
      mHp,
      win: mHp <= 0 && pHp > 0,
      pDps: tally.pDealt / duration,
      mDps: tally.mDealt / duration,
    };
  }

  function logColor(kind) {
    if (kind === 'pcrit') return '#ffd166';
    if (kind === 'phit') return '#8bd24f';
    if (kind === 'mhit') return '#e0526a';
    if (kind === 'kill') return '#e6bb6a';
    if (kind === 'death') return '#ff4d6d';
    if (kind === 'timeout') return '#e0a23a';
    return '#a8adb8';
  }

  function persist(st) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        classId: st.classId, level: st.level, mobId: st.mobId,
        gear: st.gear, weapon: st.weapon, seed: st.seed, maxTime: st.maxTime,
      }));
    } catch (e) { /* ignore */ }
  }

  async function combatlogView(parts) {
    const app = window.WOC.app;
    app.innerHTML = '';
    try {
      if (!CLASS) CLASS = await loadJSON('classstats.json');
      if (!MOBS) MOBS = await loadJSON('mobstats.json');
    } catch (e) {
      app.append(el(`<section class="block"><div class="wrap"><p class="meta">Couldn't load data (${esc(e.message)})</p></div></section>`));
      return;
    }

    const classIds = Object.keys(CLASS.classes);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) {}

    const defaultMob = MOBS.mobs.find(m => !m.elite && !m.boss) || MOBS.mobs[0];
    const st = {
      classId: classIds.includes(parts && parts[0]) ? parts[0] : (classIds.includes(saved.classId) ? saved.classId : classIds[0]),
      level: Math.min(20, Math.max(1, parseInt(parts && parts[1], 10) || saved.level || 10)),
      mobId: (parts && parts[2] && MOBS.mobs.some(m => m.id === parts[2])) ? parts[2] : (saved.mobId && MOBS.mobs.some(m => m.id === saved.mobId) ? saved.mobId : defaultMob.id),
      gear: { ap: 0, armor: 0, sta: 0, str: 0, agi: 0, crit: 0, ...(saved.gear || {}) },
      weapon: { min: 8, max: 14, speed: 2.5, ...(saved.weapon || {}) },
      seed: saved.seed || 0,
      maxTime: saved.maxTime || 120,
      result: null,
    };

    function buildHash() {
      return `#/combatlog/${st.classId}/${st.level}/${st.mobId}`;
    }

    app.append(el(`<section class="block"><div class="wrap">
      <div class="shead reveal"><span class="eyebrow">Tools · combat</span><h2>Combat log simulator</h2>
        <p>Run a 1v1 white-hit fight against any mob. Each swing uses the real armor, AP, crit and HP formulas — then scroll the event log like an in-game combat feed.</p></div>
      <div class="controls reveal" style="gap:14px;flex-wrap:wrap;align-items:flex-end">
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">Class
          <select id="cl-class" style="padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light">${classIds.map(id => `<option value="${id}">${esc(CLASS.classes[id].name)}</option>`).join('')}</select>
        </label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px;min-width:140px">Level <span id="cl-lvl-lbl">${st.level}</span>
          <input id="cl-level" type="range" min="1" max="20" value="${st.level}" style="width:140px"></label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px;min-width:220px">Mob
          <input id="cl-mob-search" list="cl-mobs" placeholder="Search a mob…" style="padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light">
          <datalist id="cl-mobs">${MOBS.mobs.map(m => `<option value="${esc(m.name)}">`).join('')}</datalist>
        </label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">Wpn min
          <input id="cl-wmin" type="number" value="${st.weapon.min}" style="width:64px;padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">max
          <input id="cl-wmax" type="number" value="${st.weapon.max}" style="width:64px;padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">speed
          <input id="cl-wspd" type="number" value="${st.weapon.speed}" step="0.1" min="0.5" style="width:64px;padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">+AP
          <input id="cl-ap" type="number" value="${st.gear.ap}" style="width:64px;padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">+Armor
          <input id="cl-armor" type="number" value="${st.gear.armor}" style="width:64px;padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">+Sta
          <input id="cl-sta" type="number" value="${st.gear.sta}" style="width:64px;padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></label>
        <label class="meta" style="display:flex;flex-direction:column;gap:3px">Seed <span class="meta" style="font-size:10px">0 = random</span>
          <input id="cl-seed" type="number" value="${st.seed}" min="0" style="width:80px;padding:7px 9px;border-radius:7px;border:1px solid #888;background:#fff;color:#111;color-scheme:light"></label>
        <span class="btn" id="cl-run">▶ Run fight</span>
        <span class="btn ghost" id="cl-rerun">↻ Re-run</span>
      </div>
      <div id="cl-grid" class="reveal" style="display:grid;grid-template-columns:minmax(280px,340px) 1fr;gap:18px;margin-top:14px;align-items:start">
        <div id="cl-summary"></div>
        <div id="cl-log-wrap" class="card" style="padding:0;overflow:hidden">
          <div style="padding:10px 14px;border-bottom:1px solid var(--line,#2a2e34);display:flex;justify-content:space-between;align-items:center">
            <span class="meta">Combat log</span>
            <span class="pill" id="cl-copy">Copy log</span>
          </div>
          <div id="cl-log" style="max-height:480px;overflow:auto;padding:10px 14px;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.55;background:#0d0f12"></div>
        </div>
      </div>
      <p class="meta reveal" style="margin-top:12px;font-size:11px">White hits only — no abilities, miss/dodge, or healing. Mob swings use 0.8–1.25× damage variance. Formulas from <a href="#/doc/${encodeURIComponent('reference/combat.md')}">combat maths</a>.</p>
    </div></section>`));

    const classSel = app.querySelector('#cl-class');
    const lvlRange = app.querySelector('#cl-level');
    const lvlLbl = app.querySelector('#cl-lvl-lbl');
    const mobSearch = app.querySelector('#cl-mob-search');
    classSel.value = st.classId;
    mobSearch.value = (MOBS.mobs.find(m => m.id === st.mobId) || defaultMob).name;

    function readInputs() {
      st.classId = classSel.value;
      st.level = parseInt(lvlRange.value, 10);
      st.gear.ap = parseFloat(app.querySelector('#cl-ap').value) || 0;
      st.gear.armor = parseFloat(app.querySelector('#cl-armor').value) || 0;
      st.gear.sta = parseFloat(app.querySelector('#cl-sta').value) || 0;
      st.weapon.min = parseFloat(app.querySelector('#cl-wmin').value) || 1;
      st.weapon.max = parseFloat(app.querySelector('#cl-wmax').value) || 1;
      st.weapon.speed = Math.max(0.5, parseFloat(app.querySelector('#cl-wspd').value) || 2.5);
      st.seed = Math.max(0, parseInt(app.querySelector('#cl-seed').value, 10) || 0);
      const byName = MOBS.mobs.find(m => m.name === mobSearch.value);
      if (byName) st.mobId = byName.id;
      lvlLbl.textContent = st.level;
    }

    function renderSummary(res) {
      const host = app.querySelector('#cl-summary');
      if (!res) {
        host.innerHTML = `<div class="card" style="padding:14px 16px"><p class="meta" style="margin:0">Pick a mob and hit <b>Run fight</b> to generate a combat log.</p></div>`;
        return;
      }
      const { mob, ps, tally, duration, win, pDps, mDps, pHp, mHp } = res;
      const verdict = win ? '✅ Victory' : mHp > 0 && pHp <= 0 ? '☠️ Defeat' : '⏱ Timeout';
      const vcol = win ? '#36c275' : pHp <= 0 ? '#e0526a' : '#e0a23a';
      const row = (a, b) => `<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px solid var(--line,#262626)"><span class="meta">${a}</span><b>${b}</b></div>`;
      host.innerHTML = `<div class="card" style="padding:14px 16px">
        <div style="font-size:1.1rem;font-weight:700;color:${vcol};margin-bottom:8px">${verdict}</div>
        <div class="meta" style="margin-bottom:10px">${esc(ps.name)} Lv ${st.level} vs ${esc(mob.name)} Lv ${mob.level}</div>
        ${row('Duration', duration.toFixed(1) + 's')}
        ${row('Your DPS', pDps.toFixed(1))}
        ${row('Mob DPS', mDps.toFixed(1))}
        ${row('Damage dealt', tally.pDealt + ` (${tally.pHits} hits, ${tally.pCrits} crits)`)}
        ${row('Damage taken', tally.mDealt + ` (${tally.mHits} hits)`)}
        ${row('Your HP left', pHp > 0 ? pHp : '0')}
        ${row('Mob HP left', mHp > 0 ? mHp : '0')}
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line,#2a2e34)">
          ${row('Your armor', ps.armor)}
          ${row('Mitigation vs mob', (armorMit(ps.armor, mob.level, CLASS.constants) * 100).toFixed(1) + '%')}
          ${row('Mob armor', mob.armor)}
          ${row('Your hit through armor', (armorMit(mob.armor, st.level, CLASS.constants) * 100).toFixed(1) + '% mitigated')}
        </div>
      </div>`;
    }

    function renderLog(res) {
      const host = app.querySelector('#cl-log');
      if (!res) {
        host.innerHTML = '<div class="meta" style="opacity:.6">No events yet.</div>';
        return;
      }
      host.innerHTML = res.log.map(ev => {
        const ts = `[${ev.t.toFixed(1)}]`;
        return `<div style="color:${logColor(ev.kind)}"><span style="color:#666;margin-right:8px">${ts}</span>${esc(ev.text)}</div>`;
      }).join('');
      host.scrollTop = host.scrollHeight;
    }

    function runFight() {
      readInputs();
      st.result = simulate(st);
      renderSummary(st.result);
      renderLog(st.result);
      history.replaceState(null, '', buildHash());
      persist(st);
    }

    classSel.onchange = () => { readInputs(); history.replaceState(null, '', buildHash()); persist(st); };
    lvlRange.oninput = () => { readInputs(); history.replaceState(null, '', buildHash()); persist(st); };
    mobSearch.onchange = () => { readInputs(); history.replaceState(null, '', buildHash()); persist(st); };
    ['#cl-wmin', '#cl-wmax', '#cl-wspd', '#cl-ap', '#cl-armor', '#cl-sta', '#cl-seed'].forEach(sel => {
      app.querySelector(sel).oninput = () => { readInputs(); persist(st); };
    });
    app.querySelector('#cl-run').onclick = runFight;
    app.querySelector('#cl-rerun').onclick = () => {
      if (!st.seed) {
        st.seed = Math.floor(Math.random() * 1e9);
        app.querySelector('#cl-seed').value = st.seed;
      }
      runFight();
    };
    app.querySelector('#cl-copy').onclick = () => {
      if (!st.result) return;
      const text = st.result.log.map(ev => `[${ev.t.toFixed(1)}] ${ev.text}`).join('\n');
      navigator.clipboard?.writeText(text).then(() => {
        const t = el('<div class="toast in">Combat log copied</div>');
        document.body.append(t);
        setTimeout(() => t.remove(), 1800);
      }).catch(() => {});
    };

    if (window.matchMedia('(max-width: 900px)').matches) {
      app.querySelector('#cl-grid').style.gridTemplateColumns = '1fr';
    }

    renderSummary(null);
    renderLog(null);
    runFight();
    reveal();
  }

  registerView('combatlog', combatlogView);
})();
