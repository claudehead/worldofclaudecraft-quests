// Extract the game's own translations (names/titles) per language into compact
// per-language maps the site applies to its catalog/search. 100% automatic —
// just reads the upstream locale files; no machine translation.
import { de_DE } from '../woc/src/ui/i18n.locales/de_DE.ts';
import { es } from '../woc/src/ui/i18n.locales/es.ts';
import { es_ES } from '../woc/src/ui/i18n.locales/es_ES.ts';
import { fr_FR } from '../woc/src/ui/i18n.locales/fr_FR.ts';
import { fr_CA } from '../woc/src/ui/i18n.locales/fr_CA.ts';
import { it_IT } from '../woc/src/ui/i18n.locales/it_IT.ts';
import { ja_JP } from '../woc/src/ui/i18n.locales/ja_JP.ts';
import { ko_KR } from '../woc/src/ui/i18n.locales/ko_KR.ts';
import { pt_BR } from '../woc/src/ui/i18n.locales/pt_BR.ts';
import { ru_RU } from '../woc/src/ui/i18n.locales/ru_RU.ts';
import { zh_CN } from '../woc/src/ui/i18n.locales/zh_CN.ts';
import { zh_TW } from '../woc/src/ui/i18n.locales/zh_TW.ts';
import * as fs from 'node:fs';
import * as path from 'node:path';

const OUTDIR = process.argv[2] || '/tmp/gen/i18n';
const LOCALES: [string, string, any][] = [
  ['de_DE', 'Deutsch', de_DE], ['es', 'Español', es], ['es_ES', 'Español (ES)', es_ES],
  ['fr_FR', 'Français', fr_FR], ['fr_CA', 'Français (CA)', fr_CA], ['it_IT', 'Italiano', it_IT],
  ['ja_JP', '日本語', ja_JP], ['ko_KR', '한국어', ko_KR], ['pt_BR', 'Português', pt_BR],
  ['ru_RU', 'Русский', ru_RU], ['zh_CN', '简体中文', zh_CN], ['zh_TW', '繁體中文', zh_TW],
];
const RE = /^entities\.(abilities|items|mobs|quests|dungeons|delves|zones|npcs)\.(.+)\.(name|title)$/;

fs.mkdirSync(OUTDIR, { recursive: true });
const langs: any[] = [{ code: 'en', label: 'English' }];
for (const [code, label, dict] of LOCALES) {
  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(dict)) {
    const m = RE.exec(k);
    if (m && typeof v === 'string') map[`${m[1]}:${m[2]}`] = v;
  }
  fs.writeFileSync(path.join(OUTDIR, `${code}.json`), JSON.stringify(map));
  langs.push({ code, label });
}
fs.writeFileSync(path.join(OUTDIR, 'languages.json'), JSON.stringify(langs));
console.log(`wrote ${LOCALES.length} language maps to ${OUTDIR}`);
