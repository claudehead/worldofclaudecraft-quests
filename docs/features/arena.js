'use strict';
// Playable Boss Battle — #/arena. A turn-based fight: pick your class, pick a boss
// from the bestiary, and trade blows using the real class/mob stats + combat math.
// Damage is scaled for ~8–12 turn fights (dramatized), crit adds swing, choices matter.
(function () {
  const { el, esc, registerView, loadJSON, app } = window.WOC;
  const CLASS_COLOR = { warrior: '#C79C6E', mage: '#69CCF0', rogue: '#FFF569', paladin: '#F58CBA', hunter: '#ABD473', priest: '#E7E7E7', shaman: '#3390DE', warlock: '#9482C9', druid: '#FF7D0A' };
  const CLASS_EMOJI = { warrior: '⚔️', mage: '🔮', rogue: '🗡️', paladin: '🛡️', hunter: '🏹', priest: '✨', shaman: '🌊', warlock: '😈', druid: '🐻' };
  const FAMILY_EMOJI = { beast: '🐺', undead: '💀', dragon: '🐉', humanoid: '🧍', elemental: '🔥', demon: '👹', construct: '🗿' };
  const rnd = (a, b) => a + Math.random() * (b - a);
  let DATA = null, S = null, avgOff = 1;

  function classStats(c, K, L) {
    const s = {}; for (const k of ['str', 'agi', 'sta', 'int', 'armor']) s[k] = (c.baseStats[k] || 0) + (c.statsPerLevel[k] || 0) * (L - 1);
    const ap = c.apRule === 'str2' ? s.str * 2 : c.apRule === 'stragi' ? s.str + s.agi : s.str;
    const crit = K.baseCrit + s.agi * K.critPerAgi + (c.caster ? s.int * K.spellCritPerInt : 0);
    const hp = c.baseHp + c.hpPerLevel * (L - 1) + Math.min(s.sta, K.staLowCap) * K.staHpLow + Math.max(0, s.sta - K.staLowCap) * K.staHpHigh;
    const sp = s.int * (K.spellPowerPerInt || 0.5);
    const melee = (10 + (ap / K.apToDamageDivisor) * 2.5) / 2.5 * 2.2, spell = (12 + sp) / 2;
    return { hp: Math.round(hp), crit: Math.min(0.5, crit), offense: c.caster ? spell : melee };
  }

  function start(clsId, bossId) {
    const K = DATA.cs.constants, c = DATA.cs.classes[clsId];
    const boss = DATA.opps.find(o => o.id === bossId);
    const L = boss.level;
    const ps = classStats(c, K, L);
    const roles = (DATA.roles[clsId] || {}).roles || [];
    const mod = Math.max(0.7, Math.min(1.4, ps.offense / avgOff));
    S = {
      clsId, bossId, L, color: CLASS_COLOR[clsId], emoji: CLASS_EMOJI[clsId], cname: c.name,
      bemoji: boss.emoji, bname: boss.name,
      pMax: ps.hp, pHp: ps.hp, crit: ps.crit,
      bMax: boss.hp, bHp: boss.hp,
      basic: Math.max(3, Math.round(boss.hp / 9 * mod)),
      bossHit: Math.max(2, Math.round(ps.hp / 10)),
      canHeal: roles.includes('healer'),
      specialCd: 0, healCd: 0, guard: false, over: false, log: [`⚔️ ${c.name} faces ${boss.name} (Lv ${L})!`],
    };
    renderBattle();
  }

  function bossTurn() {
    if (S.over) return;
    let dmg = Math.round(S.bossHit * rnd(0.8, 1.25));
    if (S.guard) { dmg = Math.round(dmg * 0.5); S.guard = false; S.log.push(`🛡️ You brace — damage halved.`); }
    S.bHp = S.bHp; S.pHp = Math.max(0, S.pHp - dmg);
    S.log.push(`👹 ${S.bname} hits you for ${dmg}.`);
    if (S.pHp <= 0) { S.over = 'lose'; S.log.push(`💀 You have fallen. ${S.bname} wins.`); }
  }

  function act(kind) {
    if (S.over) return;
    if (kind === 'attack') {
      let dmg = Math.round(S.basic * rnd(0.85, 1.15)); const crit = Math.random() < S.crit; if (crit) dmg *= 2;
      S.bHp = Math.max(0, S.bHp - dmg); S.log.push(`${crit ? '💥 CRIT! ' : '⚔️ '}You strike for ${dmg}.`);
    } else if (kind === 'special') {
      if (S.specialCd > 0) return; let dmg = Math.round(S.basic * 2 * rnd(0.9, 1.15)); const crit = Math.random() < S.crit; if (crit) dmg *= 2;
      S.bHp = Math.max(0, S.bHp - dmg); S.specialCd = 3; S.log.push(`${crit ? '💥 CRIT! ' : '🌟 '}Special hits for ${dmg}!`);
    } else if (kind === 'guard') {
      S.guard = true; S.log.push(`🛡️ You raise your guard.`);
    } else if (kind === 'heal') {
      if (S.healCd > 0) return; const h = Math.round(S.pMax * 0.22); S.pHp = Math.min(S.pMax, S.pHp + h); S.healCd = 4; S.log.push(`✨ You heal ${h}.`);
    }
    if (S.bHp <= 0) { S.over = 'win'; S.log.push(`🏆 ${S.bname} is defeated! Victory!`); }
    else bossTurn();
    if (S.specialCd > 0) S.specialCd--; if (S.healCd > 0) S.healCd--;
    renderBattle();
  }

  const bar = (hp, max, col) => `<div class="ar-bar"><span style="width:${Math.max(0, hp / max * 100)}%;background:${col}"></span></div><div class="ar-hp">${hp} / ${max}</div>`;

  function renderBattle() {
    const host = document.getElementById('arBody');
    if (!S) return;
    host.innerHTML = `
      <div class="ar-field">
        <div class="ar-side"><div class="ar-ava" style="border-color:${S.color}">${S.emoji}</div><b>${esc(S.cname)}</b>${bar(S.pHp, S.pMax, S.color)}</div>
        <div class="ar-vs">VS</div>
        <div class="ar-side"><div class="ar-ava" style="border-color:#e6803a">${S.bemoji}</div><b>${esc(S.bname)}</b>${bar(S.bHp, S.bMax, '#e6803a')}</div>
      </div>
      ${S.over ? `<div class="ar-result ${S.over}">${S.over === 'win' ? '🏆 Victory!' : '💀 Defeated'}</div>
        <div class="ar-actions"><button class="btn primary" id="arAgain">Fight again</button></div>` :
        `<div class="ar-actions">
          <button class="btn primary" data-act="attack">⚔️ Attack</button>
          <button class="btn ghost" data-act="special" ${S.specialCd ? 'disabled' : ''}>🌟 Special${S.specialCd ? ' (' + S.specialCd + ')' : ''}</button>
          <button class="btn ghost" data-act="guard">🛡️ Guard</button>
          ${S.canHeal ? `<button class="btn ghost" data-act="heal" ${S.healCd ? 'disabled' : ''}>✨ Heal${S.healCd ? ' (' + S.healCd + ')' : ''}</button>` : ''}
        </div>`}
      <div class="ar-log">${S.log.slice(-7).reverse().map(l => `<div>${esc(l)}</div>`).join('')}</div>`;
    if (S.over) document.getElementById('arAgain').onclick = () => { S = null; renderSetup(); };
    else host.querySelectorAll('[data-act]').forEach(b => b.onclick = () => act(b.dataset.act));
  }

  function renderSetup() {
    const host = document.getElementById('arBody');
    const classes = Object.values(DATA.cs.classes);
    host.innerHTML = `
      <div class="ar-setup">
        <div><h3>Choose your class</h3><div class="ar-picks" id="arCls">${classes.map(c => `<button class="ar-pick" data-cls="${c.id}" style="--cc:${CLASS_COLOR[c.id]}">${CLASS_EMOJI[c.id]} ${esc(c.name)}</button>`).join('')}</div></div>
        <div><h3>Choose your foe</h3><select id="arBoss">${DATA.opps.map(o => `<option value="${o.id}">${esc(o.name)} — Lv ${o.level} · ${o.hp} HP</option>`).join('')}</select></div>
        <button class="btn primary ar-fight" id="arFight" disabled>Pick a class to fight</button>
      </div>`;
    let cls = null;
    host.querySelectorAll('.ar-pick').forEach(b => b.onclick = () => { cls = b.dataset.cls; host.querySelectorAll('.ar-pick').forEach(x => x.classList.toggle('on', x === b)); const f = document.getElementById('arFight'); f.disabled = false; f.textContent = '⚔️ Fight!'; });
    document.getElementById('arFight').onclick = () => { if (cls) start(cls, document.getElementById('arBoss').value); };
  }

  async function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Arena</span>
      <h1 class="reveal">Boss Battle ⚔️</h1>
      <p class="sub reveal">Pick a class, pick a foe, and duel it out — powered by the real class and creature stats. Time your Special, Guard the big hits, and survive.</p>
      <div id="arBody"><div class="spinner"></div></div>
      <p class="meta" style="margin-top:1rem">Damage is dramatized for a fun ~10-turn fight; the underlying HP, DPS and crit come straight from the guide data.</p>
    </div></section>`));
    if (!DATA) {
      const [cs, mf, bosses, mobs] = await Promise.all([loadJSON('classstats.json'), loadJSON('manifest.json'), loadJSON('bosses.json'), loadJSON('mobstats.json')]);
      const roles = {}; (mf.classes || []).forEach(c => roles[c.id] = { roles: c.roles });
      // build opponent list: real bosses (+ dps from mobstats) then a few elites
      const mobById = {}; (mobs.mobs || []).forEach(m => { mobById[m.id] = m; });
      const opps = (bosses.bosses || []).map(b => { const m = (mobs.mobs || []).find(x => x.name === b.name || x.id === b.id); return { id: b.id, name: b.name, level: b.level, hp: b.hp, emoji: (m && FAMILY_EMOJI[m.family]) || '👑' }; });
      (mobs.mobs || []).filter(m => (m.elite || m.rare) && !m.boss).slice(0, 12).forEach(m => opps.push({ id: m.id, name: m.name, level: m.level, hp: m.hp, emoji: FAMILY_EMOJI[m.family] || '🐾' }));
      DATA = { cs, roles, opps };
      const K = cs.constants; const offs = Object.values(cs.classes).map(c => classStats(c, K, cs.maxLevel).offense); avgOff = offs.reduce((a, b) => a + b, 0) / offs.length;
    }
    renderSetup();
  }
  registerView('arena', view);
})();
