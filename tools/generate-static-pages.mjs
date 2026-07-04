// Prerender a real, crawlable HTML file per route so Google (and link previews) get
// a proper <title>/description/OpenGraph + readable content — while the SPA still
// hydrates on top for interactivity. Also emits sitemap.xml + robots.txt.
//
// Output: docs/<section>/index.html, docs/doc/<path>/index.html, docs/sitemap.xml, docs/robots.txt
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DOCS = path.join(ROOT, 'docs');
const DOMAIN = 'https://' + fs.readFileSync(path.join(DOCS, 'CNAME'), 'utf8').trim();
const SITE = 'World of Claudecraft';
const OG_IMG = DOMAIN + '/icon-512.png';

const tpl = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');
const BUILD_DATE = new Date().toISOString().slice(0, 10); // sitemap lastmod (rebuilds only on upstream change)

// ---- main section routes: clean SEO title + description ----
const SECTIONS = [
  ['quests', 'Quests', 'Every quest in World of Claudecraft, sorted by level — with objectives, rewards and maps.'],
  ['route', 'Leveling Route', 'The fastest 1→20 questing path through World of Claudecraft, zone by zone in level order.'],
  ['map', 'World Map', 'Pan and zoom the whole World of Claudecraft — towns, dungeons, delves, camps and quest-givers.'],
  ['atlas', 'Interactive Map', 'An interactive World of Claudecraft map with searchable points of interest.'],
  ['bestiary', 'Bestiary', 'Every creature in World of Claudecraft with stats, kill tactics and full loot tables.'],
  ['npcs', 'NPCs', 'Quest-givers and vendors in World of Claudecraft — where they are and what they offer.'],
  ['bosses', 'Boss Strategies', 'Tactics, rosters and loot for every boss encounter in World of Claudecraft.'],
  ['dungeons', 'Dungeons', 'Route maps, full rosters and bosses for every dungeon in World of Claudecraft.'],
  ['delves', 'Delves', 'Scalable mini-instances — tiers, affixes, companions and the Marks vendor.'],
  ['chains', 'Quest Chains', 'Multi-step quest chains in World of Claudecraft and the rewards they lead to.'],
  ['gear', 'Gear', 'Every weapon and armor piece in World of Claudecraft — rarity, stats and where to get it.'],
  ['bis', 'Best in Slot', 'The strongest gear in every slot, per class, and exactly where to get it.'],
  ['sets', 'Item Sets', 'Set bonuses and where to farm each piece in World of Claudecraft.'],
  ['consumables', 'Consumables', 'Food, drink, potions and elixirs — what they restore and where to buy them.'],
  ['augments', 'Augments', 'Class augments and world power-ups — tiers, classes and effects.'],
  ['cosmetics', 'Cosmetics', 'Event skin tiers and the collectible chromas of World of Claudecraft.'],
  ['classes', 'Classes', 'Every class in World of Claudecraft — specs, abilities by level and roles.'],
  ['abilities', 'Abilities', 'Every class ability in World of Claudecraft with ranks, costs and effects.'],
  ['talents', 'Talent Calculator', 'Interactive talent calculator — plan builds across class and spec trees.'],
  ['patches', 'Patch Notes', 'Official release notes for every version of World of Claudecraft.'],
  ['bags', 'Bag & Inventory Planner', 'Plan your World of Claudecraft bag loadout — 16-slot backpack + 4 bag sockets, total carry capacity, and where each bag drops (v0.20).'],
  ['haste', 'Haste Stat Weights', 'How much DPS one point of haste is worth for every class in World of Claudecraft (v0.20), and where to get haste.'],
  ['news', "What's New", "What's new in World of Claudecraft v0.20 and in the field guide — the Drowned Litany delve, world boss, haste, bags, and the guide's new tools and games."],
  ['donate', 'Donate', 'Support the free World of Claudecraft field guide — tip in SOL or $WOC on Solana.'],
  ['supporters', 'Supporters Wall', 'Live from Solana — everyone who has tipped the World of Claudecraft guide, with a supporter leaderboard and recent tips.'],
  ['ask', 'Ask the Guide', 'Ask the World of Claudecraft AI guide anything — quests, classes, gear, zones. Answers drawn straight from the field guide.'],
  ['woc', '$WOC Token', 'The $WOC community token for World of Claudecraft on Solana — live price, chart, market cap and where to buy.'],
  ['earn', 'Earn SOL by Playing', 'How to earn SOL rewards by holding $20+ of $WOC and playing World of Claudecraft — steps, live eligibility checker and FAQ.'],
  ['world', 'Claudecraft Top-Down RPG', 'Play World of Claudecraft as a 2D top-down RPG — explore the real world map, fight creatures where they live, take quests and level up.'],
  ['play', 'Claudecraft Runner', 'A side-scrolling platformer set in World of Claudecraft — run, jump and stomp through a level as your class to reach the portal.'],
  ['arena', 'Boss Battle', 'Play a turn-based boss battle in the browser — pick a class, duel a real boss from the World of Claudecraft bestiary.'],
  ['cards', 'Trading Card Generator', 'Generate and download collectible holo-style trading cards for World of Claudecraft classes, bosses and creatures.'],
  ['adventure', 'Play the Lore', 'A choose-your-path text adventure through the real zones and creatures of World of Claudecraft.'],
  ['tiers', 'Class Tier Lists', 'World of Claudecraft class tier lists (DPS, tank, healer) computed from the real combat formulas at every level.'],
  ['stats', 'Stats Dashboard', 'World of Claudecraft by the numbers — zone level ranges, quest XP, mob threat and class stats, charted.'],
  ['badges', 'Developer Badges', 'The World of Claudecraft developer badges and how they were earned.'],
  ['drops', 'Item Finder', 'Where every item drops in World of Claudecraft and how to farm it.'],
  ['farming', 'Farming Calculator', 'Plan farming runs — drop rates, expected time and best routes.'],
  ['calc', 'DPS & Survivability', 'Compute damage, survivability and time-to-kill for any build.'],
  ['assets', '3D Asset Browser', 'Spin and inspect every 3D model in World of Claudecraft.'],
  ['builds', 'Build Compendium', 'Curated top builds for every class and spec, with talent links.'],
  ['planner', 'Talent / Build Planner', 'Plan and share full character builds — talents, gear and stats.'],
];

// ---- JSON-LD structured data (breadcrumbs + page type) ----
function jsonLd(route, title, description, kind) {
  const url = DOMAIN + route;
  const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN + '/' }];
  if (kind === 'doc') crumbs.push({ '@type': 'ListItem', position: 2, name: 'Guides', item: DOMAIN + '/' });
  crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: title, item: url });
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs };
  const page = {
    '@context': 'https://schema.org',
    '@type': kind === 'doc' ? 'Article' : 'WebPage',
    [kind === 'doc' ? 'headline' : 'name']: `${title} — ${SITE}`,
    description, url,
    isPartOf: { '@type': 'WebSite', name: SITE, url: DOMAIN + '/' },
    publisher: { '@type': 'Organization', name: SITE, url: DOMAIN + '/' },
  };
  return `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>\n<script type="application/ld+json">${JSON.stringify(page)}</script>`;
}

// ---- head injection ----
function pageHtml(route, title, description, contentHtml, kind) {
  const url = DOMAIN + route;
  const fullTitle = `${title} — ${SITE}`;
  const desc = (description || '').replace(/"/g, '&quot;').replace(/\s+/g, ' ').trim().slice(0, 300);
  const head = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${desc}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE}">`,
    `<meta property="og:title" content="${esc(fullTitle)}">`,
    `<meta property="og:description" content="${desc}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${OG_IMG}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${esc(fullTitle)}">`,
    `<meta name="twitter:description" content="${desc}">`,
  ].join('\n  ');
  let html = tpl
    .replace(/<title>[\s\S]*?<\/title>/, '') // drop original title
    .replace(/<meta name="description"[^>]*>/, head) // swap description block for full head
    .replace('<main id="app"><div class="spinner"></div></main>', `<main id="app">${contentHtml}</main>`)
    .replace('</body>', `${jsonLd(route, title, description, kind)}\n</body>`);
  return html;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function writePage(route, title, description, contentHtml, kind) {
  const dir = path.join(DOCS, route.replace(/^\//, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), pageHtml(route, title, description, contentHtml, kind));
}

const urls = ['/']; // homepage already exists (index.html)

// Rich content: turn thin section stubs into real lists of named, linked entities,
// sourced from search.json (regenerated each build → stays in sync, no UI coupling).
let byType = {};
try {
  const search = JSON.parse(fs.readFileSync(path.join(DOCS, 'search.json'), 'utf8'));
  for (const e of search) (byType[e.t] ||= []).push(e);
} catch { /* search.json optional */ }
const SECTION_TYPES = {
  quests: ['Quest'], gear: ['Gear'], bis: ['Gear'], abilities: ['Ability'],
  bestiary: ['Mob', 'Boss'], bosses: ['Boss'], consumables: ['Consumable'],
  classes: ['Class'], dungeons: ['Dungeon'], delves: ['Delve'], augments: ['Power-up'],
};

// sections (trailing slash = the URL GitHub Pages serves 200 for, no 301 redirect)
for (const [slug, title, desc] of SECTIONS) {
  const types = SECTION_TYPES[slug];
  const items = types ? types.flatMap((t) => byType[t] || []) : [];
  let content;
  if (items.length) {
    const list = items.map((e) => `<li><a href="${esc((e.go || '#/').replace(/^#/, ''))}">${esc(e.n)}</a></li>`).join('');
    content = `<section class="block"><div class="wrap"><span class="eyebrow">World of Claudecraft</span><h1>${esc(title)}</h1><p class="sub">${esc(desc)}</p><p class="meta">${items.length} entries — open the full guide for filters, stats and maps.</p><ul class="prelist">${list}</ul></div></section>`;
  } else {
    content = `<section class="block"><div class="wrap"><span class="eyebrow">World of Claudecraft</span><h1>${esc(title)}</h1><p class="sub">${esc(desc)}</p><p class="meta">Loading the interactive guide… <a href="/">open the full guide</a>.</p></div></section>`;
  }
  writePage('/' + slug + '/', title, desc, content, 'section');
  urls.push('/' + slug + '/');
}

// doc pages (rendered markdown → real crawlable content)
const DOC_DIRS = ['reference', 'classes', 'dungeons', 'delves'];
let docCount = 0;
for (const d of DOC_DIRS) {
  const abs = path.join(ROOT, d);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    if (!f.endsWith('.md') || /readme/i.test(f)) continue;
    const md = fs.readFileSync(path.join(abs, f), 'utf8');
    const h1 = (md.match(/^#\s+(.+)$/m) || [])[1] || f.replace(/\.md$/, '').replace(/[-_]/g, ' ');
    const firstPara = (md.replace(/^#.*$/m, '').match(/^\s*([^\n#>|*\-].{20,})$/m) || [])[1] || `${h1} — a World of Claudecraft guide.`;
    const bodyHtml = marked.parse(md, { mangle: false, headerIds: true });
    const route = `/doc/${d}/${f.replace(/\.md$/, '')}/`;
    writePage(route, h1.trim(), firstPara.trim(), `<article class="doc"><div class="wrap">${bodyHtml}</div></article>`, 'doc');
    urls.push(route);
    docCount++;
  }
}

// sitemap.xml + robots.txt
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${DOMAIN}${u}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n') + `\n</urlset>\n`;
fs.writeFileSync(path.join(DOCS, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(DOCS, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}/sitemap.xml\n`);

console.log(`Prerendered ${SECTIONS.length} sections + ${docCount} doc pages · sitemap ${urls.length} URLs · domain ${DOMAIN}`);
