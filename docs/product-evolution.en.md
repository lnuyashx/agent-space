# Product Evolution

Language: [中文](product-evolution.zh-CN.md) | English

This repository is intended to become the final Agent Space product, not only a Web room prototype.

## Current Principles

- The current Web client is the early production Web client.
- We are not creating a parallel Web demo to replace later.
- Legacy canvas behavior remains the acceptance baseline.
- New rendering, object layers, decoration, farm, and social features continue on the production Web foundation.

## Evolution Path

1. Web foundation: Vite + TypeScript + PixiJS.
2. Renderer: move backgrounds, furniture, agents, and interaction feedback into PixiJS.
3. Data layer: extract game model for decoration, shop, farm, and social.
4. Local layer: Local Bridge for agent connection and persistence.
5. Protocol layer: ASP connecting Web, Bridge, and Hub.
6. Cloud layer: Hub for accounts, social graph, broadcast, feed, and public assets.
7. Gameplay layer: decoration, farm, neighbors, visits, feed, and shop.
8. Expansion layer: desktop pet, multiple agents, and third-party content ecosystem.

## Relation To Local PRD Docs

The local Agent Space PRD and technical kickoff documents are the master product blueprint. This repository will gradually absorb that blueprint into executable GitHub issues, architecture docs, and module code.

The Web client comes first because the home is the visual and interaction core of Agent Space.

