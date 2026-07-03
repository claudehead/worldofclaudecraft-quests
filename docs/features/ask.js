'use strict';
// Ask the Guide — #/ask. A chat that answers World of Claudecraft questions.
// Retrieval runs in the browser (over search.json + the matched pages' markdown);
// the assembled context + question go to a Cloudflare Worker (window.ASK_ENDPOINT)
// which holds the OpenRouter key and calls the model. The key is never in the client.
(function () {
  const { el, esc, registerView, loadJSON, getMd, app } = window.WOC;
  const ENDPOINT = window.ASK_ENDPOINT || '';
  const STOP = new Set('the a an of to in for and or is are how do i what where which when who whats can with on at get best my me you it this that as by from'.split(' '));
  let INDEX = null;
  const history = [];

  const tokens = (s) => (s.toLowerCase().match(/[a-z0-9']+/g) || []).filter(w => w.length > 1 && !STOP.has(w));

  function retrieve(q) {
    const qt = tokens(q); if (!qt.length) return [];
    const scored = INDEX.map(e => {
      const nt = tokens(e.n + ' ' + e.t);
      let s = 0;
      for (const w of qt) { if (nt.includes(w)) s += 3; else if (nt.some(x => x.includes(w) || w.includes(x))) s += 1; }
      return { e, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    return scored.slice(0, 14).map(x => x.e);
  }

  async function buildContext(q) {
    const hits = retrieve(q);
    const lines = hits.map(e => `- ${e.t}: ${e.n}`);
    // pull markdown from up to 2 top doc-backed hits for grounded detail
    const docs = hits.filter(e => /^#\/doc\/.+\.md/.test(e.go)).slice(0, 2);
    const excerpts = [];
    for (const d of docs) {
      const p = (decodeURIComponent((/#\/doc\/([^#]+?\.md)/.exec(d.go) || [])[1] || ''));
      if (!p) continue;
      try { const md = await getMd(p); excerpts.push(`### ${d.n}\n${md.replace(/\s+/g, ' ').slice(0, 2600)}`); } catch (e) {}
    }
    const ctx = `GUIDE ENTRIES MATCHING THE QUESTION:\n${lines.join('\n')}\n\n${excerpts.length ? 'PAGE EXCERPTS:\n' + excerpts.join('\n\n') : ''}`;
    return { ctx, sources: hits.slice(0, 6) };
  }

  function bubble(role, html) {
    const b = el(`<div class="ask-msg ask-${role}"><div class="ask-bub">${html}</div></div>`);
    document.getElementById('askLog').append(b);
    b.scrollIntoView({ block: 'end' });
    return b;
  }

  async function send(q) {
    if (!q.trim()) return;
    bubble('user', esc(q));
    history.push({ role: 'user', content: q });
    const thinking = bubble('bot', '<span class="ask-typing"><i></i><i></i><i></i></span>');
    try {
      if (!ENDPOINT) throw new Error('The AI guide isn\'t switched on yet (no endpoint configured).');
      const { ctx, sources } = await buildContext(q);
      const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: q, context: ctx, history }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const ans = data.answer || 'I couldn\'t come up with an answer.';
      history.push({ role: 'assistant', content: ans });
      const rendered = window.marked ? window.marked.parse(ans) : esc(ans);
      let srcHtml = '';
      if (sources.length) srcHtml = `<div class="ask-src">Sources: ${sources.map(s => `<a data-go="${esc(s.go)}">${esc(s.n)}</a>`).join(' · ')}</div>`;
      thinking.querySelector('.ask-bub').innerHTML = rendered + srcHtml;
    } catch (e) {
      thinking.querySelector('.ask-bub').innerHTML = `<span class="meta">⚠ ${esc(e.message)}</span>`;
    }
  }

  const SUGGEST = ['Where do I start as a new Warrior?', 'What quests are in Eastbrook Vale?', 'Best gear for a level 20 Mage?', 'How does lockpicking work?', 'Where can I fish for Glimmerfin Koi?'];

  async function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Beta</span>
      <h1 class="reveal">Ask the Guide 🔮</h1>
      <p class="sub reveal">Ask anything about World of Claudecraft — quests, classes, gear, zones. Answers come straight from this field guide.</p>
      <div class="ask-box">
        <div class="ask-log" id="askLog"></div>
        <div class="ask-suggest" id="askSuggest">${SUGGEST.map(s => `<button class="ask-chip">${esc(s)}</button>`).join('')}</div>
        <form class="ask-form" id="askForm">
          <input id="askInput" autocomplete="off" placeholder="Ask the guide…" maxlength="800">
          <button class="btn primary" type="submit">Ask</button>
        </form>
        <p class="meta ask-note">AI can be wrong — double-check anything important against the linked pages.${ENDPOINT ? '' : ' <b>The guide AI isn\'t live yet.</b>'}</p>
      </div>
    </div></section>`));

    if (!INDEX) { try { INDEX = await loadJSON('search.json'); } catch (e) { INDEX = []; } }
    if (!Array.isArray(INDEX)) INDEX = INDEX.items || INDEX.entries || [];

    const form = document.getElementById('askForm'), input = document.getElementById('askInput');
    form.addEventListener('submit', e => { e.preventDefault(); const q = input.value; input.value = ''; document.getElementById('askSuggest').style.display = 'none'; send(q); });
    document.querySelectorAll('.ask-chip').forEach(c => c.addEventListener('click', () => { document.getElementById('askSuggest').style.display = 'none'; send(c.textContent); }));
  }
  registerView('ask', view);
})();
