// World of Claudecraft guide bot — answers item/farm/mob/quest queries in Discord
// straight from the live guide data, so it stays in sync with the site.
//
// Setup: see bot/README.md. Needs DISCORD_TOKEN in the environment.
import { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } from 'discord.js';

const SITE = process.env.WOC_SITE || 'https://claudehead.github.io/worldofclaudecraft-quests';
const RAW = 'https://raw.githubusercontent.com/claudehead/worldofclaudecraft-quests/main';
const PREFIX = process.env.WOC_PREFIX || '!';
const QCOL = { poor: 0x9d9d9d, common: 0xffffff, uncommon: 0x1eff00, rare: 0x0070dd, epic: 0xa335ee, legendary: 0xff8000 };

// ---- data cache (refreshed every 30 min so it tracks guide releases) ----
const cache = {};
async function load(name, url) {
  try { cache[name] = await (await fetch(url)).json(); } catch (e) { console.error('load', name, e.message); }
}
async function refresh() {
  await Promise.all([
    load('drops', `${SITE}/drops.json`),
    load('farming', `${SITE}/farming.json`),
    load('mobs', `${SITE}/mobstats.json`),
    load('chains', `${SITE}/questchains.json`),
  ]);
  console.log('guide data refreshed');
}

const norm = (s) => (s || '').toLowerCase().trim();
const link = (path) => `${SITE}/#/${path}`;

function cmdWhere(q) {
  const items = cache.drops?.items || [];
  const m = items.filter((i) => norm(i.name).includes(norm(q))).slice(0, 5);
  if (!m.length) return { content: `No item matching **${q}**. Try the drop locator: <${link('drops')}>` };
  const it = m[0];
  const lines = it.sources.slice(0, 8).map((s) => {
    if (s.type === 'mob') return `🗡 **${s.name}** (lv ${s.level}) — ${s.chance}%${s.zones?.length ? ' · ' + s.zones.join(', ') : ''}`;
    if (s.type === 'object') return `📦 **${s.name}** (ground)${s.zones?.length ? ' · ' + s.zones.join(', ') : ''}`;
    return `🛒 **${s.name}** (vendor)`;
  });
  const e = new EmbedBuilder().setTitle(`Where to get: ${it.name}`).setColor(QCOL[it.quality] || 0xffffff)
    .setDescription(lines.join('\n')).setURL(link('drops'));
  if (m.length > 1) e.setFooter({ text: `also matched: ${m.slice(1).map((x) => x.name).join(', ')}` });
  return { embeds: [e] };
}

function cmdFarm(arg) {
  const L = parseInt(arg, 10);
  if (!L || L < 1) return { content: `Usage: \`${PREFIX}farm <level>\` — e.g. \`${PREFIX}farm 7\`` };
  const p = (cache.farming?.perLevel || []).find((x) => x.level === L);
  if (!p) return { content: `No data for level ${L}.` };
  const best = p.mobs.filter((m) => !m.tooHigh).slice(0, 5);
  const lines = best.map((m, i) => `${i === 0 ? '⭐' : '•'} **${m.name}** (lv ${m.level}) — ${m.kills} kills · ${m.xpPerKill} xp${m.zones?.length ? ' · ' + m.zones.join(', ') : ''}`);
  const e = new EmbedBuilder().setTitle(`Best grind: level ${L} → ${L + 1}`).setColor(0xffd24f)
    .setDescription(`Needs **${p.xpNeeded.toLocaleString()} XP**\n\n${lines.join('\n')}`)
    .setFooter({ text: 'Rested XP halves the kills · quests are faster' }).setURL(link(`farming/${L}`));
  return { embeds: [e] };
}

function cmdMob(q) {
  const mobs = cache.mobs?.mobs || [];
  const m = mobs.find((x) => norm(x.name).includes(norm(q)));
  if (!m) return { content: `No mob matching **${q}**.` };
  const e = new EmbedBuilder().setTitle(`${m.name}${m.elite ? ' (elite)' : m.rare ? ' (rare)' : ''}`).setColor(0xe0526a)
    .setDescription([
      `**Level:** ${m.minLevel === m.maxLevel ? m.level : m.minLevel + '–' + m.maxLevel}`,
      `**HP:** ${m.hp} · **Damage:** ${m.dmgMin}–${m.dmgMax} @ ${m.attackSpeed}s (${m.dps} dps)`,
      `**Armor:** ${m.armor}`,
      m.zones?.length ? `**Found in:** ${m.zones.join(', ')}` : '',
    ].filter(Boolean).join('\n')).setURL(link('solo'));
  return { embeds: [e] };
}

function cmdHelp() {
  const e = new EmbedBuilder().setTitle('World of Claudecraft — guide bot').setColor(0x6ca9ff)
    .setDescription([
      `\`${PREFIX}where <item>\` — where an item drops / who sells it`,
      `\`${PREFIX}farm <level>\` — best mobs to grind at that level`,
      `\`${PREFIX}mob <name>\` — a mob's HP, damage and zones`,
      `\`${PREFIX}help\` — this message`,
      '', `Full guide: ${SITE}`,
    ].join('\n'));
  return { embeds: [e] };
}

// ---- slash commands (registered on startup) ----
const SLASH = [
  new SlashCommandBuilder().setName('where').setDescription('Where an item drops / who sells it').addStringOption((o) => o.setName('item').setDescription('item name').setRequired(true)),
  new SlashCommandBuilder().setName('farm').setDescription('Best mobs to grind at a level').addIntegerOption((o) => o.setName('level').setDescription('your level').setRequired(true)),
  new SlashCommandBuilder().setName('mob').setDescription("A mob's HP, damage and zones").addStringOption((o) => o.setName('name').setDescription('mob name').setRequired(true)),
  new SlashCommandBuilder().setName('wochelp').setDescription('List guide bot commands'),
].map((c) => c.toJSON());
async function registerSlash(appId) {
  try { await new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN).put(Routes.applicationCommands(appId), { body: SLASH }); console.log('slash commands registered'); }
  catch (e) { console.error('slash register failed:', e.message); }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.once('ready', async () => { console.log(`logged in as ${client.user.tag}`); await refresh(); setInterval(refresh, 30 * 60 * 1000); await registerSlash(client.application.id); });
client.on('interactionCreate', (i) => {
  if (!i.isChatInputCommand()) return;
  let reply;
  switch (i.commandName) {
    case 'where': reply = cmdWhere(i.options.getString('item')); break;
    case 'farm': reply = cmdFarm(String(i.options.getInteger('level'))); break;
    case 'mob': reply = cmdMob(i.options.getString('name')); break;
    case 'wochelp': reply = cmdHelp(); break;
    default: return;
  }
  i.reply(reply).catch((e) => console.error('interaction reply', e.message));
});
client.on('messageCreate', (msg) => {
  if (msg.author.bot || !msg.content.startsWith(PREFIX)) return;
  const [cmd, ...rest] = msg.content.slice(PREFIX.length).trim().split(/\s+/);
  const arg = rest.join(' ');
  let reply;
  switch ((cmd || '').toLowerCase()) {
    case 'where': case 'drop': reply = arg ? cmdWhere(arg) : { content: `Usage: \`${PREFIX}where <item>\`` }; break;
    case 'farm': case 'grind': reply = cmdFarm(arg); break;
    case 'mob': case 'enemy': reply = arg ? cmdMob(arg) : { content: `Usage: \`${PREFIX}mob <name>\`` }; break;
    case 'help': case 'commands': reply = cmdHelp(); break;
    default: return;
  }
  msg.reply(reply).catch((e) => console.error('reply', e.message));
});

if (!process.env.DISCORD_TOKEN) { console.error('Set DISCORD_TOKEN (see bot/README.md)'); process.exit(1); }
client.login(process.env.DISCORD_TOKEN);
