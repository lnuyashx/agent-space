# Agent Space Task Board

GitHub Issues should be the source of truth after the repository is pushed. This file is the bootstrap task board for agents and sessions.

New sessions should start from `AGENTS.md`, `STATUS.md`, and `scripts/status.sh`.

## Coordination Rules

- Pick one issue or task at a time.
- Claim the issue with `scripts/claim-issue.sh` before editing.
- Work on a dedicated branch: `codex/issue-<number>-<short-task>`.
- Keep changes scoped to the task's ownership area.
- Update `CONTEXT.md` when architecture or resume context changes.
- Open a draft PR and link the issue when the task is ready for review.
- Codex commits must use the active session id as git user name and email prefix. See `CONTRIBUTING.md`.
- Use `docs/issue-backlog.md` to bootstrap GitHub Issues after the first push.
- Use `docs/collaboration.zh-CN.md` for the full multi-agent protocol.
- Use `docs/collaboration-overview.zh-CN.md` for the short end-to-end collaboration map.

## Suggested Agent Lanes

### Renderer Agent

- Add `spriteId` / `atlasKey` support to `itemCatalog`.
- Replace temporary pixel furniture overlay with sprite-based object rendering.
- Add depth sorting by object footpoint.
- Prepare PixiJS migration plan and first renderer spike.

### Interaction Agent

- Refine all `hitAreas` against the actual scene art.
- Add hover/click feedback variants for doors, furniture, farm plots, and mailbox.
- Improve click-to-walk destination selection around objects.
- Add object-aware collision data.

### Data / Game Model Agent

- Split prototype data into `items`, `inventory`, `sceneTemplate`, and `sceneSnapshot` modules.
- Add local save migration/versioning for `localStorage`.
- Model farm plot state and crop lifecycle.
- Model room themes and bundled furniture sets.

### QA / Docs Agent

- Add browser smoke tests for navigation, object hit testing, decoration, shop, and persistence.
- Keep screenshots small and curated under docs only when needed.
- Keep `README.md`, `ARCHITECTURE.md`, and `CONTEXT.md` aligned with implementation.
- Add PR checklist and issue templates.

## Initial Issue Candidates

- Renderer: Replace temporary furniture overlay with sprite metadata.
- Interaction: Calibrate object-body `hitAreas` for all indoor objects.
- Interaction: Improve agent walking target selection around furniture.
- Data: Split `game-data.js` into maintainable data modules.
- Data: Add save schema version and reset/debug controls.
- QA: Add headless browser smoke test script.
- Product: Define room theme and furniture bundle model.
- Product: Define farm plot state model.
