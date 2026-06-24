import * as mf from '../woc/src/render/characters/manifest.ts';
import { MOBS } from '../woc/src/sim/data.ts';
import { ZONE1_CAMPS, ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_CAMPS, ZONE2_QUESTS } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_CAMPS, ZONE3_QUESTS } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_CAMPS, TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import { DUNGEON_DEFS, DUNGEON_MOBS } from '../woc/src/sim/content/dungeons.ts';
import * as fs from 'node:fs';

const ALL: Record<string, any> = { ...MOBS, ...DUNGEON_MOBS };
const TD = new Set(['nythraxis_crypt', 'nythraxis_boss_arena']);
const zones: any[] = [
  [ZONE1_CAMPS, ZONE1_QUESTS, [-180, 180]],
  [ZONE2_CAMPS, ZONE2_QUESTS, [180, 540]],
  [ZONE3_CAMPS, ZONE3_QUESTS, [540, 900]],
  [TEMPLE_CAMPS, TEMPLE_QUESTS, null],
];
const ids = new Set<string>();
for (const [camps, quests, band] of zones) {
  for (const c of camps) ids.add(c.mobId);
  for (const q of Object.values(quests) as any[]) for (const o of q.objectives || []) if (o.type === 'kill' && o.targetMobId) ids.add(o.targetMobId);
  for (const [id, d] of Object.entries(DUNGEON_DEFS) as any[]) {
    const inZ = band ? (!TD.has(id) && d.doorPos.z >= band[0] && d.doorPos.z < band[1]) : TD.has(id);
    if (inZ) for (const s of d.spawns || []) ids.add(s.mobId);
  }
}
const out: any[] = [];
for (const id of ids) {
  const m = ALL[id];
  if (!m || m.petRole) continue;
  const key = mf.visualKeyFor({ kind: 'mob', templateId: id } as any);
  const def: any = mf.VISUALS[key];
  if (!def) continue;
  // VISUALS.tint may be a fixed hex number, the string 'entity' (use the mob's
  // own per-entity color), or undefined (no tint — keep authored materials).
  let tint: number | null = null;
  if (typeof def.tint === 'number') tint = def.tint;
  else if (def.tint === 'entity') tint = typeof m.color === 'number' ? m.color : null;
  const tintHex = tint == null ? null : '#' + (tint >>> 0).toString(16).padStart(6, '0').slice(-6);
  out.push({
    id,
    name: m.name,
    family: m.family,
    boss: !!m.boss, elite: !!m.elite, rare: !!m.rare,
    modelKey: key,
    glb: def.url,
    height: def.height ?? null,
    tint: tintHex,
    tintStrength: def.tintStrength ?? 0,
    attach: (def.attach ?? []).map((a: any) => ({ url: a.url, bone: a.bone })),
  });
}
out.sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(process.argv[2] || '/tmp/gen/mobs.json', JSON.stringify(out, null, 2));
console.log(`wrote ${out.length} mobs`);
