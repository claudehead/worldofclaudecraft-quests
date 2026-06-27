# World of Claudecraft — Discord guide bot

A small Discord bot that answers guide questions in your channel, pulling **live
data from the field guide** (so it auto-updates whenever the guide rebuilds).

## Commands
| Command | What it does |
|---|---|
| `!where <item>` | Where an item drops / who sells it (mobs %, zones, vendors) |
| `!farm <level>` | Best mobs to grind at that level (kills to ding) |
| `!mob <name>` | A mob's HP, damage, attack speed and zones |
| `!help` | List commands |

(Prefix is `!` by default — change with the `WOC_PREFIX` env var.)

## Setup (5 minutes)

1. **Create the bot app**
   - Go to <https://discord.com/developers/applications> → **New Application**.
   - **Bot** tab → **Reset Token** → copy the token (keep it secret).
   - Under **Privileged Gateway Intents**, enable **MESSAGE CONTENT INTENT**.

2. **Invite it to your server**
   - **OAuth2 → URL Generator** → scopes: `bot`; bot permissions: **Send Messages**, **Embed Links**, **Read Message History**.
   - Open the generated URL and add it to your server.

3. **Run it**
   ```bash
   cd bot
   npm install
   DISCORD_TOKEN=your-token-here npm start
   ```
   (Windows PowerShell: `$env:DISCORD_TOKEN="your-token-here"; npm start`)

   You should see `logged in as <bot>#1234` and `guide data refreshed`.

## Hosting (so it stays online)
Any always-on Node host works — a tiny VPS, Railway, Fly.io, a Raspberry Pi, etc.
Set `DISCORD_TOKEN` as an environment variable/secret and run `npm start`.

## Config (optional env vars)
- `DISCORD_TOKEN` — **required**, the bot token.
- `WOC_PREFIX` — command prefix (default `!`).
- `WOC_SITE` — guide base URL (default the public GitHub Pages site).

## How it stays current
On startup and every 30 minutes the bot fetches `drops.json`, `farming.json`,
`mobstats.json` and `questchains.json` from the live guide — the same files the
website uses — so new content from each game release shows up automatically.
