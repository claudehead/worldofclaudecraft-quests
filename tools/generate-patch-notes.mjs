// Fetch the upstream game's GitHub Releases and emit patch notes for the site.
//   node generate-patch-notes.mjs <out.json>
// Uses GITHUB_TOKEN if present (higher rate limit); works unauthenticated too.
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/patches.json';
const REPO = 'levy-street/world-of-claudecraft';
const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'woc-quests-guide' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, { headers });
if (!res.ok) { console.error(`GitHub API ${res.status}`); process.exit(1); }
const releases = await res.json();

const patches = releases
  .filter(r => !r.draft && /^v\d/.test(r.tag_name) && (r.body || '').trim().length > 30)
  .map(r => ({
    version: r.tag_name,
    name: (r.name || r.tag_name).replace(/^World of Claude[cC]raft\s*-?\s*/i, '').trim() || r.tag_name,
    date: (r.published_at || '').slice(0, 10),
    url: r.html_url,
    body: r.body.replace(/\r\n/g, '\n'),
  }));

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ repo: REPO, patches }));
console.log(`wrote ${patches.length} patch notes (${patches[0]?.version} … ${patches[patches.length - 1]?.version})`);
