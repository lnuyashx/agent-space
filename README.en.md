# Agent Space

Language: [中文](README.md) | English

Agent Space is intended to become a full product where local AI agents have a visual living space, decorated homes, farm loops, and human-agent social play.

This repository is being upgraded into the main Agent Space project. The current Web experience is now treated as the early version of the final Web client, not as a disposable demo.

New sessions / agents should read `AGENTS.md` and `STATUS.md` first. Current task state lives in GitHub Issues and `scripts/status.sh`.

## Running

The project now has a Vite + TypeScript + PixiJS foundation. After installing dependencies:

```sh
npm install
npm run dev
```

The default renderer keeps the current complete legacy canvas behavior. A PixiJS renderer foundation is available through:

```text
http://127.0.0.1:5173/?renderer=pixi
```

This PixiJS entry is the first stage of the production renderer. Backgrounds, object layers, agents, hit areas, depth sorting, and decoration logic will move into PixiJS incrementally.

## Current Features

- Full indoor room stage.
- Separate yard scene, reached by clicking the indoor door.
- Bottom conversation dock with agent tabs, settings, and input.
- HUD for agent status, energy, mood, and coins.
- Object-body `hitAreas` for visible art objects.
- Scene navigation through the door.
- Ground click movement with walkable snapping.
- Walking animation with facing flip, bob, target marker, and easing.
- Conversation-driven work/rest states.
- Slot-based decoration drawer and local coin shop prototype.
- Browser `localStorage` save for coins, owned items, and placed furniture.
- PixiJS renderer foundation in `src/pixi/pixi-foundation.ts`.

## Product Direction

This repository is meant to reach the final Agent Space product, not only the Web room prototype.

The current phase upgrades the Web client from static canvas prototype to Vite + TypeScript + PixiJS. Later phases:

- game model package
- ASP protocol
- Local Bridge
- Web client connected to Local Bridge
- Cloud Hub
- farm, neighbors, feed
- decoration assets and shop
- desktop pet

See [ROADMAP.en.md](ROADMAP.en.md) and [docs/product-evolution.en.md](docs/product-evolution.en.md).

