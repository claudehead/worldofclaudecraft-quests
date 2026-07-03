// "Ask the Guide" — Cloudflare Worker proxy for the World of Claudecraft guide AI.
//
// The website is a static HTTPS site, so it CANNOT hold the OpenRouter key without
// exposing it. This Worker sits in front of OpenRouter: the browser sends only the
// user's question + retrieved guide context; the Worker adds the secret key, pins the
// model + system prompt server-side (so the key can't be abused as a general LLM),
// and returns the answer.
//
// DEPLOY (one time):
//   1. dash.cloudflare.com → Workers & Pages → Create → Worker → paste this file.
//   2. Settings → Variables → add a *Secret* named  OPENROUTER_KEY  = your OpenRouter key.
//   3. (optional) change MODEL below.
//   4. Deploy. Copy the worker URL (e.g. https://ask-guide.<you>.workers.dev)
//      and set  window.ASK_ENDPOINT  to it in docs/index.html.

const MODEL = 'poolside/laguna-xs-2.1:free';
const ALLOW_ORIGINS = ['https://claudehead.com', 'https://www.claudehead.com', 'http://localhost:8100'];

const SYSTEM = `You are the friendly in-game guide for "World of Claudecraft", a fantasy MMORPG.
Answer the player's question using ONLY the CONTEXT provided below, which is drawn from the
official field guide. Be concise and specific — quote item names, zones, levels, quest names
and numbers exactly as they appear. If the context doesn't contain the answer, say you don't
have that in the guide yet and suggest the closest relevant page. Never invent stats, drops,
or coordinates. Format with short paragraphs or bullet points. Do not mention "context".`;

function cors(origin) {
  const allow = ALLOW_ORIGINS.includes(origin) ? origin : ALLOW_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const h = cors(origin);
    if (request.method === 'OPTIONS') return new Response(null, { headers: h });
    if (request.method !== 'POST') return new Response('POST only', { status: 405, headers: h });

    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400, h); }
    const question = String(body.question || '').slice(0, 800).trim();
    const context = String(body.context || '').slice(0, 12000);
    const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
    if (!question) return json({ error: 'empty question' }, 400, h);
    if (!env.OPENROUTER_KEY) return json({ error: 'server not configured' }, 500, h);

    const messages = [
      { role: 'system', content: SYSTEM },
      ...history
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && m.content)
        .map(m => ({ role: m.role, content: String(m.content).slice(0, 2000) })),
      { role: 'user', content: `CONTEXT:\n${context}\n\nQUESTION: ${question}` },
    ];

    let r;
    try {
      r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://claudehead.com',
          'X-Title': 'World of Claudecraft Guide',
        },
        body: JSON.stringify({ model: MODEL, messages, temperature: 0.3, max_tokens: 700 }),
      });
    } catch (e) {
      return json({ error: 'upstream unreachable' }, 502, h);
    }
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      return json({ error: `openrouter ${r.status}`, detail: t.slice(0, 300) }, 502, h);
    }
    const data = await r.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || '';
    return json({ answer, model: MODEL }, 200, h);
  },
};

function json(obj, status, h) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...h } });
}
