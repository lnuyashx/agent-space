# ADR 0002: GitHub Issues As Agent Task Source

## Status

Accepted

## Context

Multiple Codex sessions and agents may work on this repository. Chat context is not durable enough to coordinate ownership, blockers, and review state.

## Decision

Use GitHub as the shared collaboration layer:

- Issues are the source of truth for task ownership.
- Branches use `codex/<area>-<short-task>`.
- PRs link issues and remain draft until ready.
- `CONTEXT.md` records resume context for future sessions.
- `ROADMAP.md` records long-term direction.

## Consequences

- Agents should claim or reference an issue before editing.
- Work should be scoped to one issue whenever possible.
- Handoffs should happen in issue comments and `CONTEXT.md`.
- The repository should stay readable without needing old chat logs.
