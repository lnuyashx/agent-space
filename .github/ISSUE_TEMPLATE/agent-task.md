---
name: Agent Task
about: Scoped task for a Codex session or agent
title: "[Agent Task] "
labels: agent-task
assignees: ""
---

## Goal


## Ownership Area

- [ ] Renderer
- [ ] Interaction
- [ ] Data / Game Model
- [ ] QA / Docs
- [ ] Product

## Files Likely To Change


## Acceptance Checks

- [ ] Code or data change is scoped to this issue
- [ ] Issue was claimed with `scripts/claim-issue.sh`
- [ ] Docs/context updated if behavior or architecture changed
- [ ] `npm run build` passes if frontend app code changed
- [ ] `node --check src/legacy/canvas-app.js` passes if legacy canvas code changed
- [ ] `node --check data/game-data.js` passes if data changed
- [ ] Browser/visual check completed if UI changed
- [ ] Lock was released with `scripts/release-issue-lock.sh` after PR handoff

## Notes For Future Agents
