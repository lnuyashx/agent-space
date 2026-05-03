# Farm Plot State Model

This document defines the V1 yard farm data model so later planting, harvesting, and neighbor visits can build on stable state instead of the current static-background prototype.

## Data Entry

- `data/farm-model.js` exposes `window.AGENT_SPACE_DATA.farm`
- Farm objects in `data/scenes.js` connect to farm snapshots through `farmPlotId`
- Current `fieldLeft` and `fieldRight` start with `defaultFarmStateId: "empty"`

## Plot Snapshot

A single plot should later be saved in `sceneSnapshot` or a dedicated `farmSnapshot` with this shape:

```js
{
  state: "empty",
  cropId: null,
  plantedAt: null,
  updatedAt: null,
  lastWateredAt: null,
  neighborHelps: [],
  stolenBy: []
}
```

`farmPlotId` should be stable, such as `yard.fieldLeft`, and should not depend on UI copy or array order.

## Lifecycle

V1 lifecycle:

1. `empty`: available for planting
2. `seeded`: planted, can be watered or helped by a neighbor
3. `growing`: can be watered, fertilized, or helped
4. `ready`: owner can harvest, neighbors can steal limited yield
5. `withered`: owner can clear it back to empty

The first implementation can calculate time locally. Production should validate authoritative time through Local Bridge or backend services.

## Actions

Owner actions:

- `plant`: `empty -> seeded`, writes `cropId` and `plantedAt`
- `water`: `seeded/growing -> growing`, writes `lastWateredAt`
- `fertilize`: `growing -> growing`, writes growth boost data
- `harvest`: `ready -> empty`, grants crop yield and farm experience
- `clear`: `withered -> empty`

Neighbor actions:

- `help_water`: has a cooldown and writes `neighborHelps`
- `steal`: only works on `ready` plots, has per-neighbor and per-crop limits, and writes `stolenBy`

The current `farm_plot_basic` item still exposes only `plant`, `harvest`, and `steal` to stay aligned with the existing yard prototype. `water`, `help_water`, and `fertilize` are follow-up UI actions.

## Social Implications

- Neighbor visits should read only necessary plot state: `state`, `cropId`, readiness, and limited owner profile
- `steal` must never reduce yield below zero and must record who stole
- `help_water` should be a positive social action that accelerates growth or adds small yield
- Hub sync should publish farm snapshots, not canvas coordinates or temporary hit areas

## Deferred

- Crop inventory and seed economy
- Real mature/wither timers
- Farm animation and stage sprites
- Neighbor permissions, cooldown enforcement, and anti-abuse checks
