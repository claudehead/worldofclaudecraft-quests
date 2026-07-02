'use strict';
// Progress Tracker — #/tracker
// Check off quests (and bosses) you've completed; progress is saved in your browser.
// Export a JSON backup file or import one to restore/move your progress between devices.
(function () {
  const { el, esc, registerView, loadJSON, app } = window.WOC;
  const LS = 'wc_progress';

  const load = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; } };
  const save = (o) => { try { localStorage.setItem(LS, JSON.stringify(o)); } catch {} };
  const isDone = (kind, id) => !!(load()[kind] || {})[id];
  const setDone = (kind, id, on) => { const o = load(); (o[kind] || (o[kind] = {}))[id] = on ? 1 : undefined; if (!on) delete o[kind][id]; save(o); };

  function bar(done, total) {
    const pct = total ? Math.round((done / total) * 100) : 0;
    return `<div class="trk-bar"><div class="trk-fill" style="width:${pct}%"></div></div><span class="trk-pct">${done}/${total} · ${pct}%</span>`;
  }

  function render(M) {
    const zones = M.zones || [];
    const state = load();
    const qDone = state.quests || {};
    let totalQ = 0, doneQ = 0;
    zones.forEach(z => (z.quests || []).forEach(q => { totalQ++; if (qDone[q.id]) doneQ++; }));

    app.innerHTML = '';
    app.append(el(`
      <section class="block"><div class="wrap">
        <span class="eyebrow reveal">Your journey to 20</span>
        <h1 class="reveal">Progress Tracker</h1>
        <p class="sub reveal">Tick off quests as you complete them — everything saves in your browser. Back it up or move it to another device with the export / import buttons.</p>
        <div class="trk-tools">
          <button class="btn ghost" id="trkExport">⬇ Export backup (.json)</button>
          <label class="btn ghost" for="trkImport">⬆ Import backup</label>
          <input type="file" id="trkImport" accept="application/json,.json" hidden>
          <button class="btn ghost" id="trkReset">↺ Reset</button>
        </div>
        <div class="trk-overall">Overall ${bar(doneQ, totalQ)}</div>
        <div id="trkZones"></div>
      </div></section>`));

    const host = document.getElementById('trkZones');
    for (const z of zones) {
      const quests = (z.quests || []).slice().sort((a, b) => a.level - b.level);
      const zd = quests.filter(q => qDone[q.id]).length;
      const sec = el(`
        <div class="trk-zone">
          <div class="trk-zhead"><b>${esc(z.title)}</b> <span class="meta">Lv ${z.levelRange ? z.levelRange.join('–') : '?'} · ${z.hub ? 'Hub: ' + esc(z.hub) : ''}</span>
            <span class="trk-zbar">${bar(zd, quests.length)}</span></div>
          <div class="trk-qlist"></div>
        </div>`);
      const list = sec.querySelector('.trk-qlist');
      for (const q of quests) {
        const row = el(`<label class="trk-q${qDone[q.id] ? ' done' : ''}">
          <input type="checkbox" ${qDone[q.id] ? 'checked' : ''}>
          <span class="trk-lv">Lv ${q.level}</span>
          <a href="#/doc/${encodeURIComponent(q.file)}" data-go="#/doc/${encodeURIComponent(q.file)}">${esc(q.name)}</a>
          ${q.chain ? '<span class="pill tiny">chain</span>' : ''}${q.group ? '<span class="pill tiny">group</span>' : ''}
        </label>`);
        const cb = row.querySelector('input');
        cb.addEventListener('change', () => { setDone('quests', q.id, cb.checked); render(M); });
        list.append(row);
      }
      host.append(sec);
    }

    // export / import / reset
    document.getElementById('trkExport').onclick = () => {
      const blob = new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'woc-progress.json'; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    document.getElementById('trkImport').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { const data = JSON.parse(r.result); if (data && typeof data === 'object') { save(data); render(M); } else alert('That file is not a valid progress backup.'); } catch { alert('Could not read that file — is it a valid .json backup?'); } };
      r.readAsText(f);
    };
    document.getElementById('trkReset').onclick = () => { if (confirm('Clear all tracked progress? (Export a backup first if you want to keep it.)')) { localStorage.removeItem(LS); render(M); } };
  }

  function trackerView() {
    app.innerHTML = '<div class="spinner"></div>';
    loadJSON('manifest.json').then(render).catch(() => { app.innerHTML = '<section class="block"><div class="wrap"><p class="meta">Could not load quest data.</p></div></section>'; });
  }
  registerView('tracker', trackerView);
})();
