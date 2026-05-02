# Agent Space Demo Context Checkpoint

This file exists so future Codex turns can resume without relying on long chat history.

## Product Decision

The agreed long-term architecture is:

- PixiJS 2.5D renderer
- tile/grid walkable space
- sprite/object layer for furniture, fixtures, crops, agents
- item catalog + inventory + placed objects
- slot replacement first, free placement later
- scene snapshots for neighbor visits

The current static-background canvas demo is a transitional prototype only.

## Current Demo State

Main files:

- `index.html`
- `styles.css`
- `app.js`
- `data/game-data.js`
- `ARCHITECTURE.md`
- `README.md`

Current visual assets:

- `assets/scene-indoor-v2.png`
- `assets/scene-yard.png`
- `assets/aria-agent-v2.png`

Current data model:

- `itemCatalog`: sellable/system items
- `inventory`: current owned items
- `scenes`: indoor and yard
- `placedObjects`: bed, sofa, TV, bookshelf, desk, door, kitchen, farm plots, mailbox
- `walkableRects`: temporary walkable areas for static backgrounds
- `agents`: Aria/Luna/Mika initial states

## Implemented Features

- Indoor and yard scenes
- Door navigation: click door -> agent walks to door -> switches to yard
- Object-body hover/click overlay based on `hitAreas`, not broad room rectangles
- Click ground to move; invalid floor clicks snap to nearest walkable area
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
- Browser `localStorage` save: owned items, coins, and scene placed-object item ids persist across refresh

## Current Limitation

Because the current room is still a static background image, replacing a furniture `itemId` cannot yet remove/redraw the original background furniture art. The demo now draws a temporary pixel-style object layer over replaced furniture as visible feedback.

## Latest Continuation

Temporary object visual layer:

- item catalog has lightweight `visual` metadata
- item catalog also has local-demo `price` metadata for shop validation
- canvas draws a small pixel furniture placeholder over decoratable slots during decoration mode
- replaced furniture remains visible after leaving decoration mode

Later replace this temporary overlay with real PixiJS sprites from a sprite atlas.

## Resume Instructions

When continuing this demo, keep the same architecture:

- `itemCatalog` describes what can be owned or sold.
- `inventory` describes what the user owns.
- `scenes[].placedObjects` describes what is actually placed in a room.
- Local demo persistence uses `localStorage`; production should replace it with Local Bridge / SQLite / Hub sync.
- Hotspots must stay aligned with the visible art object they represent.
- New objects should use `hitAreas` polygons/rects/ellipses that trace the actual art body.
- Decoration changes should update `placedObjects[].itemId`, then the renderer should decide how to show the new item.

## Collaboration

Use GitHub as the shared coordination layer:

- `main` should stay demo-stable.
- Work branches should use `codex/<area>-<short-task>`.
- GitHub Issues should track scoped agent tasks.
- `ROADMAP.md` keeps the long-term direction.
- `TASKS.md` bootstraps initial agent lanes before issues are fully populated.
- `CONTRIBUTING.md` defines branch, issue, PR, and validation rules.
- Codex-authored commits should use the active session id as git `user.name` and `<session-id>@codex.local` as git `user.email`.
- ADRs in `docs/adr/` capture material architecture/collaboration decisions.
