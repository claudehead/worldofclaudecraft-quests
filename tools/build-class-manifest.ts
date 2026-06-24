import { GUIDE_CLASSES } from '../woc/src/guide/content.generated.ts';
import * as mf from '../woc/src/render/characters/manifest.ts';
import * as fs from 'node:fs';

const out = GUIDE_CLASSES.map((c: any) => {
  const def: any = mf.VISUALS[c.model];
  return { id: c.id, name: c.id, glb: def?.url, height: def?.height ?? null, tint: null, tintStrength: 0, attach: [] };
}).filter((x: any) => x.glb);
fs.writeFileSync(process.argv[2] || 'class-models.json', JSON.stringify(out, null, 2));
console.log(`wrote ${out.length} class models`);
