'use strict';
// Trading Card Generator — #/cards. Renders collectible holo-style cards for classes,
// bosses and mobs entirely on a <canvas> (procedural — no external images, so PNG
// export never taints) and lets you download them. Built to be screenshotted + shared.
(function () {
  const { el, esc, registerView, loadJSON, app } = window.WOC;
  const CLASS_COLOR = { warrior: '#C79C6E', mage: '#69CCF0', rogue: '#FFF569', paladin: '#F58CBA', hunter: '#ABD473', priest: '#E7E7E7', shaman: '#3390DE', warlock: '#9482C9', druid: '#FF7D0A' };
  const CLASS_EMOJI = { warrior: '⚔️', mage: '🔮', rogue: '🗡️', paladin: '🛡️', hunter: '🏹', priest: '✨', shaman: '🌊', warlock: '😈', druid: '🐻' };
  const FAMILY_EMOJI = { beast: '🐺', undead: '💀', dragon: '🐉', humanoid: '🧍', elemental: '🔥', demon: '👹', construct: '🗿', aberration: '🦑', giant: '🗿', critter: '🐁' };
  const RARITY = { legendary: ['#e6803a', 5], epic: ['#a86bd6', 4], rare: ['#46b8da', 3], uncommon: ['#5cb85c', 2], common: ['#c8c8cf', 1] };
  const W = 400, H = 560;
  let DATA = null, current = null;

  function deriveOffense(c, K, L) {
    const s = {}; for (const k of ['str', 'agi', 'int']) s[k] = (c.baseStats[k] || 0) + (c.statsPerLevel[k] || 0) * (L - 1);
    const ap = c.apRule === 'str2' ? s.str * 2 : c.apRule === 'stragi' ? s.str + s.agi : s.str;
    const sp = s.int * (K.spellPowerPerInt || 0.5);
    const melee = (10 + (ap / K.apToDamageDivisor) * 2.5) / 2.5 * 2.2;
    const spell = (12 + sp) / 2;
    return Math.round(c.caster ? spell : melee);
  }

  function subjects() {
    const list = [];
    const K = DATA.cs.constants, L = DATA.cs.maxLevel;
    // classes
    for (const c of Object.values(DATA.cs.classes)) {
      const hpSta = Math.min(c.baseStats.sta + c.statsPerLevel.sta * (L - 1), K.staLowCap) * K.staHpLow + Math.max(0, (c.baseStats.sta + c.statsPerLevel.sta * (L - 1)) - K.staLowCap) * K.staHpHigh;
      const hp = Math.round(c.baseHp + c.hpPerLevel * (L - 1) + hpSta);
      const roles = (DATA.roles[c.id] || {}).roles || [];
      list.push({ kind: 'Class', id: c.id, name: c.name, color: CLASS_COLOR[c.id], emoji: CLASS_EMOJI[c.id] || '⭐', rarity: 'epic', flavor: roles.join(' · ') || 'Adventurer', stats: [['Level', L], ['Health', hp], ['Offense', deriveOffense(c, K, L)], ['Roles', roles.length]] });
    }
    // bosses
    for (const b of (DATA.bosses.bosses || [])) {
      const mob = (DATA.mobs.mobs || []).find(m => m.name === b.name || m.id === b.id);
      list.push({ kind: 'Boss', id: b.id, name: b.name, color: RARITY.legendary[0], emoji: mob && FAMILY_EMOJI[mob.family] || '👑', rarity: 'legendary', flavor: 'Boss · ' + (b.where || 'Unknown'), stats: [['Level', b.level], ['Health', b.hp], ['DPS', mob ? Math.round(mob.dps) : '—'], ['Zone', b.where || '—']] });
    }
    // notable mobs (elite/rare)
    for (const m of (DATA.mobs.mobs || []).filter(m => (m.elite || m.rare) && !m.boss).slice(0, 30)) {
      const rar = m.rare ? 'rare' : 'uncommon';
      list.push({ kind: 'Mob', id: m.id, name: m.name, color: RARITY[rar][0], emoji: FAMILY_EMOJI[m.family] || '🐾', rarity: rar, flavor: (m.elite ? 'Elite ' : '') + (m.family || 'creature'), stats: [['Level', m.level], ['Health', m.hp], ['DPS', Math.round(m.dps)], ['Armor', m.armor]] });
    }
    return list;
  }

  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function draw(cv, s) {
    const dpr = 2, ctx = cv.getContext('2d');
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    const col = s.color, rar = RARITY[s.rarity];
    // background holo gradient
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#12131a'); g.addColorStop(0.45, mix(col, '#12131a', 0.78)); g.addColorStop(0.55, mix(col, '#0a0a10', 0.85)); g.addColorStop(1, '#0a0a10');
    ctx.fillStyle = g; roundRect(ctx, 6, 6, W - 12, H - 12, 22); ctx.fill();
    // holo sheen bands
    ctx.save(); roundRect(ctx, 6, 6, W - 12, H - 12, 22); ctx.clip();
    for (let i = -2; i < 8; i++) { const gg = ctx.createLinearGradient(i * 90, 0, i * 90 + 60, H); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.05)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gg; ctx.fillRect(i * 90, 0, 60, H); }
    ctx.restore();
    // frame
    ctx.lineWidth = 4; ctx.strokeStyle = col; roundRect(ctx, 6, 6, W - 12, H - 12, 22); ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.25)'; roundRect(ctx, 12, 12, W - 24, H - 24, 17); ctx.stroke();
    // header
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
    ctx.font = '700 26px Georgia, serif'; ctx.textAlign = 'left';
    wrapText(ctx, s.name, 26, 44, W - 90, 28);
    ctx.textAlign = 'right'; ctx.font = '16px Georgia, serif'; ctx.fillStyle = col;
    ctx.fillText('★'.repeat(rar[1]), W - 26, 40);
    // kind pill
    ctx.textAlign = 'left'; ctx.font = '700 11px system-ui, sans-serif'; ctx.fillStyle = mix(col, '#000', 0.2);
    roundRect(ctx, 26, 62, ctx.measureText(s.kind.toUpperCase()).width + 20, 20, 10); ctx.fill();
    ctx.fillStyle = '#111'; ctx.fillText(s.kind.toUpperCase(), 36, 73);
    // art circle with emoji
    const cx = W / 2, cy = 200, rr = 92;
    const rg = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy, rr); rg.addColorStop(0, mix(col, '#fff', 0.5)); rg.addColorStop(1, mix(col, '#0a0a10', 0.6));
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
    ctx.font = '96px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(s.emoji, cx, cy + 4);
    // flavor
    ctx.font = 'italic 15px Georgia, serif'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.textAlign = 'center';
    ctx.fillText(s.flavor, cx, 318);
    // stats box
    roundRect(ctx, 26, 340, W - 52, 168, 14); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.textBaseline = 'middle'; let y = 366;
    for (const [k, v] of s.stats) {
      ctx.textAlign = 'left'; ctx.font = '13px system-ui'; ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fillText(k, 44, y);
      ctx.textAlign = 'right'; ctx.font = '700 15px system-ui'; ctx.fillStyle = col; ctx.fillText(String(v), W - 44, y);
      y += 38;
    }
    // footer wordmark
    ctx.textAlign = 'center'; ctx.font = '700 12px Georgia, serif'; ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.fillText('WORLD OF CLAUDECRAFT', cx, H - 26);
  }
  function wrapText(ctx, text, x, y, maxW, lh) { const words = text.split(' '); let line = '', yy = y; for (const w of words) { if (ctx.measureText(line + w).width > maxW && line) { ctx.fillText(line.trim(), x, yy); line = ''; yy += lh; } line += w + ' '; } ctx.fillText(line.trim(), x, yy); }
  function mix(a, b, t) { const pa = hex(a), pb = hex(b); return `rgb(${Math.round(pa[0] * (1 - t) + pb[0] * t)},${Math.round(pa[1] * (1 - t) + pb[1] * t)},${Math.round(pa[2] * (1 - t) + pb[2] * t)})`; }
  function hex(c) { if (c[0] === '#') { const n = c.length === 4 ? c.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : c; return [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16)]; } const m = c.match(/\d+/g); return m ? m.map(Number) : [128, 128, 128]; }

  function show(s) { current = s; const cv = document.getElementById('cardCanvas'); draw(cv, s); }

  async function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Collectibles</span>
      <h1 class="reveal">Trading Card Generator 🃏</h1>
      <p class="sub reveal">Mint a holo-style collector card for any class, boss or creature — then download it and show it off.</p>
      <div class="card-gen">
        <div class="card-controls">
          <label class="meta">Pick a subject<select id="cardSel"></select></label>
          <div class="card-btns">
            <button class="btn ghost" id="cardRand">🎲 Random</button>
            <button class="btn primary" id="cardDl">⬇ Download PNG</button>
          </div>
        </div>
        <div class="card-stage"><canvas id="cardCanvas" class="trade-card"></canvas></div>
      </div>
    </div></section>`));

    if (!DATA) {
      const [cs, mf, bosses, mobs] = await Promise.all([loadJSON('classstats.json'), loadJSON('manifest.json'), loadJSON('bosses.json'), loadJSON('mobstats.json')]);
      const roles = {}; (mf.classes || []).forEach(c => roles[c.id] = { roles: c.roles }); DATA = { cs, roles, bosses, mobs };
    }
    const list = subjects();
    const sel = document.getElementById('cardSel');
    let group = '';
    list.forEach((s, i) => { if (s.kind !== group) { group = s.kind; sel.append(el(`<optgroup label="${esc(group)}s"></optgroup>`)); } sel.lastChild.append(el(`<option value="${i}">${esc(s.name)}</option>`)); });
    sel.onchange = () => show(list[+sel.value]);
    document.getElementById('cardRand').onclick = () => { const i = Math.floor(list.length * (Date.now() % 997) / 997); sel.value = i; show(list[i]); };
    document.getElementById('cardDl').onclick = () => { const a = document.createElement('a'); a.download = 'woc-' + (current ? current.id : 'card') + '.png'; a.href = document.getElementById('cardCanvas').toDataURL('image/png'); a.click(); };
    show(list[0]);
  }
  registerView('cards', view);
})();
