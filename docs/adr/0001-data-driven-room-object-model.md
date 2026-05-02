# ADR 0001: Data-Driven Room Object Model

## Status

Accepted

## Context

Agent Space needs to support:

- object-body interactions
- room decoration
- sellable furniture
- room snapshots for social visits
- future farm objects

A static background with hand-coded click rectangles is not enough for those goals.

## Decision

Use a data-driven room model:

- `itemCatalog` describes sellable/system items.
- `inventory` describes what the user owns.
- `scenes[].placedObjects` describes what is placed in the room.
- `hitAreas` describe object-body interaction shapes.
- `point` describes where the agent stands for an interaction.

The current canvas prototype may keep static backgrounds temporarily, but all interaction and decoration behavior should flow through these data structures.

## Consequences

- New interactions should be added through data first, not one-off canvas click code.
- Decoration changes should update placed object item ids.
- Future PixiJS work can replace the renderer while keeping the data model.
- `hitAreas` are a bridge from static art to sprite-local hit testing.
