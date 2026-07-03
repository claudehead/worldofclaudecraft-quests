'use strict';
// Donate — #/donate. Tip the free guide in SOL or $WOC on Solana, with an optional
// "from" + message attached to the transaction (on-chain memo) via a Solana Pay link.
(function () {
  const { el, esc, registerView, app } = window.WOC;
  const ADDR = 'CQf6BnKoB18znc7EJ9zHZ3b7ARqhiECCpX8jVbhs97h9';
  const TIERS = [
    { amt: 0.05, ico: '☕', label: 'Coffee' },
    { amt: 0.1, ico: '🍕', label: 'Snack' },
    { amt: 0.25, ico: '💜', label: 'Generous' },
    { amt: 0.5, ico: '🧾', label: 'A month of AI bills' },
  ];

  function payLink(amt, from, msg) {
    const p = new URLSearchParams();
    if (amt && +amt > 0) p.set('amount', String(amt));
    p.set('label', 'World of Claudecraft');
    const memo = [from && ('From: ' + from), msg].filter(Boolean).join(' — ').slice(0, 180);
    if (memo) { p.set('message', memo); p.set('memo', memo); }
    const q = p.toString();
    return 'solana:' + ADDR + (q ? '?' + q : '');
  }

  function view() {
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <span class="eyebrow reveal">Support the guide</span>
      <h1 class="reveal">Donate 💜</h1>
      <p class="sub reveal">World of Claudecraft is a free, fan-made field guide. Tips keep it running — they go straight toward the <b>monthly AI &amp; hosting bills</b> that regenerate the guide and power the Discord bot. Thank you!</p>
      <div class="donate-card">
        <div class="donate-net">◎ <b>Solana</b> <span class="meta">— SOL or $WOC to:</span></div>
        <div class="donate-addr" id="donAddr">${ADDR}</div>
        <div class="donate-actions">
          <button class="btn ghost" id="donCopy">📋 Copy address</button>
          <a class="btn ghost" href="https://solscan.io/account/${ADDR}" target="_blank" rel="noopener">Solscan ↗</a>
        </div>

        <div class="donate-tiers" id="donTiers">
          ${TIERS.map(t => `<button class="tier" data-amt="${t.amt}"><span class="tier-ico">${t.ico}</span><span class="tier-amt">${t.amt} SOL</span><span class="tier-lbl">${esc(t.label)}</span></button>`).join('')}
        </div>
        <div class="donate-fields">
          <input id="donAmt" type="number" step="0.01" min="0" placeholder="Custom amount (SOL)">
          <input id="donFrom" maxlength="60" placeholder="From — your name / handle (optional)">
          <input id="donMsg" maxlength="120" placeholder="A message with your tip (optional)">
        </div>
        <a class="btn primary donate-send" id="donSend" href="${payLink()}">💜 Send tip in your wallet</a>
        <p class="meta donate-note">Opens Phantom / Solflare with the amount and your name+message attached to the transaction (an on-chain memo). No wallet on desktop? Copy the address above and send from your phone.</p>
        <img class="donate-qr" src="donate-sol-qr.png" alt="Solana donation address QR code" loading="lazy" width="180" height="180">
      </div>
      <div id="tipwall"></div>
    </div></section>`));

    const amtEl = document.getElementById('donAmt'), fromEl = document.getElementById('donFrom'), msgEl = document.getElementById('donMsg'), send = document.getElementById('donSend');
    const refresh = () => { send.href = payLink(amtEl.value, fromEl.value.trim(), msgEl.value.trim()); };
    [amtEl, fromEl, msgEl].forEach(e => e.addEventListener('input', refresh));
    document.querySelectorAll('#donTiers .tier').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('#donTiers .tier').forEach(b => b.classList.remove('on'));
      btn.classList.add('on'); amtEl.value = btn.dataset.amt; refresh();
    }));
    const copy = document.getElementById('donCopy');
    copy.onclick = async () => { try { await navigator.clipboard.writeText(ADDR); copy.textContent = '✓ Copied!'; setTimeout(() => (copy.textContent = '📋 Copy address'), 1800); } catch {} };

    // Public tip wall (Giscus) — supporters can leave a note / say who a tip is from.
    const g = window.GISCUS;
    if (g && g.repoId && g.categoryId) {
      const wall = el('<div class="comments"><h3>💜 Tip wall — leave a note</h3><p class="meta">Sent a tip? Say hi and let others know who it\'s from.</p><div class="giscus"></div></div>');
      document.getElementById('tipwall').append(wall);
      const s = document.createElement('script');
      s.src = 'https://giscus.app/client.js';
      s.setAttribute('data-repo', g.repo); s.setAttribute('data-repo-id', g.repoId);
      s.setAttribute('data-category', g.category || 'General'); s.setAttribute('data-category-id', g.categoryId);
      s.setAttribute('data-mapping', 'specific'); s.setAttribute('data-term', 'Tip wall');
      s.setAttribute('data-reactions-enabled', '1');
      s.setAttribute('data-theme', document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
      s.setAttribute('crossorigin', 'anonymous'); s.async = true;
      wall.querySelector('.giscus').append(s);
    }
  }
  registerView('donate', view);
})();
