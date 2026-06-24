import { MOBS } from '../woc/src/sim/data.ts';
import { ZONE1_CAMPS, ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_CAMPS, ZONE2_QUESTS } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_CAMPS, ZONE3_QUESTS } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_CAMPS, TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/out';
const ALL_MOBS: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };
const TEMPLE_DUNGEONS = new Set(['nythraxis_crypt', 'nythraxis_boss_arena']);

// --- gather the same fightable mob set the bestiary uses (union across zones) ---
function gatherIds(): Set<string> {
  const ids = new Set<string>();
  const zones: any[] = [
    { camps: ZONE1_CAMPS, quests: ZONE1_QUESTS, zBand: [-180, 180] },
    { camps: ZONE2_CAMPS, quests: ZONE2_QUESTS, zBand: [180, 540] },
    { camps: ZONE3_CAMPS, quests: ZONE3_QUESTS, zBand: [540, 900] },
    { camps: TEMPLE_CAMPS, quests: TEMPLE_QUESTS, temple: true },
  ];
  for (const z of zones) {
    for (const c of z.camps) ids.add(c.mobId);
    for (const q of Object.values(z.quests) as any[])
      for (const o of q.objectives || []) if (o.type === 'kill' && o.targetMobId) ids.add(o.targetMobId);
    for (const [id, d] of Object.entries(DUNGEON_DEFS) as any[]) {
      const inZone = z.temple ? TEMPLE_DUNGEONS.has(id)
        : z.zBand && !TEMPLE_DUNGEONS.has(id) && d.doorPos.z >= z.zBand[0] && d.doorPos.z < z.zBand[1];
      if (inZone) for (const s of d.spawns || []) ids.add(s.mobId);
    }
  }
  return ids;
}

// --- color helpers ---
function hex(n: number): string { return '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6); }
function shade(h: string, f: number): string {
  const n = parseInt(h.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  const c = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

// --- family silhouettes (100x100 viewBox, centered ~50,55) ---
function silhouette(family: string, fill: string, line: string): string {
  const S = (body: string) => `<g fill="${fill}" stroke="${line}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${body}</g>`;
  switch (family) {
    case 'beast':
      return S(`
        <path d="M26 64 q-3 12 2 14 M40 66 v12 M58 66 v12 M70 62 q4 12 0 14"/>
        <ellipse cx="48" cy="58" rx="24" ry="13"/>
        <path d="M70 50 q14 -2 16 8 q1 8 -8 9 q-12 1 -12 -9 z"/>
        <path d="M80 46 l4 -9 l4 8 z"/>
        <path d="M24 50 q-10 4 -10 12"/>
        <circle cx="84" cy="55" r="1.6" fill="${line}" stroke="none"/>`);
    case 'spider':
      return S(`
        <path d="M44 52 q-26 -10 -34 -2 M46 58 q-28 2 -34 12 M54 52 q26 -10 34 -2 M52 58 q28 2 34 12
                 M44 56 q-24 4 -28 16 M54 56 q24 4 28 16 M46 50 q-22 -14 -30 -10 M52 50 q22 -14 30 -10" fill="none"/>
        <ellipse cx="50" cy="62" rx="18" ry="15"/>
        <circle cx="50" cy="46" r="11"/>
        <circle cx="46" cy="44" r="1.8" fill="${line}" stroke="none"/>
        <circle cx="54" cy="44" r="1.8" fill="${line}" stroke="none"/>`);
    case 'murloc':
      return S(`
        <path d="M50 30 q-6 -14 0 -18 q6 4 0 18"/>
        <ellipse cx="50" cy="44" rx="15" ry="14"/>
        <path d="M38 58 q12 18 24 0 z"/>
        <path d="M36 66 q-12 6 -14 16 M64 66 q12 6 14 16" fill="none"/>
        <circle cx="43" cy="42" r="4" fill="#fff" stroke="${line}" stroke-width="1.5"/>
        <circle cx="57" cy="42" r="4" fill="#fff" stroke="${line}" stroke-width="1.5"/>
        <circle cx="43" cy="42" r="1.6" fill="${line}" stroke="none"/>
        <circle cx="57" cy="42" r="1.6" fill="${line}" stroke="none"/>`);
    case 'undead':
      return S(`
        <path d="M34 44 q0 -22 16 -22 q16 0 16 22 q0 8 -6 12 l1 10 q-11 5 -22 0 l1 -10 q-6 -4 -6 -12 z"/>
        <ellipse cx="42" cy="44" rx="5" ry="6" fill="${line}" stroke="none"/>
        <ellipse cx="58" cy="44" rx="5" ry="6" fill="${line}" stroke="none"/>
        <path d="M47 56 l3 5 l3 -5" fill="none"/>
        <path d="M40 70 v8 M50 71 v9 M60 70 v8" stroke-width="2.6"/>`);
    case 'elemental':
      return S(`
        <path d="M50 20 q22 6 22 32 q0 26 -22 28 q-22 -2 -22 -28 q0 -26 22 -32 z"/>
        <circle cx="50" cy="50" r="11" fill="${shade(fill, 0.35)}" stroke="none"/>
        <circle cx="50" cy="50" r="5" fill="${shade(fill, 0.6)}" stroke="none"/>`);
    case 'dragonkin':
      return S(`
        <path d="M30 60 q-16 -6 -18 -22 q14 6 20 14"/>
        <path d="M30 58 q18 -22 40 -16 q12 4 14 16 q-2 12 -16 12 q-20 2 -30 -6 z"/>
        <path d="M70 44 q12 -8 18 -4 q-4 8 -14 10" />
        <circle cx="78" cy="46" r="1.8" fill="${line}" stroke="none"/>
        <path d="M40 64 q4 12 -2 16 M58 60 q6 14 0 18" fill="none"/>`);
    case 'demon':
      return S(`
        <path d="M40 26 q-8 -10 -12 -18 q10 4 16 12 M60 26 q8 -10 12 -18 q-10 4 -16 12"/>
        <circle cx="50" cy="34" r="12"/>
        <path d="M38 46 q-18 0 -24 -10 q14 -2 24 6 M62 46 q18 0 24 -10 q-14 -2 -24 6"/>
        <path d="M40 44 q-4 22 4 34 q6 4 12 0 q8 -12 4 -34 z"/>
        <circle cx="45" cy="33" r="1.8" fill="${line}" stroke="none"/>
        <circle cx="55" cy="33" r="1.8" fill="${line}" stroke="none"/>`);
    case 'kobold':
      return S(`
        <path d="M50 16 l3 -7 l3 7 z" fill="#ffd54a" stroke="none"/>
        <rect x="46" y="16" width="8" height="6" rx="1.5"/>
        <circle cx="50" cy="34" r="11"/>
        <path d="M41 32 l-6 -4 M59 32 l6 -4" fill="none"/>
        <path d="M42 44 q-4 20 2 32 q6 4 12 0 q6 -12 2 -32 z"/>
        <circle cx="46" cy="34" r="1.6" fill="${line}" stroke="none"/>
        <circle cx="54" cy="34" r="1.6" fill="${line}" stroke="none"/>`);
    case 'ogre':
    case 'troll': // bulky humanoid
      return S(`
        <circle cx="50" cy="28" r="13"/>
        <path d="M30 52 q4 -10 20 -10 q16 0 20 10 q4 26 -6 32 q-14 6 -28 0 q-10 -6 -6 -32 z"/>
        <path d="M30 52 q-10 6 -10 20 M70 52 q10 6 10 20" fill="none" stroke-width="5"/>
        <circle cx="45" cy="27" r="1.8" fill="${line}" stroke="none"/>
        <circle cx="55" cy="27" r="1.8" fill="${line}" stroke="none"/>`);
    default: // humanoid
      return S(`
        <circle cx="50" cy="26" r="10"/>
        <path d="M36 48 q3 -10 14 -10 q11 0 14 10 q3 22 -4 28 q-10 5 -20 0 q-7 -6 -4 -28 z"/>
        <path d="M37 50 q-10 4 -12 18 M63 50 q10 4 12 18" fill="none" stroke-width="4"/>
        <path d="M44 76 v8 M56 76 v8" stroke-width="4"/>
        <circle cx="46" cy="25" r="1.6" fill="${line}" stroke="none"/>
        <circle cx="54" cy="25" r="1.6" fill="${line}" stroke="none"/>`);
  }
}

function ring(m: any): { color: string; w: number } {
  if (m.boss) return { color: '#f0c419', w: 4 };
  if (m.elite) return { color: '#d9534f', w: 3.5 };
  if (m.rare) return { color: '#cfd8dc', w: 3 };
  return { color: '#3a4a40', w: 2 };
}

function portrait(m: any): string {
  const fill = hex(m.color ?? 0x888888);
  const line = shade(fill, -0.55);
  const bg = shade(fill, -0.78);
  const r = ring(m);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">`,
    `<defs><radialGradient id="g" cx="50%" cy="40%" r="70%">`,
    `<stop offset="0%" stop-color="${shade(bg, 0.18)}"/><stop offset="100%" stop-color="${bg}"/></radialGradient></defs>`,
    `<rect x="2" y="2" width="96" height="96" rx="14" fill="url(#g)" stroke="${r.color}" stroke-width="${r.w}"/>`,
    silhouette(m.family, fill, line),
    `</svg>`,
  ].join('\n');
}

const dir = `${OUT}/zones/_mob-icons`;
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
let n = 0;
for (const id of gatherIds()) {
  const m = ALL_MOBS[id];
  if (!m || m.petRole) continue;
  fs.writeFileSync(`${dir}/${id}.svg`, portrait(m));
  n++;
}
console.log(`wrote ${n} mob icons to ${dir}`);
