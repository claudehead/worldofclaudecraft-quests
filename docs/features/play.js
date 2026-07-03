'use strict';
// Claudecraft Runner — #/play. A full side-scrolling action platformer.
// Move ←→/AD · jump + double-jump Space/↑ · attack J/X (melee classes swing, ranged
// classes fire) · dash Shift · stomp foes from above. Clear each themed zone by
// beating its boss. Lives, checkpoints, coins, score + saved high score, sound, and
// on-screen touch controls. Canvas + rAF, hero = class render, enemies = mob art.
(function () {
  const { el, esc, registerView, loadJSON, raw, app } = window.WOC;
  const CLASS_COLOR = { warrior: '#C79C6E', mage: '#69CCF0', rogue: '#FFF569', paladin: '#F58CBA', hunter: '#ABD473', priest: '#E7E7E7', shaman: '#3390DE', warlock: '#9482C9', druid: '#FF7D0A' };
  const CLASS_EMOJI = { warrior: '⚔️', mage: '🔮', rogue: '🗡️', paladin: '🏹', hunter: '🏹', priest: '✨', shaman: '🌊', warlock: '😈', druid: '🐻' };
  const RANGED = new Set(['mage', 'hunter', 'warlock', 'priest']);
  const MOB_ART = ['forest_wolf', 'webwood_spider', 'wild_boar', 'mudfin_murloc', 'bristleback_boar', 'thornpeak_stalker', 'bloodfen_raptor'];
  const ZONES = [
    { name: 'Eastbrook Vale', sky: ['#1a2740', '#0c1020'], hill: 'rgba(90,120,90,.28)', ground: '#3a4d2e', top: '#5a7a3e', boss: '🐺 Gorrak the Ruthless' },
    { name: 'Mirefen Marsh', sky: ['#1c2a2a', '#0a1414'], hill: 'rgba(80,110,90,.28)', ground: '#33442e', top: '#4e6a3c', boss: '🐸 The Bog King' },
    { name: 'Thornpeak Heights', sky: ['#2a2438', '#100c1a'], hill: 'rgba(110,90,120,.28)', ground: '#4a3d4e', top: '#6a5a72', boss: '🐉 Ashmaw the Wyrm' },
  ];
  const W = 900, H = 460, GROUND = 380, G = 0.62, MOVE = 4.2, JUMP = -12.2;
  const imgs = {}; let CS = null, keys = {}, raf = 0, G_ = null, ac = null, muted = false;
  const BEST = () => { try { return JSON.parse(localStorage.getItem('wc_runner_best')) || { score: 0, zone: 0 }; } catch (e) { return { score: 0, zone: 0 }; } };

  function img(url) { if (imgs[url]) return imgs[url]; const im = new Image(); im.src = url; imgs[url] = im; return im; }
  function beep(f, d, type) { if (muted) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'square'; o.frequency.value = f; g.gain.value = 0.05; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d); o.stop(ac.currentTime + d); } catch (e) {} }
  const S = { jump: () => beep(520, 0.12), djump: () => beep(680, 0.12), coin: () => beep(880, 0.08, 'sine'), hit: () => beep(140, 0.2, 'sawtooth'), shoot: () => beep(400, 0.1), foe: () => beep(220, 0.15), heal: () => beep(760, 0.15, 'sine'), win: () => { beep(523, 0.12); setTimeout(() => beep(784, 0.2), 130); } };

  function buildLevel(zi) {
    const z = ZONES[zi], plats = [], coins = [], foes = [], spikes = [], powers = [], checks = [];
    let x = 0; const segs = 12 + zi * 3, diff = 1 + zi * 0.5;
    plats.push({ x: 0, y: GROUND, w: 600, h: 120 }); x = 600;
    for (let i = 0; i < segs; i++) {
      const gap = 80 + ((zi * 13 + i * 17) % 80);
      x += gap;
      const w = 230 + ((i * 29) % 200), y = GROUND - (((i * 7) % 3) * 46);
      plats.push({ x, y, w, h: GROUND + 120 - y });
      if (i % 2 === 0) { const fx = x + 50 + (i % 3) * 40, fy = y - 118; plats.push({ x: fx, y: fy, w: 120, h: 18, float: true }); for (let c = 0; c < 3; c++) coins.push({ x: fx + 20 + c * 36, y: fy - 34, got: false }); }
      for (let c = 0; c < 3; c++) coins.push({ x: x - gap + 20 + c * (gap / 3), y: y - 66 - (c === 1 ? 24 : 0), got: false });
      // enemies — varied
      if (i > 0) {
        const roll = (i * 7 + zi * 3) % 10, art = img(raw('quests/zones/_mob-renders/' + MOB_ART[(i + zi) % MOB_ART.length] + '.png'));
        if (roll < 4) foes.push({ t: 'walk', x: x + w * 0.5, y: y - 40, w: 40, h: 40, x0: x + 30, x1: x + w - 30, vx: (i % 2 ? 1 : -1) * (1 + diff * 0.4), hp: 1, alive: true, art });
        else if (roll < 6) foes.push({ t: 'fly', x: x + w * 0.5, y: y - 130, w: 38, h: 38, bx: x + w * 0.5, ph: i, vx: (i % 2 ? 1 : -1) * 1.4, hp: 1, alive: true, art });
        else if (roll < 8) foes.push({ t: 'charge', x: x + w * 0.5, y: y - 40, w: 42, h: 42, home: x + w * 0.5, vx: 0, hp: 1, alive: true, art });
        else foes.push({ t: 'shoot', x: x + w * 0.6, y: y - 42, w: 40, h: 42, cd: 60, hp: 1, alive: true, art });
      }
      if (i % 3 === 1) spikes.push({ x: x + w - 40, y: y - 16, w: 34, h: 16 });
      if (i % 4 === 2) powers.push({ x: x + w * 0.4, y: y - 40, type: 'heal', got: false });
      if (i % 5 === 3) checks.push({ x: x + 40, y: y - 60, hit: false });
      x += w;
    }
    // boss arena
    plats.push({ x: x, y: GROUND, w: 700, h: 120 });
    const boss = { x: x + 480, y: GROUND - 90, w: 90, h: 90, hp: 6 + zi * 2, maxHp: 6 + zi * 2, vx: -1.4 - zi * 0.3, cd: 90, alive: true, dir: -1, art: img(raw('quests/zones/_mob-renders/' + MOB_ART[zi] + '.png')) };
    return { z, plats, coins, foes, spikes, powers, checks, boss, gate: x, end: x + 700 };
  }

  function start(clsId, zi, carry) {
    cancelAnimationFrame(raf);
    const lvl = buildLevel(zi || 0);
    G_ = {
      clsId, zi: zi || 0, ranged: RANGED.has(clsId), color: CLASS_COLOR[clsId], hero: img(raw((CS.render[clsId]) || '')),
      p: { x: 60, y: GROUND - 48, w: 34, h: 46, vx: 0, vy: 0, ground: false, jumps: 0, face: 1, atk: 0, shootCd: 0, inv: 0, dash: 0, dashCd: 0 },
      lvl, cam: 0, hp: (carry && carry.hp) || 4, maxHp: 4, coins: (carry && carry.coins) || 0, lives: carry ? carry.lives : 3,
      score: (carry && carry.score) || 0, checkX: 60, bossOn: false, shots: [], eshots: [], parts: [], state: 'play',
    };
    loop();
  }

  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function hurt(g, dmg, knockDir) { if (g.p.inv > 0) return; g.hp -= dmg; g.p.inv = 70; g.p.vy = -7; g.p.x -= knockDir * 26; S.hit(); if (g.hp <= 0) death(g); }
  function death(g) {
    g.lives--; if (g.lives < 0) { g.state = 'over'; save(g); return; }
    g.hp = g.maxHp; g.p.x = g.checkX; g.p.y = 0; g.p.vy = 0; g.p.inv = 80; g.eshots = [];
  }
  function save(g) { const b = BEST(); if (g.score > b.score || g.zi > b.zone) { try { localStorage.setItem('wc_runner_best', JSON.stringify({ score: Math.max(g.score, b.score), zone: Math.max(g.zi, b.zone) })); } catch (e) {} } }

  function update() {
    const g = G_, p = g.p, L = g.lvl;
    const left = keys['arrowleft'] || keys['a'], right = keys['arrowright'] || keys['d'];
    let spd = MOVE + (p.dash > 0 ? 4 : 0);
    p.vx = left ? -spd : right ? spd : 0; if (left) p.face = -1; if (right) p.face = 1;
    if (keys['shift'] && p.dashCd <= 0 && (left || right)) { p.dash = 12; p.dashCd = 45; }
    if (p.dash > 0) p.dash--; if (p.dashCd > 0) p.dashCd--;
    p.vy += G; p.x += p.vx;
    for (const pl of L.plats) if (hit(p, pl)) { if (p.vx > 0) p.x = pl.x - p.w; else if (p.vx < 0) p.x = pl.x + pl.w; }
    p.y += p.vy; p.ground = false;
    for (const pl of L.plats) if (hit(p, pl)) { if (p.vy > 0) { p.y = pl.y - p.h; p.vy = 0; p.ground = true; p.jumps = 0; } else if (p.vy < 0) { p.y = pl.y + pl.h; p.vy = 0; } }
    if (p.x < 0) p.x = 0;
    if (p.atk > 0) p.atk--; if (p.inv > 0) p.inv--; if (p.shootCd > 0) p.shootCd--;
    if (p.y > H + 80) { hurt(g, 1, 0); if (g.state !== 'play') return; p.x = Math.max(g.checkX, p.x - 100); p.y = 0; p.vy = 0; }
    // coins / powerups / checkpoints
    for (const c of L.coins) if (!c.got && Math.abs(p.x + p.w / 2 - c.x) < 24 && Math.abs(p.y + p.h / 2 - c.y) < 24) { c.got = true; g.coins++; g.score += 10; S.coin(); }
    for (const pw of L.powers) if (!pw.got && hit(p, { x: pw.x - 16, y: pw.y - 16, w: 32, h: 32 })) { pw.got = true; if (g.hp < g.maxHp) g.hp++; g.score += 25; S.heal(); }
    for (const ck of L.checks) if (!ck.hit && Math.abs(p.x - ck.x) < 30) { ck.hit = true; g.checkX = ck.x; }
    for (const s of L.spikes) if (hit(p, s)) hurt(g, 1, p.vx >= 0 ? 1 : -1);
    // player shots
    if (g.ranged && (keys['j'] || keys['x']) && p.shootCd <= 0) { g.shots.push({ x: p.x + p.w / 2, y: p.y + p.h / 2, vx: p.face * 8, alive: true }); p.shootCd = 18; S.shoot(); }
    g.shots = g.shots.filter(s => s.alive); g.shots.forEach(s => { s.x += s.vx; if (Math.abs(s.x - p.x) > W) s.alive = false; });
    g.eshots = g.eshots.filter(s => s.alive); g.eshots.forEach(s => { s.x += s.vx; if (hit(p, { x: s.x - 6, y: s.y - 6, w: 12, h: 12 })) { s.alive = false; hurt(g, 1, s.vx > 0 ? 1 : -1); } if (Math.abs(s.x - p.x) > W) s.alive = false; });
    // foes
    for (const f of L.foes) {
      if (!f.alive) continue;
      if (f.t === 'walk') { f.x += f.vx; if (f.x < f.x0 || f.x > f.x1) f.vx *= -1; }
      else if (f.t === 'fly') { f.ph += 0.03; f.y = (GROUND - 130) + Math.sin(f.ph) * 40; f.x += f.vx; if (Math.abs(f.x - f.bx) > 160) f.vx *= -1; }
      else if (f.t === 'charge') { const d = p.x - f.x; if (Math.abs(d) < 260 && Math.abs(p.y - f.y) < 80) f.vx = Math.sign(d) * 3.4; else f.vx *= 0.9; f.x += f.vx; }
      else if (f.t === 'shoot') { f.cd--; if (f.cd <= 0 && Math.abs(f.x - p.x) < 420) { g.eshots.push({ x: f.x, y: f.y + 10, vx: Math.sign(p.x - f.x) * 4, alive: true }); f.cd = 90; } }
      // player hits foe
      const stomp = p.vy > 0 && (p.y + p.h) - f.y < 26 && hit(p, f);
      const swing = !g.ranged && p.atk > 0 && Math.abs(p.x + p.w / 2 - (f.x + f.w / 2)) < 50 && Math.abs(p.y - f.y) < 60;
      const shotHit = g.shots.find(s => s.alive && hit({ x: s.x - 6, y: s.y - 6, w: 12, h: 12 }, f));
      if (stomp || swing || shotHit) { f.alive = false; if (shotHit) shotHit.alive = false; g.score += 30; g.coins++; if (stomp) p.vy = JUMP * 0.6; S.foe(); }
      else if (hit(p, f)) hurt(g, 1, f.x < p.x ? -1 : 1);
      if (g.state !== 'play') return;
    }
    // boss (activates past the gate)
    const b = L.boss;
    if (p.x > L.gate - W * 0.5) g.bossOn = true;
    if (g.bossOn && b.alive) {
      b.x += b.vx; if (b.x < L.gate + 60 || b.x > L.end - 120) b.vx *= -1; b.dir = Math.sign(b.vx) || b.dir;
      b.cd--; if (b.cd <= 0) { g.eshots.push({ x: b.x, y: b.y + 30, vx: Math.sign(p.x - b.x) * 4.4, alive: true }); b.cd = 70 - g.zi * 8; }
      const stomp = p.vy > 0 && (p.y + p.h) - b.y < 34 && hit(p, b);
      const swing = !g.ranged && p.atk > 0 && hit({ x: p.x - 20, y: p.y - 10, w: p.w + 40, h: p.h + 20 }, b);
      const shotHit = g.shots.find(s => s.alive && hit({ x: s.x - 6, y: s.y - 6, w: 12, h: 12 }, b));
      if ((stomp || swing || shotHit) && b.iframe !== true) { b.hp--; b.iframe = true; setTimeout(() => b.iframe = false, 300); if (shotHit) shotHit.alive = false; if (stomp) p.vy = JUMP * 0.7; S.foe(); g.score += 20; if (b.hp <= 0) { b.alive = false; g.score += 200; return levelClear(); } }
      else if (hit(p, b)) hurt(g, 1, b.x < p.x ? -1 : 1);
    }
    g.cam = Math.max(0, Math.min(L.end - W, p.x - W * 0.4));
  }

  function levelClear() {
    const g = G_; S.win(); save(g);
    if (g.zi >= ZONES.length - 1) { g.state = 'win'; return; }
    g.state = 'clear';
  }

  function draw(ctx) {
    const g = G_, cam = g.cam, z = g.lvl.z;
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, z.sky[0]); sky.addColorStop(1, z.sky[1]); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = z.hill; for (let i = 0; i < 8; i++) { const hx = ((i * 300 - cam * 0.4) % (W + 300)) - 150; ctx.beginPath(); ctx.arc(hx, GROUND, 160, Math.PI, 0); ctx.fill(); }
    ctx.save(); ctx.translate(-cam, 0);
    for (const pl of g.lvl.plats) { ctx.fillStyle = pl.float ? '#6a5a3a' : z.ground; rr(ctx, pl.x, pl.y, pl.w, pl.h, pl.float ? 6 : 0); ctx.fill(); ctx.fillStyle = pl.float ? '#8a7550' : z.top; ctx.fillRect(pl.x, pl.y, pl.w, 6); }
    ctx.fillStyle = '#b8b8c0'; for (const s of g.lvl.spikes) for (let i = 0; i < s.w; i += 10) { ctx.beginPath(); ctx.moveTo(s.x + i, s.y + s.h); ctx.lineTo(s.x + i + 5, s.y); ctx.lineTo(s.x + i + 10, s.y + s.h); ctx.fill(); }
    for (const c of g.lvl.coins) if (!c.got) { ctx.fillStyle = '#e8c86a'; ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, 7); ctx.fill(); ctx.strokeStyle = '#b8963a'; ctx.stroke(); }
    for (const pw of g.lvl.powers) if (!pw.got) { ctx.font = '26px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🧪', pw.x, pw.y + 8); }
    for (const ck of g.lvl.checks) { ctx.fillStyle = ck.hit ? '#4ec77e' : '#888'; ctx.fillRect(ck.x - 2, ck.y - 30, 4, 40); ctx.beginPath(); ctx.moveTo(ck.x + 2, ck.y - 30); ctx.lineTo(ck.x + 20, ck.y - 24); ctx.lineTo(ck.x + 2, ck.y - 18); ctx.fill(); }
    // shots
    ctx.fillStyle = '#ffe08a'; for (const s of g.shots) { ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#e06666'; for (const s of g.eshots) { ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, 7); ctx.fill(); }
    // foes
    for (const f of g.lvl.foes) { if (!f.alive) continue; drawSprite(ctx, f.art, f.x, f.y, f.w, f.h, '#c0504d'); }
    // boss
    const b = g.lvl.boss; if (g.bossOn && b.alive) { drawSprite(ctx, b.art, b.x, b.y, b.w, b.h, '#e6803a'); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(b.x - 5, b.y - 16, b.w + 10, 7); ctx.fillStyle = '#e06666'; ctx.fillRect(b.x - 5, b.y - 16, (b.w + 10) * b.hp / b.maxHp, 7); }
    // hero
    const p = g.p; ctx.save(); if (p.inv > 0 && Math.floor(p.inv / 5) % 2) ctx.globalAlpha = 0.5;
    if (p.face < 0) { ctx.translate(p.x + p.w, 0); ctx.scale(-1, 1); ctx.translate(-p.x, 0); }
    drawSprite(ctx, g.hero, p.x - 8, p.y - 12, p.w + 16, p.h + 14, g.color, true);
    ctx.restore();
    if (p.atk > 0 && !g.ranged) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(p.x + p.w / 2 + p.face * 24, p.y + p.h / 2, 28, -1, 1); ctx.stroke(); }
    ctx.restore();
    // HUD
    ctx.fillStyle = '#fff'; ctx.font = '600 18px system-ui'; ctx.textAlign = 'left';
    ctx.fillText('❤'.repeat(Math.max(0, g.hp)) + '  ✖' + g.lives, 16, 26);
    ctx.font = '600 14px system-ui'; ctx.fillStyle = '#cfd3da'; ctx.fillText(z.name, 16, 46);
    ctx.textAlign = 'right'; ctx.fillStyle = '#e8c86a'; ctx.font = '600 18px system-ui'; ctx.fillText('🪙 ' + g.coins + '   ' + g.score, W - 16, 26);
    if (g.bossOn && b.alive) { ctx.textAlign = 'center'; ctx.fillStyle = '#e6803a'; ctx.font = '700 16px Georgia,serif'; ctx.fillText(z.boss, W / 2, 26); }
  }
  function drawSprite(ctx, im, x, y, w, h, col, tall) { if (im && im.complete && im.naturalWidth) ctx.drawImage(im, x, y, w, h); else { ctx.fillStyle = col; rr(ctx, x, y, w, h, 6); ctx.fill(); } }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function loop() {
    const cv = document.getElementById('playCv');
    if (!cv || !document.body.contains(cv)) { cancelAnimationFrame(raf); return; }
    if (G_.state === 'play') update();
    draw(cv.getContext('2d'));
    if (G_.state !== 'play') return overlay(G_.state);
    raf = requestAnimationFrame(loop);
  }

  function overlay(state) {
    const host = document.getElementById('playOver'), g = G_, b = BEST();
    let body;
    if (state === 'clear') body = `<div class="play-msg" style="color:#e8c86a">🏆 ${esc(g.lvl.z.name)} cleared!</div><div class="meta">Score ${g.score} · 🪙 ${g.coins} · ✖${g.lives} lives</div><button class="btn primary" id="playNext">Next zone →</button>`;
    else if (state === 'win') body = `<div class="play-msg" style="color:#e8c86a">👑 You conquered Claudecraft!</div><div class="meta">Final score ${g.score} · best ${Math.max(g.score, b.score)}</div><button class="btn primary" id="playAgain">Play again</button>`;
    else body = `<div class="play-msg" style="color:#e06666">💀 Game over</div><div class="meta">Score ${g.score} · reached ${esc(ZONES[g.zi].name)} · best ${Math.max(g.score, b.score)}</div><button class="btn primary" id="playAgain">Try again</button>`;
    host.innerHTML = `<div class="play-over">${body}</div>`; host.style.display = 'flex';
    const nx = document.getElementById('playNext'); if (nx) nx.onclick = () => { host.style.display = 'none'; start(g.clsId, g.zi + 1, { hp: g.hp, coins: g.coins, lives: g.lives, score: g.score }); };
    const ag = document.getElementById('playAgain'); if (ag) ag.onclick = () => { host.style.display = 'none'; setup(); };
  }

  function jump() { const p = G_ && G_.p; if (!p || G_.state !== 'play') return; if (p.ground || p.jumps < 2) { p.vy = JUMP; p.jumps = p.ground ? 1 : p.jumps + 1; p.ground = false; p.jumps === 1 ? S.jump() : S.djump(); } }
  function attack() { const g = G_; if (g && g.state === 'play' && !g.ranged && g.p.atk <= 0) { g.p.atk = 12; } }

  function setup() {
    const host = document.getElementById('playBody'), b = BEST();
    const classes = Object.values(CS.classes);
    host.innerHTML = `<div class="ar-setup"><h3>Choose your hero</h3><div class="ar-picks">${classes.map(c => `<button class="ar-pick" data-cls="${c.id}" style="--cc:${CLASS_COLOR[c.id]}">${CLASS_EMOJI[c.id]} ${esc(c.name)}${RANGED.has(c.id) ? ' 🏹' : ' ⚔️'}</button>`).join('')}</div>
      <p class="meta"><b>← →</b>/<b>A D</b> move · <b>Space/↑</b> jump (again = double-jump) · <b>Shift</b> dash · <b>J/X</b> ${'attack'} — ranged heroes 🏹 fire, melee ⚔️ swing; stomp from above. Clear 3 zones, each ends with a boss.</p>
      ${b.score ? `<p class="meta">🏆 Best score: <b>${b.score}</b> · furthest: <b>${esc(ZONES[Math.min(b.zone, ZONES.length - 1)].name)}</b></p>` : ''}</div>`;
    host.querySelectorAll('.ar-pick').forEach(bt => bt.onclick = () => {
      host.innerHTML = `<div class="play-wrap"><canvas id="playCv" width="${W}" height="${H}" class="play-cv"></canvas><div id="playOver" class="play-overlay"></div>${touchControls()}</div>
        <div class="play-foot"><button class="btn ghost" id="playMute">${muted ? '🔇 Muted' : '🔊 Sound'}</button></div>`;
      wireTouch(); document.getElementById('playMute').onclick = (e) => { muted = !muted; e.target.textContent = muted ? '🔇 Muted' : '🔊 Sound'; };
      start(bt.dataset.cls, 0);
    });
  }
  const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  function touchControls() { if (!touch) return ''; return `<div class="play-touch"><button class="tc" data-k="arrowleft">◀</button><button class="tc" data-k="arrowright">▶</button><span class="tc-sp"></span><button class="tc" data-k="j">✦</button><button class="tc tc-jump" data-k=" ">⤒</button></div>`; }
  function wireTouch() { document.querySelectorAll('.tc').forEach(bt => { const k = bt.dataset.k; const on = e => { e.preventDefault(); keys[k] = true; if (k === ' ') jump(); if (k === 'j') attack(); }; const off = e => { e.preventDefault(); keys[k] = false; }; bt.addEventListener('pointerdown', on); bt.addEventListener('pointerup', off); bt.addEventListener('pointerleave', off); bt.addEventListener('pointercancel', off); }); }

  function onKey(e, down) {
    const k = e.key.toLowerCase();
    if ([' ', 'arrowup', 'w', 'arrowdown', 'arrowleft', 'arrowright', 'a', 'd', 's', 'j', 'x', 'shift'].includes(k)) e.preventDefault();
    keys[k] = down;
    if (down && (k === ' ' || k === 'arrowup' || k === 'w')) jump();
    if (down && (k === 'j' || k === 'x')) attack();
  }

  async function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Arcade</span>
      <h1 class="reveal">Claudecraft Runner 🎮</h1>
      <p class="sub reveal">A real platformer across three zones — run, double-jump, dash, fight the beasts your way, and topple each zone's boss. Lives, checkpoints, coins and a saved high score.</p>
      <div id="playBody"><div class="spinner"></div></div>
    </div></section>`));
    if (!CS) { const [cs, mf] = await Promise.all([loadJSON('classstats.json'), loadJSON('manifest.json')]); cs.render = {}; (mf.classes || []).forEach(c => cs.render[c.id] = c.render); CS = cs; }
    setup();
  }
  addEventListener('keydown', e => onKey(e, true));
  addEventListener('keyup', e => onKey(e, false));
  registerView('play', view);
})();
