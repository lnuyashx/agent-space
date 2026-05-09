import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { buildDefaultBridgeState, loadGameDataFromScripts } from "./defaults.mjs";
import { BridgeStateStore } from "./sqlite-store.mjs";

const BRIDGE_SCHEMA_VERSION = 2;
const PROJECT_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const HOST = process.env.BRIDGE_HOST || "127.0.0.1";
const PORT = Number(process.env.BRIDGE_PORT || 8787);
const DB_PATH = resolve(PROJECT_ROOT, process.env.BRIDGE_DB_PATH || "bridge/.runtime/agent-space-bridge.sqlite");
const WS_PATH = process.env.BRIDGE_WS_PATH || "/bridge";

const gameData = loadGameDataFromScripts(PROJECT_ROOT);
const defaultState = buildDefaultBridgeState(gameData);
const store = new BridgeStateStore({
  dbPath: DB_PATH,
  schemaVersion: BRIDGE_SCHEMA_VERSION,
  defaultState,
});

const httpServer = createServer((request, response) => {
  if (request.url === "/healthz") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(
      JSON.stringify({
        ok: true,
        service: "agent-space-local-bridge",
        schemaVersion: BRIDGE_SCHEMA_VERSION,
      }),
    );
    return;
  }

  if (request.url === "/state") {
    const snapshot = store.readState();
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(
      JSON.stringify({
        schemaVersion: snapshot.schemaVersion,
        savedAt: snapshot.savedAt,
        state: snapshot.payload,
      }),
    );
    return;
  }

  response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ ok: false, error: "Not Found" }));
});

const wss = new WebSocketServer({ server: httpServer, path: WS_PATH });

wss.on("connection", (socket) => {
  socket.send(
    JSON.stringify({
      event: "bridge.ready",
      schemaVersion: BRIDGE_SCHEMA_VERSION,
      wsPath: WS_PATH,
    }),
  );

  socket.on("message", (payload, isBinary) => {
    const text = isBinary ? null : payload.toString();
    const request = parseBridgeRequest(text);
    if (!request.ok) {
      socket.send(JSON.stringify(errorResponse(null, request.error)));
      return;
    }

    const rpc = request.value;
    try {
      const result = dispatchMethod(rpc.method, rpc.params || {});
      socket.send(JSON.stringify(successResponse(rpc.id ?? null, result)));
    } catch (error) {
      socket.send(JSON.stringify(errorResponse(rpc.id ?? null, formatBridgeError(error))));
    }
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log(`Agent Space Local Bridge listening on ws://${HOST}:${PORT}${WS_PATH}`);
  console.log(`Health check: http://${HOST}:${PORT}/healthz`);
  console.log(`SQLite state path: ${DB_PATH}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  try {
    wss.clients.forEach((client) => {
      try {
        client.close(1001, "Bridge shutting down");
      } catch {
        // no-op
      }
    });
    store.close();
    httpServer.close();
  } finally {
    process.exit(0);
  }
}

function dispatchMethod(method, params) {
  switch (method) {
    case "ping":
      return handlePing();
    case "snapshot.get":
      return handleSnapshotGet();
    case "snapshot.save":
      return handleSnapshotSave(params);
    case "inventory.buy":
      return handleInventoryBuy(params);
    case "scene.equip":
      return handleSceneEquip(params);
    case "farm.action":
      return handleFarmAction(params);
    case "save.reset":
      return handleSaveReset();
    default:
      throw new BridgeError("METHOD_NOT_FOUND", `Unsupported method: ${method}`);
  }
}

function handlePing() {
  return {
    service: "agent-space-local-bridge",
    schemaVersion: BRIDGE_SCHEMA_VERSION,
    now: new Date().toISOString(),
  };
}

function handleSnapshotGet() {
  const current = store.readState();
  return {
    schemaVersion: current.schemaVersion,
    savedAt: current.savedAt,
    snapshot: current.payload,
  };
}

function handleSnapshotSave(params) {
  const incoming = params?.snapshot;
  if (!incoming || typeof incoming !== "object") {
    throw new BridgeError("INVALID_PARAMS", "snapshot.save requires a snapshot object.");
  }
  const normalized = normalizeSnapshot(incoming);
  const saved = store.writeState(normalized);
  return {
    schemaVersion: saved.schemaVersion,
    savedAt: saved.savedAt,
    snapshot: saved.payload,
  };
}

function handleInventoryBuy(params) {
  const itemId = asNonEmptyString(params?.itemId, "inventory.buy requires itemId.");
  const quantity = params?.count == null ? 1 : Number(params.count);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new BridgeError("INVALID_PARAMS", "inventory.buy requires count as positive integer.");
  }

  const item = gameData.itemCatalog[itemId];
  if (!item) throw new BridgeError("NOT_FOUND", `Unknown itemId: ${itemId}`);

  const unitPrice = Number.isFinite(Number(params?.price)) ? Number(params.price) : Number(item.price || 0);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new BridgeError("INVALID_PARAMS", "inventory.buy price must be a non-negative number.");
  }

  const cost = unitPrice * quantity;
  const current = store.readState();
  const next = deepClone(current.payload);

  if (next.inventory.coins < cost) {
    throw new BridgeError("INSUFFICIENT_COINS", `Not enough coins. Need ${cost}, have ${next.inventory.coins}.`);
  }

  next.inventory.coins -= cost;
  next.inventory.owned[itemId] = (next.inventory.owned[itemId] || 0) + quantity;
  next.savedAt = new Date().toISOString();

  const saved = store.writeState(next, current.schemaVersion);
  return {
    coins: saved.payload.inventory.coins,
    owned: saved.payload.inventory.owned[itemId],
    savedAt: saved.savedAt,
  };
}

function handleSceneEquip(params) {
  const sceneId = asNonEmptyString(params?.sceneId, "scene.equip requires sceneId.");
  const objectId = asNonEmptyString(params?.objectId, "scene.equip requires objectId.");
  const itemId = asNonEmptyString(params?.itemId, "scene.equip requires itemId.");

  const sceneTemplate = gameData.scenes[sceneId];
  if (!sceneTemplate) throw new BridgeError("NOT_FOUND", `Unknown sceneId: ${sceneId}`);

  const objectTemplate = sceneTemplate.placedObjects?.[objectId];
  if (!objectTemplate) throw new BridgeError("NOT_FOUND", `Unknown objectId ${objectId} in scene ${sceneId}`);

  const item = gameData.itemCatalog[itemId];
  if (!item) throw new BridgeError("NOT_FOUND", `Unknown itemId: ${itemId}`);

  if (!item.slots?.includes(objectTemplate.slot)) {
    throw new BridgeError("INVALID_ITEM_SLOT", `Item ${itemId} is not compatible with slot ${objectTemplate.slot}.`);
  }

  const current = store.readState();
  const next = deepClone(current.payload);
  const ownedCount = Number(next.inventory.owned[itemId] || 0);
  if (ownedCount <= 0 && Number(item.price || 0) > 0) {
    throw new BridgeError("ITEM_NOT_OWNED", `Item ${itemId} is not owned.`);
  }

  if (!next.sceneSnapshot?.[sceneId]?.placedObjects?.[objectId]) {
    throw new BridgeError("STATE_CONFLICT", `Snapshot missing scene object ${sceneId}/${objectId}.`);
  }

  next.sceneSnapshot[sceneId].placedObjects[objectId].itemId = itemId;
  next.savedAt = new Date().toISOString();
  const saved = store.writeState(next, current.schemaVersion);

  return {
    sceneId,
    objectId,
    itemId,
    savedAt: saved.savedAt,
  };
}

function handleFarmAction(params) {
  const plotId = asNonEmptyString(params?.plotId, "farm.action requires plotId.");
  const actionId = asNonEmptyString(params?.action, "farm.action requires action.");

  const action = gameData.farm?.actions?.[actionId];
  if (!action) throw new BridgeError("NOT_FOUND", `Unknown farm action: ${actionId}`);

  const current = store.readState();
  const next = deepClone(current.payload);
  const plot = next.farmSnapshot?.plots?.[plotId];
  if (!plot) throw new BridgeError("NOT_FOUND", `Unknown plotId: ${plotId}`);

  if (!action.from?.includes(plot.state)) {
    throw new BridgeError(
      "INVALID_PLOT_STATE",
      `Action ${actionId} not allowed from state ${plot.state}. Expected one of: ${action.from?.join(", ") || "none"}.`,
    );
  }

  if (action.requires?.includes("cropId")) {
    const cropId = asNonEmptyString(params?.cropId, `farm.action ${actionId} requires cropId.`);
    plot.cropId = cropId;
    if (!plot.plantedAt) plot.plantedAt = new Date().toISOString();
  }

  plot.state = action.to || plot.state;
  plot.updatedAt = new Date().toISOString();
  if (actionId === "harvest" || actionId === "clear") {
    plot.cropId = null;
  }
  if (actionId === "water") {
    plot.lastWateredAt = plot.updatedAt;
  }

  next.savedAt = plot.updatedAt;
  const saved = store.writeState(next, current.schemaVersion);
  return {
    plotId,
    action: actionId,
    state: saved.payload.farmSnapshot.plots[plotId],
    savedAt: saved.savedAt,
  };
}

function handleSaveReset() {
  const nextDefault = buildDefaultBridgeState(gameData);
  const saved = store.resetState(nextDefault);
  return {
    schemaVersion: saved.schemaVersion,
    savedAt: saved.savedAt,
    snapshot: saved.payload,
  };
}

function normalizeSnapshot(snapshot) {
  return {
    inventory: {
      coins: Math.max(0, Number(snapshot?.inventory?.coins) || 0),
      owned: Object.fromEntries(
        Object.entries(snapshot?.inventory?.owned || {}).map(([itemId, count]) => [itemId, Math.max(0, Number(count) || 0)]),
      ),
    },
    sceneSnapshot: deepClone(snapshot?.sceneSnapshot || {}),
    farmSnapshot: deepClone(snapshot?.farmSnapshot || { plots: {} }),
    savedAt: new Date().toISOString(),
  };
}

function parseBridgeRequest(text) {
  if (!text) {
    return { ok: false, error: { code: "INVALID_MESSAGE", message: "Binary payload is not supported." } };
  }
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: { code: "INVALID_MESSAGE", message: "Request must be a JSON object." } };
    }
    if (typeof parsed.method !== "string" || !parsed.method.trim()) {
      return { ok: false, error: { code: "INVALID_MESSAGE", message: "Request method is required." } };
    }
    return { ok: true, value: parsed };
  } catch (error) {
    return { ok: false, error: { code: "INVALID_JSON", message: `Invalid JSON: ${error.message}` } };
  }
}

function successResponse(id, result) {
  return { id, ok: true, result };
}

function errorResponse(id, error) {
  return { id, ok: false, error };
}

function formatBridgeError(error) {
  if (error instanceof BridgeError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details || null,
    };
  }
  return {
    code: "INTERNAL_ERROR",
    message: error?.message || "Unknown error",
    details: null,
  };
}

function asNonEmptyString(value, message) {
  if (typeof value !== "string" || !value.trim()) {
    throw new BridgeError("INVALID_PARAMS", message);
  }
  return value;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

class BridgeError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.code = code;
    this.details = details;
  }
}
