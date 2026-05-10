import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { buildDefaultBridgeState, loadGameDataFromScripts } from "./defaults.mjs";
import { BridgeStateStore } from "./sqlite-store.mjs";

const BRIDGE_SCHEMA_VERSION = 2;
const DEV_STAGE_MIN_COINS = 999999;
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
  const next = deepClone(current.payload);
  const coinUplifted = ensureDevStageCoins(next);
  const lifecycleChanged = resolveFarmLifecycleForSnapshot(next);
  const snapshot = coinUplifted || lifecycleChanged ? store.writeState(next, current.schemaVersion) : current;
  return {
    schemaVersion: snapshot.schemaVersion,
    savedAt: snapshot.savedAt,
    snapshot: snapshot.payload,
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
  ensureDevStageCoins(next);

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
  resolveFarmLifecycleForSnapshot(next);
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
  const normalizedInventory = {
    coins: Math.max(DEV_STAGE_MIN_COINS, Number(snapshot?.inventory?.coins) || 0),
    owned: Object.fromEntries(
      Object.entries(snapshot?.inventory?.owned || {}).map(([itemId, count]) => [itemId, Math.max(0, Number(count) || 0)]),
    ),
  };

  const normalizedSceneSnapshot = normalizeSceneSnapshot(snapshot?.sceneSnapshot || {});

  return {
    inventory: normalizedInventory,
    sceneSnapshot: normalizedSceneSnapshot,
    farmSnapshot: deepClone(snapshot?.farmSnapshot || { plots: {} }),
    savedAt: new Date().toISOString(),
  };
}

function normalizeSceneSnapshot(sceneSnapshot) {
  return Object.fromEntries(
    Object.entries(gameData?.scenes || {}).map(([sceneId, sceneTemplate]) => {
      const incomingScene = sceneSnapshot?.[sceneId] || {};
      const defaultThemeId = defaultThemeIdForScene(sceneId);
      const themeId = canUseThemeInScene(incomingScene?.themeId, sceneId)
        ? incomingScene.themeId
        : defaultThemeId;

      const incomingOwnedThemes = Array.isArray(incomingScene?.ownedThemeIds)
        ? incomingScene.ownedThemeIds.filter((themeIdCandidate) => canUseThemeInScene(themeIdCandidate, sceneId))
        : [];
      if (themeId && !incomingOwnedThemes.includes(themeId)) {
        incomingOwnedThemes.push(themeId);
      }
      if (!incomingOwnedThemes.length && defaultThemeId) {
        incomingOwnedThemes.push(defaultThemeId);
      }

      const incomingOwnedBundles = Array.isArray(incomingScene?.ownedBundleIds)
        ? incomingScene.ownedBundleIds.filter((bundleId) => canUseBundleInScene(bundleId, sceneId))
        : [];
      const inferredBundleIds = inferBundleOwnershipFromThemes(sceneId, incomingOwnedThemes);
      const ownedBundleIds = Array.from(new Set([...incomingOwnedBundles, ...inferredBundleIds]));

      const placedObjects = Object.fromEntries(
        Object.entries(sceneTemplate?.placedObjects || {}).map(([objectId, objectTemplate]) => {
          const incomingItemId = incomingScene?.placedObjects?.[objectId]?.itemId;
          const incomingItem = gameData.itemCatalog?.[incomingItemId];
          const validItemId = incomingItem && incomingItem.slots?.includes(objectTemplate.slot)
            ? incomingItemId
            : objectTemplate.itemId;
          return [objectId, { itemId: validItemId }];
        }),
      );

      return [
        sceneId,
        {
          themeId,
          ownedThemeIds: Array.from(new Set(incomingOwnedThemes)),
          ownedBundleIds,
          placedObjects,
        },
      ];
    }),
  );
}

function canUseThemeInScene(themeId, sceneId) {
  const theme = gameData?.themeBundles?.themes?.[themeId];
  return Boolean(theme && theme.sceneId === sceneId);
}

function canUseBundleInScene(bundleId, sceneId) {
  const bundle = gameData?.themeBundles?.bundles?.[bundleId];
  return Boolean(bundle && bundle.sceneId === sceneId);
}

function themeBundlesForScene(themeId, sceneId) {
  const bundles = gameData?.themeBundles?.bundles || {};
  const theme = gameData?.themeBundles?.themes?.[themeId];
  const preferredBundleIds = Array.isArray(theme?.bundleIds) ? theme.bundleIds : [];
  const seenBundleIds = new Set();
  const scopedBundles = [];

  preferredBundleIds.forEach((bundleId) => {
    const bundle = bundles[bundleId];
    if (!bundle || bundle.sceneId !== sceneId || bundle.themeId !== themeId || seenBundleIds.has(bundle.id)) return;
    scopedBundles.push(bundle);
    seenBundleIds.add(bundle.id);
  });

  Object.values(bundles).forEach((bundle) => {
    if (!bundle || bundle.sceneId !== sceneId || bundle.themeId !== themeId || seenBundleIds.has(bundle.id)) return;
    scopedBundles.push(bundle);
    seenBundleIds.add(bundle.id);
  });

  return scopedBundles;
}

function defaultThemeIdForScene(sceneId) {
  const themes = Object.values(gameData?.themeBundles?.themes || {}).filter((theme) => theme.sceneId === sceneId);
  if (!themes.length) return null;
  return themes.find((theme) => theme.saleMode === "default")?.id || themes[0].id;
}

function inferBundleOwnershipFromThemes(sceneId, themeIds = []) {
  const sourceThemeIds = Array.isArray(themeIds) && themeIds.length
    ? themeIds
    : [defaultThemeIdForScene(sceneId)].filter(Boolean);
  const ownedBundleIds = [];
  sourceThemeIds.forEach((themeId) => {
    themeBundlesForScene(themeId, sceneId).forEach((bundle) => {
      if (bundle?.id) ownedBundleIds.push(bundle.id);
    });
  });
  return Array.from(new Set(ownedBundleIds.filter((bundleId) => canUseBundleInScene(bundleId, sceneId))));
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

function ensureDevStageCoins(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return false;
  if (!snapshot.inventory || typeof snapshot.inventory !== "object") {
    snapshot.inventory = { coins: DEV_STAGE_MIN_COINS, owned: {} };
    return true;
  }
  const currentCoins = Number(snapshot.inventory.coins) || 0;
  const upliftedCoins = Math.max(DEV_STAGE_MIN_COINS, currentCoins);
  if (upliftedCoins === currentCoins) return false;
  snapshot.inventory.coins = upliftedCoins;
  return true;
}

function resolveFarmLifecycleForSnapshot(snapshot, nowIso = new Date().toISOString()) {
  const plots = snapshot?.farmSnapshot?.plots;
  if (!plots || typeof plots !== "object") return false;
  const nowMs = Date.parse(nowIso);
  if (!Number.isFinite(nowMs)) return false;
  let changed = false;
  Object.values(plots).forEach((plot) => {
    if (resolveFarmPlotLifecycle(plot, nowMs, nowIso)) {
      changed = true;
    }
  });
  if (changed) {
    snapshot.savedAt = nowIso;
  }
  return changed;
}

function resolveFarmPlotLifecycle(plot, nowMs, nowIso) {
  if (!plot || typeof plot !== "object") return false;
  if (!plot.cropId || !plot.plantedAt) return false;

  const crop = gameData.farm?.crops?.[plot.cropId];
  const growMinutes = Number(crop?.growMinutes);
  const readyWindowMinutes = Number(crop?.readyWindowMinutes);
  const plantedAtMs = Date.parse(plot.plantedAt);
  if (!Number.isFinite(growMinutes) || !Number.isFinite(plantedAtMs)) return false;

  const readyAtMs = plantedAtMs + growMinutes * 60 * 1000;
  const witherAtMs = readyAtMs + readyWindowMinutes * 60 * 1000;
  let changed = false;

  if ((plot.state === "seeded" || plot.state === "growing") && nowMs >= readyAtMs) {
    plot.state = "ready";
    plot.updatedAt = nowIso;
    changed = true;
  }

  if (plot.state === "ready" && Number.isFinite(readyWindowMinutes) && nowMs >= witherAtMs) {
    plot.state = "withered";
    plot.updatedAt = nowIso;
    changed = true;
  }

  return changed;
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
