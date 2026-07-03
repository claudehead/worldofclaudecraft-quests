'use strict';
// Play the Lore — #/adventure. A Zork-style run through the real world of Claudecraft:
// travel zone by zone (in level order), face the zone's actual creatures, and choose how
// to survive. Built from manifest zones + mobstats. Reach the last zone to win.
(function () {
  const { el, esc, registerView, loadJSON, app } = window.WOC;
  const CLASS_EMOJI = { warrior: '⚔️', mage: '🔮', rogue: '🗡️', paladin: '🛡️', hunter: '🏹', priest: '✨', shaman: '🌊', warlock: '😈', druid: '🐻' };
  const CLASS_COLOR = { warrior: '#C79C6E', mage: '#69CCF0', rogue: '#FFF569', paladin: '#F58CBA', hunter: '#ABD473', priest: '#E7E7E7', shaman: '#3390DE', warlock: '#9482C9', druid: '#FF7D0A' };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  let DATA = null, S = null;

  const INTROS = ['A cold wind greets you as you cross into', 'The road opens onto', 'Mist parts to reveal', 'You set foot in', 'Weary but determined, you reach'];
  const WIN = ['You cut it down.', 'It falls before you.', 'Victory — but not without a scratch.', 'The beast is slain.'];
  const LOSE = ['It overpowers you.', 'You barely escape, badly wounded.', 'The blow lands hard.', 'You stagger back, bleeding.'];

  function begin(clsId) {
    const c = DATA.cs.classes[clsId];
    const hp = Math.round(c.baseHp + c.hpPerLevel * 4);
    S = { clsId, cname: c.name, emoji: CLASS_EMOJI[clsId], color: CLASS_COLOR[clsId], hp, maxHp: hp, level: 1, zi: 0, enc: 0, log: [], over: false, kills: 0 };
    zoneIntro();
  }

  const zone = () => DATA.zones[S.zi];
  function zoneMobs() { const z = zone(); return (DATA.mobs || []).filter(m => (m.zones || []).includes(z.title) && !m.boss); }

  function zoneIntro() {
    const z = zone();
    S.log.push({ h: true, t: `${INTROS[S.zi % INTROS.length]} ${z.title} (levels ${z.levelRange[0]}–${z.levelRange[1]}).` });
    render(['Explore']);
  }

  function encounter() {
    const mobs = zoneMobs();
    S.foe = mobs.length ? pick(mobs) : { name: 'a lurking shade', level: S.level, dps: 3, family: 'undead' };
    S.log.push({ t: `A <b>${esc(S.foe.name)}</b> (Lv ${S.foe.level}) blocks your path.` });
    render(['Fight', 'Sneak past', 'Rest']);
  }

  function fight() {
    const f = S.foe, win = Math.random() < clamp(0.52 + (S.level - f.level) * 0.12, 0.15, 0.9);
    if (win) {
      const dmg = Math.round((f.dps || 3) * (0.5 + Math.random() * 1.5)); S.hp = Math.max(0, S.hp - dmg); S.kills++;
      S.log.push({ t: `${pick(WIN)} You take ${dmg} damage.` });
    } else {
      const dmg = Math.round((f.dps || 3) * (2 + Math.random() * 3)); S.hp = Math.max(0, S.hp - dmg);
      S.log.push({ t: `${pick(LOSE)} You take ${dmg} damage.` });
    }
    afterEncounter();
  }
  function sneak() {
    const f = S.foe, ok = Math.random() < clamp(0.45 + (S.level - f.level) * 0.1, 0.1, 0.85);
    if (ok) S.log.push({ t: `You slip past the ${esc(f.name)} unseen. 🤫` });
    else { const dmg = Math.round((f.dps || 3) * (1 + Math.random() * 2)); S.hp = Math.max(0, S.hp - dmg); S.log.push({ t: `The ${esc(f.name)} spots you! It hits for ${dmg} before you flee.` }); }
    afterEncounter();
  }
  function rest() {
    if (Math.random() < 0.3) { const dmg = Math.round(4 + Math.random() * 6); S.hp = Math.max(0, S.hp - dmg); S.log.push({ t: `Ambushed while resting! You lose ${dmg} HP.` }); afterEncounter(); return; }
    const h = Math.round(S.maxHp * 0.25); S.hp = Math.min(S.maxHp, S.hp + h); S.log.push({ t: `You make camp and recover ${h} HP. 🔥` });
    afterEncounter();
  }

  function afterEncounter() {
    if (S.hp <= 0) { S.over = 'dead'; S.log.push({ h: true, t: `💀 You fall in ${zone().title}. Your journey ends at level ${S.level}, ${S.kills} foes bested.` }); render([]); return; }
    S.enc++;
    if (S.enc >= 3) {
      S.enc = 0; S.level++; S.maxHp += 12; S.hp = Math.min(S.maxHp, S.hp + 8);
      if (S.zi >= DATA.zones.length - 1) { S.over = 'win'; S.log.push({ h: true, t: `🏆 You have crossed all of Claudecraft and lived! Final level ${S.level}, ${S.kills} foes bested, ${S.hp} HP to spare.` }); render([]); return; }
      S.zi++; S.log.push({ h: true, t: `You grow stronger — level ${S.level}! You press on toward ${DATA.zones[S.zi].title}.` });
      render(['Continue']);
    } else { render(['Press on']); }
  }

  function render(choices) {
    const host = document.getElementById('advBody');
    const bars = S ? `<div class="adv-hud"><span class="adv-cls" style="color:${S.color}">${S.emoji} ${esc(S.cname)}</span> · Lv ${S.level} · <span class="adv-bar"><i style="width:${S.hp / S.maxHp * 100}%;background:${S.hp / S.maxHp < 0.3 ? '#e06666' : '#4ec77e'}"></i></span> ${S.hp}/${S.maxHp} HP</div>` : '';
    const story = S.log.slice(-12).map(l => `<p class="${l.h ? 'adv-h' : ''}">${l.t}</p>`).join('');
    const map = { 'Explore': encounter, 'Fight': fight, 'Sneak past': sneak, 'Rest': rest, 'Press on': encounter, 'Continue': zoneIntro };
    const btns = choices.map(c => `<button class="btn ${c === 'Fight' ? 'primary' : 'ghost'}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
    host.innerHTML = `${bars}<div class="adv-story">${story}</div>
      ${choices.length ? `<div class="adv-choices">${btns}</div>` : `<div class="adv-choices"><button class="btn primary" id="advRestart">↻ New adventure</button></div>`}`;
    if (choices.length) host.querySelectorAll('[data-c]').forEach(b => b.onclick = () => map[b.dataset.c]());
    else document.getElementById('advRestart').onclick = () => { S = null; setup(); };
    host.querySelector('.adv-story').scrollTop = host.querySelector('.adv-story').scrollHeight;
  }

  function setup() {
    const host = document.getElementById('advBody');
    const classes = Object.values(DATA.cs.classes);
    host.innerHTML = `<div class="adv-setup"><h3>Choose your hero</h3><div class="adv-picks">${classes.map(c => `<button class="ar-pick" data-cls="${c.id}" style="--cc:${CLASS_COLOR[c.id]}">${CLASS_EMOJI[c.id]} ${esc(c.name)}</button>`).join('')}</div><p class="meta">Pick a class to begin your journey through the world.</p></div>`;
    host.querySelectorAll('.ar-pick').forEach(b => b.onclick = () => begin(b.dataset.cls));
  }

  async function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Interactive fiction</span>
      <h1 class="reveal">Play the Lore 📖</h1>
      <p class="sub reveal">A choose-your-path adventure through the real zones and creatures of Claudecraft. Fight, sneak, rest — and try to survive to the far side of the world.</p>
      <div id="advBody"><div class="spinner"></div></div>
    </div></section>`));
    if (!DATA) {
      const [cs, mf, mobs] = await Promise.all([loadJSON('classstats.json'), loadJSON('manifest.json'), loadJSON('mobstats.json')]);
      const zones = (mf.zones || []).slice().sort((a, b) => a.levelRange[0] - b.levelRange[0]);
      DATA = { cs, zones, mobs: mobs.mobs || [] };
    }
    setup();
  }
  registerView('adventure', view);
})();
