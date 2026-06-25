import { ITEMS } from '../woc/src/sim/data.ts';
import { ZONE1_NPCS, ZONE1_ZONE, ZONE1_QUESTS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_NPCS, ZONE2_ZONE, ZONE2_QUESTS } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_NPCS, ZONE3_ZONE, ZONE3_QUESTS } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_NPCS, TEMPLE_QUESTS } from '../woc/src/sim/content/temple.ts';
import * as mf from '../woc/src/render/characters/manifest.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/npcs.json';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const itemName = (id: string) => (ITEMS as any)[id]?.name || id;

const zones = [
  { dir: '01-eastbrook-vale', title: 'Eastbrook Vale', npcs: ZONE1_NPCS, quests: ZONE1_QUESTS },
  { dir: '02-' + slug(ZONE2_ZONE.name), title: ZONE2_ZONE.name, npcs: ZONE2_NPCS, quests: ZONE2_QUESTS },
  { dir: '03-' + slug(ZONE3_ZONE.name), title: ZONE3_ZONE.name, npcs: ZONE3_NPCS, quests: ZONE3_QUESTS },
  { dir: '04-the-drowned-temple', title: 'The Drowned Temple', npcs: TEMPLE_NPCS, quests: TEMPLE_QUESTS },
];
const questInfo: Record<string, { name: string; file: string }> = {};
for (const z of zones) for (const q of Object.values(z.quests) as any[]) questInfo[q.id] = { name: q.name, file: `quests/zones/${z.dir}/${slug(q.id)}.md` };

const clean = (s: string) => (s || '').replace(/\$N/g, 'you').replace(/\$C/g, 'friend').replace(/\$[A-Za-z]/g, '').trim();

const models: any[] = [];
const npcs: any[] = [];
for (const z of zones) {
  for (const n of Object.values(z.npcs) as any[]) {
    const key = mf.visualKeyFor({ kind: 'npc', templateId: n.id } as any);
    const def: any = mf.VISUALS[key];
    let tint: number | null = null;
    if (typeof def?.tint === 'number') tint = def.tint;
    else if (def?.tint === 'entity') tint = typeof n.color === 'number' ? n.color : null;
    if (def?.url) models.push({ id: n.id, glb: def.url, height: def.height ?? null, tint: tint == null ? null : '#' + (tint >>> 0).toString(16).padStart(6, '0').slice(-6), tintStrength: def.tintStrength ?? 0, attach: [] });
    npcs.push({
      id: n.id, name: n.name, title: n.title || '', zone: z.title,
      pos: { x: Math.round(n.pos.x), z: Math.round(n.pos.z) },
      greeting: clean(n.greeting),
      role: (n.questIds || []).length ? (n.vendorItems?.length || n.market ? 'Quests & vendor' : 'Quest giver') : (n.vendorItems?.length || n.market ? 'Vendor' : 'NPC'),
      quests: (n.questIds || []).filter((q: string) => questInfo[q]).map((q: string) => ({ name: questInfo[q].name, file: questInfo[q].file })),
      market: !!n.market,
      vendorItems: (n.vendorItems || []).map(itemName),
      render: `npcs/_renders/${n.id}.png`,
    });
  }
}
npcs.sort((a, b) => a.zone.localeCompare(b.zone) || a.name.localeCompare(b.name));

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ count: npcs.length, zones: zones.map(z => z.title), npcs }));
fs.writeFileSync(OUT.replace(/[^/\\]+$/, 'npc-models.json'), JSON.stringify(models, null, 2));
console.log(`wrote ${npcs.length} NPCs (+ ${models.length} render manifest entries)`);
