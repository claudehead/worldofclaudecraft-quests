'use strict';
// Earn SOL by Playing — #/earn. A guide to the $WOC holder play-and-earn program:
// hold at least $20 of $WOC, play World of Claudecraft, earn SOL rewards. Includes a
// live, read-only eligibility checker (reads a wallet's $WOC balance × price from the
// chain — no keys, no connection required) and honest risk disclaimers.
(function () {
  const { el, esc, registerView, app } = window.WOC;
  const MINT = '3WjLscH2JsXLEFJZRA9z8ti8yRGxWGKbqymPd7UicRth';
  const THRESHOLD = 20; // USD of $WOC to be eligible
  // window.SOLANA_RPC lets the site owner drop in a reliable keyed RPC (e.g. a free
  // Helius URL) for a rock-solid live check; the public endpoints are best-effort.
  const RPCS = [window.SOLANA_RPC, 'https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com'].filter(Boolean);

  async function rpc(method, params) {
    for (const url of RPCS) {
      try {
        const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
        if (!r.ok) continue;
        const j = await r.json();
        if (!j.error) return { ok: true, result: j.result };
      } catch (e) {}
    }
    return { ok: false };
  }
  async function wocPrice() {
    try { const j = await (await fetch('https://api.dexscreener.com/latest/dex/tokens/' + MINT)).json(); const p = (j.pairs || []).sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]; return p ? +p.priceUsd : null; } catch (e) { return null; }
  }
  // returns a number (balance) on success, or null if every RPC failed (≠ 0 balance)
  async function wocBalance(owner) {
    const res = await rpc('getTokenAccountsByOwner', [owner, { mint: MINT }, { encoding: 'jsonParsed' }]);
    if (!res.ok) return null;
    return (res.result.value || []).reduce((s, a) => s + (a.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);
  }
  const validAddr = (a) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);

  async function check(addr) {
    const out = document.getElementById('earnOut');
    if (!out) return;
    out.innerHTML = '<div class="spinner"></div>';
    if (!validAddr(addr)) { out.innerHTML = '<p class="meta">That doesn\'t look like a Solana address.</p>'; return; }
    const [price, bal] = await Promise.all([wocPrice(), wocBalance(addr).catch(() => null)]);
    if (bal === null) {
      out.innerHTML = `<div class="earn-result no"><div class="earn-big">⚠ Couldn't reach Solana</div><p class="meta">The public network endpoint is busy right now. Check your $WOC balance directly on <a href="https://solscan.io/account/${esc(addr)}#portfolio" target="_blank" rel="noopener">Solscan →</a> — you're eligible if it's worth $${THRESHOLD} or more.</p></div>`;
      return;
    }
    if (price == null) { out.innerHTML = '<p class="meta">Couldn\'t fetch the $WOC price right now — try again shortly.</p>'; return; }
    const usd = bal * price;
    const ok = usd >= THRESHOLD;
    out.innerHTML = `<div class="earn-result ${ok ? 'ok' : 'no'}">
      <div class="earn-big">${ok ? '✅ Eligible' : '⛔ Not yet eligible'}</div>
      <div class="earn-rows">
        <div><span class="meta">$WOC held</span><b>${bal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b></div>
        <div><span class="meta">Value</span><b>$${usd.toFixed(2)}</b></div>
        <div><span class="meta">Requirement</span><b>$${THRESHOLD}</b></div>
      </div>
      ${ok ? '<p class="meta">You meet the holding requirement. Keep playing to earn rewards.</p>' : `<p class="meta">You need about <b>$${(THRESHOLD - usd).toFixed(2)}</b> more in $WOC. <a data-go="#/woc">Get $WOC →</a></p>`}
    </div>`;
  }

  const STEPS = [
    ['①', 'Get $WOC', 'Buy the $WOC community token on Solana. New to crypto? Follow the <a data-go="#/doc/reference%2Fget-woc.md"><b>wallet setup &amp; buy guide</b></a> (wallet → fund → swap), or see the <a data-go="#/woc">$WOC hub</a> for live price and a buy link.'],
    ['②', 'Hold at least $20', 'Keep at least <b>$20 worth of $WOC</b> in your Solana wallet. That\'s your key to the play-and-earn program — check your status below any time.'],
    ['③', 'Play World of Claudecraft', 'Jump into the game and play. <a href="https://claudehead.github.io/woc-play/" target="_blank" rel="noopener">Play here ▶</a>. Your activity is what earns rewards — the more you play, the more you earn.'],
    ['④', 'Earn SOL rewards', 'Eligible holders share in <b>SOL rewards</b> paid from the community treasury. Rewards are distributed periodically to the wallet you hold $WOC in.'],
  ];

  const FAQ = [
    ['How much SOL can I earn?', 'Rewards are variable — they depend on how much you play, how many eligible players there are, and the size of the community treasury that period. There is no fixed or guaranteed amount, and rewards can change or pause at any time.'],
    ['Do I have to lock or send my $WOC?', 'No. You simply hold $WOC in your own wallet. You never send it anywhere, connect nothing that can move funds, and keep full custody at all times. Eligibility is checked by reading your public wallet balance.'],
    ['Which wallet gets paid?', 'The same Solana wallet that holds your $WOC. Make sure you play and hold from a wallet you control.'],
    ['What if my $WOC value drops below $20?', 'Eligibility is based on live value, so if your holdings fall under $20 you\'d pause earning until you\'re back above the threshold. Use the checker above to see where you stand.'],
    ['Is this guaranteed income?', 'No. This is a community rewards program built around a volatile memecoin — not an investment, salary, or guaranteed yield. Only ever hold what you can afford to lose.'],
  ];

  function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">$WOC holders</span>
      <h1 class="reveal">Earn SOL by Playing 🎮◎</h1>
      <p class="sub reveal">Hold at least <b>$20 of $WOC</b>, play World of Claudecraft, and earn <b>SOL rewards</b> from the community treasury. Here's how it works.</p>

      <div class="earn-steps">${STEPS.map(s => `<div class="earn-step"><span class="earn-num">${s[0]}</span><div><h3>${esc(s[1])}</h3><p class="meta">${s[2]}</p></div></div>`).join('')}</div>

      <div class="earn-check">
        <h3>Am I eligible? 🔍</h3>
        <p class="meta">Paste your Solana wallet address to check your $WOC holdings. This only <b>reads</b> your public balance — it can't touch your funds.</p>
        <div class="earn-checkrow">
          <input id="earnAddr" placeholder="Your Solana wallet address" autocomplete="off">
          <button class="btn primary" id="earnBtn">Check</button>
          ${window.solana && window.solana.isPhantom ? '<button class="btn ghost" id="earnPhantom">Connect Phantom</button>' : ''}
        </div>
        <div id="earnOut"></div>
      </div>

      <h2 class="reveal" style="margin-top:2rem">FAQ</h2>
      ${FAQ.map(f => `<details class="earn-faq"><summary>${esc(f[0])}</summary><p class="meta">${esc(f[1])}</p></details>`).join('')}

      <div class="earn-disc">
        <b>⚠ Important.</b> This is a community rewards program tied to <b>$WOC</b>, a volatile memecoin — <b>not</b> an investment, security, salary, or guaranteed return. Rewards are discretionary, variable, and may change or stop at any time. Nothing here is financial advice. Crypto is risky; only hold what you can afford to lose, and do your own research. Availability and rules may vary by region and are subject to change.
      </div>
    </div></section>`));

    const addr = document.getElementById('earnAddr');
    document.getElementById('earnBtn').onclick = () => check(addr.value.trim());
    addr.addEventListener('keydown', e => { if (e.key === 'Enter') check(addr.value.trim()); });
    const ph = document.getElementById('earnPhantom');
    if (ph) ph.onclick = async () => { try { const r = await window.solana.connect(); addr.value = r.publicKey.toString(); check(addr.value); } catch (e) {} };
  }
  registerView('earn', view);
})();
