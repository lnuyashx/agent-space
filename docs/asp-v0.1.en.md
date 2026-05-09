# Agent Space Protocol v0.1 (Local Bridge)

Language: [中文](asp-v0.1.zh-CN.md) | English

This version defines only the minimum protocol between the Web client and local `Local Bridge`. Cloud Hub is out of scope.

## Transport

- Protocol: WebSocket
- Default endpoint: `ws://127.0.0.1:8787/bridge`
- Health check: `GET http://127.0.0.1:8787/healthz`

## Message Shape

Request:

```json
{
  "id": "req-1",
  "method": "snapshot.get",
  "params": {}
}
```

Success response:

```json
{
  "id": "req-1",
  "ok": true,
  "result": {}
}
```

Error response:

```json
{
  "id": "req-1",
  "ok": false,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "..."
  }
}
```

## v0.1 Methods

1. `ping`
2. `snapshot.get`
3. `snapshot.save`
4. `inventory.buy`
5. `scene.equip`
6. `farm.action`
7. `save.reset`

## Method Notes

### `ping`

- Purpose: connectivity/version heartbeat
- Params: none
- Returns: `service`, `schemaVersion`, `now`

### `snapshot.get`

- Purpose: fetch full current state
- Params: none
- Returns:
  - `schemaVersion`
  - `savedAt`
  - `snapshot` (`inventory` / `sceneSnapshot` / `farmSnapshot`)

### `snapshot.save`

- Purpose: full snapshot replacement write
- Params:
  - `snapshot` (object)
- Returns updated `schemaVersion`, `savedAt`, and `snapshot`

### `inventory.buy`

- Purpose: local purchase flow, deduct coins and increment owned item count
- Params:
  - `itemId` (string)
  - `count` (int, optional, default `1`)
  - `price` (number, optional; defaults to item catalog price)
- Returns:
  - `coins`
  - `owned` (owned count for the item)
  - `savedAt`

### `scene.equip`

- Purpose: equip an item into a scene object slot
- Params:
  - `sceneId`
  - `objectId`
  - `itemId`
- Validation:
  - `sceneId/objectId/itemId` must exist
  - `item.slots` must include the object slot
  - priced items must be owned before equip
- Returns: `sceneId`, `objectId`, `itemId`, `savedAt`

### `farm.action`

- Purpose: apply a farm plot action based on `data/farm-model.js`
- Params:
  - `plotId`
  - `action`
  - `cropId` (required for actions that require it)
- Validation:
  - action must exist
  - current plot state must be in action `from`
- Returns: `plotId`, `action`, updated `state`, `savedAt`

### `save.reset`

- Purpose: reset persisted state to bridge defaults (composed from `data/*.js`)
- Params: none
- Returns reset `schemaVersion`, `savedAt`, and `snapshot`

## Persistence

- Storage: SQLite
- Default file: `bridge/.runtime/agent-space-bridge.sqlite`
- Table: `bridge_state` (single row, `id=1`)

## Relationship To Current Frontend

- v0.1 provides backend bootstrap only; it does not force frontend behavior changes.
- The current frontend can keep `localStorage` for now. A bridge adapter will be added next to migrate writes into `Local Bridge`.
