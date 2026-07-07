'use strict';
// $WOC token hub — #/woc. Live price, chart, market stats and a Buy button for the
// World of Claudecraft community token. All data is public: price/market data from
// DexScreener, supply from a Solana RPC. No backend, no keys.
(function () {
  const { el, esc, registerView, app } = window.WOC;
  const MINT = '3WjLscH2JsXLEFJZRA9z8ti8yRGxWGKbqymPd7UicRth';
  const RPCS = ['https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com'];

  const fmtUsd = (n) => n == null ? '—' : (n >= 1 ? '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '$' + Number(n).toPrecision(3));
  const fmtBig = (n) => n == null ? '—' : n >= 1e9 ? '$' + (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(1) + 'K' : '$' + n.toFixed(0);
  const fmtNum = (n) => n == null ? '—' : n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n);

  async function rpc(method, params) {
    for (const url of RPCS) {
      try { const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }); const j = await r.json(); if (!j.error) return j.result; } catch (e) {}
    }
    return null;
  }

  async function fetchStats() {
    let pair = null;
    try {
      const j = await (await fetch('https://api.dexscreener.com/latest/dex/tokens/' + MINT)).json();
      pair = (j.pairs || []).sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || null;
    } catch (e) {}
    const supRes = await rpc('getTokenSupply', [MINT]);
    const supply = supRes?.value ? Number(supRes.value.uiAmount) : null;
    return { pair, supply };
  }

  function stat(label, value, cls) { return `<div class="woc-stat"><span class="woc-stat-l">${label}</span><span class="woc-stat-v ${cls || ''}">${value}</span></div>`; }

  async function render(host) {
    host.innerHTML = '<div class="spinner"></div>';
    const { pair, supply } = await fetchStats();
    if (!pair) { host.innerHTML = '<p class="meta">Couldn\'t load market data right now — try again shortly.</p>'; return; }
    const chg = pair.priceChange?.h24;
    const chgCls = chg > 0 ? 'up' : chg < 0 ? 'down' : '';
    const chgStr = chg == null ? '—' : (chg > 0 ? '▲ ' : chg < 0 ? '▼ ' : '') + Math.abs(chg).toFixed(2) + '%';
    const jup = 'https://jup.ag/swap/SOL-' + MINT;
    const chart = `https://dexscreener.com/solana/${pair.pairAddress}?embed=1&loadChartSettings=0&theme=dark&chartTheme=dark&trades=0&info=0`;

    host.innerHTML = `
      <div class="woc-hero">
        <div class="woc-price">
          <div class="woc-price-usd">${fmtUsd(Number(pair.priceUsd))}</div>
          <div class="woc-chg ${chgCls}">${chgStr} <span class="meta">24h</span></div>
        </div>
        <div class="woc-buy">
          <a class="btn primary" href="${jup}" target="_blank" rel="noopener">Buy $WOC on Jupiter ↗</a>
          <a class="btn ghost" href="${pair.url}" target="_blank" rel="noopener">Chart on DexScreener ↗</a>
        </div>
        <p class="meta" style="margin-top:10px">New to Solana? <a data-go="#/doc/reference%2Fget-woc.md"><b>Full step-by-step: set up a wallet, fund it &amp; buy $WOC →</b></a></p>
      </div>
      <div class="woc-stats">
        ${stat('Market cap', fmtBig(pair.marketCap ?? pair.fdv))}
        ${stat('24h volume', fmtBig(pair.volume?.h24))}
        ${stat('Liquidity', fmtBig(pair.liquidity?.usd))}
        ${stat('Supply', supply ? fmtNum(supply) + ' WOC' : '—')}
        ${stat('DEX', esc(pair.dexId || 'pumpswap'))}
        ${stat('Pair', esc((pair.baseToken?.symbol || 'WOC') + ' / ' + (pair.quoteToken?.symbol || 'SOL')))}
      </div>
      <div class="woc-chart"><iframe src="${chart}" title="$WOC price chart" loading="lazy"></iframe></div>
      <div class="woc-contract">
        <span class="woc-stat-l">Contract</span>
        <code id="wocAddr">${MINT}</code>
        <button class="btn ghost" id="wocCopy">📋 Copy</button>
        <a class="btn ghost" href="https://solscan.io/token/${MINT}" target="_blank" rel="noopener">Solscan ↗</a>
      </div>
      <p class="meta woc-disclaimer">$WOC is a community meme token — not investment advice and not required to play or use this guide. Always do your own research. Support the guide directly on the <a data-go="#/donate">donate page</a> or see the <a data-go="#/supporters">Supporters Wall</a>.</p>`;

    const copy = document.getElementById('wocCopy');
    copy.onclick = async () => { try { await navigator.clipboard.writeText(MINT); copy.textContent = '✓ Copied!'; setTimeout(() => (copy.textContent = '📋 Copy'), 1600); } catch (e) {} };
  }

  function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Community token</span>
      <h1 class="reveal">$WOC <span class="woc-sym">World of Claudecraft</span></h1>
      <p class="sub reveal">The community token on Solana — live price, chart and where to trade it. Tipping the guide in $WOC? See the <a data-go="#/donate">donate page</a>.</p>
      <div id="wocHub"></div>
    </div></section>`));
    render(document.getElementById('wocHub'));
  }
  registerView('woc', view);
})();
