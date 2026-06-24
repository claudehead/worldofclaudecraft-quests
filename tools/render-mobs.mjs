// Renders each mob's REAL game .glb model to a PNG via headless Chromium + three.js.
//   node render-mobs.mjs <mobs.json> <woc/public dir> <out dir> [onlyId]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [, , manifestPath, publicDir, outDir, onlyId] = process.argv;
const mobs = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const MIME = { '.glb': 'model/gltf-binary', '.js': 'text/javascript', '.html': 'text/html', '.bin': 'application/octet-stream' };
const THREE_DIR = path.join(__dirname, 'node_modules', 'three');

function send(res, file, type) {
  try { const b = fs.readFileSync(file); res.writeHead(200, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' }); res.end(b); }
  catch { res.writeHead(404); res.end('nf'); }
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/harness.html') return send(res, path.join(__dirname, 'harness.html'), 'text/html');
  if (url.startsWith('/vendor/jsm/')) return send(res, path.join(THREE_DIR, 'examples', 'jsm', url.slice('/vendor/jsm/'.length)), 'text/javascript');
  if (url.startsWith('/vendor/')) return send(res, path.join(THREE_DIR, 'build', url.slice('/vendor/'.length)), 'text/javascript');
  if (url.startsWith('/assets/')) {
    const f = path.join(publicDir, url.slice('/assets/'.length));
    return send(res, f, MIME[path.extname(f)] || 'application/octet-stream');
  }
  res.writeHead(404); res.end('nf');
});

await new Promise(r => server.listen(0, r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 });
page.on('console', m => { if (m.type() === 'error') console.log('  [page error]', m.text()); });
page.on('response', r => { if (r.status() >= 400) console.log('  [404]', r.url()); });
page.on('pageerror', e => console.log('  [pageerror]', String(e).split('\n')[0]));

await page.goto(`${base}/harness.html`);
await page.waitForFunction('window.__ready === true', { timeout: 30000 });

// sanity: confirm a real WebGL context exists (not a 2d fallback)
const gl = await page.evaluate(() => {
  const c = document.getElementById('c');
  const ctx = c.getContext('webgl2') || c.getContext('webgl');
  return ctx ? (ctx.getParameter(ctx.VERSION) + ' | ' + ctx.getParameter(ctx.RENDERER)) : null;
});
if (!gl) { console.error('NO WEBGL CONTEXT — aborting'); await browser.close(); server.close(); process.exit(2); }
console.log('WebGL:', gl);

const list = onlyId ? mobs.filter(m => m.id === onlyId) : mobs;
let ok = 0, fail = 0;
for (const m of list) {
  try {
    const dataUrl = await page.evaluate(args => window.__renderMob(args), { url: `${base}/assets/${m.glb}`, tint: m.tint, tintStrength: m.tintStrength });
    const b64 = dataUrl.split(',')[1];
    fs.writeFileSync(path.join(outDir, `${m.id}.png`), Buffer.from(b64, 'base64'));
    ok++;
    process.stdout.write(`  ✓ ${m.id} (${path.basename(m.glb)})\n`);
  } catch (e) {
    fail++;
    console.log(`  ✗ ${m.id}: ${String(e).split('\n')[0]}`);
  }
}
console.log(`done: ${ok} rendered, ${fail} failed -> ${outDir}`);
await browser.close();
server.close();
