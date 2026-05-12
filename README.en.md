# Agent Space

Language: [中文](README.md) | English

Agent Space is intended to become a 2.5D visual living space for local AI agents and Codex pets. Phase one prioritizes local pet state, room life, backgrounds, and furniture customization; farm loops, multiple agents, online sync, and social features come later.

This repository is being upgraded into the main Agent Space project. The current Web experience is now treated as the early version of the final Web client, not as a disposable demo.

New sessions / agents should read `AGENTS.md` and `STATUS.md` first. Current task state lives in GitHub Issues and `scripts/status.sh`.

## Running

The project now has a Vite + TypeScript + PixiJS foundation. After installing dependencies:

```sh
npm install
npm run setup:local
npm run dev
```

`npm run dev` automatically runs `setup:local` first. Local setup scans `$CODEX_HOME/pets` or `~/.codex/pets`, imports Codex pet visual assets into the git-ignored `public/local-agent-space/` runtime folder, and falls back to the built-in agent asset when no local pet is available.

The default renderer keeps the current complete legacy canvas behavior. A PixiJS renderer foundation is available through:

```text
http://127.0.0.1:5173/?renderer=pixi
```

This PixiJS entry is the first stage of the production renderer. Backgrounds, object layers, agents, hit areas, depth sorting, and decoration logic will move into PixiJS incrementally.

## Current Features

- Full indoor room stage.
- Separate yard scene, reached by clicking the indoor door.
- Bottom conversation dock with agent tabs, settings, and input.
- HUD for agent status, energy, mood, and local customization state.
- Object-body `hitAreas` for visible art objects.
- Scene navigation through the door.
- Ground click movement with walkable snapping.
- Walking animation with facing flip, bob, target marker, and easing.
- Conversation-driven work/rest states.
- Slot-based decoration drawer with locally unlocked themes and furniture.
- Browser `localStorage` save for theme and placed furniture state, with old coin fields kept only for compatibility.
- Local pet runtime through `scripts/setup-local.mjs`, `pet-manifest.json`, and `agent-state.json`.
- Local state debug flow through `npm run agent:state -- coding`, plus in-drawer status preview buttons for room behavior mapping.
- PixiJS renderer foundation in `src/pixi/pixi-foundation.ts`.

## Product Direction

This repository is meant to reach the final Agent Space product, not only the Web room prototype.

The current phase upgrades the Web client from static canvas prototype to a local Codex pet visual room. Later phases:

- local Codex pet / `agentState` sync
- local room background, theme bundle, and furniture customization
- PixiJS 2.5D object layer plus Tiled-style object data
- more local agent adapters
- yard and farm as living-space extensions
- Cloud Hub, online sync, and social play

See [ROADMAP.en.md](ROADMAP.en.md) and [docs/product-evolution.en.md](docs/product-evolution.en.md).

## Local Bridge (Experimental)

```sh
npm run bridge:start
```

- WebSocket: `ws://127.0.0.1:8787/bridge`
- Health: `http://127.0.0.1:8787/healthz`
- Protocol docs: `docs/asp-v0.1.zh-CN.md` (English: `docs/asp-v0.1.en.md`)
- SQLite default path: `bridge/.runtime/agent-space-bridge.sqlite`
- The frontend uses `localStorage` by default and does not require the bridge. Enable bridge debugging explicitly with `?bridge=ws://127.0.0.1:8787/bridge`.

## Local Validation

```sh
npm run check
npm run build
```

`npm run check` validates TypeScript, the legacy renderer, data syntax, and the browser hit-area assertions in `tests/hitareas-browser.html`.
