'use strict';
// Donate — #/donate. Tip the free guide in SOL or $WOC on Solana.
(function () {
  const { el, registerView, app } = window.WOC;
  const ADDR = 'CQf6BnKoB18znc7EJ9zHZ3b7ARqhiECCpX8jVbhs97h9';

  function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Support the guide</span>
      <h1 class="reveal">Donate 💜</h1>
      <p class="sub reveal">World of Claudecraft is a free, fan-made field guide. If it's helped you, a tip keeps it running — thank you!</p>
      <div class="donate-card">
        <div class="donate-net">◎ <b>Solana</b> <span class="meta">— send <b>SOL</b> or <b>$WOC</b> to:</span></div>
        <div class="donate-addr" id="donAddr">${ADDR}</div>
        <div class="donate-actions">
          <button class="btn primary" id="donCopy">📋 Copy address</button>
          <a class="btn ghost" href="https://solscan.io/account/${ADDR}" target="_blank" rel="noopener">View on Solscan ↗</a>
        </div>
        <img class="donate-qr" src="donate-sol-qr.png" alt="Solana donation address QR code" loading="lazy" width="200" height="200">
        <p class="meta donate-note">Scan with any Solana wallet (Phantom, Solflare…). <b>SOL</b> and <b>$WOC</b> share the same address.</p>
      </div>
    </div></section>`));
    const btn = document.getElementById('donCopy');
    btn.onclick = async () => {
      try { await navigator.clipboard.writeText(ADDR); btn.textContent = '✓ Copied!'; setTimeout(() => (btn.textContent = '📋 Copy address'), 1800); }
      catch {
        const r = document.createRange(); r.selectNode(document.getElementById('donAddr'));
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      }
    };
  }
  registerView('donate', view);
})();
