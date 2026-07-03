'use strict';
// The Game — #/play. A real-time side-scrolling platformer: run (← →/A D), jump and
// double-jump (Space/↑) over gaps and hazards, stomp or attack (J/X) the bestiary's
// creatures, grab coins, and reach the portal. Uses the class render as your hero and
// real mob art as enemies. Everything is canvas + rAF; no libraries.
(function () {
  const { el, esc, registerView, loadJSON, raw, app } = window.WOC;
  const CLASS_COLOR = { warrior: '#C79C6E', mage: '#69CCF0', rogue: '#FFF569', paladin: '#F58CBA', hunter: '#ABD473', priest: '#E7E7E7', shaman: '#3390DE', warlock: '#9482C9', druid: '#FF7D0A' };
  const CLASS_EMOJI = { warrior: '⚔️', mage: '🔮', rogue: '🗡️', paladin: '🛡️', hunter: '🏹', priest: '✨', shaman: '🌊', warlock: '😈', druid: '🐻' };
  const MOB_ART = ['forest_wolf', 'webwood_spider', 'wild_boar', 'mudfin_murloc', 'bristleback_boar'];
  const W = 900, H = 460, GROUND = 380, G = 0.62, MOVE = 4.2, JUMP = -12.2;
  const imgs = {};
  let CS = null, keys = {}, raf = 0, G_ = null;

  function img(url) { if (imgs[url]) return imgs[url]; const im = new Image(); im.src = url; imgs[url] = im; return im; }

  // ---- level ----
  function buildLevel(seed) {
    const plats = [], coins = [], foes = [], spikes = [];
    let x = 0; const segs = 16;
    plats.push({ x: 0, y: GROUND, w: 700, h: 120 }); x = 700;
    for (let i = 0; i < segs; i++) {
      const gap = 90 + ((seed * (i + 3)) % 70);       // jumpable gap
      x += gap;
      const w = 260 + ((seed * (i + 7)) % 200);
      const y = GROUND - (((seed * (i + 2)) % 3) * 46); // varied heights
      plats.push({ x, y, w, h: GROUND + 120 - y });
      // floating platform above some segments
      if (i % 2 === 0) { const fx = x + 60 + (i % 3) * 40, fy = y - 120; plats.push({ x: fx, y: fy, w: 120, h: 18, float: true }); for (let c = 0; c < 3; c++) coins.push({ x: fx + 20 + c * 36, y: fy - 36, got: false }); }
      // coins arc over the gap
      for (let c = 0; c < 3; c++) coins.push({ x: x - gap + 20 + c * (gap / 3), y: y - 70 - (c === 1 ? 26 : 0), got: false });
      // a foe on this platform
      if (i > 0) { const fid = MOB_ART[(seed * (i + 1)) % MOB_ART.length]; foes.push({ x: x + w * 0.5, y: y - 40, w: 40, h: 40, x0: x + 30, x1: x + w - 30, vx: (i % 2 ? 1 : -1) * 1.1, alive: true, art: img(raw('quests/zones/_mob-renders/' + fid + '.png')) }); }
      // occasional spikes at platform edge
      if (i % 3 === 1) spikes.push({ x: x + w - 40, y: y - 16, w: 34, h: 16 });
      x += w;
    }
    return { plats, coins, foes, spikes, goal: { x: x + 60, y: GROUND - 70 }, end: x + 160 };
  }

  function start(clsId) {
    cancelAnimationFrame(raf);
    const seed = (Date.now() % 97) + 3;
    const lvl = buildLevel(seed);
    G_ = {
      clsId, color: CLASS_COLOR[clsId], hero: img(raw((CS.render[clsId]) || '')),
      p: { x: 60, y: GROUND - 48, w: 34, h: 46, vx: 0, vy: 0, ground: false, jumps: 0, face: 1, atk: 0, inv: 0 },
      lvl, cam: 0, hp: 3, coins: 0, state: 'play',
    };
    loop();
  }

  function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function update() {
    const g = G_, p = g.p;
    // input
    const left = keys['arrowleft'] || keys['a'], right = keys['arrowright'] || keys['d'];
    p.vx = left ? -MOVE : right ? MOVE : 0; if (left) p.face = -1; if (right) p.face = 1;
    p.vy += G; p.x += p.vx;
    // horizontal platform collision
    for (const pl of g.lvl.plats) { if (hit(p, pl)) { if (p.vx > 0) p.x = pl.x - p.w; else if (p.vx < 0) p.x = pl.x + pl.w; } }
    p.y += p.vy; p.ground = false;
    for (const pl of g.lvl.plats) { if (hit(p, pl)) { if (p.vy > 0) { p.y = pl.y - p.h; p.vy = 0; p.ground = true; p.jumps = 0; } else if (p.vy < 0) { p.y = pl.y + pl.h; p.vy = 0; } } }
    if (p.x < 0) p.x = 0;
    if (p.atk > 0) p.atk--; if (p.inv > 0) p.inv--;
    // fell in a pit
    if (p.y > H + 80) { g.hp--; if (g.hp <= 0) return end('lose'); p.x = Math.max(60, p.x - 120); p.y = 0; p.vy = 0; p.inv = 60; }
    // coins
    for (const c of g.lvl.coins) if (!c.got && Math.abs((p.x + p.w / 2) - c.x) < 24 && Math.abs((p.y + p.h / 2) - c.y) < 24) { c.got = true; g.coins++; }
    // spikes
    for (const s of g.lvl.spikes) if (p.inv <= 0 && hit(p, s)) { g.hp--; p.inv = 70; p.vy = -8; if (g.hp <= 0) return end('lose'); }
    // foes
    for (const f of g.lvl.foes) {
      if (!f.alive) continue;
      f.x += f.vx; if (f.x < f.x0 || f.x > f.x1) f.vx *= -1;
      if (hit(p, f)) {
        const stomp = p.vy > 0 && (p.y + p.h) - f.y < 26;
        const attacking = p.atk > 0 && Math.abs((p.x + p.w / 2) - (f.x + f.w / 2)) < 46;
        if (stomp || attacking) { f.alive = false; g.coins += 2; if (stomp) p.vy = JUMP * 0.6; }
        else if (p.inv <= 0) { g.hp--; p.inv = 70; p.vy = -8; p.x -= f.vx > 0 ? 30 : -30; if (g.hp <= 0) return end('lose'); }
      }
    }
    // goal
    if (p.x + p.w > g.lvl.goal.x) return end('win');
    // camera
    g.cam = Math.max(0, Math.min(g.lvl.end - W, p.x - W * 0.4));
  }

  function end(state) { G_.state = state; }

  function draw(ctx) {
    const g = G_, cam = g.cam;
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1a2740'); sky.addColorStop(1, '#0c1020'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // parallax hills
    ctx.fillStyle = 'rgba(90,120,90,.25)'; for (let i = 0; i < 8; i++) { const hx = ((i * 300 - cam * 0.4) % (W + 300)) - 150; ctx.beginPath(); ctx.arc(hx, GROUND, 160, Math.PI, 0); ctx.fill(); }
    ctx.save(); ctx.translate(-cam, 0);
    // platforms
    for (const pl of g.lvl.plats) { ctx.fillStyle = pl.float ? '#6a5a3a' : '#3a4d2e'; roundRect(ctx, pl.x, pl.y, pl.w, pl.h, pl.float ? 6 : 0); ctx.fill(); ctx.fillStyle = pl.float ? '#8a7550' : '#5a7a3e'; ctx.fillRect(pl.x, pl.y, pl.w, 6); }
    // spikes
    ctx.fillStyle = '#b8b8c0'; for (const s of g.lvl.spikes) for (let i = 0; i < s.w; i += 10) { ctx.beginPath(); ctx.moveTo(s.x + i, s.y + s.h); ctx.lineTo(s.x + i + 5, s.y); ctx.lineTo(s.x + i + 10, s.y + s.h); ctx.fill(); }
    // coins
    for (const c of g.lvl.coins) if (!c.got) { ctx.fillStyle = '#e8c86a'; ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, 7); ctx.fill(); ctx.strokeStyle = '#b8963a'; ctx.stroke(); }
    // goal portal
    const gl = g.lvl.goal; const pg = ctx.createRadialGradient(gl.x, gl.y, 4, gl.x, gl.y, 46); pg.addColorStop(0, '#e8c86a'); pg.addColorStop(1, 'rgba(232,200,106,.1)'); ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(gl.x, gl.y, 46, 0, 7); ctx.fill();
    // foes
    for (const f of g.lvl.foes) { if (!f.alive) continue; if (f.art && f.art.complete && f.art.naturalWidth) ctx.drawImage(f.art, f.x - 4, f.y - 8, f.w + 8, f.h + 8); else { ctx.fillStyle = '#c0504d'; ctx.fillRect(f.x, f.y, f.w, f.h); } }
    // hero
    const p = g.p; ctx.save(); if (p.inv > 0 && Math.floor(p.inv / 5) % 2) ctx.globalAlpha = 0.5;
    if (p.face < 0) { ctx.translate(p.x + p.w, 0); ctx.scale(-1, 1); ctx.translate(-p.x, 0); }
    if (g.hero && g.hero.complete && g.hero.naturalWidth) ctx.drawImage(g.hero, p.x - 8, p.y - 12, p.w + 16, p.h + 14);
    else { ctx.fillStyle = g.color; roundRect(ctx, p.x, p.y, p.w, p.h, 6); ctx.fill(); }
    ctx.restore();
    // attack swish
    if (p.atk > 0) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x + p.w / 2 + p.face * 26, p.y + p.h / 2, 26, -1, 1); ctx.stroke(); }
    ctx.restore();
    // HUD
    ctx.fillStyle = '#fff'; ctx.font = '600 18px system-ui'; ctx.textAlign = 'left';
    ctx.fillText('❤'.repeat(Math.max(0, g.hp)), 16, 28);
    ctx.textAlign = 'right'; ctx.fillStyle = '#e8c86a'; ctx.fillText('🪙 ' + g.coins, W - 16, 28);
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function loop() {
    const cv = document.getElementById('playCv');
    if (!cv || !document.body.contains(cv)) { cancelAnimationFrame(raf); return; } // left the page
    const ctx = cv.getContext('2d');
    if (G_.state === 'play') update();
    draw(ctx);
    if (G_.state !== 'play') { overlay(G_.state); return; }
    raf = requestAnimationFrame(loop);
  }

  function overlay(state) {
    const host = document.getElementById('playOver');
    host.innerHTML = `<div class="play-over ${state}"><div class="play-msg">${state === 'win' ? '🏆 You reached the portal!' : '💀 You fell in battle'}</div><div class="meta">🪙 ${G_.coins} collected</div><button class="btn primary" id="playAgain">Play again</button></div>`;
    host.style.display = 'flex';
    document.getElementById('playAgain').onclick = () => { host.style.display = 'none'; setup(); };
  }

  function jump() { const p = G_ && G_.p; if (!p || G_.state !== 'play') return; if (p.ground || p.jumps < 2) { p.vy = JUMP; p.jumps = p.ground ? 1 : p.jumps + 1; p.ground = false; } }
  function attack() { const p = G_ && G_.p; if (p && G_.state === 'play' && p.atk <= 0) p.atk = 12; }

  function setup() {
    const host = document.getElementById('playBody');
    const classes = Object.values(CS.classes);
    host.innerHTML = `<div class="ar-setup"><h3>Choose your hero</h3><div class="ar-picks">${classes.map(c => `<button class="ar-pick" data-cls="${c.id}" style="--cc:${CLASS_COLOR[c.id]}">${CLASS_EMOJI[c.id]} ${esc(c.name)}</button>`).join('')}</div>
      <p class="meta">Controls: <b>← →</b> or <b>A/D</b> move · <b>Space / ↑</b> jump (press again to double-jump) · <b>J / X</b> attack · stomp foes from above. Reach the golden portal.</p></div>`;
    host.querySelectorAll('.ar-pick').forEach(b => b.onclick = () => { document.getElementById('playBody').innerHTML = `<div class="play-wrap"><canvas id="playCv" width="${W}" height="${H}" class="play-cv"></canvas><div id="playOver" class="play-overlay"></div></div>`; start(b.dataset.cls); });
  }

  function onKey(e, down) {
    const k = e.key.toLowerCase();
    if ([' ', 'arrowup', 'w', 'arrowdown', 'arrowleft', 'arrowright', 'a', 'd', 's', 'j', 'x'].includes(k)) e.preventDefault();
    keys[k] = down;
    if (down && (k === ' ' || k === 'arrowup' || k === 'w')) jump();
    if (down && (k === 'j' || k === 'x')) attack();
  }

  async function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Arcade</span>
      <h1 class="reveal">Claudecraft Runner 🎮</h1>
      <p class="sub reveal">A real platformer — run, double-jump over the gaps, stomp the beasts, grab the loot, and reach the portal. Keyboard required.</p>
      <div id="playBody"><div class="spinner"></div></div>
    </div></section>`));
    if (!CS) {
      const [cs, mf] = await Promise.all([loadJSON('classstats.json'), loadJSON('manifest.json')]);
      cs.render = {}; (mf.classes || []).forEach(c => cs.render[c.id] = c.render); CS = cs;
    }
    setup();
  }
  // global key listeners (attached once; harmless off-page since G_ guards)
  addEventListener('keydown', e => onKey(e, true));
  addEventListener('keyup', e => onKey(e, false));
  registerView('play', view);
})();
