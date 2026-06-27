// Generates reference/sneak-peek.md — upcoming work from the upstream repo's
// branches + open PRs, with each branch's age. Old branches are flagged as
// "may never ship". Uses the GitHub API (GH_TOKEN/GITHUB_TOKEN if available).
import * as fs from 'node:fs';

const UP = 'levy-street/world-of-claudecraft';
const OUT = process.argv[2] || 'reference/sneak-peek.md';
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'woc-guide' };
if (TOKEN) headers.Authorization = 'Bearer ' + TOKEN;

async function gh(path) { const r = await fetch('https://api.github.com' + path, { headers }); if (!r.ok) throw new Error(`${path} -> ${r.status}`); return r.json(); }
async function all(path) { let out = [], page = 1; while (true) { const b = await gh(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`); out.push(...b); if (b.length < 100) break; page++; } return out; }

const NOW = Date.now();
const fmtAge = (d) => { if (d == null) return '?'; if (d < 1) return 'today'; if (d < 2) return 'yesterday'; if (d < 31) return `${d} days ago`; if (d < 60) return '~1 month ago'; return `~${Math.round(d / 30)} months ago`; };
const bucket = (d) => d == null ? 3 : d <= 7 ? 0 : d <= 30 ? 1 : d <= 90 ? 2 : 3;
const BUCKETS = [
  { emoji: '🟢', title: 'Fresh — actively in progress (updated this week)' },
  { emoji: '🟡', title: 'Recent — within the last month' },
  { emoji: '🟠', title: 'Slowing down — 1–3 months old' },
  { emoji: '🔴', title: 'Stale — 3+ months untouched (may never ship)' },
];
// Friendlier category from branch/PR name
function tag(name, title) {
  const s = (name + ' ' + title).toLowerCase();
  if (/feat|feature/.test(s) && !/refactor|chore|fix|docs|perf|test/.test(name)) return '✨ Feature';
  if (/fix/.test(name)) return '🔧 Fix';
  if (/perf/.test(name)) return '⚡ Perf';
  if (/refactor/.test(name)) return '🛠 Refactor';
  if (/docs/.test(name)) return '📄 Docs';
  if (/chore|ci|build/.test(name)) return '⚙️ Chore';
  return '•';
}

const branches = await all(`/repos/${UP}/branches`);
const prs = await all(`/repos/${UP}/pulls?state=open`);
const prByRef = {}; for (const p of prs) prByRef[p.head.ref] = { num: p.number, title: p.title, draft: p.draft };

const rows = [];
for (const br of branches) {
  if (br.name === 'main' || /^(gh-pages|dependabot)/.test(br.name)) continue;
  let date = null, msg = '';
  try { const c = await gh(`/repos/${UP}/commits/${encodeURIComponent(br.name)}`); date = c.commit.author.date; msg = (c.commit.message || '').split('\n')[0]; } catch (e) {}
  const pr = prByRef[br.name];
  const title = (pr ? pr.title : msg).replace(/\s*\(#\d+\)\s*$/, '').replace(/^(feat|fix|chore|docs|perf|refactor|test)(\([^)]*\))?:\s*/i, '');
  const ageDays = date ? Math.floor((NOW - new Date(date).getTime()) / 86400000) : null;
  if (/^merge /i.test(title) && !pr) continue;
  rows.push({ name: br.name, title: title || br.name, pr: pr ? pr.num : null, draft: pr?.draft, ageDays, date });
}
rows.sort((a, b) => (a.ageDays ?? 1e9) - (b.ageDays ?? 1e9));

const L = [];
const todayISO = new Date(NOW).toISOString().slice(0, 10);
L.push('# 🔭 Sneak Peek — what\'s in the works');
L.push('');
L.push(`Unmerged branches and open pull requests on the [upstream game repo](https://github.com/${UP}) — a look at what *might* be coming. **Nothing here is in the game yet**, and branches that have sat untouched for months may never land. Sorted by how recently each was updated.`);
L.push('');
L.push(`_As of ${todayISO} · ${rows.length} branches in flight._`);
L.push('');
for (let bi = 0; bi < BUCKETS.length; bi++) {
  const inB = rows.filter(r => bucket(r.ageDays) === bi);
  if (!inB.length) continue;
  L.push(`## ${BUCKETS[bi].emoji} ${BUCKETS[bi].title}`);
  L.push('');
  L.push('| What | Type | Last update | PR |');
  L.push('|---|---|---|---|');
  for (const r of inB) {
    const prCell = r.pr ? `[#${r.pr}](https://github.com/${UP}/pull/${r.pr})${r.draft ? ' _(draft)_' : ''}` : '—';
    L.push(`| ${esc(r.title)}${r.title.length < 4 ? ` \`${esc(r.name)}\`` : ''} | ${tag(r.name, r.title)} | ${fmtAge(r.ageDays)} | ${prCell} |`);
  }
  L.push('');
}
L.push('---');
L.push('_Auto-generated from the upstream repo\'s branches; refreshes with each build. A fan view — branch names and plans can change or be dropped at any time._');
function esc(s) { return String(s).replace(/\|/g, '\\|'); }
fs.writeFileSync(OUT, L.join('\n') + '\n');
console.log(`wrote sneak-peek (${rows.length} branches) to ${OUT}`);
