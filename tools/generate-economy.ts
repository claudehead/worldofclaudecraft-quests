// World Market (auction house) guide. The mechanics live as un-exported consts
// in sim.ts, so we parse them from source to stay in sync.
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/world-market.md';
const WOC = process.argv[3] || 'woc';
const sim = fs.readFileSync(`${WOC}/src/sim/sim.ts`, 'utf8');
const num = (name: string, dflt: number): number => {
  const m = new RegExp(`const ${name}\\s*=\\s*([0-9_.*\\s]+?)[;//]`).exec(sim);
  if (!m) return dflt;
  try { return Function(`"use strict";return(${m[1].replace(/_/g, '')})`)(); } catch { return dflt; }
};
const copper = (c: number) => c >= 10000 ? `${(c / 10000).toLocaleString()}g` : c >= 100 ? `${(c / 100).toLocaleString()}s` : `${c}c`;

const maxListings = num('MARKET_MAX_LISTINGS', 12);
const minPrice = num('MARKET_MIN_PRICE', 1);
const maxPrice = num('MARKET_MAX_PRICE', 5_000_000);
const cut = num('MARKET_CUT', 0.05);
const durH = Math.round(num('MARKET_LISTING_DURATION', 172800) / 3600);

const L: string[] = [];
L.push(`# The World Market`);
L.push('');
L.push(`The World Market is a shared **auction house** run by the Merchant (Keeper of the World Market) in the first village. Walk up to the Merchant and interact to browse, buy, and list goods. It's one market everyone shares.`);
L.push('');
L.push(`## Buying`);
L.push('');
L.push(`- Open the Merchant and browse current listings (search/filter by name).`);
L.push(`- The price shown is the **total buyout** for the whole stack — pay it and the goods are yours.`);
L.push(`- The Merchant also keeps a permanent **house stock** that never runs out and never expires — reliable basics are always available.`);
L.push('');
L.push(`## Selling`);
L.push('');
L.push(`- List an item from your bags with a buyout price. You may have up to **${maxListings} active listings** at once.`);
L.push(`- Prices range from **${copper(minPrice)}** to **${copper(maxPrice)}** (a ceiling to guard against fat-finger mistakes).`);
L.push(`- The Merchant takes a **${Math.round(cut * 100)}% cut** of every completed sale — a gold sink, so price with that in mind.`);
L.push(`- Unsold listings linger for **${durH} hours** (${Math.round(durH / 24)} days), then return to you.`);
L.push(`- Your **sale proceeds and any returned/expired goods wait at the Merchant** for you to collect later — you don't have to be online when something sells.`);
L.push('');
L.push(`> Tip: undercut the lowest buyout on common goods to sell fast, or list rare drops high and let the ${durH}-hour window do the work. Remember the ${Math.round(cut * 100)}% cut when setting a floor.`);
L.push('');

fs.mkdirSync(OUT.replace(/[/\\][^/\\]+$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, L.join('\n'));
console.log(`wrote world-market guide (max ${maxListings} listings, ${Math.round(cut * 100)}% cut, ${durH}h)`);
