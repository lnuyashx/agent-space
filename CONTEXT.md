# Agent Space Context Checkpoint

This file exists so future Codex turns can resume without relying on long chat history.

## Product Decision

The agreed long-term architecture is:

- final Agent Space product, not only a web-room prototype
- Vite + TypeScript web client
- PixiJS 2.5D renderer
- tile/grid walkable space
- sprite/object layer for furniture, fixtures, crops, agents
- item catalog + inventory + placed objects
- slot replacement first, free placement later
- scene snapshots for neighbor visits
- Local Bridge / SQLite local persistence
- ASP protocol and Cloud Hub for social mode

The current legacy canvas renderer is the acceptance baseline while the PixiJS renderer foundation replaces it incrementally.

## Current Project State

Main files:

- `index.html`
- `styles.css`
- `src/main.ts`
- `src/legacy/canvas-app.js`
- `src/pixi/pixi-foundation.ts`
- `data/assets.js`
- `data/item-catalog.js`
- `data/inventory.js`
- `data/scenes.js`
- `data/agents.js`
- `data/farm-model.js`
- `data/theme-bundles.js`
- `data/game-data.js`
- `ARCHITECTURE.md`
- `README.md`
- `README.en.md`
- `ROADMAP.md`
- `ROADMAP.en.md`
- `docs/product-evolution.zh-CN.md`
- `docs/product-evolution.en.md`

Current visual assets:

- `assets/scene-indoor-v2.png`
- `assets/scene-indoor-empty-prototype.svg`
- `assets/scene-yard.png`
- `assets/aria-agent-v2.png`
- `assets/furniture-prototype-atlas.svg`

Current data model:

- `itemCatalog`: sellable/system items
- `inventory`: current owned items
- `scenes`: indoor and yard
- `placedObjects`: bed, sofa, TV, bookshelf, desk, door, kitchen, farm plots, mailbox
- `placedObjects[].interactionPoint`: walkable anchor where the agent stands after clicking or targeting an object
- `walkableRects`: temporary walkable areas for static backgrounds
- `agents`: Aria/Luna/Mika initial states
- `farm`: crop lifecycle, plot snapshot shape, owner actions, neighbor actions, social sync rules
- `themeBundles`: room themes, furniture bundles, ownership/equip flow, renderer/data dependencies
- `data/game-data.js`: compatibility composer that exposes `window.AGENT_SPACE_DATA` from `window.AGENT_SPACE_DATA_MODULES`

## Implemented Features

- Indoor and yard scenes
- Door navigation: click door -> agent walks to door -> switches to yard
- Object-body hover/click overlay based on `hitAreas`, not broad room rectangles
- Click ground to move; invalid floor clicks snap to nearest walkable area
- Click objects to move the agent to object-specific walkable interaction anchors
- Agent walking animation: facing flip, bob, target ring
- Conversation dock and HUD
- Artifact drawer
- Data-driven task routing by item action:
  - `preview_work`
  - `preview_research`
  - `preview_cook`
  - `preview_rest`
- `preview_idle`
- Decoration drawer launched via Settings button
- Slot replacement updates `placedObjects[].itemId`
- Local shop loop: unowned compatible furniture appears in the same drawer, can be bought with demo coins, then equipped
- Browser `localStorage` save: owned items, coins, and scene placed-object item ids persist across refresh with `schemaVersion: 2`
- Settings drawer save debug footer: shows save schema/status/key and can reset local save state
- Farm plot state model: `empty -> seeded -> growing -> ready -> withered`, with owner actions and neighbor actions documented in `docs/farm-plot-state-model.zh-CN.md`
- Room theme and bundle model: themes define style tokens and renderer requirements; bundles grant furniture and write `sceneSnapshot.themeId` plus placed object item ids
- Vite + TypeScript project foundation
- PixiJS renderer preview behind `?renderer=pixi`

## Current Limitation

Because the normal room is still a static background image, replacing a furniture `itemId` cannot yet remove/redraw the original background furniture art in regular mode. Decoration mode now swaps to an empty-room prototype background and draws independent furniture sprites on top, so the object layer can be inspected without old baked-in furniture underneath.

## Latest Continuation

Temporary object visual layer:

- item catalog has `sprite` metadata with `atlasKey`, `spriteId`, `anchor`, and canvas fallback data
- `assets.atlases.furniturePrototype` maps sprite ids to frames in `assets/furniture-prototype-atlas.svg`
- indoor `decoratingAssetId` points to `assets/scene-indoor-empty-prototype.svg` for decoration mode only
- item catalog also has local-demo `price` metadata for shop validation
- canvas draws atlas frames first, then falls back to `sprite.fallback` over decoratable slots during decoration mode
- replaced furniture remains visible after leaving decoration mode

Later replace this temporary overlay with real PixiJS textures resolved by `sprite.atlasKey` and `sprite.spriteId`.

Indoor object-body hit area calibration:

- `data/scenes.js` has tighter indoor `hitAreas` for bed, sofa, TV, bookshelf, desk, garden door, and kitchen.
- The garden door keeps the open door slab and threshold rug clickable for navigation.
- `tests/hitareas-browser.html` covers body-hit and old-corner-miss assertions for all calibrated indoor objects.
- `scripts/check-hitareas.sh` runs those assertions in headless Chrome / Chromium.

Browser smoke coverage:

- `tests/smoke-browser.html` loads the real `index.html` in a browser frame and simulates the core user path.
- `scripts/check-smoke.sh` verifies app boot, object hit testing, door navigation, decoration drawer, shop purchase, and `localStorage` reload persistence without storing screenshots by default.

## Resume Instructions

When continuing this project, keep the same architecture:

- `itemCatalog` describes what can be owned or sold.
- `inventory` describes what the user owns.
- `scenes[].placedObjects` describes what is actually placed in a room.
- Data files are loaded as classic browser scripts: module slices populate `window.AGENT_SPACE_DATA_MODULES`, and `data/game-data.js` composes the legacy app entrypoint.
- Farm plot objects should use stable `farmPlotId` values; future saves should store farm snapshots by that id rather than by canvas position.
- Theme bundle ownership should stay separate from item ownership; equipping a bundle writes a theme id plus compatible slot item ids.
- Local demo persistence uses `localStorage`; production should replace it with Local Bridge / SQLite / Hub sync.
- Current save key is `agent-space-demo-save`; old `agent-space-demo-save-v1` can be read and is removed after the next successful v2 save.
- Hotspots must stay aligned with the visible art object they represent.
- New objects should use `hitAreas` polygons/rects/ellipses that trace the actual art body.
- New interactive objects should define a walkable `interactionPoint` near the usable side of the object; movement should route through `zoneInteractionPoint()` instead of raw hit area points.
- Decoration changes should update `placedObjects[].itemId`, then the renderer should decide how to show the new item.
- Human-facing project introduction docs default to Chinese and provide English `.en.md` variants.
- Use the legacy canvas renderer as behavior parity baseline while moving visuals into PixiJS.

## Collaboration

Use GitHub as the shared coordination layer:

- `AGENTS.md` and `STATUS.md` are the first files new sessions should read.
- `scripts/status.sh` prints current repo, open issues, and active issue locks.
- `main` should stay stable and shippable.
- Work branches should use `codex/<area>-<short-task>`.
- GitHub Issues should track scoped agent tasks.
- `docs/collaboration.zh-CN.md` defines the task claim/progress/handoff protocol.
- `docs/collaboration-overview.zh-CN.md` explains the end-to-end collaboration map.
- `docs/new-session-prompt.zh-CN.md` contains copy-paste prompts for future Codex sessions.
- Issue claim uses remote lock branches named `locks/issue-<number>` to avoid two sessions handling the same task.
- `ROADMAP.md` keeps the long-term direction.
- `TASKS.md` bootstraps initial agent lanes before issues are fully populated.
- `CONTRIBUTING.md` defines branch, issue, PR, and validation rules.
- Codex-authored commits should use the active session id as git `user.name` and `<session-id>@codex.local` as git `user.email`.
- ADRs in `docs/adr/` capture material architecture/collaboration decisions.
