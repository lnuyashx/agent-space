# Agent Space Protocol v0.1（Local Bridge）

语言：中文 | [English](asp-v0.1.en.md)

这个版本只定义 Web 客户端和本地 `Local Bridge` 的最小协议，不包含 Cloud Hub。

## 传输

- 协议：WebSocket
- 默认地址：`ws://127.0.0.1:8787/bridge`
- 健康检查：`GET http://127.0.0.1:8787/healthz`

## 消息格式

请求：

```json
{
  "id": "req-1",
  "method": "snapshot.get",
  "params": {}
}
```

成功响应：

```json
{
  "id": "req-1",
  "ok": true,
  "result": {}
}
```

失败响应：

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

## v0.1 方法

1. `ping`
2. `snapshot.get`
3. `snapshot.save`
4. `inventory.buy`
5. `scene.equip`
6. `farm.action`
7. `save.reset`

## 方法说明

### `ping`

- 作用：连通性和版本探活
- 参数：无
- 返回：`service`、`schemaVersion`、`now`

### `snapshot.get`

- 作用：读取当前完整状态快照
- 参数：无
- 返回：
  - `schemaVersion`
  - `savedAt`
  - `snapshot`（`inventory` / `sceneSnapshot` / `farmSnapshot`）

### `snapshot.save`

- 作用：整体覆盖写入快照
- 参数：
  - `snapshot`（对象）
- 返回：写入后的 `schemaVersion`、`savedAt`、`snapshot`

### `inventory.buy`

- 作用：本地购买，扣金币并增加拥有数量
- 参数：
  - `itemId`（string）
  - `count`（int，可选，默认 1）
  - `price`（number，可选；默认取 item catalog 的价格）
- 返回：
  - `coins`
  - `owned`（该 item 当前拥有数量）
  - `savedAt`

### `scene.equip`

- 作用：把一个 item 装备到场景槽位对象
- 参数：
  - `sceneId`
  - `objectId`
  - `itemId`
- 校验：
  - `sceneId/objectId/itemId` 必须存在
  - `item.slots` 必须包含对象槽位
  - 可收费 item 必须已拥有
- 返回：`sceneId`、`objectId`、`itemId`、`savedAt`

### `farm.action`

- 作用：对农田 plot 执行动作（基于 `data/farm-model.js`）
- 参数：
  - `plotId`
  - `action`
  - `cropId`（当动作需要时）
- 校验：
  - 动作必须存在
  - 当前 plot state 必须在动作允许的 `from` 集合内
- 返回：`plotId`、`action`、新 `state`、`savedAt`

### `save.reset`

- 作用：重置到 bridge 默认状态（从 `data/*.js` 组合出的初始状态）
- 参数：无
- 返回：重置后的 `schemaVersion`、`savedAt`、`snapshot`

## 状态落盘

- 存储：SQLite
- 默认文件：`bridge/.runtime/agent-space-bridge.sqlite`
- 表：`bridge_state`（单行，`id=1`）

## 与现有前端的关系

- v0.1 只提供桥接后端，不强制改变当前前端行为。
- 当前前端仍可继续走 `localStorage`，后续会新增 adapter，把写入迁移到 `Local Bridge`。
