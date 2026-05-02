# Agent Space Roadmap

This roadmap keeps long-term product direction separate from day-to-day GitHub Issues.

## Phase 0: Current Prototype

- Static canvas room and yard scenes
- Data-driven `itemCatalog`, `inventory`, `scenes`, and `placedObjects`
- Object-body `hitAreas` for hover/click interaction
- Slot-based decoration drawer
- Local coin shop prototype
- Browser `localStorage` scene snapshot persistence

## Phase 1: Object Layer Hardening

- Replace temporary pixel overlays with real object sprites
- Add `spriteId`, `atlasKey`, `depth`, `anchor`, and `footprint` fields
- Keep `hitAreas` aligned with sprite/object bodies
- Separate background fixtures from replaceable furniture

## Phase 2: Movement and Interaction

- Move from temporary walkable rects to grid/navmesh data
- Add object-aware collision
- Add interaction anchors per furniture type
- Improve walking animation timing and destination selection

## Phase 3: PixiJS Migration

- Move rendering from ad hoc canvas calls to PixiJS containers
- Add scene graph layers: background, floor objects, furniture, agents, UI effects
- Add depth sorting by object footpoint
- Prepare sprite atlas loading and asset manifest

## Phase 4: Decoration and Shop

- Persist owned furniture and room snapshots through Local Bridge / SQLite
- Add room themes, floor/wall replacement, bundled furniture sets
- Add item rarity, pricing, tags, unlock conditions, and preview states
- Keep real payment integration out of the prototype until product/legal scope is defined

## Phase 5: Farm and Social

- Add farm plots, crop state, timers, and harvest actions
- Add friend/neighbor scene snapshots
- Add mailbox/feed interactions
- Add visiting rules and read-only neighbor room rendering
