'use strict';
// Claudecraft — Top-Down. #/world. A 2D top-down RPG built on the real world map:
// the actual zone bands, lakes, roads, towns, dungeons and NPCs, with the game's own
// creatures spawned at their true positions. Explore (WASD/arrows), fight (J/Space —
// ranged classes fire, melee swing), level up, take kill-quests from NPCs, heal in town.
(function () {
  const { el, esc, registerView, loadJSON, raw, app } = window.WOC;
  const CLASS_COLOR = { warrior: '#C79C6E', mage: '#69CCF0', rogue: '#FFF569', paladin: '#F58CBA', hunter: '#ABD473', priest: '#E7E7E7', shaman: '#3390DE', warlock: '#9482C9', druid: '#FF7D0A' };
  const CLASS_EMOJI = { warrior: '⚔️', mage: '🔮', rogue: '🗡️', paladin: '🛡️', hunter: '🏹', priest: '✨', shaman: '🌊', warlock: '😈', druid: '🐻' };
  const RANGED = new Set(['mage', 'hunter', 'warlock', 'priest']);
  const BIOME = { 'Eastbrook Vale': '#2f4326', 'Mirefen Marsh': '#2b3a2a', 'Thornpeak Heights': '#3c3340' };
  let CVW = 900, CVH = 520, S = 2.6, dpr = 1; // canvas logical size + zoom (world→px)
  const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const imgs = {}; let D = null, keys = {}, raf = 0, G = null, ac = null, muted = false;

  function layout() {
    const cv = document.getElementById('wCv'); if (!cv) return;
    const view = cv.parentElement;
    CVW = Math.round(view.clientWidth); CVH = Math.round(view.clientHeight);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = CVW * dpr; cv.height = CVH * dpr; cv.style.width = CVW + 'px'; cv.style.height = CVH + 'px';
    // Zelda-style zoom: keep the hero a healthy fraction of the shorter screen edge.
    S = Math.max(2.6, Math.min(4.6, Math.min(CVW, CVH) / 150));
  }

  const img = (u) => imgs[u] || (imgs[u] = Object.assign(new Image(), { src: u }));
  function beep(f, d, t) { if (muted) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = t || 'square'; o.frequency.value = f; g.gain.value = 0.05; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d); o.stop(ac.currentTime + d); } catch (e) {} }
  const SFX = { hit: () => beep(140, .18, 'sawtooth'), foe: () => beep(240, .12), shoot: () => beep(420, .09), level: () => { beep(523, .12); setTimeout(() => beep(784, .18), 120); }, quest: () => beep(660, .14, 'sine'), heal: () => beep(720, .14, 'sine') };

  const zoneAt = (z) => { for (const b of D.map.bands) if (z >= b.zMin && z < b.zMax) return b; return D.map.bands[D.map.bands.length - 1]; };
  const inLake = (x, z) => D.map.lakes.some(l => (x - l.x) ** 2 + (z - l.z) ** 2 < l.r * l.r);

  function playerStats(clsId, L) {
    const c = D.cs.classes[clsId], K = D.cs.constants;
    const s = {}; for (const k of ['str', 'agi', 'sta', 'int']) s[k] = (c.baseStats[k] || 0) + (c.statsPerLevel[k] || 0) * (L - 1);
    const hp = Math.round(c.baseHp + c.hpPerLevel * (L - 1) + Math.min(s.sta, K.staLowCap) * K.staHpLow + Math.max(0, s.sta - K.staLowCap) * K.staHpHigh);
    const ap = c.apRule === 'str2' ? s.str * 2 : c.apRule === 'stragi' ? s.str + s.agi : s.str;
    const dmg = Math.round(8 + L * 3 + (c.caster ? s.int * 0.4 : ap * 0.35));
    return { hp, dmg };
  }
  const xpNeed = (L) => L * 80;

  function spawnMobs() {
    const out = [];
    for (const m of D.best.mobs) {
      if (!m.mapXZ) continue;
      const ms = D.mobById[m.id] || {};
      out.push({ id: m.id, name: m.name, x: m.mapXZ[0], z: m.mapXZ[1], hx: m.mapXZ[0], hz: m.mapXZ[1], w: 26, h: 26,
        maxHp: Math.min(m.hp || 40, 260), hp: Math.min(m.hp || 40, 260), lvl: m.minLevel || 1, dps: ms.dps || (m.minLevel || 1),
        rank: m.rank, art: m.render ? img(raw(m.render)) : null, vx: 0, vz: 0, state: 'idle', wcd: 0, cd: 0, alive: true, family: m.family });
    }
    return out;
  }

  function start(clsId) {
    cancelAnimationFrame(raf);
    const town = D.map.markers.find(m => m.type === 'town') || { x: 0, z: 0 };
    const st = playerStats(clsId, 1);
    G = {
      clsId, ranged: RANGED.has(clsId), color: CLASS_COLOR[clsId], hero: img(raw(D.cs.render[clsId] || '')),
      p: { x: town.x, z: town.z + 20, w: 24, h: 30, face: 1, atk: 0, shootCd: 0, inv: 0 },
      L: 1, xp: 0, dmg: st.dmg, hp: st.hp, maxHp: st.hp, coins: 0,
      mobs: spawnMobs(), shots: [], quest: null, msg: '', msgT: 0, state: 'play',
    };
    loop();
  }

  function setMsg(t, frames) { G.msg = t; G.msgT = frames || 150; }
  function levelUp() { G.L++; G.xp = 0; const st = playerStats(G.clsId, G.L); G.dmg = st.dmg; G.maxHp = st.hp; G.hp = st.hp; SFX.level(); setMsg('⭐ Level ' + G.L + '!', 150); }

  function nearestNpc(range) { let best = null, bd = range * range; for (const m of D.map.markers) { if (m.type !== 'npc' && m.type !== 'town') continue; const d = (m.x - G.p.x) ** 2 + (m.z - G.p.z) ** 2; if (d < bd) { bd = d; best = m; } } return best; }

  function interact() {
    const t = D.map.markers.find(m => m.type === 'town' && (m.x - G.p.x) ** 2 + (m.z - G.p.z) ** 2 < (m.r + 10) ** 2);
    if (t) { G.hp = G.maxHp; SFX.heal(); setMsg('🏰 Rested at ' + (t.label || 'town') + ' — full health.'); return; }
    const npc = nearestNpc(28);
    if (!npc) return;
    if (!G.quest) {
      // assign a kill quest for this zone's mobs
      const band = zoneAt(G.p.z), pool = D.best.mobs.filter(m => m.zoneTitle === band.title && m.mapXZ && (m.rank || '').toLowerCase() !== 'boss');
      const target = pool[(Math.abs(Math.round(G.p.x)) + pool.length) % (pool.length || 1)] || { name: 'creatures', id: null };
      G.quest = { name: target.name, id: target.id, need: 4, have: 0, npc: npc.label || 'A villager' };
      SFX.quest(); setMsg('📜 Quest: slay 4 ' + target.name + '. Return when done.', 200);
    } else if (G.quest.have >= G.quest.need) {
      G.xp += 60 + G.L * 20; G.coins += 20; if (G.xp >= xpNeed(G.L)) levelUp(); else setMsg('✅ Quest complete! +' + (60 + G.L * 20) + ' XP, +20 🪙', 180);
      G.quest = null; SFX.quest();
    } else setMsg('📜 ' + G.quest.have + '/' + G.quest.need + ' ' + G.quest.name + ' slain.');
  }

  const AGGRO = 58, LEASH = 150; // small aggro radius + leash so mobs don't swarm the whole map
  function update() {
    const p = G.p;
    const townSafe = D.map.markers.some(m => m.type === 'town' && (m.x - p.x) ** 2 + (m.z - p.z) ** 2 < (m.r + 24) ** 2);
    let vx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
    let vz = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
    if (vx || vz) { const m = Math.hypot(vx, vz) || 1, spd = 2.6; const nx = p.x + vx / m * spd, nz = p.z + vz / m * spd; if (!inLake(nx, p.z)) p.x = nx; if (!inLake(p.x, nz)) p.z = nz; if (vx) p.face = Math.sign(vx); }
    const b = D.map.bounds; p.x = Math.max(b.minX + 4, Math.min(b.maxX - 4, p.x)); p.z = Math.max(b.minZ + 4, Math.min(b.maxZ - 4, p.z));
    if (p.atk > 0) p.atk--; if (p.inv > 0) p.inv--; if (p.shootCd > 0) p.shootCd--;
    if (G.msgT > 0) G.msgT--;
    // shoot
    if (G.ranged && (keys['j'] || keys[' ']) && p.shootCd <= 0) { G.shots.push({ x: p.x, z: p.z, vx: p.face * 6, alive: true, life: 90 }); p.shootCd = 16; SFX.shoot(); }
    G.shots = G.shots.filter(s => s.alive && s.life-- > 0); G.shots.forEach(s => s.x += s.vx);
    // mobs
    for (const mb of G.mobs) {
      if (!mb.alive) continue;
      const d2 = (mb.x - p.x) ** 2 + (mb.z - p.z) ** 2;
      const homeD2 = (mb.x - mb.hx) ** 2 + (mb.z - mb.hz) ** 2;
      if (!townSafe && d2 < AGGRO * AGGRO && homeD2 < LEASH * LEASH) {
        // chase the player
        mb.state = 'chase'; const a = Math.atan2(p.z - mb.z, p.x - mb.x), sp = 0.9 + mb.lvl * 0.02; mb.x += Math.cos(a) * sp; mb.z += Math.sin(a) * sp;
      } else if (mb.state === 'chase' && homeD2 > 16) {
        // leashed / lost aggro → walk back home
        const a = Math.atan2(mb.hz - mb.z, mb.hx - mb.x); mb.x += Math.cos(a) * 1.2; mb.z += Math.sin(a) * 1.2; if (homeD2 < 25) mb.state = 'idle';
      } else {
        mb.state = 'idle'; mb.wcd--; if (mb.wcd <= 0) { mb.vx = (Math.random() - .5) * 1.2; mb.vz = (Math.random() - .5) * 1.2; mb.wcd = 40 + Math.random() * 60; } const nx = mb.x + mb.vx, nz = mb.z + mb.vz; if (!inLake(nx, nz) && (nx - mb.hx) ** 2 + (nz - mb.hz) ** 2 < 70 * 70) { mb.x = nx; mb.z = nz; } else { mb.wcd = 0; }
      }
      // player melee / shots hit mob
      const melee = !G.ranged && p.atk > 0 && Math.abs(mb.x - (p.x + p.face * 20)) < 26 && Math.abs(mb.z - p.z) < 26;
      const shot = G.shots.find(s => s.alive && (s.x - mb.x) ** 2 + (s.z - mb.z) ** 2 < 20 * 20);
      if (melee || shot) { if (shot) shot.alive = false; mb.hp -= G.dmg; mb.state = 'chase'; if (mb.hp <= 0) killMob(mb); }
      else if (mb.alive && d2 < 20 * 20 && p.inv <= 0) { G.hp -= Math.max(1, Math.round(mb.dps * 0.6)); p.inv = 45; SFX.hit(); if (G.hp <= 0) return death(); }
    }
  }

  function killMob(mb) {
    mb.alive = false; SFX.foe(); G.coins += 1; G.xp += mb.lvl * 8 + 10;
    if (G.quest && (mb.id === G.quest.id || mb.name === G.quest.name) && G.quest.have < G.quest.need) { G.quest.have++; if (G.quest.have >= G.quest.need) setMsg('📜 Quest ready — return to ' + G.quest.npc + '.', 180); }
    if (G.xp >= xpNeed(G.L)) levelUp();
    setTimeout(() => { mb.hp = mb.maxHp; mb.x = mb.hx; mb.z = mb.hz; mb.alive = true; mb.state = 'idle'; }, 9000); // respawn
  }
  function death() { G.state = 'over'; }

  // ---- render ----
  function draw(ctx) {
    const p = G.p;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c1414'; ctx.fillRect(0, 0, CVW, CVH);
    ctx.save(); ctx.translate(CVW / 2, CVH / 2); ctx.scale(S, S); ctx.translate(-p.x, -p.z);
    // zone bands
    const b = D.map.bounds;
    for (const bd of D.map.bands) { ctx.fillStyle = BIOME[bd.title] || '#2f4326'; ctx.fillRect(b.minX, bd.zMin, b.maxX - b.minX, bd.zMax - bd.zMin); }
    // roads
    ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (const r of D.map.roads) { ctx.beginPath(); r.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke(); }
    // lakes
    for (const l of D.map.lakes) { ctx.fillStyle = '#26506a'; ctx.beginPath(); ctx.arc(l.x, l.z, l.r, 0, 7); ctx.fill(); ctx.strokeStyle = '#3a7290'; ctx.lineWidth = 2; ctx.stroke(); }
    // markers
    for (const m of D.map.markers) {
      if (m.type === 'town') { ctx.fillStyle = 'rgba(210,180,120,.5)'; ctx.beginPath(); ctx.arc(m.x, m.z, m.r || 22, 0, 7); ctx.fill(); }
      else if (m.type === 'camp') { ctx.fillStyle = '#7a3a2a'; ctx.fillRect(m.x - 3, m.z - 3, 6, 6); }
      else if (m.type === 'graveyard') { ctx.fillStyle = '#9aa'; ctx.fillRect(m.x - 1.5, m.z - 6, 3, 12); ctx.fillRect(m.x - 5, m.z - 2, 10, 3); }
    }
    // labels layer done after transform for crispness — collect towns/dungeons/npcs
    // mobs
    for (const mb of G.mobs) { if (!mb.alive) continue; drawSprite(ctx, mb.art, mb.x - mb.w / 2, mb.z - mb.h / 2, mb.w, mb.h, mb.rank === 'Boss' ? '#e6803a' : '#b05040'); if (mb.hp < mb.maxHp) { ctx.fillStyle = '#000'; ctx.fillRect(mb.x - 14, mb.z - mb.h / 2 - 8, 28, 4); ctx.fillStyle = '#e06666'; ctx.fillRect(mb.x - 14, mb.z - mb.h / 2 - 8, 28 * mb.hp / mb.maxHp, 4); } }
    // shots
    ctx.fillStyle = '#ffe08a'; for (const s of G.shots) { ctx.beginPath(); ctx.arc(s.x, s.z, 4, 0, 7); ctx.fill(); }
    // player
    ctx.save(); if (p.inv > 0 && Math.floor(p.inv / 4) % 2) ctx.globalAlpha = .5;
    ctx.translate(p.x, p.z); if (p.face < 0) ctx.scale(-1, 1);
    drawSprite(ctx, G.hero, -p.w / 2, -p.h / 2 - 6, p.w, p.h + 6, G.color); ctx.restore();
    if (p.atk > 0 && !G.ranged) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x + p.face * 16, p.z, 20, -1, 1); ctx.stroke(); }
    ctx.restore();
    // labels (screen space)
    ctx.textAlign = 'center'; ctx.font = '600 12px system-ui';
    for (const m of D.map.markers) {
      if (!m.label) continue; if (m.type === 'camp' || m.type === 'poi') continue;
      const sx = CVW / 2 + (m.x - p.x) * S, sy = CVH / 2 + (m.z - p.z) * S;
      if (sx < -40 || sx > CVW + 40 || sy < -20 || sy > CVH + 20) continue;
      ctx.fillStyle = m.type === 'town' ? '#e8c86a' : m.type === 'dungeon' ? '#d07a5a' : m.type === 'npc' ? '#8fd0ff' : m.type === 'graveyard' ? '#cfd3da' : '#bbb';
      const ico = m.type === 'town' ? '🏰' : m.type === 'dungeon' ? '🚪' : m.type === 'npc' ? '❗' : m.type === 'graveyard' ? '⚰️' : '•';
      ctx.fillText(ico, sx, sy - 4); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '11px system-ui'; ctx.fillText(m.label, sx, sy + 12); ctx.font = '600 12px system-ui';
    }
    // HUD
    hud(ctx);
    // interact hint
    const npc = nearestNpc(28) || D.map.markers.find(m => m.type === 'town' && (m.x - p.x) ** 2 + (m.z - p.z) ** 2 < (m.r + 10) ** 2);
    if (npc) { ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '600 13px system-ui'; ctx.fillText('Press E', CVW / 2, CVH / 2 - 34); }
    if (G.msgT > 0) { ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(CVW / 2 - 200, 44, 400, 26); ctx.fillStyle = '#fff'; ctx.font = '600 14px system-ui'; ctx.fillText(G.msg, CVW / 2, 62); }
  }
  function hud(ctx) {
    ctx.textAlign = 'left';
    // hp bar
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(12, 12, 180, 16); ctx.fillStyle = '#e0555a'; ctx.fillRect(12, 12, 180 * Math.max(0, G.hp) / G.maxHp, 16);
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.strokeRect(12, 12, 180, 16); ctx.fillStyle = '#fff'; ctx.font = '600 12px system-ui'; ctx.fillText(Math.max(0, G.hp) + '/' + G.maxHp, 18, 24);
    // xp bar
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(12, 32, 180, 8); ctx.fillStyle = '#5aa0e0'; ctx.fillRect(12, 32, 180 * G.xp / xpNeed(G.L), 8);
    ctx.fillStyle = '#fff'; ctx.font = '600 14px system-ui'; ctx.fillText('Lv ' + G.L + ' ' + (D.cs.classes[G.clsId].name), 200, 24);
    ctx.textAlign = 'right'; ctx.fillStyle = '#e8c86a'; ctx.fillText('🪙 ' + G.coins, CVW - 12, 24);
    ctx.textAlign = 'left'; ctx.fillStyle = '#cfd3da'; ctx.font = '600 13px system-ui'; ctx.fillText('📍 ' + zoneAt(G.p.z).title, 200, 40);
    if (G.quest) { ctx.textAlign = 'right'; ctx.fillStyle = G.quest.have >= G.quest.need ? '#4ec77e' : '#fff'; ctx.font = '600 13px system-ui'; ctx.fillText('📜 ' + G.quest.have + '/' + G.quest.need + ' ' + G.quest.name, CVW - 12, 42); }
    // minimap
    const mm = { x: CVW - 118, y: CVH - 150, w: 106, h: 138 }, b = D.map.bounds, sx = mm.w / (b.maxX - b.minX), sz = mm.h / (b.maxZ - b.minZ);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(mm.x, mm.y, mm.w, mm.h);
    for (const bd of D.map.bands) { ctx.fillStyle = BIOME[bd.title] || '#2f4326'; ctx.fillRect(mm.x, mm.y + (bd.zMin - b.minZ) * sz, mm.w, (bd.zMax - bd.zMin) * sz); }
    for (const m of D.map.markers) if (m.type === 'town') { ctx.fillStyle = '#e8c86a'; ctx.fillRect(mm.x + (m.x - b.minX) * sx - 1, mm.y + (m.z - b.minZ) * sz - 1, 3, 3); }
    ctx.fillStyle = '#fff'; ctx.fillRect(mm.x + (G.p.x - b.minX) * sx - 2, mm.y + (G.p.z - b.minZ) * sz - 2, 4, 4);
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.strokeRect(mm.x, mm.y, mm.w, mm.h);
  }
  function drawSprite(ctx, im, x, y, w, h, col) { if (im && im.complete && im.naturalWidth) ctx.drawImage(im, x, y, w, h); else { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w / 2, 0, 7); ctx.fill(); } }

  function loop() {
    const cv = document.getElementById('wCv'); if (!cv || !document.body.contains(cv)) { cancelAnimationFrame(raf); return; }
    if (G.state === 'play') update();
    draw(cv.getContext('2d'));
    if (G.state !== 'play') return overlay();
    raf = requestAnimationFrame(loop);
  }
  function overlay() {
    const host = document.getElementById('wOver');
    host.innerHTML = `<div class="play-over"><div class="play-msg" style="color:#e06666">💀 You have fallen</div><div class="meta">Level ${G.L} · 🪙 ${G.coins} · ${esc(zoneAt(G.p.z).title)}</div><button class="btn primary" id="wAgain">Respawn in town</button></div>`;
    host.style.display = 'flex';
    document.getElementById('wAgain').onclick = () => { host.style.display = 'none'; const t = D.map.markers.find(m => m.type === 'town'); G.p.x = t.x; G.p.z = t.z + 20; G.hp = G.maxHp; G.p.inv = 60; G.state = 'play'; loop(); };
  }

  function wireTouch() {
    document.querySelectorAll('.gp').forEach(bt => {
      const k = bt.dataset.k;
      const on = e => { e.preventDefault(); keys[k] = true; if (k === 'j') attack(); if (k === 'e') interact(); };
      const off = e => { e.preventDefault(); keys[k] = false; };
      bt.addEventListener('pointerdown', on); bt.addEventListener('pointerup', off);
      bt.addEventListener('pointerleave', off); bt.addEventListener('pointercancel', off);
    });
  }
  function attack() { if (G && G.state === 'play' && !G.ranged && G.p.atk <= 0) { G.p.atk = 12; SFX.shoot(); } }
  function onKey(e, down) {
    // Global session-long listener: only act while the game canvas is on screen and
    // no text field is focused, or it would swallow WASD/space/J/E out of inputs
    // like the "Ask the Guide" box everywhere on the site.
    const t = e.target;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    if (!G || !document.getElementById('wCv')) return;
    const k = e.key.toLowerCase();
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'j', 'e'].includes(k)) e.preventDefault();
    keys[k] = down;
    if (down && (k === 'j' || k === ' ')) attack();
    if (down && k === 'e') interact();
  }

  function setup() {
    const host = document.getElementById('wBody'), classes = Object.values(D.cs.classes);
    host.innerHTML = `<div class="ar-setup"><h3>Choose your hero</h3><div class="ar-picks">${classes.map(c => `<button class="ar-pick" data-cls="${c.id}" style="--cc:${CLASS_COLOR[c.id]}">${CLASS_EMOJI[c.id]} ${esc(c.name)}${RANGED.has(c.id) ? ' 🏹' : ' ⚔️'}</button>`).join('')}</div>
      <p class="meta"><b>WASD</b>/<b>arrows</b> walk · <b>J/Space</b> attack (ranged 🏹 fire · melee ⚔️ swing) · <b>E</b> talk to ❗NPCs &amp; rest in 🏰 towns. Roam the real world of Claudecraft, level up, and clear kill-quests.</p></div>`;
    host.querySelectorAll('.ar-pick').forEach(b => b.onclick = () => {
      host.innerHTML = `<div class="gm ${touch ? 'gm-mobile' : ''}">
        <div class="gm-view">
          <canvas id="wCv" class="gm-cv"></canvas>
          <div id="wOver" class="play-overlay"></div>
          <button class="gm-corner gm-exit" id="wExit" title="Exit">✕</button>
          <button class="gm-corner gm-mute" id="wMute" title="Sound">🔊</button>
        </div>
        ${touch ? `<div class="gm-pad">
          <div class="gm-dpad">
            <button class="gp gp-up" data-k="arrowup">▲</button>
            <button class="gp gp-left" data-k="arrowleft">◀</button>
            <button class="gp gp-right" data-k="arrowright">▶</button>
            <button class="gp gp-down" data-k="arrowdown">▼</button>
          </div>
          <div class="gm-acts">
            <button class="gp gp-b" data-k="e">💬</button>
            <button class="gp gp-a" data-k="j">⚔️</button>
          </div></div>` : ''}
      </div>`;
      layout(); wireTouch();
      document.getElementById('wMute').onclick = (e) => { muted = !muted; e.currentTarget.textContent = muted ? '🔇' : '🔊'; };
      document.getElementById('wExit').onclick = () => { cancelAnimationFrame(raf); G = null; setup(); };
      start(b.dataset.cls);
    });
  }

  async function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Top-down RPG</span>
      <h1 class="reveal">Claudecraft — Top-Down 🗺️</h1>
      <p class="sub reveal">The whole world of Claudecraft as a playable 2D RPG — real zones, towns, roads and creatures. Explore, fight, quest and level up.</p>
      <div id="wBody"><div class="spinner"></div></div>
    </div></section>`));
    if (!D) {
      const [cs, mf, mob, map, best] = await Promise.all([
        loadJSON('classstats.json'), loadJSON('manifest.json'), loadJSON('mobstats.json'), loadJSON('world-map.json'),
        loadJSON('bestiary/bestiary.json', { raw: true }).catch(() => ({ mobs: [] })),
      ]);
      cs.render = {}; (mf.classes || []).forEach(c => cs.render[c.id] = c.render);
      const mobById = {}; (mob.mobs || []).forEach(m => mobById[m.id] = m);
      D = { cs, map, best, mobById };
    }
    setup();
  }
  addEventListener('keydown', e => onKey(e, true));
  addEventListener('keyup', e => onKey(e, false));
  addEventListener('resize', layout);
  addEventListener('orientationchange', () => setTimeout(layout, 250));
  registerView('world', view);
})();
