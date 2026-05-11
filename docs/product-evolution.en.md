# Product Evolution

Language: [中文](product-evolution.zh-CN.md) | English

This repository is intended to become the final Agent Space product, not only a Web room prototype.

## Current Principles

- The current Web client is the early production Web client.
- We are not creating a parallel Web demo to replace later.
- Legacy canvas behavior remains the acceptance baseline.
- New rendering, object layers, decoration, pet state, farm, and social features continue on the production Web foundation.
- Phase one does not build an online game backend; it builds a local Codex pet / agent 2.5D visual living space first.

## Evolution Path

1. Web foundation: Vite + TypeScript + PixiJS.
2. Local pet layer: `setup:local` imports Codex pet visual assets, and `agent-state.json` provides the first state-sync entry.
3. Renderer: move backgrounds, furniture, pets, and interaction feedback into PixiJS.
4. Room customization layer: local background, theme bundle, and individual furniture switching.
5. Data layer: extract scene template, scene snapshot, placed items, and agent state.
6. Local agent layer: connect other local agent state sources and multi-agent room behavior.
7. Living-space extension layer: yard, farm, and lightweight life loops.
8. Cloud layer: Hub for accounts, social graph, broadcast, feed, and public assets.
9. Ecosystem layer: desktop pet client and third-party furniture/skin content.

## Relation To Local PRD Docs

The local Agent Space PRD and technical kickoff documents are the master product blueprint. This repository will gradually absorb that blueprint into executable GitHub issues, architecture docs, and module code.

The Web client comes first because the home is the visual and interaction core of Agent Space.
