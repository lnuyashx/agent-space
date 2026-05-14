# Agent Space Roadmap

Language: [中文](ROADMAP.md) | English

This roadmap separates long-term product direction from day-to-day GitHub Issues. The current goal is to turn this repository into the main Agent Space product repo, not only a Web room prototype. Phase one focuses on a local Codex pet / agent visual living space.

## Phase 0: Current Playable Prototype

- Static canvas room and yard scenes
- Data-driven `itemCatalog`, `inventory`, `scenes`, and `placedObjects`
- Object-body `hitAreas`
- Slot-based decoration drawer
- Locally unlocked decoration prototype, with old coin fields kept for compatibility
- Browser `localStorage` scene snapshot persistence

## Phase 1: Local Codex Pet Visual Room

- Add Vite + TypeScript + PixiJS
- Treat the current Web client as the early production client
- Keep legacy canvas behavior as the acceptance baseline
- Add a PixiJS renderer foundation to replace the legacy renderer incrementally
- Auto-import local Codex pet visual assets through `setup:local`
- Use `agent-state.json` as the first local state sync entry
- Allow local room themes, bundles, and furniture replacements without coin purchases

## Phase 2: 2.5D Room And Object Layer Hardening

- Replace temporary pixel overlays with real object sprites
- Add `spriteId`, `atlasKey`, `depth`, `anchor`, and `footprint`
- Keep `hitAreas` aligned with sprite/object bodies
- Separate background fixtures from replaceable furniture
- Add Tiled/LDtk-style object-layer import for 2.5D rooms and furniture placement

## Phase 3: Pet Behavior, Movement, And Interaction

- Move from temporary walkable rects to grid/navmesh
- Add object-aware collision
- Add interaction anchors per furniture type
- Improve walking target selection around objects
- Map Codex statuses to desk, bed, door, and idle behavior anchors

## Phase 4: More Local Agents

- Define additional local agent state sources
- Place multiple local agents in the same room with independent status and behavior
- Do not introduce cloud accounts or multiplayer sync yet

## Phase 5: Yard And Farm Living-Space Extension

- Farm plots, crop state, timers, and harvest actions
- Let the pet visit and tend the yard
- Keep farm as a life rhythm, not a first-stage economy

## Phase 6: Local Data Layer And Adapters

- Split item catalog, scene template, scene snapshot, and agent state
- Treat Local Bridge as an optional local adapter, not the phase-one backend
- Prepare schema versioning and migrations for future Hub sync

## Phase 7: Cloud Hub And Online Social

- Friend/neighbor scene snapshots
- Mailbox, feed, and visit rules
- Read-only neighbor room rendering

- Accounts, public-key auth, social graph
- State broadcast, neighbor presence, and feed
- Asset and public scene snapshot sync
- No upload of private agent memory, private chat, or local artifacts

## Phase 8: Ecosystem

- Desktop pet client
- Third-party furniture and skin content ecosystem
