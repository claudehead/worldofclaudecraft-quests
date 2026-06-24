// Renders each loot item's REAL in-game icon to a PNG via headless Chromium.
// Most items use the game's procedural iconDataUrl; some weapons use hand-
// painted .jpg thumbnails under public/ui/weapons — those are rasterised too.
//   node render-loot.mjs <loot-items.json> <woc/public dir> <out dir>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [, , listPath, publicDir, outDir] = process.argv;
const ids = JSON.parse(fs.readFileSync(listPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

// serve public/ so the page can load the .jpg weapon thumbnails
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const f = path.join(publicDir, decodeURIComponent(req.url.split('?')[0]).replace(/^\/assets/, ''));
  try { res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' }); res.end(fs.readFileSync(f)); }
  catch { res.writeHead(404); res.end('nf'); }
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

// bundle the game's icon code (TS + imports) into one browser script
const built = await esbuild.build({
  entryPoints: [path.join(__dirname, 'icon-entry.js')],
  bundle: true, format: 'iife', platform: 'browser', write: false, logLevel: 'error',
});

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
page.on('pageerror', e => console.log('  [pageerror]', String(e).split('\n')[0]));
await page.setContent('<!doctype html><body></body>');
await page.addScriptTag({ content: built.outputFiles[0].text });
await page.waitForFunction('window.__ready === true', { timeout: 20000 });

// resolve an item to a png data URL: procedural icon, or rasterise its .jpg
await page.exposeFunction('noop', () => {});
const toPng = async (id) => page.evaluate(async ([id, base]) => {
  const SIZE = 128;
  const u = window.itemIcon(id, SIZE);
  if (u && u.startsWith('data:image')) return u;
  if (u && typeof u === 'string') {
    const img = new Image(); img.crossOrigin = 'anonymous'; img.src = base + '/assets' + u;
    await img.decode();
    const c = document.createElement('canvas'); c.width = SIZE; c.height = SIZE;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, SIZE, SIZE);
    return c.toDataURL('image/png');
  }
  return null;
}, [id, base]);

let ok = 0, fail = 0;
for (const id of ids) {
  try {
    const dataUrl = await toPng(id);
    if (!dataUrl) throw new Error('no icon');
    fs.writeFileSync(path.join(outDir, `${id}.png`), Buffer.from(dataUrl.split(',')[1], 'base64'));
    ok++;
  } catch (e) { fail++; console.log(`  ✗ ${id}: ${String(e).split('\n')[0]}`); }
}
console.log(`done: ${ok} icons, ${fail} failed -> ${outDir}`);
await browser.close();
server.close();
