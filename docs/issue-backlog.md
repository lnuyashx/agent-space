# Initial GitHub Issue Backlog

Create these after the repository is pushed.

## 1. Renderer: Replace temporary furniture overlay with sprite metadata

Labels: `area:renderer`, `type:feature`, `status:ready`, `priority:p1`

Goal:
Move from canvas-drawn placeholder furniture to data fields ready for real sprites.

Acceptance:
- Add `spriteId` / `atlasKey` fields to catalog or placed objects.
- Keep fallback drawing working.
- Document sprite metadata in `ARCHITECTURE.md`.

## 2. Interaction: Calibrate object-body hitAreas for all indoor objects

Labels: `area:interaction`, `type:feature`, `status:ready`, `priority:p0`

Goal:
Make hover/click match actual art object bodies instead of broad zones.

Acceptance:
- Desk, door, sofa, bed, TV, bookshelf, and kitchen have calibrated hitAreas.
- Browser assertions cover body hit and old-corner miss cases.
- Update `CONTEXT.md` if behavior changes.

## 3. Interaction: Improve walking target selection around furniture

Labels: `area:interaction`, `type:feature`, `status:ready`, `priority:p1`

Goal:
When users click objects, the agent should walk to a natural anchor without clipping through furniture.

Acceptance:
- Each important object has interaction anchor data.
- Click-to-object movement uses anchor point.
- Ground click still snaps to walkable space.

## 4. Data: Split game-data.js into maintainable data modules

Labels: `area:data`, `type:tech-debt`, `status:ready`, `priority:p1`

Goal:
Prepare data model for multiple agents and future backend/local storage.

Acceptance:
- Split catalog, inventory, scenes, and agents into separate files or clearly isolated modules.
- Preserve browser loading path.
- Update README and architecture docs.

## 5. Data: Add save schema version and reset/debug controls

Labels: `area:data`, `type:feature`, `status:ready`, `priority:p1`

Goal:
Make localStorage persistence safer as the schema changes.

Acceptance:
- Save payload has version.
- Unsupported old versions fail safely or migrate.
- Add a local reset control or documented console command.

## 6. QA: Add headless browser smoke test script

Labels: `area:qa-docs`, `type:feature`, `status:ready`, `priority:p1`

Goal:
Make visual/interaction validation repeatable.

Acceptance:
- Script verifies app boot, object hit testing, door navigation, decoration, shop, persistence.
- Store screenshots only when requested.
- Document how to run.

## 7. Product: Define room theme and furniture bundle model

Labels: `area:product`, `type:research`, `status:ready`, `priority:p2`

Goal:
Define how sellable themes and bundles should map to data.

Acceptance:
- Document theme fields.
- Document bundle ownership/equip flow.
- Identify dependencies on renderer/data model.

## 8. Product: Define farm plot state model

Labels: `area:product`, `area:data`, `type:research`, `status:ready`, `priority:p2`

Goal:
Prepare for farm gameplay without coupling it to the current room prototype.

Acceptance:
- Document crop lifecycle state.
- Document farm object actions.
- Identify social/neighbor implications.
