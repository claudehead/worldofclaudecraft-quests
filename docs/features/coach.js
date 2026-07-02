'use strict';
// Leveling Coach — #/coach
// Pick your class and current level; get a tailored "what to do next" plan:
// the zone you should be in, quests at your level, and where to go next.
(function () {
  const { el, esc, registerView, loadJSON, app } = window.WOC;
  const LS = 'wc_coach';

  function plan(M, classId, level) {
    const zones = (M.zones || []).slice().sort((a, b) => (a.levelRange ? a.levelRange[0] : 0) - (b.levelRange ? b.levelRange[0] : 0));
    const inRange = zones.filter(z => z.levelRange && level >= z.levelRange[0] && level <= z.levelRange[1]);
    const current = inRange[0] || zones.find(z => z.levelRange && z.levelRange[0] > level) || zones[zones.length - 1];
    // quests near your level in the zones that fit
    const pool = (inRange.length ? inRange : [current]).flatMap(z => (z.quests || []).map(q => ({ ...q, zone: z.title })));
    const quests = pool
      .filter(q => q.level >= level - 2 && q.level <= level + 2)
      .sort((a, b) => a.level - b.level).slice(0, 14);
    // next zone to move to
    const next = zones.find(z => z.levelRange && z.levelRange[0] > (current.levelRange ? current.levelRange[0] : 0));
    const cls = (M.classes || []).find(c => c.id === classId) || M.classes[0];
    return { current, quests, next, cls };
  }

  function render(M, classId, level) {
    const { current, quests, next, cls } = plan(M, classId, level);
    const app2 = app;
    const classOpts = (M.classes || []).map(c => `<option value="${c.id}"${c.id === classId ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
    app2.innerHTML = '';
    app2.append(el(`
      <section class="block"><div class="wrap">
        <span class="eyebrow reveal">What do I do next?</span>
        <h1 class="reveal">Leveling Coach</h1>
        <p class="sub reveal">Tell me your class and level — I'll point you to the right zone, the quests to grab now, and where to head next.</p>
        <div class="coach-in">
          <label>Class <select id="coachClass">${classOpts}</select></label>
          <label>Level <input id="coachLevel" type="number" min="1" max="20" value="${level}"></label>
        </div>
        <div class="coach-out">
          <div class="coach-card">
            <h2>📍 You belong in <a data-go="#/zone/${current.dir.replace(/^\d+-/, '')}"><b>${esc(current.title)}</b></a></h2>
            <p class="meta">Level ${current.levelRange ? current.levelRange.join('–') : '?'}${current.hub ? ' · Hub: ' + esc(current.hub) : ''}${current.biome ? ' · ' + esc(current.biome) : ''}</p>
          </div>
          <div class="coach-card">
            <h2>⚔️ ${esc(cls.name)} · Lv ${level}</h2>
            <p class="meta">${(cls.roles || []).join(' / ')} · Specs: ${(cls.specs || []).join(', ')}</p>
            <p><a class="btn ghost" data-go="#/doc/${encodeURIComponent(cls.file)}">Class guide</a>
               <a class="btn ghost" data-go="#/bis">Best in slot</a>
               <a class="btn ghost" data-go="#/talents">Talents</a></p>
          </div>
        </div>
        <h2 style="margin-top:1.4rem">🗺️ Quests to grab now</h2>
        <ul class="coach-quests">${quests.length ? quests.map(q => `<li><span class="trk-lv">Lv ${q.level}</span> <a data-go="#/doc/${encodeURIComponent(q.file)}">${esc(q.name)}</a>${q.chain ? ' <span class="pill tiny">chain</span>' : ''}${q.group ? ' <span class="pill tiny">group</span>' : ''}</li>`).join('') : '<li class="meta">No quests match — you may be between zones. Keep pushing!</li>'}</ul>
        ${next ? `<p class="coach-next">➡️ Around level <b>${next.levelRange[0]}</b>, move on to <a data-go="#/zone/${next.dir.replace(/^\d+-/, '')}"><b>${esc(next.title)}</b></a> (${next.levelRange.join('–')}).</p>` : '<p class="coach-next">🏆 You\'re in the final tier — clear it and hit the dungeons &amp; delves for endgame gear.</p>'}
        <p><a class="btn ghost" data-go="#/tracker">Track your progress →</a> <a class="btn ghost" data-go="#/route">Full leveling route →</a></p>
      </div></section>`));

    const cSel = document.getElementById('coachClass'), lIn = document.getElementById('coachLevel');
    const update = () => { const cid = cSel.value, lv = Math.max(1, Math.min(20, +lIn.value || 1)); try { localStorage.setItem(LS, JSON.stringify({ classId: cid, level: lv })); } catch {} render(M, cid, lv); };
    cSel.onchange = update; lIn.onchange = update;
  }

  function coachView() {
    app.innerHTML = '<div class="spinner"></div>';
    loadJSON('manifest.json').then(M => {
      let saved = {}; try { saved = JSON.parse(localStorage.getItem(LS) || '{}'); } catch {}
      render(M, saved.classId || (M.classes && M.classes[0].id), saved.level || 1);
    }).catch(() => { app.innerHTML = '<section class="block"><div class="wrap"><p class="meta">Could not load data.</p></div></section>'; });
  }
  registerView('coach', coachView);
})();
