# 🤖 AI take-over agent

Load the game yourself, then press **F8** to let a local LLM (or a built-in scripted policy) play your character — and F8 again to take back control. It drives the **live** game through the same `window.__game.sim` the HUD uses, so **no game code is modified**.

> Use it in **offline / practice mode**, where your local sim is authoritative. Pointing it at the live multiplayer service would desync and trip the game's anti-bot system — don't.

## What's here
- **`woc-agent.user.js`** — a Tampermonkey userscript: the F8 take-over loop (perceive → decide → act).
- **`skills/<class>.json`** — per-class playbooks (abilities, rotation, rules), generated from the game data by `tools/generate-agent-skill.ts`. The userscript fetches the right one for your character automatically.

## Setup
1. **Install [Tampermonkey](https://www.tampermonkey.net/)**, create a new script, paste in `woc-agent.user.js`. Edit the `@match` lines to your game's URL (defaults include `localhost:5173`, the `npm run dev` offline client).
2. **(Recommended) Local brain — free, runs on your GPU:**
   ```
   ollama pull gemma3:4b
   set OLLAMA_ORIGINS=*        # let the game page call Ollama (Windows: setx, then restart)
   ollama serve
   ```
   No Ollama running? The agent falls back to a **built-in scripted policy** and still plays.
3. **Play:** open the game (offline), pick a character, then press **F8**. A 🤖 pill (bottom-right) shows status and the current intent. F8 again to stop.

## How it works (two-tier)
- **Every frame** a deterministic *executor* enacts the current intent through `sim` methods: face + approach the target, auto-attack in range, cast the first ready ability in the class `rotation`, loot, consume, flee.
- **~once a second** the *brain* (Gemma, or scripted) reads a compact JSON observation (self HP/resource, target, nearby mobs as distance+bearing, ready abilities) and sets the next intent. This keeps it responsive and cheap — the LLM fires ~1×/sec, not every frame.

## Tuning
- If the character **circles its target** instead of closing in, flip `TURN_SIGN` (1 → -1) at the top of the userscript.
- Swap the model with `CFG.MODEL` (e.g. `gemma3:12b` for smarter, slower decisions).
- To use **Claude** instead of Gemma, run a tiny local proxy that holds your API key and point `CFG.OLLAMA` at it (keeps the key out of the page). Ask and we'll add `claude-proxy.mjs`.

## Want it smarter?
The brain only sets high-level intents (`kill`, `flee`, `consume`, `loot`, `say`, `idle`); the executor does the mechanics. Add intents (e.g. `goto`, `turn_in_quest`) by extending both `decide()`'s action list and `execute()`.
