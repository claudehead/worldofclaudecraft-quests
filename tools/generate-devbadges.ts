// Emits docs/devbadges.json — the v0.18 developer-badge ladder (earned by landing
// merged PRs in the open-source game repo). Thresholds come from the sim; the
// display (name/flavor/colours) mirrors the client's dev-tier art.
import { DEV_TIER_DEFS, DEV_TIER_SIGNIFICANT_INDEX } from '../woc/src/sim/dev_tier.ts';
import * as fs from 'node:fs';

const DISPLAY: Record<string, { name: string; flavor: string; ring: string; glow: string }> = {
  tinkerer: { name: 'Tinkerer', flavor: 'Your first pull request landed in the realm.', ring: '#9aa7b4', glow: '#5d6b78' },
  artificer: { name: 'Artificer', flavor: 'Five pull requests in, and the world bends to your code.', ring: '#5aa9e6', glow: '#2f6fb0' },
  runesmith: { name: 'Runesmith', flavor: 'Fifteen pull requests forged into the running game.', ring: '#9b6cff', glow: '#6a37e0' },
  architect: { name: 'Architect', flavor: 'An architect of the realm: 30 pull requests merged.', ring: '#ffd24a', glow: '#e0a52a' },
  worldwright: { name: 'Worldwright', flavor: 'A wright of worlds: 70 pull requests shape the game.', ring: '#ffe9a8', glow: '#ffaa00' },
};

const tiers = (DEV_TIER_DEFS as readonly any[]).map((t) => ({
  index: t.index, key: t.key, threshold: t.threshold,
  significant: t.index >= (DEV_TIER_SIGNIFICANT_INDEX as number),
  ...(DISPLAY[t.key] || { name: t.key, flavor: '', ring: '#888', glow: '#555' }),
}));

fs.writeFileSync(process.argv[2] || 'docs/devbadges.json', JSON.stringify({ tiers, significantIndex: DEV_TIER_SIGNIFICANT_INDEX }));
console.log(`wrote devbadges.json (${tiers.length} rungs)`);
