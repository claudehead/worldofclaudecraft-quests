import { MOBS } from '../woc/src/sim/data.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/out-dungeon-maps';
const ALL: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };

function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function tierColor(m: any): string {
  if (m.boss) return '#f0c419';
  if (m.elite) return '#d9534f';
  if (m.rare) return '#cfd8dc';
  return '#e08a5a';
}

// group spawns into encounter "pulls": same mob id within a small z window
function clusters(spawns: any[]): { mobId: string; x: number; z: number; n: number }[] {
  const out: { mobId: string; x: number; z: number; n: number }[] = [];
  for (const s of spawns) {
    const hit = out.find(o => o.mobId === s.mobId && Math.abs(o.z / o.n - s.z) <= 7);
    if (hit) { hit.x += s.x; hit.z += s.z; hit.n++; }
    else out.push({ mobId: s.mobId, x: s.x, z: s.z, n: 1 });
  }
  return out.map(o => ({ mobId: o.mobId, x: o.x / o.n, z: o.z / o.n, n: o.n }));
}

function dungeonMap(id: string, d: any): string | null {
  const spawns = d.spawns || [];
  if (!spawns.length) return null;
  const cl = clusters(spawns);

  // fixed pixel scale with generous side margins for labels
  const W = 460;
  const cx = W / 2;                 // corridor is centred; x=0 in world
  const xScale = 7;                 // px per world-x unit
  const zScale = 9;                 // px per world-z unit
  const topPad = 62, botPad = 46;
  const zMin = Math.min(d.entry.z, ...spawns.map((p: any) => p.z));
  const zMax = Math.max(...spawns.map((p: any) => p.z));
  const H = Math.round(topPad + (zMax - zMin) * zScale + botPad);
  const X = (x: number) => (cx + x * xScale).toFixed(1);
  const Y = (z: number) => (topPad + (z - zMin) * zScale).toFixed(1);

  const xs = spawns.map((p: any) => p.x);
  const corridorL = cx + (Math.min(...xs) - 8) * xScale;
  const corridorR = cx + (Math.max(...xs) + 8) * xScale;

  const s: string[] = [];
  s.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Helvetica, Arial, sans-serif">`);
  s.push(`<rect width="${W}" height="${H}" fill="#181014"/>`);
  s.push(`<rect x="${corridorL.toFixed(1)}" y="${(topPad - 24).toFixed(1)}" width="${(corridorR - corridorL).toFixed(1)}" height="${(H - topPad - botPad + 48).toFixed(1)}" rx="16" fill="#241820" stroke="#3a2a33" stroke-width="2"/>`);

  // entry (top)
  s.push(`<circle cx="${X(d.entry.x)}" cy="${Y(d.entry.z)}" r="7" fill="#5cb85c" stroke="#11160f" stroke-width="1.5"/>`);
  s.push(`<text x="${X(d.entry.x)}" y="${(parseFloat(Y(d.entry.z)) - 11).toFixed(1)}" fill="#a7e3a7" font-size="12" font-weight="bold" text-anchor="middle">Enter ▼</text>`);

  for (const c of cl) {
    const m = ALL[c.mobId]; if (!m) continue;
    const col = tierColor(m);
    const r = m.boss ? 11 : m.elite ? 7 : 5.5;
    s.push(`<circle cx="${X(c.x)}" cy="${Y(c.z)}" r="${r}" fill="${col}" stroke="#11160f" stroke-width="1.5"/>`);
    const label = `${m.name}${c.n > 1 ? ` ×${c.n}` : ''}`;
    if (m.boss) {
      // boss: bold label centred below the dot, never clipped
      s.push(`<text x="${X(c.x)}" y="${(parseFloat(Y(c.z)) + r + 16).toFixed(1)}" fill="#f7d979" font-size="14" font-weight="bold" text-anchor="middle" stroke="#11160f" stroke-width="0.7" paint-order="stroke">${esc(label)} — Boss</text>`);
    } else {
      const side = c.x >= 0 ? 1 : -1;
      const tx = parseFloat(X(c.x)) + side * (r + 6);
      s.push(`<text x="${tx.toFixed(1)}" y="${(parseFloat(Y(c.z)) + 4).toFixed(1)}" fill="#f0e6d2" font-size="11" text-anchor="${side > 0 ? 'start' : 'end'}" stroke="#11160f" stroke-width="0.6" paint-order="stroke">${esc(label)}</text>`);
    }
  }

  s.push(`<text x="12" y="22" fill="#cfe3d6" font-size="13" font-weight="bold">${esc(d.name)}</text>`);
  s.push(`<text x="${W - 12}" y="${H - 12}" fill="#7a6a73" font-size="11" text-anchor="end">▼ descent</text>`);
  s.push(`</svg>`);
  return s.join('\n');
}

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const [id, d] of Object.entries(DUNGEON_DEFS) as any[]) {
  const svg = dungeonMap(id, d);
  if (!svg) continue;
  fs.writeFileSync(`${OUT}/${id}.svg`, svg);
  n++;
}
console.log(`wrote ${n} dungeon maps to ${OUT}`);
