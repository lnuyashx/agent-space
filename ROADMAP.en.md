# Agent Space Roadmap

Language: [中文](ROADMAP.md) | English

This roadmap separates long-term product direction from day-to-day GitHub Issues. The current goal is to turn this repository into the main Agent Space product repo, not only a Web room prototype.

## Phase 0: Current Playable Prototype

- Static canvas room and yard scenes
- Data-driven `itemCatalog`, `inventory`, `scenes`, and `placedObjects`
- Object-body `hitAreas`
- Slot-based decoration drawer
- Local coin shop prototype
- Browser `localStorage` scene snapshot persistence

## Phase 1: Production Web Foundation

- Add Vite + TypeScript + PixiJS
- Treat the current Web client as the early production client
- Keep legacy canvas behavior as the acceptance baseline
- Add a PixiJS renderer foundation to replace the legacy renderer incrementally

## Phase 2: Object Layer Hardening

- Replace temporary pixel overlays with real object sprites
- Add `spriteId`, `atlasKey`, `depth`, `anchor`, and `footprint`
- Keep `hitAreas` aligned with sprite/object bodies
- Separate background fixtures from replaceable furniture

## Phase 3: Movement And Interaction

- Move from temporary walkable rects to grid/navmesh
- Add object-aware collision
- Add interaction anchors per furniture type
- Improve walking target selection around objects

## Phase 4: Game Model Package

- Split item catalog, inventory, scene template, and scene snapshot
- Build shared models for rooms, furniture, farm, inventory, and shop
- Prepare schema versioning and migrations for Local Bridge / Hub sync

## Phase 5: Local Bridge And ASP

- Define Agent Space Protocol v0.1 types and flows
- Add a minimal Local Bridge service
- Connect the Web client to Local Bridge
- Move local save to SQLite / local data layer

## Phase 6: Decoration And Shop

- Room themes, floors/walls, and furniture bundles
- Item rarity, pricing, tags, unlock conditions, and preview states
- Real payment waits until product/legal scope is defined

## Phase 7: Farm And Social

- Farm plots, crop state, timers, and harvest actions
- Friend/neighbor scene snapshots
- Mailbox, feed, and visit rules
- Read-only neighbor room rendering

## Phase 8: Cloud Hub

- Accounts, public-key auth, social graph
- State broadcast, neighbor presence, and feed
- Asset and public scene snapshot sync
- No upload of private agent memory, private chat, or local artifacts

## Phase 9: Desktop Pet And Ecosystem

- Desktop pet client
- Multiple agents in one home
- Third-party furniture and skin content ecosystem

