// Scan the upstream game's quest voice-over files and emit a manifest the site
// uses to play them (hot-linked from the upstream repo, so no audio is copied).
//   node generate-voice-manifest.ts <woc/public/audio/voice> <out.json>
import * as fs from 'node:fs';
import * as path from 'node:path';

const VOICE_DIR = process.argv[2];
const OUT = process.argv[3] || '/tmp/gen/voice.json';
const UPSTREAM_BASE = 'https://raw.githubusercontent.com/levy-street/world-of-claudecraft/main/public/audio/voice/';

const quests: Record<string, { offer?: string; complete?: string }> = {};
for (const npc of fs.readdirSync(VOICE_DIR)) {
  const dir = path.join(VOICE_DIR, npc);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) {
    const m = /^quest__(.+)__(offer|complete)\.mp3$/.exec(f);
    if (!m) continue;
    const [, qid, kind] = m;
    (quests[qid] ||= {})[kind as 'offer' | 'complete'] = `${npc}/${f}`;
  }
}

const out = { base: UPSTREAM_BASE, quests };
fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`wrote voice manifest for ${Object.keys(quests).length} quests`);
