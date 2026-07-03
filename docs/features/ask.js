'use strict';
// Ask the Guide — #/ask. A chat that answers World of Claudecraft questions,
// grounded in the field guide via client-side retrieval (search.json + matched
// pages' markdown). Two ways to generate the answer:
//   • LOCAL  — a tiny model (Qwen2.5-0.5B) runs in the browser via WebLLM/WebGPU.
//              No key, no server, private. One-time ~350 MB weight download (cached).
//   • REMOTE — if window.ASK_ENDPOINT is set (a Cloudflare Worker holding the
//              OpenRouter key), we POST to it instead. Optional.
(function () {
  const { el, esc, registerView, loadJSON, getMd, app } = window.WOC;
  const ENDPOINT = window.ASK_ENDPOINT || '';
  const MODELS = [
    { id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', label: 'Tiny — SmolLM2 360M (~180 MB, fastest)' },
    { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', label: 'Small — Qwen2.5 0.5B (~270 MB, default)' },
    { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Medium — Llama 3.2 1B (~600 MB)' },
    { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Best — Qwen2.5 1.5B (~950 MB)' },
  ];
  let MODEL = localStorage.getItem('wc_ai_model') || 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
  const WEBLLM_CDN = 'https://esm.run/@mlc-ai/web-llm';
  const STOP = new Set('the a an of to in for and or is are how do i what where which when who whats can with on at get best my me you it this that as by from'.split(' '));
  const SYSTEM = `You are the friendly in-game guide for "World of Claudecraft", a fantasy MMORPG. Answer the player's question using ONLY the CONTEXT provided, which is drawn from the official field guide. Be concise and specific — quote item names, zones, levels and quest names exactly. If the context doesn't contain the answer, say you don't have that in the guide yet. Never invent stats, drops or coordinates. Use short paragraphs or bullets. Do not mention "context".`;

  let INDEX = null, engine = null, engineState = 'none'; // none | loading | ready | error
  const history = [];

  const tokens = (s) => (s.toLowerCase().match(/[a-z0-9']+/g) || []).filter(w => w.length > 1 && !STOP.has(w));

  function retrieve(q) {
    const qt = tokens(q); if (!qt.length) return [];
    return INDEX.map(e => {
      const nt = tokens(e.n + ' ' + e.t); let s = 0;
      for (const w of qt) { if (nt.includes(w)) s += 3; else if (nt.some(x => x.includes(w) || w.includes(x))) s += 1; }
      return { e, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 14).map(x => x.e);
  }

  async function buildContext(q, budget) {
    const hits = retrieve(q);
    const lines = hits.map(e => `- ${e.t}: ${e.n}`);
    const docs = hits.filter(e => /^#\/doc\/.+\.md/.test(e.go)).slice(0, budget > 6000 ? 2 : 1);
    const per = budget > 6000 ? 2600 : 1500;
    const excerpts = [];
    for (const d of docs) {
      const p = decodeURIComponent((/#\/doc\/([^#]+?\.md)/.exec(d.go) || [])[1] || '');
      if (!p) continue;
      try { const md = await getMd(p); excerpts.push(`### ${d.n}\n${md.replace(/\s+/g, ' ').slice(0, per)}`); } catch (e) {}
    }
    const ctx = `GUIDE ENTRIES MATCHING THE QUESTION:\n${lines.join('\n')}\n\n${excerpts.length ? 'PAGE EXCERPTS:\n' + excerpts.join('\n\n') : ''}`.slice(0, budget);
    return { ctx, sources: hits.slice(0, 6) };
  }

  function messagesFor(q, ctx) {
    return [
      { role: 'system', content: SYSTEM },
      ...history.filter(m => m.content).slice(-6),
      { role: 'user', content: `CONTEXT:\n${ctx}\n\nQUESTION: ${q}` },
    ];
  }

  function bubble(role, html) {
    const b = el(`<div class="ask-msg ask-${role}"><div class="ask-bub">${html}</div></div>`);
    document.getElementById('askLog').append(b); b.scrollIntoView({ block: 'end' }); return b;
  }
  const render = (t) => window.marked ? window.marked.parse(t) : esc(t);
  const srcLine = (s) => s.length ? `<div class="ask-src">Sources: ${s.map(x => `<a data-go="${esc(x.go)}">${esc(x.n)}</a>`).join(' · ')}</div>` : '';

  // ---- local model (WebLLM) ----
  function setStatus(msg, pct) {
    const s = document.getElementById('askStatus'); if (!s) return;
    s.innerHTML = msg + (pct != null ? ` <span class="ask-bar"><i style="width:${Math.round(pct * 100)}%"></i></span>` : '');
  }
  async function loadLocal() {
    if (engineState === 'loading' || engineState === 'ready') return;
    if (!navigator.gpu) { setStatus('⚠ This browser has no WebGPU — local AI needs a recent Chrome/Edge on desktop, or use the remote guide.'); engineState = 'error'; return; }
    engineState = 'loading';
    const btn = document.getElementById('askLoad'); if (btn) btn.disabled = true;
    setStatus('Loading the local guide model… first time downloads ~350 MB (cached after).', 0);
    try {
      const webllm = await import(WEBLLM_CDN);
      // Cache weights in OPFS (Origin Private File System). Why not the alternatives:
      //   • "cache" (Cache API) rejects HuggingFace's redirected shard responses
      //     → "Cache.add() encountered a network error".
      //   • "indexeddb" can store the weights but fails to read very large blobs back
      //     → "Failed to read large IndexedDB value" (a Chromium limitation).
      // OPFS is built for large binary files and avoids both. The selector is
      // `cacheBackend` ("cache" | "indexeddb" | "cross-origin" | "opfs") in current WebLLM.
      const appConfig = { ...webllm.prebuiltAppConfig, cacheBackend: 'opfs' };
      engine = await webllm.CreateMLCEngine(MODEL, {
        appConfig,
        initProgressCallback: (r) => setStatus(esc(r.text || 'Loading…'), typeof r.progress === 'number' ? r.progress : null),
      });
      engineState = 'ready';
      localStorage.setItem('wc_ai_local', '1');
      setStatus('✅ Local guide model ready — ask away. Runs privately in your browser.');
      const b = document.getElementById('askBadge'); if (b) { b.textContent = '🖥️ Local model'; b.hidden = false; }
    } catch (e) {
      engineState = 'error';
      setStatus('⚠ Couldn\'t load the local model: ' + esc(e.message || e));
      if (btn) btn.disabled = false;
    }
  }

  async function generate(q, thinking) {
    const wantLocal = engineState === 'ready' || (!ENDPOINT);
    if (wantLocal) {
      if (engineState !== 'ready') { await loadLocal(); if (engineState !== 'ready') throw new Error('Local model not loaded yet — tap “Run AI locally”.'); }
      const { ctx, sources } = await buildContext(q, 4000);
      const stream = await engine.chat.completions.create({ messages: messagesFor(q, ctx), temperature: 0.3, max_tokens: 640, stream: true });
      let acc = '';
      const bub = thinking.querySelector('.ask-bub');
      for await (const chunk of stream) { acc += chunk.choices?.[0]?.delta?.content || ''; bub.innerHTML = render(acc); thinking.scrollIntoView({ block: 'end' }); }
      history.push({ role: 'assistant', content: acc });
      bub.innerHTML = render(acc) + srcLine(sources);
      return;
    }
    // remote
    const { ctx, sources } = await buildContext(q, 12000);
    const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: q, context: ctx, history }) });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const ans = data.answer || 'I couldn\'t come up with an answer.';
    history.push({ role: 'assistant', content: ans });
    thinking.querySelector('.ask-bub').innerHTML = render(ans) + srcLine(sources);
  }

  async function send(q) {
    if (!q.trim()) return;
    bubble('user', esc(q));
    history.push({ role: 'user', content: q });
    const thinking = bubble('bot', '<span class="ask-typing"><i></i><i></i><i></i></span>');
    try { await generate(q, thinking); }
    catch (e) { thinking.querySelector('.ask-bub').innerHTML = `<span class="meta">⚠ ${esc(e.message)}</span>`; }
  }

  const SUGGEST = ['Where do I start as a new Warrior?', 'What quests are in Eastbrook Vale?', 'Best gear for a level 20 Mage?', 'How does lockpicking work?'];

  async function view() {
    app.innerHTML = '';
    const gpu = !!navigator.gpu;
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Beta</span>
      <h1 class="reveal">Ask the Guide 🔮 <span class="ask-badge" id="askBadge" hidden></span></h1>
      <p class="sub reveal">Ask anything about World of Claudecraft — quests, classes, gear, zones. Answers come straight from this field guide${gpu ? ', and can run <b>100% private in your browser</b>' : ''}.</p>
      <div class="ask-box">
        <div class="ask-runner">
          ${gpu ? `<select id="askModel" class="ask-model">${MODELS.map(m => `<option value="${m.id}"${m.id === MODEL ? ' selected' : ''}>${esc(m.label)}</option>`).join('')}</select>` : ''}
          <button class="btn ${ENDPOINT ? 'ghost' : 'primary'}" id="askLoad">🖥️ Run AI locally ${gpu ? '' : '(needs WebGPU)'}</button>
          <span class="meta" id="askStatus">${gpu ? 'Loads the model into your browser — no account, no server, fully private. Weights are cached, so switching sizes only downloads once each.' : 'Local AI needs a recent desktop Chrome/Edge (WebGPU).' + (ENDPOINT ? '' : ' The remote guide isn\'t configured yet.')}</span>
        </div>
        <div class="ask-log" id="askLog"></div>
        <div class="ask-suggest" id="askSuggest">${SUGGEST.map(s => `<button class="ask-chip">${esc(s)}</button>`).join('')}</div>
        <form class="ask-form" id="askForm">
          <input id="askInput" autocomplete="off" placeholder="Ask the guide…" maxlength="800">
          <button class="btn primary" type="submit">Ask</button>
        </form>
        <p class="meta ask-note">AI can be wrong — double-check anything important against the linked pages.</p>
      </div>
    </div></section>`));

    if (!INDEX) { try { INDEX = await loadJSON('search.json'); } catch (e) { INDEX = []; } }
    if (!Array.isArray(INDEX)) INDEX = INDEX.items || INDEX.entries || [];

    const sel = document.getElementById('askModel');
    if (sel) sel.addEventListener('change', () => {
      MODEL = sel.value; localStorage.setItem('wc_ai_model', MODEL);
      engine = null; engineState = 'none';
      const b = document.getElementById('askBadge'); if (b) b.hidden = true;
      setStatus('Model changed — tap “Run AI locally” to load ' + esc(sel.options[sel.selectedIndex].text.split('—')[1] || MODEL) + '.');
    });
    document.getElementById('askLoad').addEventListener('click', loadLocal);
    const form = document.getElementById('askForm'), input = document.getElementById('askInput');
    form.addEventListener('submit', e => { e.preventDefault(); const q = input.value; input.value = ''; document.getElementById('askSuggest').style.display = 'none'; send(q); });
    document.querySelectorAll('.ask-chip').forEach(c => c.addEventListener('click', () => { document.getElementById('askSuggest').style.display = 'none'; send(c.textContent); }));

    // auto-resume local model if the user opted in before (weights are already cached → fast)
    if (gpu && localStorage.getItem('wc_ai_local') === '1') loadLocal();
  }
  registerView('ask', view);
})();
