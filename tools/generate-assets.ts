// Catalogue every .glb under the game's public/models, flag which ones aren't
// referenced anywhere in the source ("hidden"/unused), and emit assets.json for
// the in-browser 3D viewer. Run: tsx generate-assets.ts <woc dir> <out.json>
import * as fs from 'node:fs';
import * as path from 'node:path';

const WOC = process.argv[2] || 'woc';
const OUT = process.argv[3] || '/tmp/gen/assets.json';
const MODELS = path.join(WOC, 'public', 'models');
const SRC = path.join(WOC, 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.toLowerCase().endsWith('.glb')) out.push(p);
  }
  return out;
}
// concat all source so we can test whether a model is referenced
function readSrc(dir: string): string {
  let s = '';
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) s += readSrc(p);
    else if (/\.(ts|tsx|js|mjs|json)$/.test(e.name)) { try { s += fs.readFileSync(p, 'utf8'); } catch {} }
  }
  return s;
}

const src = readSrc(SRC);
const CAT_LABEL: Record<string, string> = {
  chars: 'Characters', creatures: 'Creatures', dungeon: 'Dungeon', foliage: 'Foliage',
  props: 'Props', quest: 'Quest objects', resources: 'Resources', tools: 'Tools', weapons: 'Weapons',
};
const title = (s: string) => s.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\bglb\b/i, '').trim();

const files = walk(MODELS).map(p => p.replace(/\\/g, '/'));
const assets = files.map(p => {
  const rel = p.slice(p.indexOf('models/')); // e.g. models/creatures/alpaca.glb
  const parts = rel.split('/');
  const cat = parts[1];
  const base = parts[parts.length - 1].replace(/\.glb$/i, '');
  // referenced if the filename (or relative path) appears anywhere in source
  const used = src.includes(base + '.glb') || src.includes(rel) || src.includes('/' + base + '"') || src.includes(`'${base}'`);
  return { path: rel, name: title(base), cat, sub: parts.slice(2, -1).join('/'), used };
}).sort((a, b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name));

const cats = [...new Set(assets.map(a => a.cat))].map(c => ({ id: c, label: CAT_LABEL[c] || c, count: assets.filter(a => a.cat === c).length }));
const hidden = assets.filter(a => !a.used).length;

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ count: assets.length, hidden, repo: 'levy-street/world-of-claudecraft', ref: 'main', categories: cats, assets }));
console.log(`wrote ${assets.length} assets (${hidden} unreferenced) across ${cats.length} categories`);
