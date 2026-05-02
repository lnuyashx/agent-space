# Contributing

This repository is expected to be worked on by multiple Codex sessions and agents. Keep GitHub as the shared state source.

## Branches

- `main` is the stable demo branch.
- Use `codex/<area>-<short-task>` for agent work.
- Do not push unrelated changes into another agent's branch.
- Before starting work, pull/rebase from `main` and read `CONTEXT.md`, `ROADMAP.md`, and the issue you are claiming.

Examples:

```text
codex/renderer-sprite-layer
codex/interaction-hitarea-calibration
codex/data-scene-snapshot
codex/qa-smoke-tests
```

## Issues

Use GitHub Issues for task ownership.

Each issue should include:

- Goal
- Ownership area
- Files likely to change
- Acceptance checks
- Notes for future agents

If an issue changes architecture or resume context, update `CONTEXT.md`.

For multiple Codex sessions, use the lock protocol in `docs/collaboration.zh-CN.md`.
An issue is claimed only after the session creates the remote lock branch:

```text
locks/issue-<number>
```

Use:

```sh
scripts/claim-issue.sh <issue-number> <session-id> <branch-slug>
```

Do not work on an issue if its lock branch already exists.
The claim script requires a clean local worktree and a `status:ready` issue.

Useful commands:

```sh
scripts/list-issue-locks.sh
scripts/progress-issue.sh <issue-number> <session-id> progress
scripts/progress-issue.sh <issue-number> <session-id> handoff
scripts/release-issue-lock.sh <issue-number> <session-id> needs-review
```

Recommended labels:

- `area:renderer`
- `area:interaction`
- `area:data`
- `area:qa-docs`
- `area:product`
- `type:feature`
- `type:bug`
- `type:tech-debt`
- `status:ready`
- `status:claimed`
- `status:blocked`
- `status:needs-review`

Recommended milestones:

- `M1 Object-body interactions`
- `M2 Sprite object layer`
- `M3 PixiJS migration`
- `M4 Decoration and shop`
- `M5 Farm and social`

## Commit Identity

Codex-authored commits must identify the active session id in the local git config:

```sh
git config user.name "<session-id>"
git config user.email "<session-id>@codex.local"
```

For this originating session:

```sh
git config user.name "019dc8bc-0e29-72d1-94cf-2ca2ac016b3e"
git config user.email "019dc8bc-0e29-72d1-94cf-2ca2ac016b3e@codex.local"
```

Human commits can use the user's normal GitHub identity.

## GitHub CLI Authorization

For this repository, GitHub CLI should be authorized once with the minimal stable scopes:

- `repo` for private repository creation, code push, issues, labels, milestones, and pull requests
- `workflow` for pushing GitHub Actions files under `.github/workflows/`

Do not request broader scopes such as `delete_repo`, `admin:org`, `write:packages`, or `project` unless a future task explicitly needs them.

## Pull Requests

Open PRs as drafts unless the change is ready to review.

Every PR should include:

- What changed
- Why it changed
- Validation performed
- Linked issue

Run these checks for frontend or data changes:

```sh
npm run build
node --check src/legacy/canvas-app.js
node --check data/game-data.js
```

For visual changes, include a short note describing the browser/screenshot path used for verification.

GitHub Actions runs install + build checks on PRs and pushes to `main`.

## Session Handoff

At the end of a Codex session that changes behavior, update `CONTEXT.md` with:

- What changed
- Important files touched
- Current limitations
- Validation performed
- Next recommended issue or task

If a session stops mid-task, leave a comment on the GitHub Issue with:

- Branch name
- Current state
- Blocker or next step
- Files currently in scope

## File Ownership

Prefer these ownership boundaries:

- Renderer: `src/legacy/canvas-app.js`, `src/pixi/`, future rendering modules, asset manifest
- Interaction: `hitAreas`, movement, hover/click, navigation
- Data: `data/game-data.js`, inventory, scene snapshots, persistence
- Docs/QA: markdown docs, issue templates, test scripts

If a change crosses lanes, mention that in the issue or PR.

## Conflict Avoidance

- Avoid two active issues editing the same function or data object.
- When a task needs broad edits to `src/legacy/canvas-app.js`, `src/pixi/`, or `data/game-data.js`, state the intended sections in the issue before starting.
- Do not reformat entire files unless the issue is explicitly about formatting.
- Do not revert another agent's changes without an issue comment explaining why.

## Architecture Decisions

Material decisions should be captured in `docs/adr/`:

- Renderer/runtime changes
- Data model changes
- Persistence strategy
- Commerce/shop assumptions
- Social/farm model assumptions

Use a short ADR file named `NNNN-short-title.md`.
