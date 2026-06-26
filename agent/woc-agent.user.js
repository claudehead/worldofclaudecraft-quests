// ==UserScript==
// @name         World of Claudecraft — AI Take-over
// @namespace    claudehead.woc.agent
// @version      0.1.0
// @description  Press F8 to let a local LLM (Gemma via Ollama) or a scripted fallback play your character. Reads the live window.__game.sim; no game changes. Use in OFFLINE/practice mode.
// @match        http://localhost:5173/*
// @match        http://localhost:*/*
// @match        https://*/*
// @grant        none
// ==/UserScript==
/*  SETUP
 *  1. Install Tampermonkey, add this script. Edit the @match lines to your game URL.
 *  2. (Optional, recommended) Local brain:  ollama pull gemma3:4b   then keep `ollama serve` running.
 *     Allow the page to call Ollama:  set env OLLAMA_ORIGINS=*  before `ollama serve`.
 *     No Ollama? It falls back to a built-in scripted policy and still plays.
 *  3. Load the game (offline), pick a character, then press  F8  to toggle take-over.
 *  If the character circles its target instead of closing in, flip TURN_SIGN below.
 */
(function () {
  'use strict';
  const CFG = {
    SKILL_BASE: 'https://raw.githubusercontent.com/claudehead/worldofclaudecraft-quests/main/agent/skills',
    OLLAMA: 'http://localhost:11434/api/chat',
    MODEL: 'gemma3:4b',
    DECIDE_MS: 1200,     // how often the LLM re-decides (executor runs every frame)
    TURN_SIGN: 1,        // flip to -1 if it turns the wrong way
  };
  let ON = false, skill = null, intent = { type: 'idle' }, lastDecide = 0, deciding = false, lastClass = null;

  // ---- tiny math (uses the game's own facing convention: dir = (sin f, cos f)) ----
  const d2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  function aim(p, t) {                       // returns {dist, dot, cross} relative to where p faces
    const dx = t.x - p.x, dz = t.z - p.z, len = Math.hypot(dx, dz) || 1;
    const fx = Math.sin(p.facing), fz = Math.cos(p.facing);
    return { dist: len, dot: (fx * dx + fz * dz) / len, cross: (fx * dz - fz * dx) / len };
  }
  const sim = () => (window.__game && window.__game.sim) || null;
  const ent = (id) => { const s = sim(); return id != null && s ? s.entities.get(id) : null; };
  const hostiles = (p, s, r = 60) => [...s.entities.values()]
    .filter(e => e.kind === 'mob' && !e.dead && e.hostile && d2(p.pos, e.pos) < r)
    .sort((a, b) => d2(p.pos, a.pos) - d2(p.pos, b.pos));

  // ---- perception: compact JSON for the brain ----
  function observe() {
    const s = sim(); if (!s) return null; const p = s.player;
    const t = ent(p.targetId);
    const mobs = hostiles(p, s).slice(0, 5).map(e => {
      const a = aim(p, e);
      return { id: e.id, dist: Math.round(a.dist), bearing: Math.round(Math.asin(Math.max(-1, Math.min(1, a.cross))) * 180 / Math.PI), hp: +(e.hp / e.maxHp).toFixed(2), lvl: e.level - p.level, onMe: e.aggroTargetId === p.id };
    });
    const ready = (skill?.rotation || []).filter(id => abilityReady(p, id));
    return {
      hp: +(p.hp / p.maxHp).toFixed(2), resource: p.maxResource ? +(p.resource / p.maxResource).toFixed(2) : 1,
      level: p.level, inCombat: !!p.inCombat, dead: !!p.dead,
      target: t && !t.dead ? { id: t.id, dist: Math.round(d2(p.pos, t.pos)), hp: +(t.hp / t.maxHp).toFixed(2), lvl: t.level - p.level } : null,
      mobs, readyAbilities: ready,
    };
  }
  const abMap = () => Object.fromEntries((skill?.abilities || []).map(a => [a.id, a]));
  function abilityReady(p, id) {
    const a = abMap()[id]; if (!a) return false;
    const cd = (p.cooldowns && p.cooldowns.get) ? (p.cooldowns.get(id) ?? 0) : 0;
    return cd <= 0 && p.resource >= (a.cost || 0) && (p.gcdRemaining ?? 0) <= 0;
  }

  // ---- the brain: Gemma via Ollama, with a scripted fallback ----
  async function decide(obs) {
    // scripted baseline (also the fallback when no LLM)
    const scripted = () => {
      if (obs.hp < 0.25 && obs.mobs.some(m => m.onMe)) return { type: 'flee' };
      if (!obs.inCombat && obs.hp < 0.6) return { type: 'consume' };
      if (obs.target) return { type: 'kill', targetId: obs.target.id };
      const m = obs.mobs.find(m => m.lvl <= 1) || obs.mobs[0];
      return m ? { type: 'kill', targetId: m.id } : { type: 'idle' };
    };
    try {
      const sys = [
        ...(skill?.playbook || []),
        'You control the character. Each turn you get a JSON observation and reply with ONE JSON action.',
        'Actions: {"type":"kill","targetId":N} | {"type":"flee"} | {"type":"consume"} | {"type":"loot"} | {"type":"idle"} | {"type":"say","text":"..."}',
        'Distances are yards; bearing is degrees (0 = ahead). Prefer mobs with lvl <= 1. Reply with JSON only.',
      ].join('\n');
      const r = await fetch(CFG.OLLAMA, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: CFG.MODEL, format: 'json', stream: false,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: JSON.stringify(obs) }] }),
      });
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      const act = JSON.parse(j.message.content);
      if (act && act.type) return act;
    } catch (e) { /* Ollama down → scripted */ }
    return scripted();
  }

  // ---- executor: runs every frame, enacts the current intent through sim methods ----
  function clearMove(s) { const m = s.moveInput; if (!m) return; m.forward = m.back = m.turnLeft = m.turnRight = m.strafeLeft = m.strafeRight = m.jump = false; }
  function faceAndApproach(s, p, target, range) {
    const a = aim(p, target), m = s.moveInput;
    if (a.dot < 0.96) { if (a.cross * CFG.TURN_SIGN > 0) m.turnLeft = true; else m.turnRight = true; }
    if (a.dist > range && a.dot > 0.5) m.forward = true;
    return a.dist <= range && a.dot > 0.9;
  }
  function execute() {
    const s = sim(); if (!s) return; const p = s.player; if (p.dead) { try { s.releaseSpirit(); } catch {} return; }
    clearMove(s);
    const range = skill?.ranged ? 24 : (skill?.rules?.meleeRange || 5);
    if (intent.type === 'kill') {
      const t = ent(intent.targetId);
      if (!t || t.dead) { intent = { type: 'loot' }; return; }
      if (p.targetId !== t.id) { try { s.targetEntity(t.id); } catch {} }
      if (faceAndApproach(s, p, t, range)) {
        try { s.startAutoAttack(); } catch {}
        for (const id of (skill?.rotation || [])) {
          const a = abMap()[id];
          if (abilityReady(p, id) && d2(p.pos, t.pos) <= (a.range || range)) { try { s.castAbility(id); } catch {} break; }
        }
      }
    } else if (intent.type === 'flee') {
      const m = hostiles(p, s)[0];
      if (m) { s.moveInput.back = true; }  // back away from what we're facing (the threat)
      else intent = { type: 'idle' };
    } else if (intent.type === 'consume') {
      const inv = s.inventory || [];
      const wantMana = (skill?.resource === 'mana') && p.resource < p.maxResource * 0.5;
      for (const slot of inv) { const id = slot.itemId || slot.id; if (!id) continue;
        if (wantMana && /water|drink|tea|brew/i.test(id)) { try { s.useItem(id); } catch {} break; }
        if (p.hp < p.maxHp * 0.6 && /bread|cheese|meat|fish|food|trout|pike|carp/i.test(id)) { try { s.useItem(id); } catch {} break; } }
      intent = { type: 'idle' };
    } else if (intent.type === 'loot') {
      try { s.interact(); } catch {} intent = { type: 'idle' };
    } else if (intent.type === 'say') {
      try { s.chat('/s ' + (intent.text || 'hello')); } catch {} intent = { type: 'idle' };
    }
  }

  // ---- main loop ----
  async function tickBrain() {
    if (deciding) return; const obs = observe(); if (!obs) return;
    deciding = true; try { intent = await decide(obs); } finally { deciding = false; }
    setStatus();
  }
  function loop(ts) {
    if (ON) {
      execute();
      if (ts - lastDecide > CFG.DECIDE_MS) { lastDecide = ts; tickBrain(); }
    }
    requestAnimationFrame(loop);
  }

  // ---- skill loading + UI ----
  async function loadSkill() {
    const s = sim(); if (!s) return; const cls = s.player?.cls || s.player?.class; if (!cls || cls === lastClass) return;
    try { skill = await (await fetch(`${CFG.SKILL_BASE}/${cls}.json`)).json(); lastClass = cls; } catch (e) { skill = { rotation: [], abilities: [], rules: { meleeRange: 5 } }; }
    setStatus();
  }
  const pill = document.createElement('div');
  pill.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:99999;font:12px system-ui;padding:7px 11px;border-radius:9px;background:rgba(10,10,16,.85);color:#eee;border:1px solid #333;pointer-events:none';
  function setStatus() { pill.textContent = `🤖 ${ON ? 'PLAYING' : 'off'} · ${lastClass || '—'} · ${intent.type}${ON ? '' : '  (F8)'}`; pill.style.borderColor = ON ? '#e6bb6a' : '#333'; }
  addEventListener('keydown', e => { if (e.key === 'F8') { ON = !ON; if (!ON) { const s = sim(); if (s) clearMove(s); } if (ON) loadSkill(); setStatus(); } });

  // boot once the game exposes itself
  const boot = setInterval(() => { if (sim()) { clearInterval(boot); document.body.appendChild(pill); setStatus(); loadSkill(); requestAnimationFrame(loop); console.log('[woc-agent] ready — press F8 to take over'); } }, 800);
})();
