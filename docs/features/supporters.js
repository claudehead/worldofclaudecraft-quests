'use strict';
// Live Supporters Wall — #/supporters
// Reads the donation wallet's recent incoming SOL tips straight from the Solana
// blockchain (public RPC, no backend) and shows a leaderboard + recent tips,
// pulling the sender's name from the on-chain memo left with each tip.
(function () {
  const { el, esc, registerView, app } = window.WOC;
  const WALLET = 'CQf6BnKoB18znc7EJ9zHZ3b7ARqhiECCpX8jVbhs97h9';
  const RPCS = ['https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com'];

  async function rpc(method, params) {
    let lastErr;
    for (const url of RPCS) {
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
        const j = await res.json();
        if (j.error) throw new Error(j.error.message);
        return j.result;
      } catch (e) { lastErr = e; }
    }
    throw lastErr;
  }

  function parseTip(tx) {
    if (!tx || (tx.meta && tx.meta.err)) return null;
    const msg = tx.transaction.message;
    // Only top-level instructions: a direct wallet→wallet tip. This deliberately
    // skips AMM/pump.fun sell-payouts (which arrive via inner instructions) so the
    // leaderboard shows real supporters, not trading proceeds.
    const ins = msg.instructions || [];
    let sol = 0, from = '', memo = '';
    for (const i of ins) {
      if (i.program === 'system' && i.parsed && i.parsed.type === 'transfer' && i.parsed.info.destination === WALLET) {
        sol += i.parsed.info.lamports / 1e9; from = i.parsed.info.source;
      }
      if (i.program === 'spl-memo') memo = typeof i.parsed === 'string' ? i.parsed : (i.parsed && i.parsed.toString ? i.parsed.toString() : '');
    }
    if (sol <= 0) return null;
    const name = (memo.match(/From:\s*([^—|]+)/i) || [])[1]?.trim() || '';
    return { sol, from, name, memo: memo.replace(/^From:[^—|]*[—|]?\s*/i, '').trim(), sig: tx.transaction.signatures[0], time: tx.blockTime };
  }

  const short = (a) => a ? a.slice(0, 4) + '…' + a.slice(-4) : 'anon';
  const ago = (t) => { if (!t) return ''; const s = Date.now() / 1000 - t; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago'; };

  async function load(host) {
    host.innerHTML = '<div class="spinner"></div>';
    let tips = [];
    try {
      const sigs = await rpc('getSignaturesForAddress', [WALLET, { limit: 25 }]);
      const txs = await Promise.allSettled((sigs || []).map(s => rpc('getTransaction', [s.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }])));
      tips = txs.filter(r => r.status === 'fulfilled').map(r => parseTip(r.value)).filter(Boolean);
    } catch (e) {
      host.innerHTML = `<p class="meta">Couldn't reach the Solana network right now — try again in a bit. (${esc(e.message)})</p>`;
      return;
    }
    // leaderboard: group by name (or source wallet)
    const board = {};
    for (const t of tips) { const k = t.name || short(t.from); (board[k] = board[k] || { name: k, total: 0, n: 0 }); board[k].total += t.sol; board[k].n++; }
    const top = Object.values(board).sort((a, b) => b.total - a.total).slice(0, 10);
    const total = tips.reduce((s, t) => s + t.sol, 0);

    host.innerHTML = '';
    if (!tips.length) { host.append(el(`<p class="meta">No tips yet — <a data-go="#/donate">be the first</a> 💜</p>`)); return; }
    host.append(el(`
      <div class="sup-summary">💜 <b>${total.toFixed(2)} SOL</b> from <b>${tips.length}</b> recent tips</div>
      <div class="sup-cols">
        <div class="sup-col"><h3>🏆 Top supporters</h3><ol class="sup-board">${top.map(s => `<li><span class="sup-name">${esc(s.name)}</span><span class="sup-amt">${s.total.toFixed(2)} SOL</span></li>`).join('')}</ol></div>
        <div class="sup-col"><h3>🕒 Recent tips</h3><ul class="sup-recent">${tips.map(t => `<li><a href="https://solscan.io/tx/${t.sig}" target="_blank" rel="noopener"><span class="sup-name">${esc(t.name || short(t.from))}</span> <span class="sup-amt">${t.sol.toFixed(3)} SOL</span> <span class="meta">${ago(t.time)}</span></a>${t.memo ? `<div class="sup-msg">“${esc(t.memo)}”</div>` : ''}</li>`).join('')}</ul></div>
      </div>`));
  }

  function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Thank you 💜</span>
      <h1 class="reveal">Supporters Wall</h1>
      <p class="sub reveal">Live from the Solana blockchain — everyone who's tipped the guide (names come from the note attached to each tip). <a data-go="#/donate">Leave a tip →</a></p>
      <div id="supWall"></div>
    </div></section>`));
    load(document.getElementById('supWall'));
  }
  registerView('supporters', view);
})();
