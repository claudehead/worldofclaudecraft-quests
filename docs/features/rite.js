'use strict';
// Drowned Reliquary Rite — practice trainer (#/rite). A playable "Simon says" version
// of the Drowned Litany's finale: watch the shrine sequence, then repeat it. Faithful
// to the game's real numbers (woc/src/sim/delves/rite_tuning.ts RITE_INTENSITY):
//   easy   len 4 · shown 3× · 3 tries · loot ceiling Low
//   medium len 5 · shown 2× · 2 tries · loot ceiling Medium
//   hard   len 6 · shown 1× · 1 try  · loot ceiling Premium
// 4 shrines (bell/candle/reed/skull); a wrong touch costs 3% HP and burns a try;
// out of tries and the reliquary opens on Low loot. No per-touch timer — it's memory.
(function () {
  const { el, registerView, reveal, app } = window.WOC;

  const SHRINES = [
    { id: 'bell', label: 'Bell', emoji: '🔔', color: '#c69a3e', glow: '#ffe39a' },
    { id: 'candle', label: 'Candle', emoji: '🕯️', color: '#d1702f', glow: '#ffb877' },
    { id: 'reed', label: 'Reed', emoji: '🌾', color: '#6aa544', glow: '#bdea8c' },
    { id: 'skull', label: 'Skull', emoji: '💀', color: '#9aa0a8', glow: '#ffffff' },
  ];
  const DIFF = {
    easy: { label: 'Easy', length: 4, playbacks: 3, tries: 3, ceiling: 'Low' },
    medium: { label: 'Medium', length: 5, playbacks: 2, tries: 2, ceiling: 'Medium' },
    hard: { label: 'Hard', length: 6, playbacks: 1, tries: 1, ceiling: 'Premium' },
  };
  const STEP_MS = 600;   // RITE_PLAYBACK_STEP: gap between sequence lights
  const REPEAT_MS = 1200; // RITE_REPEAT_GAP: dark beat between repeat playbacks

  const STYLE = `
  .rite-wrap{max-width:640px}
  .rite-stage{background:radial-gradient(120% 90% at 50% 0%,#1b2233,#0d1119);border:1px solid #2a3350;border-radius:16px;padding:22px 18px 26px;margin-top:14px;position:relative;overflow:hidden}
  .rite-shrines{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:6px 0 4px}
  .rite-pad{position:relative;aspect-ratio:1/1.15;border-radius:14px;border:2px solid rgba(255,255,255,.10);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;transition:transform .08s,box-shadow .18s,filter .18s,border-color .18s;filter:brightness(.55) saturate(.7);user-select:none}
  .rite-pad .ico{font-size:34px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}
  .rite-pad .nm{font-size:11px;letter-spacing:.04em;color:#e9e2cf;opacity:.9}
  .rite-pad.lit{filter:brightness(1.35) saturate(1.2);transform:translateY(-3px) scale(1.03)}
  .rite-pad.good{filter:brightness(1.3);border-color:#5cd08a!important;box-shadow:0 0 0 2px #5cd08a,0 0 18px rgba(92,208,138,.5)}
  .rite-pad.bad{filter:brightness(1.2);border-color:#e0526a!important;box-shadow:0 0 0 2px #e0526a,0 0 18px rgba(224,82,106,.55);animation:riteShake .25s}
  .rite-pad.play{filter:brightness(.55) saturate(.7)}
  .rite-pad.live{cursor:pointer}
  .rite-pad.live:hover{filter:brightness(.85);transform:translateY(-2px)}
  @keyframes riteShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
  .rite-hud{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:2px 2px 12px;flex-wrap:wrap}
  .rite-tries{display:flex;gap:5px;align-items:center;font-size:13px;color:#c8bfa6}
  .rite-heart{color:#e0526a;font-size:15px}
  .rite-heart.spent{color:#3a3f4a}
  .rite-hpwrap{flex:1;min-width:120px;height:9px;background:#20252f;border-radius:6px;overflow:hidden;border:1px solid #313a4d}
  .rite-hp{height:100%;background:linear-gradient(90deg,#4bbf7b,#8bd24f);transition:width .25s}
  .rite-msg{min-height:24px;text-align:center;font-size:15px;font-weight:600;margin:4px 0 2px;color:#e9e2cf}
  .rite-sub{text-align:center;font-size:12.5px;color:#9aa2b0;min-height:18px}
  .rite-dots{display:flex;justify-content:center;gap:7px;margin:10px 0 2px}
  .rite-dot{width:11px;height:11px;border-radius:50%;background:#2c3446;border:1px solid #3a4258}
  .rite-dot.on{background:#e6c15a;border-color:#e6c15a;box-shadow:0 0 8px rgba(230,193,90,.6)}
  .rite-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:4px}
  .rite-pill{padding:7px 14px;border-radius:20px;border:1px solid #3a4258;background:#151a24;color:#d8cfb6;cursor:pointer;font-size:13px;font-weight:600;transition:.15s}
  .rite-pill:hover{border-color:#e6c15a;color:#fff}
  .rite-pill.active{background:#e6c15a;color:#1a1206;border-color:#e6c15a}
  .rite-cta{margin-left:auto;padding:7px 16px;border-radius:20px;border:1px solid #5cd08a;background:rgba(92,208,138,.12);color:#8be0aa;cursor:pointer;font-size:13px;font-weight:700}
  .rite-cta:hover{background:rgba(92,208,138,.25);color:#fff}
  `;

  let gen = 0; // bumps on every new rite / view mount, invalidating stale timers

  function view() {
    gen++;
    const myGen = gen;
    const timers = [];
    const after = (ms, fn) => { const t = setTimeout(() => { if (myGen === gen) fn(); }, ms); timers.push(t); };
    const clearAll = () => { timers.forEach(clearTimeout); timers.length = 0; };

    let diff = 'easy';
    let seq = [], inputIdx = 0, triesLeft = 0, hp = 100, phase = 'choose';

    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap rite-wrap">
      <style>${STYLE}</style>
      <span class="eyebrow reveal">Tools · practice</span>
      <h1 class="reveal">Drowned Reliquary Rite — Practice 🔔</h1>
      <p class="sub reveal">The Drowned Litany's finale isn't a lockpick — it's a memory rite. When Sister Nhalia falls, four shrines light a sequence and you repeat it back. Practice it here, free, before you run the delve. <b>No timer per touch — it's pure memory.</b></p>
      <div class="rite-controls reveal" id="riteDiff"></div>
      <div class="rite-stage reveal">
        <div class="rite-hud">
          <div class="rite-tries" id="riteTries"></div>
          <div class="rite-hpwrap" title="Your health — each wrong touch costs 3%"><div class="rite-hp" id="riteHp" style="width:100%"></div></div>
        </div>
        <div class="rite-msg" id="riteMsg">Pick a difficulty to begin.</div>
        <div class="rite-sub" id="riteSub">Easy shows the sequence three times and forgives two slips.</div>
        <div class="rite-dots" id="riteDots"></div>
        <div class="rite-shrines" id="riteShrines"></div>
      </div>
      <p class="meta reveal" style="margin-top:14px">This mirrors the real finale exactly — 4 shrines, difficulty sets sequence length, replays and loot ceiling (Easy→Low, Medium→Medium, Hard→Premium). Read the full <a data-go="#/doc/delves%2Fdrowned_litany.md">Drowned Litany guide</a>, or try the other delve's <a data-go="#/lockpick">lockpick minigame</a>.</p>
    </div></section>`));

    const $ = (id) => document.getElementById(id);
    const msg = $('riteMsg'), sub = $('riteSub');
    const shrineHost = $('riteShrines'), diffHost = $('riteDiff'), dotHost = $('riteDots');

    // difficulty pills
    Object.entries(DIFF).forEach(([k, d]) => {
      const p = el(`<span class="rite-pill${k === diff ? ' active' : ''}">${d.label}</span>`);
      p.onclick = () => { diff = k; diffHost.querySelectorAll('.rite-pill').forEach((x) => x.classList.remove('active')); p.classList.add('active'); start(); };
      diffHost.append(p);
    });
    const cta = el(`<span class="rite-cta">↻ New rite</span>`);
    cta.onclick = () => start();
    diffHost.append(cta);

    // shrine pads
    const pads = {};
    SHRINES.forEach((s) => {
      const pad = el(`<div class="rite-pad" data-id="${s.id}" style="background:linear-gradient(160deg,${s.color},${shade(s.color)})">
        <span class="ico">${s.emoji}</span><span class="nm">${s.label}</span></div>`);
      pad.style.setProperty('--glow', s.glow);
      pad.onclick = () => onTouch(s.id);
      pads[s.id] = pad;
      shrineHost.append(pad);
    });

    function shade(hex) {
      const n = parseInt(hex.slice(1), 16);
      const r = Math.max(0, (n >> 16) - 60), g = Math.max(0, ((n >> 8) & 255) - 60), b = Math.max(0, (n & 255) - 60);
      return `rgb(${r},${g},${b})`;
    }

    function renderTries() {
      const cfg = DIFF[diff];
      const host = $('riteTries');
      if (phase === 'choose') { host.innerHTML = `<span>${cfg.playbacks}× shown · ${cfg.tries} ${cfg.tries === 1 ? 'try' : 'tries'} · ceiling ${cfg.ceiling}</span>`; return; }
      let h = '';
      for (let i = 0; i < cfg.tries; i++) h += `<span class="rite-heart${i < cfg.tries - triesLeft ? ' spent' : ''}">❤</span>`;
      host.innerHTML = `${h}<span style="margin-left:4px">${triesLeft} left</span>`;
    }
    function renderDots(activeUpTo) {
      dotHost.innerHTML = seq.map((_, i) => `<span class="rite-dot${activeUpTo != null && i < activeUpTo ? ' on' : ''}"></span>`).join('');
    }
    function setLive(on) {
      SHRINES.forEach((s) => pads[s.id].classList.toggle('live', on));
    }
    function flash(id, cls, ms) {
      const pad = pads[id]; pad.classList.add(cls);
      after(ms, () => pad.classList.remove(cls));
    }

    // Per-run token cancels a prior rite's playback cleanly (gen stays fixed for the
    // whole view mount so flash() timers keep working; a new view mount bumps gen).
    let runToken = 0;
    function start() { startInner(); }
    function startInner() {
      const cfg = DIFF[diff];
      const token = ++runToken;
      const alive = () => token === runToken && myGen === gen;
      const wait = (ms, fn) => setTimeout(() => { if (alive()) fn(); }, ms);

      seq = Array.from({ length: cfg.length }, () => SHRINES[(Math.random() * SHRINES.length) | 0].id);
      inputIdx = 0; triesLeft = cfg.tries; hp = 100; phase = 'playback';
      $('riteHp').style.width = '100%';
      renderTries(); renderDots(0); setLive(false);
      playback(cfg.playbacks, 1, cfg, alive, wait);
    }

    function playback(loopsLeft, loopNo, cfg, alive, wait) {
      if (!alive()) return;
      msg.textContent = `Watch closely…`;
      sub.textContent = `Playback ${loopNo} of ${cfg.playbacks} · length ${cfg.length}`;
      setLive(false);
      let i = 0;
      const showNext = () => {
        if (!alive()) return;
        if (i >= seq.length) {
          if (loopsLeft > 1) { wait(REPEAT_MS, () => playback(loopsLeft - 1, loopNo + 1, cfg, alive, wait)); }
          else { toInput(); }
          return;
        }
        const id = seq[i];
        pads[id].classList.add('lit');
        wait(Math.round(STEP_MS * 0.68), () => { pads[id].classList.remove('lit'); i++; wait(Math.round(STEP_MS * 0.32), showNext); });
      };
      wait(REPEAT_MS * 0.4, showNext);
    }

    function toInput() {
      phase = 'input'; inputIdx = 0;
      msg.textContent = 'Your turn — repeat the sequence.';
      sub.textContent = 'Touch the shrines in the order they lit.';
      renderDots(0); setLive(true);
    }

    function onTouch(id) {
      if (phase !== 'input') return;
      if (id === seq[inputIdx]) {
        flash(id, 'good', 260);
        inputIdx++;
        renderDots(inputIdx);
        if (inputIdx >= seq.length) return win();
      } else {
        wrong(id);
      }
    }

    function wrong(id) {
      flash(id, 'bad', 320);
      triesLeft--;
      hp = Math.max(0, hp - 3);
      $('riteHp').style.width = hp + '%';
      renderTries();
      const cfg = DIFF[diff];
      if (triesLeft > 0) {
        phase = 'playback'; setLive(false);
        msg.textContent = 'Wrong shrine — the rite resets.';
        sub.textContent = `${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left · watch again…`;
        const token = runToken; const alive = () => token === runToken && myGen === gen;
        const wait = (ms, fn) => setTimeout(() => { if (alive()) fn(); }, ms);
        wait(900, () => playback(1, 1, cfg, alive, wait));
      } else {
        lose();
      }
    }

    function win() {
      phase = 'won'; setLive(false);
      const cfg = DIFF[diff];
      renderDots(seq.length);
      SHRINES.forEach((s, i) => flash(s.id, 'good', 200 + i * 90));
      msg.innerHTML = `✔ <span style="color:#8be0aa">The reliquary opens!</span>`;
      sub.innerHTML = `Clean rite on <b>${cfg.label}</b> — you'd claim up to <b>${cfg.ceiling}-tier</b> loot. Try a harder rite for a higher ceiling.`;
    }

    function lose() {
      phase = 'lost'; setLive(false);
      msg.innerHTML = `✖ <span style="color:#e08a9a">Out of tries.</span>`;
      sub.innerHTML = `The reliquary grinds open on <b>Low-tier</b> loot anyway — but you missed the good stuff. Hit <b>↻ New rite</b> to try again.`;
    }

    renderTries();
    reveal();
  }

  registerView('rite', view);
})();
