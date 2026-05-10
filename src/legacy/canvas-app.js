const canvas = document.querySelector("#worldCanvas");
const ctx = canvas.getContext("2d");
const avatarCanvas = document.querySelector("#avatarCanvas");
const avatarCtx = avatarCanvas.getContext("2d");
const gameData = window.AGENT_SPACE_DATA;
const SAVE_SCHEMA_VERSION = 2;
const SAVE_KEY = "agent-space-demo-save";
const LEGACY_SAVE_KEYS = ["agent-space-demo-save-v1"];
const BRIDGE_SAVE_KEY = "agent-space-local-bridge";
const BRIDGE_TIMEOUT_MS = 2200;
const FARM_LIFECYCLE_TICK_MS = 1500;
const DEV_STAGE_MIN_COINS = 999999;
const saveDebugState = {
  key: SAVE_KEY,
  schemaVersion: SAVE_SCHEMA_VERSION,
  status: "fresh",
  savedAt: null,
  error: null,
};
const bridgeState = {
  url: resolveBridgeUrl(),
  farmSnapshot: { plots: {} },
};
const FARM_ACTION_LABELS = {
  plant: "播种",
  water: "浇水",
  fertilize: "施肥",
  harvest: "收获",
  clear: "清理",
};
const THEME_TOKEN_COLORS = {
  "warm-plaster": "#f4dec6",
  "honey-oak": "#d7b083",
  walnut: "#7d5840",
  "soft-salmon": "#e6b79f",
  "sunlit-soft": "#f3e0b9",
  "leaf-green": "#8cab76",
  "mist-blue": "#cadcec",
  "pale-ash": "#d9d9d2",
  "white-oak": "#d7c8af",
  "cool-cream": "#ece6d8",
  "clear-morning": "#d7e9f4",
  "sea-glass": "#8ec6b8",
  "warm-white": "#f4f0e7",
  "matte-maple": "#ceb28b",
  "charcoal-line": "#4e5057",
  "rose-grid": "#dca8ab",
  "studio-bright": "#f6e7c7",
  "creator-pink": "#d48ca8",
};
const savedState = readSavedState();

const sceneImages = Object.fromEntries(
  Object.entries(gameData.assets.scenes).map(([sceneId, src]) => {
    const image = new Image();
    image.src = src;
    return [sceneId, image];
  }),
);
Object.values(sceneImages).forEach((image) => {
  image.onload = () => requestAnimationFrame(draw);
});

const atlasDefinitions = Object.values(gameData.assets.atlases || {});
const atlasImages = Object.fromEntries(
  atlasDefinitions
    .filter((atlas) => atlas.image)
    .map((atlas) => {
      const image = new Image();
      image.src = atlas.image;
      image.onload = () => requestAnimationFrame(draw);
      return [atlas.key, image];
    }),
);

const agentImage = new Image();
agentImage.src = gameData.assets.agent;
agentImage.onload = () => {
  drawAvatar();
  requestAnimationFrame(draw);
};

const sceneZones = Object.fromEntries(
  Object.entries(gameData.scenes).map(([sceneId, scene]) => [sceneId, scene.placedObjects]),
);

const scenes = Object.fromEntries(
  Object.entries(gameData.scenes).map(([sceneId, scene]) => [
    sceneId,
    {
      ...scene,
      image: sceneImages[scene.assetId],
      decoratingImage: scene.decoratingAssetId ? sceneImages[scene.decoratingAssetId] : null,
      zones: scene.placedObjects,
    },
  ]),
);

applySavedInventory(savedState.inventory);

Object.values(scenes).forEach((scene) => {
  Object.entries(scene.zones).forEach(([objectId, zone]) => {
    zone.objectId = objectId;
    zone.defaultItemId = zone.defaultItemId || zone.itemId;
  });
});
applyDefaultSceneThemes();
applySavedSceneSnapshot(savedState.sceneSnapshot);
applySavedFarmSnapshot(savedState.farmSnapshot);
ensureFarmSnapshotShape();

const initialScene = window.location.hash === "#yard" ? "yard" : "indoor";

const agents = Object.fromEntries(
  Object.entries(gameData.agents).map(([name, agent]) => {
    const initialObject = agent.initialObject;
    const sceneId = initialObject?.scene || initialScene;
    const objectZone = initialObject ? scenes[sceneId].zones[initialObject.objectId] : null;
    const objectPoint = objectZone ? zoneInteractionPoint(objectZone, scenes[sceneId]) : null;
    return [
      name,
      {
        ...agent,
        realStatus: initialObject?.status || scenes[sceneId].status,
        scene: sceneId,
        point: { ...(objectPoint || scenes[sceneId].entry) },
      },
    ];
  }),
);

const state = {
  activeAgent: "Aria",
  currentScene: initialScene,
  preview: null,
  previewTimer: null,
  bubble: null,
  artifact: null,
  working: false,
  hoverZone: null,
  agent: {
    x: scenes[initialScene].entry.x,
    y: scenes[initialScene].entry.y,
    fromX: scenes[initialScene].entry.x,
    fromY: scenes[initialScene].entry.y,
    targetX: scenes[initialScene].entry.x,
    targetY: scenes[initialScene].entry.y,
    moveStart: 0,
    moveMs: 0,
    status: "idle",
    facing: 1,
  },
  clickTarget: null,
  hotspotPulse: null,
  navigationTimer: null,
  decorating: false,
  selectedDecorObjectId: null,
  selectedFarmPlotId: null,
  lastFarmLifecycleTickAt: 0,
  farmLifecyclePersisting: false,
  pendingFarmAction: false,
  pendingThemeAction: false,
};

const el = {
  coinValue: document.querySelector("#coinValue"),
  modeBtn: document.querySelector("#modeBtn"),
  modeLabel: document.querySelector("#modeLabel"),
  activeAgentName: document.querySelector("#activeAgentName"),
  currentTask: document.querySelector("#currentTask"),
  previewHint: document.querySelector("#previewHint"),
  energyText: document.querySelector("#energyText"),
  moodText: document.querySelector("#moodText"),
  expText: document.querySelector("#expText"),
  moodCopy: document.querySelector("#moodCopy"),
  energyBar: document.querySelector("#energyBar"),
  moodBar: document.querySelector("#moodBar"),
  expBar: document.querySelector("#expBar"),
  promptInput: document.querySelector("#promptInput"),
  intentSelect: document.querySelector("#intentSelect"),
  artifactDrawer: document.querySelector("#artifactDrawer"),
  artifactTitle: document.querySelector("#artifactTitle"),
  artifactContent: document.querySelector("#artifactContent"),
  toastStack: document.querySelector("#toastStack"),
  agentTabs: document.querySelector("#agentTabs"),
  decorateDrawer: document.querySelector("#decorateDrawer"),
  decorateSlotList: document.querySelector("#decorateSlotList"),
  decorateItemList: document.querySelector("#decorateItemList"),
  decorateCurrentSlot: document.querySelector("#decorateCurrentSlot"),
  themeCurrentLabel: document.querySelector("#themeCurrentLabel"),
  themeList: document.querySelector("#themeList"),
  saveSchemaLabel: document.querySelector("#saveSchemaLabel"),
  saveDebugMeta: document.querySelector("#saveDebugMeta"),
  resetSaveBtn: document.querySelector("#resetSaveBtn"),
  farmActionPanel: document.querySelector("#farmActionPanel"),
  farmPanelTitle: document.querySelector("#farmPanelTitle"),
  farmPanelState: document.querySelector("#farmPanelState"),
  farmActionButtons: document.querySelector("#farmActionButtons"),
};

function readSavedState() {
  const saveKeys = [SAVE_KEY, ...LEGACY_SAVE_KEYS];
  for (const key of saveKeys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") throw new Error("Save payload must be an object");
      const schemaVersion = Number(parsed.schemaVersion || 1);
      if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
        throw new Error(`Unsupported save schema value: ${parsed.schemaVersion}`);
      }
      saveDebugState.key = key;
      saveDebugState.schemaVersion = schemaVersion;
      saveDebugState.savedAt = parsed.savedAt || null;
      saveDebugState.error = null;
      if (schemaVersion > SAVE_SCHEMA_VERSION) {
        saveDebugState.status = "incompatible";
        saveDebugState.error = `schema v${schemaVersion}`;
        return {};
      }
      saveDebugState.status = key === SAVE_KEY && schemaVersion === SAVE_SCHEMA_VERSION ? "loaded" : "migrated";
      return parsed;
    } catch (error) {
      saveDebugState.key = key;
      saveDebugState.status = "invalid";
      saveDebugState.error = error.message;
      console.warn("Failed to read saved Agent Space state", error);
      return {};
    }
  }
  return {};
}

function applySavedInventory(inventory) {
  if (!inventory) {
    gameData.inventory.coins = Math.max(DEV_STAGE_MIN_COINS, Number(gameData.inventory.coins) || 0);
    return;
  }
  if (inventory.owned && typeof inventory.owned === "object") {
    Object.entries(inventory.owned).forEach(([itemId, count]) => {
      if (gameData.itemCatalog[itemId]) {
        gameData.inventory.owned[itemId] = Math.max(0, Number(count) || 0);
      }
    });
  }
  if (Number.isFinite(Number(inventory.coins))) {
    gameData.inventory.coins = Math.max(DEV_STAGE_MIN_COINS, Number(inventory.coins));
  } else {
    gameData.inventory.coins = Math.max(DEV_STAGE_MIN_COINS, Number(gameData.inventory.coins) || 0);
  }
}

function applySavedSceneSnapshot(sceneSnapshot) {
  if (!sceneSnapshot) return;
  Object.entries(sceneSnapshot).forEach(([sceneId, sceneSave]) => {
    const scene = scenes[sceneId];
    if (!scene || !sceneSave) return;
    if (sceneSave.placedObjects && typeof sceneSave.placedObjects === "object") {
      Object.entries(sceneSave.placedObjects).forEach(([objectId, objectSave]) => {
        const zone = scene.zones[objectId];
        const item = gameData.itemCatalog[objectSave?.itemId];
        if (!zone || !item || !item.slots?.includes(zone.slot)) return;
        zone.itemId = objectSave.itemId;
        zone.label = item.label;
      });
    }
    if (Array.isArray(sceneSave.ownedThemeIds)) {
      const validOwned = sceneSave.ownedThemeIds.filter((themeId) => canUseThemeInScene(themeId, sceneId));
      if (validOwned.length) {
        scene.ownedThemeIds = Array.from(new Set(validOwned));
      }
    }
    if (typeof sceneSave.themeId === "string" && canUseThemeInScene(sceneSave.themeId, sceneId)) {
      scene.themeId = sceneSave.themeId;
    }
    if (!Array.isArray(scene.ownedThemeIds) || !scene.ownedThemeIds.length) {
      scene.ownedThemeIds = [defaultThemeIdForScene(sceneId)].filter(Boolean);
    }
    if (scene.themeId && !scene.ownedThemeIds.includes(scene.themeId)) {
      scene.ownedThemeIds.push(scene.themeId);
    }
    const savedBundleIds = Array.isArray(sceneSave.ownedBundleIds) ? sceneSave.ownedBundleIds : [];
    const validSavedBundleIds = savedBundleIds.filter((bundleId) => canUseBundleInScene(bundleId, sceneId));
    const inferredBundleIds = inferBundleOwnershipFromThemes(sceneId, scene.ownedThemeIds);
    scene.ownedBundleIds = Array.from(new Set([...validSavedBundleIds, ...inferredBundleIds]));
  });
}

function themesForScene(sceneId) {
  return Object.values(gameData.themeBundles?.themes || {}).filter((theme) => theme.sceneId === sceneId);
}

function defaultThemeIdForScene(sceneId) {
  const themes = themesForScene(sceneId);
  if (!themes.length) return null;
  return themes.find((theme) => theme.saleMode === "default")?.id || themes[0].id;
}

function applyDefaultSceneThemes() {
  Object.entries(scenes).forEach(([sceneId, scene]) => {
    const defaultThemeId = defaultThemeIdForScene(sceneId);
    if (!scene.themeId) {
      scene.themeId = defaultThemeId;
    }
    if (!Array.isArray(scene.ownedThemeIds) || !scene.ownedThemeIds.length) {
      scene.ownedThemeIds = [defaultThemeId].filter(Boolean);
    }
    if (scene.themeId && !scene.ownedThemeIds.includes(scene.themeId)) {
      scene.ownedThemeIds.push(scene.themeId);
    }
    const inferredBundleIds = inferBundleOwnershipFromThemes(sceneId, scene.ownedThemeIds);
    const existingBundleIds = Array.isArray(scene.ownedBundleIds)
      ? scene.ownedBundleIds.filter((bundleId) => canUseBundleInScene(bundleId, sceneId))
      : [];
    scene.ownedBundleIds = Array.from(new Set([...existingBundleIds, ...inferredBundleIds]));
  });
}

function canUseThemeInScene(themeId, sceneId) {
  const theme = gameData.themeBundles?.themes?.[themeId];
  return Boolean(theme && theme.sceneId === sceneId);
}

function canUseBundleInScene(bundleId, sceneId) {
  const bundle = gameData.themeBundles?.bundles?.[bundleId];
  return Boolean(bundle && bundle.sceneId === sceneId);
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

function sceneTheme(scene = activeScene()) {
  const themeId = scene?.themeId;
  if (!themeId) return null;
  return gameData.themeBundles?.themes?.[themeId] || null;
}

function themeTokenColor(token, fallback) {
  if (!token) return fallback;
  return THEME_TOKEN_COLORS[token] || fallback;
}

function rgbaFromHex(hexColor, alpha) {
  if (typeof hexColor !== "string" || !hexColor.startsWith("#")) {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  const value = hexColor.slice(1);
  if (value.length !== 6) return `rgba(255, 255, 255, ${alpha})`;
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function applyBridgeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  applySavedInventory(snapshot.inventory);
  applySavedSceneSnapshot(snapshot.sceneSnapshot);
  applySavedFarmSnapshot(snapshot.farmSnapshot);
  ensureFarmSnapshotShape();
}

function buildDefaultFarmPlots(nowIso = new Date().toISOString()) {
  const farmDefault = cloneData(gameData.farm?.defaultPlotSnapshot || { state: "empty" });
  const plots = {};

  Object.values(scenes).forEach((scene) => {
    Object.values(scene.zones).forEach((zone) => {
      const plotId = zone?.farmPlotId;
      if (!plotId || plots[plotId]) return;
      plots[plotId] = normalizeFarmPlot({
        ...farmDefault,
        state: zone.defaultFarmStateId || farmDefault.state || "empty",
        updatedAt: nowIso,
      });
    });
  });

  return plots;
}

function normalizeFarmPlot(plot) {
  const farmDefault = cloneData(gameData.farm?.defaultPlotSnapshot || { state: "empty" });
  const merged = {
    ...farmDefault,
    ...(plot && typeof plot === "object" ? plot : {}),
  };
  if (!merged.state || typeof merged.state !== "string") {
    merged.state = farmDefault.state || "empty";
  }
  if (!Array.isArray(merged.neighborHelps)) {
    merged.neighborHelps = [];
  }
  if (!Array.isArray(merged.stolenBy)) {
    merged.stolenBy = [];
  }
  return merged;
}

function ensureFarmSnapshotShape(nowIso = new Date().toISOString()) {
  const defaults = buildDefaultFarmPlots(nowIso);
  const currentPlots = bridgeState.farmSnapshot?.plots && typeof bridgeState.farmSnapshot.plots === "object"
    ? bridgeState.farmSnapshot.plots
    : {};
  const plots = {};

  Object.entries(defaults).forEach(([plotId, defaultPlot]) => {
    plots[plotId] = normalizeFarmPlot({
      ...defaultPlot,
      ...(currentPlots[plotId] || {}),
    });
  });

  Object.entries(currentPlots).forEach(([plotId, plot]) => {
    if (plots[plotId]) return;
    plots[plotId] = normalizeFarmPlot(plot);
  });

  bridgeState.farmSnapshot = { plots };
}

function applySavedFarmSnapshot(farmSnapshot) {
  if (!farmSnapshot || typeof farmSnapshot !== "object") return;
  if (!farmSnapshot.plots || typeof farmSnapshot.plots !== "object") return;
  bridgeState.farmSnapshot = {
    plots: Object.fromEntries(
      Object.entries(farmSnapshot.plots).map(([plotId, plot]) => [plotId, normalizeFarmPlot(plot)]),
    ),
  };
}

function buildSceneSnapshot() {
  return Object.fromEntries(
    Object.entries(scenes).map(([sceneId, scene]) => [
      sceneId,
      {
        themeId: scene.themeId || defaultThemeIdForScene(sceneId),
        ownedThemeIds: Array.isArray(scene.ownedThemeIds) ? Array.from(new Set(scene.ownedThemeIds)) : [],
        ownedBundleIds: Array.isArray(scene.ownedBundleIds)
          ? Array.from(new Set(scene.ownedBundleIds.filter((bundleId) => canUseBundleInScene(bundleId, sceneId))))
          : [],
        placedObjects: Object.fromEntries(
          Object.entries(scene.zones).map(([objectId, zone]) => [objectId, { itemId: zone.itemId }]),
        ),
      },
    ]),
  );
}

function buildFullSnapshot(savedAt = new Date().toISOString()) {
  ensureFarmSnapshotShape(savedAt);
  return {
    inventory: {
      owned: cloneData(gameData.inventory.owned),
      coins: gameData.inventory.coins,
    },
    sceneSnapshot: buildSceneSnapshot(),
    farmSnapshot: cloneData(bridgeState.farmSnapshot || { plots: {} }),
    savedAt,
  };
}

function writeLocalMirror(snapshot, savedAt) {
  const payload = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt,
    inventory: snapshot.inventory,
    sceneSnapshot: snapshot.sceneSnapshot,
    farmSnapshot: snapshot.farmSnapshot,
  };
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  LEGACY_SAVE_KEYS.forEach((key) => window.localStorage.removeItem(key));
}

function updateSaveDebug({ key, status, savedAt, error = null }) {
  saveDebugState.key = key;
  saveDebugState.schemaVersion = SAVE_SCHEMA_VERSION;
  saveDebugState.status = status;
  saveDebugState.savedAt = savedAt || null;
  saveDebugState.error = error;
  renderSaveDebug();
}

async function saveGameState() {
  const savedAt = new Date().toISOString();
  const snapshot = buildFullSnapshot(savedAt);
  try {
    const result = await bridgeRequest("snapshot.save", { snapshot });
    const bridgeSnapshot = result?.snapshot || snapshot;
    const bridgeSavedAt = result?.savedAt || bridgeSnapshot.savedAt || savedAt;
    applyBridgeSnapshot(bridgeSnapshot);
    writeLocalMirror(bridgeSnapshot, bridgeSavedAt);
    updateSaveDebug({
      key: BRIDGE_SAVE_KEY,
      status: "saved",
      savedAt: bridgeSavedAt,
      error: null,
    });
    return true;
  } catch (error) {
    try {
      writeLocalMirror(snapshot, savedAt);
      updateSaveDebug({
        key: SAVE_KEY,
        status: "saved",
        savedAt,
        error: `bridge offline: ${error.message}`,
      });
      return false;
    } catch (localError) {
      saveDebugState.status = "invalid";
      saveDebugState.error = localError.message;
      renderSaveDebug();
      console.warn("Failed to save Agent Space state", localError);
      return false;
    }
  }
}

async function resetLocalSave() {
  const confirmed = window.confirm("重置本地存档？购买记录、金币、家具摆放和农田状态会恢复默认。");
  if (!confirmed) return;
  try {
    const result = await bridgeRequest("save.reset");
    const resetSnapshot = result?.snapshot;
    if (!resetSnapshot) throw new Error("Bridge reset returned empty snapshot.");
    const resetSavedAt = result?.savedAt || new Date().toISOString();
    applyBridgeSnapshot(resetSnapshot);
    writeLocalMirror(resetSnapshot, resetSavedAt);
    updateSaveDebug({
      key: BRIDGE_SAVE_KEY,
      status: "saved",
      savedAt: resetSavedAt,
      error: null,
    });
    renderStatus();
    if (state.decorating) renderDecoratePanel();
    toast("本地存档已通过 Local Bridge 重置");
    return;
  } catch (bridgeError) {
    console.warn("Failed to reset through Local Bridge, fallback to localStorage", bridgeError);
  }

  try {
    [SAVE_KEY, ...LEGACY_SAVE_KEYS].forEach((key) => window.localStorage.removeItem(key));
    toast("本地存档已重置");
    window.setTimeout(() => window.location.reload(), 420);
  } catch (localError) {
    console.warn("Failed to reset Agent Space save state", localError);
    toast("重置失败，请查看控制台");
  }
}

function activeAgent() {
  return agents[state.activeAgent];
}

function activeScene() {
  return scenes[state.currentScene];
}

function activeSceneImage() {
  const scene = activeScene();
  const decoratingImage = state.decorating ? scene.decoratingImage : null;
  if (decoratingImage?.complete && decoratingImage.naturalWidth) return decoratingImage;
  return scene.image;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rectForCover(image = activeSceneImage()) {
  const imageRatio = image.width / image.height || 16 / 9;
  const canvasRatio = canvas.width / canvas.height;
  let width = canvas.width;
  let height = canvas.height;
  let x = 0;
  let y = 0;
  if (canvasRatio > imageRatio) {
    height = canvas.width / imageRatio;
    y = (canvas.height - height) / 2;
  } else {
    width = canvas.height * imageRatio;
    x = (canvas.width - width) / 2;
  }
  return { x, y, width, height };
}

function sceneToCanvas(point) {
  const rect = rectForCover();
  return {
    x: rect.x + point.x * rect.width,
    y: rect.y + point.y * rect.height,
  };
}

function canvasToScene(point) {
  const rect = rectForCover();
  return {
    x: (point.x - rect.x) / rect.width,
    y: (point.y - rect.y) / rect.height,
  };
}

function pointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const pi = polygon[i];
    const pj = polygon[j];
    const intersects =
      pi.y > point.y !== pj.y > point.y &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInEllipse(point, ellipse) {
  const rx = ellipse.rx || ellipse.w / 2;
  const ry = ellipse.ry || ellipse.h / 2;
  const cx = ellipse.cx ?? ellipse.x + rx;
  const cy = ellipse.cy ?? ellipse.y + ry;
  return ((point.x - cx) ** 2) / (rx ** 2) + ((point.y - cy) ** 2) / (ry ** 2) <= 1;
}

function zoneShapes(zone) {
  if (zone.hitAreas) return zone.hitAreas;
  if (zone.polygon) return [{ type: "polygon", points: zone.polygon }];
  if (zone.rect) return [{ type: "rect", ...zone.rect }];
  return [];
}

function pointInShape(point, shape) {
  if (shape.type === "polygon") return pointInPolygon(point, shape.points);
  if (shape.type === "ellipse") return pointInEllipse(point, shape);
  return pointInRect(point, shape);
}

function pointInZone(point, zone) {
  return zoneShapes(zone).some((shape) => pointInShape(point, shape));
}

function shapeBounds(shape) {
  if (shape.type === "polygon") {
    const xs = shape.points.map((point) => point.x);
    const ys = shape.points.map((point) => point.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return {
      x,
      y,
      w: Math.max(...xs) - x,
      h: Math.max(...ys) - y,
    };
  }
  if (shape.type === "ellipse") {
    const rx = shape.rx || shape.w / 2;
    const ry = shape.ry || shape.h / 2;
    const cx = shape.cx ?? shape.x + rx;
    const cy = shape.cy ?? shape.y + ry;
    return { x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2 };
  }
  return shape;
}

function zoneBounds(zone) {
  const bounds = zoneShapes(zone).map(shapeBounds);
  if (!bounds.length) return zone.rect || { x: 0, y: 0, w: 0, h: 0 };
  const x = Math.min(...bounds.map((rect) => rect.x));
  const y = Math.min(...bounds.map((rect) => rect.y));
  const right = Math.max(...bounds.map((rect) => rect.x + rect.w));
  const bottom = Math.max(...bounds.map((rect) => rect.y + rect.h));
  return {
    x,
    y,
    w: right - x,
    h: bottom - y,
  };
}

function zoneAt(point) {
  return Object.values(activeScene().zones).find((zone) => pointInZone(point, zone)) || null;
}

function itemForZone(zone) {
  return gameData.itemCatalog[zone.itemId];
}

function ownedCount(itemId) {
  return gameData.inventory.owned[itemId] || 0;
}

function zoneSupportsAction(zone, action) {
  return itemForZone(zone)?.actions?.includes(action);
}

function decoratableObjects(scene = activeScene()) {
  return Object.entries(scene.zones).filter(([, zone]) => zoneSupportsAction(zone, "decorate_replace"));
}

function catalogItemsForSlot(slot) {
  return Object.entries(gameData.itemCatalog).filter(([itemId, item]) => item.slots?.includes(slot) && item.actions?.includes("decorate_replace"));
}

function itemSprite(item) {
  const fallback = item?.sprite?.fallback || { kind: item?.category || "item", color: "#d96f42", accent: "#fff3d8", short: "ITEM" };
  return {
    atlasKey: item?.sprite?.atlasKey || "prototype-furniture",
    spriteId: item?.sprite?.spriteId || `${fallback.kind}.fallback`,
    anchor: item?.sprite?.anchor || { x: 0.5, y: 1 },
    fallback,
  };
}

function atlasForSprite(sprite) {
  return atlasDefinitions.find((atlas) => atlas.key === sprite.atlasKey) || null;
}

function frameForSprite(sprite) {
  const atlas = atlasForSprite(sprite);
  return atlas?.frames?.[sprite.spriteId] || null;
}

function swatchMarkup(item) {
  const visual = itemSprite(item).fallback;
  return `<span class="decor-swatch" style="--swatch:${visual.color}; --swatch-accent:${visual.accent};"></span>`;
}

function itemPrice(item) {
  return Number(item?.price || 0);
}

function itemCommerceText(itemId, item) {
  const owned = ownedCount(itemId);
  if (owned > 0) return `${item.category} · 拥有 ${owned}`;
  return `${item.category} · ${itemPrice(item)} 金币`;
}

function pointInWalkable(point, scene = activeScene()) {
  return scene.walkableRects.some((rect) => pointInRect(point, rect));
}

function clampPointToRect(point, rect) {
  return {
    x: clamp(point.x, rect.x, rect.x + rect.w),
    y: clamp(point.y, rect.y, rect.y + rect.h),
  };
}

function nearestWalkablePoint(point, scene = activeScene()) {
  if (pointInWalkable(point, scene)) return point;
  let best = null;
  let bestDistance = Infinity;
  scene.walkableRects.forEach((rect) => {
    const candidate = clampPointToRect(point, rect);
    const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  });
  return best || scene.entry;
}

function zoneInteractionPoint(zone, scene = activeScene()) {
  if (zone.interactionPoint) return nearestWalkablePoint(zone.interactionPoint, scene);
  if (zone.point) return nearestWalkablePoint(zone.point, scene);
  const bounds = zoneBounds(zone);
  return nearestWalkablePoint({ x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h }, scene);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(720, Math.floor(rect.width));
  const height = Math.max(500, Math.floor(rect.height));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function syncHash() {
  const hash = activeScene().hash;
  const target = `${window.location.pathname}${hash}`;
  if (`${window.location.pathname}${window.location.hash}` !== target) {
    window.history.replaceState(null, "", target);
  }
}

function moveAgentTo(point, status, options = {}) {
  const agent = state.agent;
  const target = options.allowBlocked ? point : nearestWalkablePoint(point);
  agent.fromX = agent.x;
  agent.fromY = agent.y;
  agent.targetX = target.x;
  agent.targetY = target.y;
  const distance = Math.hypot(agent.targetX - agent.fromX, agent.targetY - agent.fromY);
  agent.moveMs = clamp(distance * 4200, 360, 2200);
  agent.moveStart = performance.now();
  agent.facing = agent.targetX >= agent.fromX ? 1 : -1;
  agent.status = options.working ? "working" : "walking";
  state.clickTarget = options.showTarget === false ? null : { x: agent.targetX, y: agent.targetY, until: Date.now() + agent.moveMs + 600 };
  if (status) {
    activeAgent().realStatus = status;
    activeAgent().point = { ...target };
    activeAgent().scene = state.currentScene;
    renderStatus();
  }
}

function setScene(sceneName, options = {}) {
  if (!scenes[sceneName]) return;
  clearTimeout(state.navigationTimer);
  state.currentScene = sceneName;
  if (sceneName !== "yard") {
    state.selectedFarmPlotId = null;
  }
  state.preview = null;
  state.hoverZone = null;
  state.hotspotPulse = null;
  clearTimeout(state.previewTimer);

  const scene = activeScene();
  const point = options.point || scene.entry;
  const agent = activeAgent();
  agent.scene = sceneName;
  agent.point = { ...point };
  if (options.status || !state.working) {
    agent.realStatus = options.status || scene.status;
  }

  state.agent.x = point.x;
  state.agent.y = point.y;
  state.agent.fromX = point.x;
  state.agent.fromY = point.y;
  state.agent.targetX = point.x;
  state.agent.targetY = point.y;
  state.agent.moveMs = 0;
  state.agent.status = "idle";
  state.agent.facing = 1;
  state.clickTarget = null;

  if (!options.silent) {
    setBubble(options.bubble || scene.status, 2200);
    toast(sceneName === "yard" ? "已进入小院子" : "已回到室内");
  }

  syncHash();
  renderStatus();
  if (state.decorating) renderDecoratePanel();
}

function updateAgentPosition() {
  const agent = state.agent;
  const progress = agent.moveMs
    ? clamp((performance.now() - agent.moveStart) / agent.moveMs, 0, 1)
    : 1;
  const ease = 1 - Math.pow(1 - progress, 3);
  agent.x = agent.fromX + (agent.targetX - agent.fromX) * ease;
  agent.y = agent.fromY + (agent.targetY - agent.fromY) * ease;
  activeAgent().point = { x: agent.x, y: agent.y };
  activeAgent().scene = state.currentScene;
  if (progress >= 1 && agent.moveMs) {
    agent.moveMs = 0;
    if (agent.status === "walking") {
      agent.status = state.working ? "working" : "idle";
    }
  }
}

function drawRoom() {
  const image = activeSceneImage();
  if (!image.complete || !image.naturalWidth) {
    ctx.fillStyle = state.currentScene === "yard" ? "#9ec877" : "#ead2b6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const rect = rectForCover(image);
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  if (state.currentScene !== "yard") {
    const theme = sceneTheme();
    if (theme) {
      drawThemeOverlay(theme, rect);
      return;
    }
  }
  ctx.fillStyle = state.currentScene === "yard" ? "rgba(255, 250, 205, 0.03)" : "rgba(255, 236, 203, 0.035)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawThemeOverlay(theme, rect) {
  const tokens = theme?.styleTokens || {};
  const wall = themeTokenColor(tokens.wall, "#f4ddc3");
  const floor = themeTokenColor(tokens.floor, "#d6b18a");
  const accent = themeTokenColor(tokens.accent, "#8cab76");
  const lighting = themeTokenColor(tokens.lighting, "#f2dfb9");
  const rug = themeTokenColor(tokens.rug, "#d7b39e");

  ctx.fillStyle = rgbaFromHex(wall, 0.12);
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height * 0.58);

  ctx.fillStyle = rgbaFromHex(floor, 0.11);
  ctx.fillRect(rect.x, rect.y + rect.height * 0.58, rect.width, rect.height * 0.42);

  ctx.fillStyle = rgbaFromHex(lighting, 0.08);
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

  const rugWidth = rect.width * 0.32;
  const rugHeight = rect.height * 0.12;
  const rugX = rect.x + rect.width * 0.33;
  const rugY = rect.y + rect.height * 0.72;
  ctx.fillStyle = rgbaFromHex(rug, 0.16);
  ctx.fillRect(rugX, rugY, rugWidth, rugHeight);

  ctx.strokeStyle = rgbaFromHex(accent, 0.42);
  ctx.lineWidth = 2;
  ctx.strokeRect(rugX, rugY, rugWidth, rugHeight);
}

function drawObjectLayer() {
  const time = performance.now();
  decoratableObjects().forEach(([objectId, zone]) => {
    const changed = zone.itemId !== zone.defaultItemId;
    const selected = state.decorating && state.selectedDecorObjectId === objectId;
    if (!state.decorating && !changed) return;
    drawPixelFurniture(zone, itemForZone(zone), {
      changed,
      selected,
      dimmed: state.decorating && !selected && !changed,
      time,
    });
  });
}

function drawFarmPlotMarkers() {
  if (state.currentScene !== "yard") return;
  const farmZones = Object.values(activeScene().zones).filter((zone) => zone.farmPlotId);
  if (!farmZones.length) return;

  farmZones.forEach((zone) => {
    const summary = farmSummaryForZone(zone);
    if (!summary) return;
    const bounds = zoneBounds(zone);
    const center = sceneToCanvas({ x: bounds.x + bounds.w / 2, y: bounds.y });
    const primaryText = summary.cropLabel ? `${summary.stateLabel} · ${summary.cropLabel}` : summary.stateLabel;
    const secondaryText = `可做 ${summary.actionHint}`;
    const active = state.selectedFarmPlotId === summary.plotId || state.hotspotPulse?.zone === zone || state.hoverZone === zone;

    ctx.save();
    ctx.font = "11px ui-sans-serif";
    const width = Math.min(182, Math.max(106, Math.max(ctx.measureText(primaryText).width, ctx.measureText(secondaryText).width) + 16));
    const x = clamp(center.x - width / 2, 10, canvas.width - width - 10);
    const y = clamp(center.y - 48, 12, canvas.height - 46);
    ctx.fillStyle = active ? "rgba(255, 245, 223, .95)" : "rgba(255, 250, 241, .88)";
    ctx.strokeStyle = active ? "rgba(215, 131, 76, .9)" : "rgba(90, 68, 49, .26)";
    ctx.lineWidth = active ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, 34, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2b241c";
    ctx.textAlign = "center";
    ctx.fillText(primaryText, x + width / 2, y + 14);
    ctx.fillStyle = "#5d4a3a";
    ctx.fillText(secondaryText, x + width / 2, y + 28);
    ctx.restore();
  });
}

function tickFarmLifecycle(nowMs = Date.now()) {
  if (state.currentScene !== "yard") return;
  if (nowMs - state.lastFarmLifecycleTickAt < FARM_LIFECYCLE_TICK_MS) return;
  state.lastFarmLifecycleTickAt = nowMs;
  ensureFarmSnapshotShape(new Date(nowMs).toISOString());
  const plots = bridgeState.farmSnapshot?.plots || {};
  let changed = false;
  Object.values(plots).forEach((plot) => {
    if (resolveFarmLifecycle(plot, nowMs)) {
      changed = true;
    }
  });
  if (!changed) return;

  if (!state.farmLifecyclePersisting) {
    state.farmLifecyclePersisting = true;
    void saveGameState().finally(() => {
      state.farmLifecyclePersisting = false;
    });
  }
  renderStatus();
}

function drawPixelFurniture(zone, item, options) {
  const sprite = itemSprite(item);
  const visual = sprite.fallback;
  const spriteKind = visual.kind || item?.category;
  const atlasImage = atlasImages[sprite.atlasKey];
  const atlasFrame = frameForSprite(sprite);
  const bounds = zoneBounds(zone);
  const p1 = sceneToCanvas({ x: bounds.x, y: bounds.y });
  const p2 = sceneToCanvas({ x: bounds.x + bounds.w, y: bounds.y + bounds.h });
  const width = Math.abs(p2.x - p1.x);
  const height = Math.abs(p2.y - p1.y);
  const scale = clamp(Math.min(width / 116, height / 78), 0.52, 1.08);
  const pulse = options.selected ? 1 + Math.sin(options.time / 150) * 0.045 : 1;
  const alpha = options.selected || options.changed ? 0.96 : options.dimmed ? 0.58 : 0.76;

  ctx.save();
  ctx.translate((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
  ctx.scale(scale * pulse, scale * pulse);
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(36, 24, 16, .2)";
  ctx.beginPath();
  ctx.ellipse(0, 34, 44, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  if (atlasImage?.complete && atlasImage.naturalWidth && atlasFrame) {
    ctx.drawImage(atlasImage, atlasFrame.x, atlasFrame.y, atlasFrame.w, atlasFrame.h, -58, -54, 116, 96);
  } else if (spriteKind === "bed") drawBedSprite(visual);
  else if (spriteKind === "sofa") drawSofaSprite(visual);
  else if (spriteKind === "bookshelf") drawBookshelfSprite(visual);
  else if (spriteKind === "desk") drawDeskSprite(visual, visual.variant === "dual-monitor");
  else if (spriteKind === "kitchen") drawKitchenSprite(visual);
  else if (spriteKind === "tv") drawTvSprite(visual);
  else drawGenericItemSprite(visual);

  if (options.changed || state.decorating) {
    pixelRect(-25, 36, 50, 16, "rgba(255, 250, 241, .92)", "rgba(47, 33, 24, .26)");
    ctx.fillStyle = "#2d251e";
    ctx.font = "bold 10px ui-sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(visual.short || sprite.spriteId, 0, 47);
  }
  ctx.restore();
}

function drawBedSprite(visual) {
  pixelRect(-43, -11, 86, 29, visual.color, "rgba(45, 31, 23, .36)");
  pixelRect(-39, -18, 26, 16, visual.accent, "rgba(45, 31, 23, .22)");
  pixelRect(-7, -16, 42, 14, "#fff7e8", "rgba(45, 31, 23, .16)");
  pixelRect(-41, 14, 82, 9, "rgba(80, 48, 37, .24)");
  pixelRect(-41, 22, 8, 9, "#5b4034");
  pixelRect(33, 22, 8, 9, "#5b4034");
}

function drawSofaSprite(visual) {
  pixelRect(-42, -17, 84, 24, visual.color, "rgba(45, 31, 23, .35)");
  pixelRect(-47, -5, 16, 30, visual.color, "rgba(45, 31, 23, .35)");
  pixelRect(31, -5, 16, 30, visual.color, "rgba(45, 31, 23, .35)");
  pixelRect(-28, 5, 25, 18, visual.accent, "rgba(45, 31, 23, .18)");
  pixelRect(3, 5, 25, 18, visual.accent, "rgba(45, 31, 23, .18)");
  pixelRect(-37, 25, 9, 7, "#5b4034");
  pixelRect(28, 25, 9, 7, "#5b4034");
}

function drawBookshelfSprite(visual) {
  pixelRect(-33, -30, 66, 62, visual.color, "rgba(45, 31, 23, .36)");
  pixelRect(-27, -23, 54, 10, visual.accent);
  pixelRect(-27, -6, 54, 10, "#f1d892");
  pixelRect(-27, 11, 54, 10, "#96bd8b");
  pixelRect(-29, -12, 58, 4, "#5b4034");
  pixelRect(-29, 5, 58, 4, "#5b4034");
  pixelRect(-29, 22, 58, 4, "#5b4034");
}

function drawDeskSprite(visual, dualMonitor = false) {
  pixelRect(-43, 3, 86, 18, visual.color, "rgba(45, 31, 23, .36)");
  pixelRect(-34, 21, 8, 14, "#5b4034");
  pixelRect(26, 21, 8, 14, "#5b4034");
  pixelRect(dualMonitor ? -35 : -21, -25, 34, 23, "#2c3548", "rgba(255,255,255,.22)");
  pixelRect(dualMonitor ? 1 : -12, -25, 34, 23, "#2c3548", "rgba(255,255,255,.22)");
  pixelRect(dualMonitor ? -31 : -17, -21, 26, 15, visual.accent);
  pixelRect(dualMonitor ? 5 : -8, -21, 26, 15, visual.accent);
  pixelRect(-9, -2, 18, 5, "#5b4034");
}

function drawKitchenSprite(visual) {
  pixelRect(-45, -18, 90, 16, visual.accent, "rgba(45, 31, 23, .24)");
  pixelRect(-45, -2, 90, 32, visual.color, "rgba(45, 31, 23, .36)");
  pixelRect(-37, 6, 20, 16, "#fff7e8", "rgba(45, 31, 23, .18)");
  pixelRect(-8, 8, 20, 11, "#5e7894", "rgba(45, 31, 23, .18)");
  pixelRect(23, 5, 14, 20, "#fff7e8", "rgba(45, 31, 23, .18)");
}

function drawTvSprite(visual) {
  pixelRect(-30, -24, 60, 34, "#2c3548", "rgba(45, 31, 23, .36)");
  pixelRect(-24, -18, 48, 22, visual.accent);
  pixelRect(-40, 13, 80, 17, visual.color, "rgba(45, 31, 23, .36)");
  pixelRect(-8, 10, 16, 7, "#5b4034");
}

function drawGenericItemSprite(visual) {
  pixelRect(-32, -24, 64, 48, visual.color, "rgba(45, 31, 23, .36)");
  pixelRect(-23, -15, 46, 30, visual.accent, "rgba(45, 31, 23, .16)");
}

function drawZoneShape(shape) {
  if (shape.type === "polygon") {
    shape.points.forEach((point, index) => {
      const p = sceneToCanvas(point);
      if (index === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    return;
  }
  if (shape.type === "ellipse") {
    const bounds = shapeBounds(shape);
    const center = sceneToCanvas({ x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 });
    const edge = sceneToCanvas({ x: bounds.x + bounds.w, y: bounds.y + bounds.h });
    const origin = sceneToCanvas({ x: bounds.x, y: bounds.y });
    ctx.ellipse(center.x, center.y, Math.abs(edge.x - origin.x) / 2, Math.abs(edge.y - origin.y) / 2, 0, 0, Math.PI * 2);
    return;
  }
  const p1 = sceneToCanvas({ x: shape.x, y: shape.y });
  const p2 = sceneToCanvas({ x: shape.x + shape.w, y: shape.y + shape.h });
  ctx.roundRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y, 8);
}

function drawZonePreview() {
  if (state.hotspotPulse && Date.now() > state.hotspotPulse.until) {
    state.hotspotPulse = null;
  }
  const zone = state.hotspotPulse?.zone || state.hoverZone || state.preview?.zone;
  if (!zone) return;
  const bounds = zoneBounds(zone);
  const p1 = sceneToCanvas({ x: bounds.x, y: bounds.y });
  const p2 = sceneToCanvas({ x: bounds.x + bounds.w, y: bounds.y + bounds.h });
  const pulse = state.hotspotPulse?.zone === zone ? 0.35 + Math.sin(performance.now() / 90) * 0.22 : 0;
  ctx.save();
  ctx.fillStyle =
    state.preview?.zone === zone || state.hotspotPulse?.zone === zone
      ? `rgba(255, 232, 130, ${0.11 + pulse * 0.45})`
      : "rgba(255,255,255,.04)";
  ctx.strokeStyle = zone.type === "navigate" ? `rgba(112, 202, 255, ${0.86 + pulse})` : `rgba(255, 224, 117, ${0.76 + pulse})`;
  ctx.lineWidth = zone.type === "navigate" ? 3 : 2;
  ctx.shadowColor = zone.type === "navigate" ? "rgba(112, 202, 255, .55)" : "rgba(255, 224, 117, .42)";
  ctx.shadowBlur = state.hotspotPulse?.zone === zone ? 18 : 10;
  zoneShapes(zone).forEach((shape) => {
    ctx.beginPath();
    drawZoneShape(shape);
    ctx.fill();
    ctx.stroke();
  });
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255, 250, 241, .94)";
  ctx.strokeStyle = "rgba(65, 42, 30, .2)";
  const farmSummary = zone.farmPlotId ? farmSummaryForZone(zone) : null;
  const label = farmSummary ? `${zone.label} · ${farmSummary.stateLabel}` : zone.label;
  ctx.font = "12px ui-sans-serif";
  const labelWidth = Math.min(178, Math.max(44, ctx.measureText(label).width + 18));
  const labelX = clamp((p1.x + p2.x) / 2 - labelWidth / 2, 12, canvas.width - labelWidth - 12);
  const labelY = clamp(p1.y - 30, 18, canvas.height - 38);
  ctx.beginPath();
  ctx.roundRect(labelX, labelY, labelWidth, 24, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#2c241d";
  ctx.textAlign = "center";
  ctx.fillText(label, labelX + labelWidth / 2, labelY + 16);
  ctx.restore();
}

function drawClickTarget(time) {
  if (!state.clickTarget || Date.now() > state.clickTarget.until) {
    state.clickTarget = null;
    return;
  }
  const p = sceneToCanvas(state.clickTarget);
  const pulse = 0.5 + Math.sin(time / 140) * 0.5;
  ctx.save();
  ctx.strokeStyle = `rgba(255, 246, 180, ${0.45 + pulse * 0.35})`;
  ctx.fillStyle = `rgba(255, 246, 180, ${0.12 + pulse * 0.08})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 20, 20 + pulse * 5, 7 + pulse * 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawDecorationMarkers() {
  if (!state.decorating) return;
  decoratableObjects().forEach(([objectId, zone]) => {
    const bounds = zoneBounds(zone);
    const center = sceneToCanvas({ x: bounds.x + bounds.w / 2, y: bounds.y });
    const item = itemForZone(zone);
    const active = state.selectedDecorObjectId === objectId;
    const text = item?.label || zone.label;
    ctx.save();
    ctx.font = "12px ui-sans-serif";
    const width = Math.min(130, Math.max(54, ctx.measureText(text).width + 18));
    const x = center.x - width / 2;
    const y = Math.max(70, center.y - 6);
    ctx.fillStyle = active ? "rgba(255, 237, 219, .96)" : "rgba(255,255,255,.82)";
    ctx.strokeStyle = active ? "rgba(217, 111, 66, .72)" : "rgba(98, 75, 55, .25)";
    ctx.lineWidth = active ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, 24, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2b241c";
    ctx.textAlign = "center";
    ctx.fillText(text, center.x, y + 16);
    ctx.restore();
  });
}

function drawAgent(time) {
  const p = sceneToCanvas({ x: state.agent.x, y: state.agent.y });
  const scale = clamp(canvas.width / 1180, 0.62, 1.02);
  const walking = state.agent.status === "walking" || (state.agent.status === "working" && state.agent.moveMs);
  const step = Math.sin(time / 86);
  const bob = walking ? Math.abs(step) * -6 : Math.sin(time / 360) * 3;
  const sway = walking ? Math.sin(time / 120) * 2.5 : 0;
  const stretch = walking ? 1 + Math.abs(step) * 0.035 : 1;
  ctx.save();
  ctx.translate(p.x + sway, p.y + bob);
  ctx.scale(scale * state.agent.facing, scale * stretch);
  ctx.fillStyle = "rgba(36, 24, 16, .22)";
  ctx.beginPath();
  ctx.ellipse(0, 24 - bob / scale, 21, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  if (agentImage.complete && agentImage.naturalWidth) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(agentImage, 0, 0, agentImage.naturalWidth, agentImage.naturalHeight, -34, -116, 68, 116);
  }
  if (state.agent.status === "working") {
    pixelRect(-30, -2, 60, 21, "#fffaf1", "rgba(32, 23, 17, .3)");
    pixelRect(-18, 6, 36, 3, "#5d7fb5");
    pixelRect(-12, 13, 24, 3, "#d6a95a");
  }
  ctx.restore();
  drawAgentBubble(p, bob);
  drawArtifactMark(p, time);
}

function pixelRect(x, y, w, h, fill, stroke = null) {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h));
  }
}

function drawAgentBubble(p, bob) {
  if (!state.bubble || Date.now() > state.bubble.until) {
    state.bubble = null;
    return;
  }
  const text = state.bubble.text;
  ctx.save();
  ctx.font = "13px ui-sans-serif";
  const width = Math.min(280, Math.max(76, ctx.measureText(text).width + 24));
  const x = p.x - width / 2;
  const y = p.y - 88 + bob;
  ctx.fillStyle = "rgba(255, 252, 247, .96)";
  ctx.strokeStyle = "rgba(84, 56, 35, .18)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, 34, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#2b241c";
  ctx.textAlign = "center";
  ctx.fillText(text, p.x, y + 22);
  ctx.restore();
}

function drawArtifactMark(p, time) {
  if (!state.artifact || state.artifact.opened) return;
  const lift = Math.sin(time / 240) * 4;
  ctx.save();
  ctx.shadowColor = "rgba(207, 151, 38, .55)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#f3ba3e";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 78 + lift, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fffaf0";
  ctx.font = "bold 30px ui-sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("!", p.x, p.y - 67 + lift);
  ctx.restore();
}

function draw() {
  resizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  tickFarmLifecycle();
  drawRoom();
  updateAgentPosition();
  drawObjectLayer();
  drawClickTarget(performance.now());
  drawZonePreview();
  drawFarmPlotMarkers();
  drawDecorationMarkers();
  drawAgent(performance.now());
  requestAnimationFrame(draw);
}

function setBubble(text, ms = 5000) {
  state.bubble = { text, until: Date.now() + ms };
}

function toast(text) {
  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = text;
  el.toastStack.append(item);
  window.setTimeout(() => item.remove(), 2400);
}

function sceneOwnsTheme(scene, themeId) {
  return Array.isArray(scene?.ownedThemeIds) && scene.ownedThemeIds.includes(themeId);
}

function sceneOwnsBundle(scene, bundleId) {
  return Array.isArray(scene?.ownedBundleIds) && scene.ownedBundleIds.includes(bundleId);
}

function themeSwatchMarkup(theme) {
  const wall = themeTokenColor(theme?.styleTokens?.wall, "#d7b79a");
  const accent = themeTokenColor(theme?.styleTokens?.accent, "#b88873");
  return `<span class="theme-chip" style="background:linear-gradient(135deg, ${wall} 0 56%, ${accent} 56% 100%);"></span>`;
}

function themeCommerceText(theme, owned, equipped) {
  if (equipped) return `${theme.rarity} · 已装备`;
  if (owned) return `${theme.rarity} · 已拥有`;
  const price = Number(theme.price || 0);
  return price > 0 ? `${theme.rarity} · ${price} 金币` : `${theme.rarity} · 免费`;
}

function themeBundlesForScene(themeId, sceneId) {
  const bundles = gameData.themeBundles?.bundles || {};
  const theme = gameData.themeBundles?.themes?.[themeId];
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

function themeBundleForApply(themeId, sceneId = state.currentScene) {
  return themeBundlesForScene(themeId, sceneId).find((bundle) => Object.keys(bundle?.equipPlan || {}).length > 0) || null;
}

function resolveBundleEquipPlan(bundle, scene = activeScene()) {
  const entries = [];
  let invalid = 0;
  Object.entries(bundle?.equipPlan || {}).forEach(([objectId, itemId]) => {
    const zone = scene?.zones?.[objectId];
    const item = gameData.itemCatalog[itemId];
    if (!zone || !item || !item.slots?.includes(zone.slot)) {
      invalid += 1;
      return;
    }
    entries.push({ objectId, itemId, zone, item });
  });
  return {
    entries,
    invalid,
    total: Object.keys(bundle?.equipPlan || {}).length,
  };
}

function grantBundleItems(bundle) {
  let granted = 0;
  (bundle?.grantItems || []).forEach((itemId) => {
    if (!gameData.itemCatalog[itemId]) return;
    const current = Math.max(0, Number(gameData.inventory.owned[itemId]) || 0);
    if (current <= 0) granted += 1;
    gameData.inventory.owned[itemId] = Math.max(1, current);
  });
  return granted;
}

function applyBundleEquipPlanEntries(entries) {
  let applied = 0;
  entries.forEach(({ zone, itemId, item }) => {
    if (zone.itemId === itemId) return;
    zone.itemId = itemId;
    zone.label = item.label;
    applied += 1;
  });
  return applied;
}

async function equipSceneTheme(themeId, options = {}) {
  const { skipSave = false, skipToast = false, suppressAlreadyToast = false } = options;
  const scene = activeScene();
  if (!scene || !canUseThemeInScene(themeId, state.currentScene)) {
    return { ok: false, reason: "invalid" };
  }
  const theme = gameData.themeBundles?.themes?.[themeId];
  if (!theme) return { ok: false, reason: "invalid" };
  if (scene.themeId === themeId) {
    if (!skipToast && !suppressAlreadyToast) {
      toast(`${theme.label} 已经是当前主题`);
    }
    return { ok: true, changed: false, bridgeSaved: true, purchased: false };
  }

  const wasOwned = sceneOwnsTheme(scene, themeId);
  const price = Number(theme.price || 0);
  if (!wasOwned && price > 0) {
    if (gameData.inventory.coins < price) {
      if (!skipToast) {
        toast(`金币不足，还差 ${price - gameData.inventory.coins}`);
      }
      return { ok: false, reason: "insufficient", price };
    }
    gameData.inventory.coins = Math.max(0, gameData.inventory.coins - price);
    scene.ownedThemeIds = Array.from(new Set([...(scene.ownedThemeIds || []), themeId]));
  } else if (!wasOwned) {
    scene.ownedThemeIds = Array.from(new Set([...(scene.ownedThemeIds || []), themeId]));
  }

  scene.themeId = themeId;
  const bridgeSaved = skipSave ? true : await saveGameState();
  renderDecoratePanel();
  renderStatus();
  if (!skipToast) {
    if (!wasOwned && price > 0) {
      toast(`已购买并切换到 ${theme.label}${bridgeSaved ? "" : "（离线）"}`);
    } else {
      toast(`已切换到 ${theme.label}${bridgeSaved ? "" : "（离线）"}`);
    }
  }
  return {
    ok: true,
    changed: true,
    bridgeSaved,
    purchased: !wasOwned && price > 0,
  };
}

async function applyThemeBundle(themeId) {
  if (state.pendingThemeAction) return;
  const scene = activeScene();
  if (!scene || !canUseThemeInScene(themeId, state.currentScene)) return;
  const theme = gameData.themeBundles?.themes?.[themeId];
  if (!theme) return;
  const bundle = themeBundleForApply(themeId, state.currentScene);
  if (!bundle) {
    toast(`${theme.label} 暂无可应用的套装`);
    return;
  }

  const plan = resolveBundleEquipPlan(bundle, scene);
  if (!plan.entries.length) {
    toast(`${bundle.label} 与当前槽位不兼容`);
    return;
  }

  state.pendingThemeAction = true;
  renderDecoratePanel();
  try {
    const bundlePrice = Number(bundle.price || 0);
    const wasBundleOwned = sceneOwnsBundle(scene, bundle.id);
    if (!wasBundleOwned) {
      if (bundlePrice > 0 && gameData.inventory.coins < bundlePrice) {
        toast(`金币不足，还差 ${bundlePrice - gameData.inventory.coins}`);
        return;
      }
      if (bundlePrice > 0) {
        gameData.inventory.coins = Math.max(0, gameData.inventory.coins - bundlePrice);
      }
      scene.ownedBundleIds = Array.from(new Set([...(scene.ownedBundleIds || []), bundle.id]));
    }
    scene.ownedThemeIds = Array.from(new Set([...(scene.ownedThemeIds || []), themeId]));

    const equipResult = await equipSceneTheme(themeId, {
      skipSave: true,
      skipToast: true,
      suppressAlreadyToast: true,
    });
    if (!equipResult.ok) {
      toast("主题套装应用失败，请重试");
      return;
    }

    const granted = grantBundleItems(bundle);
    const applied = applyBundleEquipPlanEntries(plan.entries);
    const bridgeSaved = await saveGameState();
    renderDecoratePanel();
    renderStatus();

    const acquiredBundle = !wasBundleOwned;
    if (!applied && !granted && !acquiredBundle && !equipResult.changed) {
      toast(`${bundle.label} 已经是当前搭配${bridgeSaved ? "" : "（离线）"}`);
      return;
    }

    const detail = [`更新 ${applied} 个槽位`];
    if (granted > 0) detail.push(`赠送 ${granted} 件`);
    if (plan.invalid > 0) detail.push(`跳过 ${plan.invalid} 项不兼容`);
    let actionLabel = "已应用";
    if (acquiredBundle && bundlePrice > 0) {
      actionLabel = "已购买并应用";
    } else if (acquiredBundle) {
      actionLabel = "已领取并应用";
    }
    toast(`${actionLabel} ${bundle.label}（${detail.join("，")}）${bridgeSaved ? "" : "（离线）"}`);
  } finally {
    state.pendingThemeAction = false;
    renderDecoratePanel();
  }
}

function renderThemeList() {
  if (!el.themeList || !el.themeCurrentLabel) return;
  const themes = themesForScene(state.currentScene);
  const scene = activeScene();
  const currentTheme = sceneTheme(scene);
  el.themeList.innerHTML = "";

  if (!themes.length) {
    el.themeCurrentLabel.textContent = "房间主题";
    el.themeList.innerHTML = '<div class="decor-card"><strong>当前场景暂无主题</strong><span>后续开放</span></div>';
    return;
  }

  el.themeCurrentLabel.textContent = currentTheme ? `房间主题 · ${currentTheme.label}` : "房间主题";
  themes.forEach((theme) => {
    const owned = sceneOwnsTheme(scene, theme.id);
    const equipped = scene.themeId === theme.id;
    const wrapper = document.createElement("div");
    wrapper.className = "theme-entry";

    const themeButton = document.createElement("button");
    themeButton.className = `theme-card${equipped ? " active" : ""}`;
    themeButton.type = "button";
    themeButton.dataset.themeId = theme.id;
    themeButton.disabled = state.pendingThemeAction;
    themeButton.innerHTML = `${themeSwatchMarkup(theme)}<span class="decor-copy"><strong>${theme.label}</strong><span>${themeCommerceText(theme, owned, equipped)}</span></span>`;
    themeButton.addEventListener("click", () => {
      if (state.pendingThemeAction) return;
      void equipSceneTheme(theme.id);
    });
    wrapper.append(themeButton);

    const bundle = themeBundleForApply(theme.id, state.currentScene);
    if (bundle) {
      const plan = resolveBundleEquipPlan(bundle, scene);
      const bundleOwned = sceneOwnsBundle(scene, bundle.id);
      const bundlePrice = Number(bundle.price || 0);
      const unaffordable = !bundleOwned && bundlePrice > gameData.inventory.coins;
      const bundleButton = document.createElement("button");
      bundleButton.className = [
        "theme-bundle-button",
        bundleOwned ? "owned" : "for-sale",
        unaffordable ? "unaffordable" : "",
      ].filter(Boolean).join(" ");
      bundleButton.type = "button";
      bundleButton.dataset.themeId = theme.id;
      bundleButton.dataset.bundleId = bundle.id;
      bundleButton.disabled = state.pendingThemeAction || plan.entries.length <= 0 || unaffordable;
      const bundleActionLabel = bundleOwned
        ? "应用套装"
        : bundlePrice > 0
          ? `购买并应用 · ${bundlePrice} 金币`
          : "领取并应用";
      bundleButton.innerHTML = `<strong>${bundleActionLabel} · ${plan.entries.length}/${plan.total} 槽位</strong><span>${bundle.label}${plan.invalid > 0 ? ` · 跳过 ${plan.invalid} 项` : bundleOwned ? " · 已拥有" : ""}</span>`;
      bundleButton.addEventListener("click", () => {
        if (state.pendingThemeAction) return;
        void applyThemeBundle(theme.id);
      });
      wrapper.append(bundleButton);
    }

    el.themeList.append(wrapper);
  });
}

function renderDecoratePanel() {
  if (!el.decorateDrawer) return;
  const slots = decoratableObjects();
  el.decorateSlotList.innerHTML = "";
  if (!slots.length) {
    el.decorateSlotList.innerHTML = '<div class="decor-card"><strong>当前场景暂无可替换槽位</strong><span>先回到室内试试</span></div>';
    el.decorateItemList.innerHTML = "";
    el.decorateCurrentSlot.textContent = "无可用槽位";
    renderThemeList();
    return;
  }
  if (!state.selectedDecorObjectId || !activeScene().zones[state.selectedDecorObjectId]) {
    state.selectedDecorObjectId = slots[0][0];
  }

  slots.forEach(([objectId, zone]) => {
    const item = itemForZone(zone);
    const button = document.createElement("button");
    button.className = `decor-card${state.selectedDecorObjectId === objectId ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `${swatchMarkup(item)}<span class="decor-copy"><strong>${zone.slot}</strong><span>${item?.label || zone.label}</span></span>`;
    button.addEventListener("click", () => {
      state.selectedDecorObjectId = objectId;
      state.hoverZone = zone;
      renderDecoratePanel();
    });
    el.decorateSlotList.append(button);
  });

  const selected = activeScene().zones[state.selectedDecorObjectId];
  const selectedItem = itemForZone(selected);
  el.decorateCurrentSlot.textContent = selected ? `${selected.slot} · ${selectedItem?.label || selected.label}` : "选择槽位";
  el.decorateItemList.innerHTML = "";
  catalogItemsForSlot(selected.slot).forEach(([itemId, item]) => {
    const owned = ownedCount(itemId);
    const locked = owned <= 0;
    const unaffordable = locked && itemPrice(item) > gameData.inventory.coins;
    const button = document.createElement("button");
    button.className = [
      "decor-card",
      selected.itemId === itemId ? "active" : "",
      locked ? "for-sale" : "",
      unaffordable ? "unaffordable" : "",
    ].filter(Boolean).join(" ");
    button.type = "button";
    button.innerHTML = `${swatchMarkup(item)}<span class="decor-copy"><strong>${item.label}</strong><span>${itemCommerceText(itemId, item)}</span><i class="rarity">${locked ? "SHOP" : item.rarity}</i></span>`;
    button.addEventListener("click", () => {
      void replaceDecorItem(itemId);
    });
    el.decorateItemList.append(button);
  });
  renderThemeList();
}

function openDecoratePanel() {
  state.decorating = true;
  el.artifactDrawer.classList.remove("open");
  el.decorateDrawer.classList.add("open");
  el.decorateDrawer.setAttribute("aria-hidden", "false");
  renderDecoratePanel();
  toast("装修模式：先选槽位，再替换拥有的家具");
}

function closeDecoratePanel() {
  state.decorating = false;
  state.selectedDecorObjectId = null;
  state.hoverZone = null;
  el.decorateDrawer.classList.remove("open");
  el.decorateDrawer.setAttribute("aria-hidden", "true");
}

async function replaceDecorItem(itemId) {
  const zone = activeScene().zones[state.selectedDecorObjectId];
  const item = gameData.itemCatalog[itemId];
  if (!zone || !item || !item.slots?.includes(zone.slot)) return;
  if (!(await ensureOwned(itemId, item))) return;
  zone.itemId = itemId;
  zone.label = item.label;
  state.hotspotPulse = { zone, until: Date.now() + 900 };
  const synced = await syncEquipToBridge(state.currentScene, zone.objectId, itemId);
  if (!synced) {
    await saveGameState();
  } else {
    writeLocalMirror(buildFullSnapshot(), new Date().toISOString());
  }
  renderDecoratePanel();
  toast(`${zone.slot} 已替换为 ${item.label}`);
}

async function ensureOwned(itemId, item) {
  if (ownedCount(itemId) > 0) return true;
  const price = itemPrice(item);
  if (!price) {
    toast(`${item.label} 暂未开放购买`);
    return false;
  }
  if (gameData.inventory.coins < price) {
    toast(`金币不足，还差 ${price - gameData.inventory.coins}`);
    return false;
  }
  try {
    const localCoinBeforeBuy = gameData.inventory.coins;
    const result = await bridgeRequest("inventory.buy", {
      itemId,
      count: 1,
      price,
    });
    const bridgeCoins = Number(result?.coins);
    const optimisticCoins = Math.max(0, localCoinBeforeBuy - price);
    gameData.inventory.coins = Number.isFinite(bridgeCoins)
      ? Math.max(bridgeCoins, optimisticCoins)
      : optimisticCoins;
    gameData.inventory.owned[itemId] = Math.max(1, Number(result?.owned) || 1);
    writeLocalMirror(buildFullSnapshot(), result?.savedAt || new Date().toISOString());
    updateSaveDebug({
      key: BRIDGE_SAVE_KEY,
      status: "saved",
      savedAt: result?.savedAt || new Date().toISOString(),
      error: null,
    });
    renderStatus();
    toast(`已购买 ${item.label}`);
    return true;
  } catch (error) {
    gameData.inventory.coins -= price;
    gameData.inventory.owned[itemId] = 1;
    renderStatus();
    toast(`已购买 ${item.label}`);
    return true;
  }
}

function setPreview(zone) {
  clearTimeout(state.previewTimer);
  state.preview = { zone, text: zone.preview };
  el.currentTask.textContent = zone.preview;
  el.previewHint.textContent = "短暂预览";
  if (!state.working) {
    moveAgentTo(zoneInteractionPoint(zone), null);
  }
  setBubble(zone.bubble, 2600);
  toast(`${zone.label}状态预览，真实状态未改变`);
  state.previewTimer = window.setTimeout(() => {
    state.preview = null;
    renderStatus();
  }, 3200);
}

function farmStateLabel(stateId) {
  return gameData.farm?.states?.[stateId]?.label || stateId || "未知状态";
}

function farmActionLabel(actionId) {
  return FARM_ACTION_LABELS[actionId] || actionId;
}

function farmPlotForZone(zone) {
  const plotId = zone?.farmPlotId;
  if (!plotId) return null;
  return bridgeState.farmSnapshot?.plots?.[plotId] || null;
}

function farmActionHints(plotState) {
  const ownerActions = gameData.farm?.states?.[plotState]?.ownerActions || [];
  if (!ownerActions.length) return "无可执行动作";
  return ownerActions.map((actionId) => farmActionLabel(actionId)).join(" / ");
}

function farmSummaryForZone(zone) {
  const plot = farmPlotForZone(zone);
  if (!plot) return null;
  return {
    plotId: zone.farmPlotId,
    stateId: plot.state,
    stateLabel: farmStateLabel(plot.state),
    cropLabel: plot.cropId ? gameData.farm?.crops?.[plot.cropId]?.label || plot.cropId : null,
    actionHint: farmActionHints(plot.state),
  };
}

function farmPreviewHint(summary) {
  if (!summary) return "院子页面";
  const crop = summary.cropLabel ? ` · ${summary.cropLabel}` : "";
  return `农田 ${summary.stateLabel}${crop} · 可做 ${summary.actionHint}`;
}

function selectedFarmZone() {
  if (state.currentScene !== "yard" || !state.selectedFarmPlotId) return null;
  return Object.values(activeScene().zones).find((zone) => zone.farmPlotId === state.selectedFarmPlotId) || null;
}

function renderFarmActionPanel() {
  if (!el.farmActionPanel || !el.farmPanelTitle || !el.farmPanelState || !el.farmActionButtons) return;
  const zone = selectedFarmZone();
  const summary = zone ? farmSummaryForZone(zone) : null;
  if (!zone || !summary) {
    el.farmActionPanel.setAttribute("aria-hidden", "true");
    el.farmPanelTitle.textContent = "农田动作";
    el.farmPanelState.textContent = "请选择一个农田地块";
    el.farmActionButtons.innerHTML = "";
    return;
  }

  const ownerActions = gameData.farm?.states?.[summary.stateId]?.ownerActions || [];
  const cropCopy = summary.cropLabel ? ` · 作物 ${summary.cropLabel}` : " · 作物 无";
  el.farmActionPanel.setAttribute("aria-hidden", "false");
  el.farmPanelTitle.textContent = `${zone.label} · ${summary.stateLabel}`;
  el.farmPanelState.textContent = `可做 ${summary.actionHint}${cropCopy}`;
  el.farmActionButtons.innerHTML = "";

  if (!ownerActions.length) {
    const empty = document.createElement("span");
    empty.className = "farm-action-empty";
    empty.textContent = "当前状态没有可执行动作";
    el.farmActionButtons.append(empty);
    return;
  }

  ownerActions.forEach((actionId) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.farmAction = actionId;
    button.textContent = farmActionLabel(actionId);
    if (state.pendingFarmAction || (actionId === "plant" && !pickFarmCropId())) {
      button.disabled = true;
    }
    el.farmActionButtons.append(button);
  });
}

function isBridgeOfflineError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("disabled") ||
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("closed before response")
  );
}

function pickFarmCropId() {
  const crops = Object.entries(gameData.farm?.crops || {});
  if (!crops.length) return null;
  crops.sort(([, left], [, right]) => {
    const leftMinutes = Number(left?.growMinutes);
    const rightMinutes = Number(right?.growMinutes);
    if (!Number.isFinite(leftMinutes) && !Number.isFinite(rightMinutes)) return 0;
    if (!Number.isFinite(leftMinutes)) return 1;
    if (!Number.isFinite(rightMinutes)) return -1;
    return leftMinutes - rightMinutes;
  });
  return crops[0][0];
}

function chooseFarmOwnerAction(plotState) {
  if (!plotState) return null;
  const ownerActions = gameData.farm?.states?.[plotState]?.ownerActions || [];
  const preferredByState = {
    empty: "plant",
    seeded: "water",
    growing: "water",
    ready: "harvest",
    withered: "clear",
  };
  const preferred = preferredByState[plotState];
  if (preferred && ownerActions.includes(preferred)) return preferred;
  return ownerActions[0] || null;
}

function remainingGrowMinutes(plot, nowMs = Date.now()) {
  if (!plot?.cropId || !plot?.plantedAt) return null;
  const crop = gameData.farm?.crops?.[plot.cropId];
  const growMinutes = Number(crop?.growMinutes);
  const plantedAtMs = Date.parse(plot.plantedAt);
  if (!Number.isFinite(growMinutes) || !Number.isFinite(plantedAtMs)) return null;
  const readyAtMs = plantedAtMs + growMinutes * 60 * 1000;
  if (nowMs >= readyAtMs) return 0;
  return Math.ceil((readyAtMs - nowMs) / (60 * 1000));
}

function resolveFarmLifecycle(plot, nowMs = Date.now()) {
  if (!plot || typeof plot !== "object") return false;
  const crop = plot.cropId ? gameData.farm?.crops?.[plot.cropId] : null;
  const growMinutes = Number(crop?.growMinutes);
  const readyWindowMinutes = Number(crop?.readyWindowMinutes);
  const plantedAtMs = Date.parse(plot.plantedAt || "");
  if (!Number.isFinite(growMinutes) || !Number.isFinite(plantedAtMs)) return false;

  const readyAtMs = plantedAtMs + growMinutes * 60 * 1000;
  const witherAtMs = readyAtMs + readyWindowMinutes * 60 * 1000;
  const nowIso = new Date(nowMs).toISOString();
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

function applyFarmActionLocal(plotId, actionId, params = {}) {
  const action = gameData.farm?.actions?.[actionId];
  const plot = bridgeState.farmSnapshot?.plots?.[plotId];
  if (!action || !plot) return null;
  if (!action.from?.includes(plot.state)) return null;

  const nowIso = new Date().toISOString();
  if (action.requires?.includes("cropId")) {
    if (!params.cropId) return null;
    plot.cropId = params.cropId;
    if (!plot.plantedAt) {
      plot.plantedAt = nowIso;
    }
  }

  plot.state = action.to || plot.state;
  plot.updatedAt = nowIso;
  if (actionId === "harvest" || actionId === "clear") {
    const farmDefault = gameData.farm?.defaultPlotSnapshot || {};
    plot.cropId = null;
    plot.plantedAt = farmDefault.plantedAt ?? null;
    plot.lastWateredAt = farmDefault.lastWateredAt ?? null;
    plot.neighborHelps = cloneData(farmDefault.neighborHelps || []);
    plot.stolenBy = cloneData(farmDefault.stolenBy || []);
  } else if (actionId === "water") {
    plot.lastWateredAt = nowIso;
  }

  return {
    plot: normalizeFarmPlot(plot),
    savedAt: nowIso,
  };
}

async function executeFarmOwnerAction(zone, actionId) {
  if (state.pendingFarmAction) return;
  const plotId = zone?.farmPlotId;
  if (!plotId || !actionId) return;
  ensureFarmSnapshotShape();
  const plot = bridgeState.farmSnapshot?.plots?.[plotId];
  if (!plot) {
    toast(`${zone.label}缺少农田状态，暂时无法执行动作`);
    return;
  }

  const lifecycleChanged = resolveFarmLifecycle(plot);
  if (lifecycleChanged) {
    await saveGameState();
  }
  const ownerActions = gameData.farm?.states?.[plot.state]?.ownerActions || [];
  if (!ownerActions.includes(actionId)) {
    toast(`${zone.label} 当前状态只支持：${farmActionHints(plot.state)}`);
    renderStatus();
    return;
  }

  const params = { plotId, action: actionId };
  if (actionId === "plant") {
    const cropId = pickFarmCropId();
    if (!cropId) {
      toast("缺少可用作物配置，暂时无法播种");
      return;
    }
    params.cropId = cropId;
  }

  state.pendingFarmAction = true;
  renderFarmActionPanel();
  const fromState = plot.state;
  const actionText = farmActionLabel(actionId);
  try {
    const result = await bridgeRequest("farm.action", params);
    const nextPlot = normalizeFarmPlot(result?.state || plot);
    bridgeState.farmSnapshot.plots[plotId] = nextPlot;
    const savedAt = result?.savedAt || new Date().toISOString();
    ensureFarmSnapshotShape(savedAt);
    writeLocalMirror(buildFullSnapshot(savedAt), savedAt);
    updateSaveDebug({
      key: BRIDGE_SAVE_KEY,
      status: "saved",
      savedAt,
      error: null,
    });
    const toState = bridgeState.farmSnapshot.plots[plotId].state;
    const remain = toState === "growing" ? remainingGrowMinutes(bridgeState.farmSnapshot.plots[plotId]) : null;
    const growHint = remain > 0 ? `，约 ${remain} 分钟后成熟` : "";
    setBubble(`${zone.label}：${farmStateLabel(toState)}`, 3000);
    toast(`${zone.label} ${actionText}：${farmStateLabel(fromState)} -> ${farmStateLabel(toState)}${growHint}`);
  } catch (error) {
    if (!isBridgeOfflineError(error)) {
      toast(`${zone.label} ${actionText}失败：${error.message}`);
      return;
    }
    const fallback = applyFarmActionLocal(plotId, actionId, params);
    if (!fallback) {
      toast(`${zone.label} 当前无法执行 ${actionText}（bridge offline）`);
      return;
    }
    bridgeState.farmSnapshot.plots[plotId] = fallback.plot;
    ensureFarmSnapshotShape(fallback.savedAt);
    writeLocalMirror(buildFullSnapshot(fallback.savedAt), fallback.savedAt);
    updateSaveDebug({
      key: SAVE_KEY,
      status: "saved",
      savedAt: fallback.savedAt,
      error: `bridge offline: ${error.message}`,
    });
    const toState = fallback.plot.state;
    const remain = toState === "growing" ? remainingGrowMinutes(fallback.plot) : null;
    const growHint = remain > 0 ? `，约 ${remain} 分钟后成熟` : "";
    setBubble(`${zone.label}：${farmStateLabel(toState)}`, 3000);
    toast(`${zone.label} ${actionText}（离线）：${farmStateLabel(fromState)} -> ${farmStateLabel(toState)}${growHint}`);
  } finally {
    state.pendingFarmAction = false;
    renderStatus();
  }
}

async function handleYardAction(zone) {
  clearTimeout(state.previewTimer);
  state.preview = null;
  activeAgent().realStatus = zone.real;
  moveAgentTo(zoneInteractionPoint(zone), zone.real);
  setBubble(zone.bubble, 3000);

  const plotId = zone.farmPlotId;
  if (!plotId) {
    state.selectedFarmPlotId = null;
    toast(`${zone.label}是院子页面交互，不会触发工作任务`);
    renderStatus();
    return;
  }

  state.selectedFarmPlotId = plotId;
  ensureFarmSnapshotShape();
  const plot = bridgeState.farmSnapshot?.plots?.[plotId];
  if (!plot) {
    toast(`${zone.label}缺少农田状态，先按普通院子交互处理`);
    renderStatus();
    return;
  }

  const lifecycleChanged = resolveFarmLifecycle(plot);
  if (lifecycleChanged) {
    await saveGameState();
  }
  const summary = farmSummaryForZone(zone);
  setBubble(`${zone.label}：${farmStateLabel(plot.state)}`, 3000);
  toast(`${zone.label} 当前 ${summary?.stateLabel || "未知"}，可做 ${summary?.actionHint || "无可执行动作"}`);
  renderStatus();
}

function navigateViaZone(zone) {
  if (state.working) {
    setBubble("我先把手上的任务做完");
    return;
  }
  clearTimeout(state.navigationTimer);
  clearTimeout(state.previewTimer);
  state.preview = null;
  state.hotspotPulse = { zone, until: Date.now() + 900 };
  setBubble(zone.bubble, 1800);
  moveAgentTo(zoneInteractionPoint(zone), zone.type === "navigate" ? `前往${zone.label}` : zone.real, { showTarget: false });
  state.navigationTimer = window.setTimeout(() => {
    setScene(zone.to, { status: zone.real, bubble: zone.bubble });
  }, state.agent.moveMs + 220);
}

function handleGroundClick(point) {
  if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return;
  if (state.working) {
    setBubble("工作中先不乱跑");
    return;
  }
  clearTimeout(state.previewTimer);
  state.preview = null;
  if (state.currentScene === "yard") {
    state.selectedFarmPlotId = null;
  }
  const target = nearestWalkablePoint(point);
  const status = state.currentScene === "yard" ? "在院子里散步" : "在房间里走动";
  activeAgent().realStatus = status;
  moveAgentTo(target, status);
}

function findZoneByAction(sceneId, action, fallbackId) {
  const zones = scenes[sceneId].zones;
  return Object.values(zones).find((zone) => zoneSupportsAction(zone, action)) || zones[fallbackId];
}

function taskKindFromText(text) {
  if (/查|搜索|资料|研究|调研/.test(text)) return "research";
  if (/菜|做饭|料理|食谱|茶/.test(text)) return "cook";
  if (/睡|休息|累/.test(text)) return "rest";
  if (/计划|总结|聊|想/.test(text)) return "plan";
  return "work";
}

function targetZoneForTask(kind) {
  if (kind === "cook") return findZoneByAction("indoor", "preview_cook", "kitchenMain");
  if (kind === "rest") return findZoneByAction("indoor", "preview_rest", "bedroomBed");
  if (kind === "plan") return findZoneByAction("indoor", "preview_idle", "livingSofa");
  if (kind === "research") return findZoneByAction("indoor", "preview_research", "studyBookshelf");
  return findZoneByAction("indoor", "preview_work", "studyDesk");
}

function sendPrompt() {
  const text = el.promptInput.value.trim();
  if (!text) return;
  el.promptInput.value = "";
  const selected = el.intentSelect.value;
  if (selected === "goto") {
    if (/院|小院|出门|外面|农田/.test(text)) {
      setScene("yard", { status: scenes.yard.status, bubble: "去院子看看" });
      return;
    }
    setScene("indoor", { status: scenes.indoor.status, bubble: "回到室内" });
    return;
  }
  const kind = selected === "speak" ? "speak" : selected === "task" ? taskKindFromText(text) : taskKindFromText(text);
  if (kind === "speak" || (!/写|做|帮|生成|设计|实现|修|整理|画|菜|睡|休息|查|搜索|资料/.test(text) && selected !== "task")) {
    if (state.currentScene !== "indoor") {
      setScene("indoor", { silent: true });
    }
    setBubble("我在，听你说。");
    activeAgent().realStatus = "在客厅聊天";
    moveAgentTo(zoneInteractionPoint(findZoneByAction("indoor", "preview_idle", "livingSofa")), activeAgent().realStatus);
    return;
  }
  startTask(text, kind);
}

function startTask(prompt, kind) {
  if (state.working) {
    setBubble("我先把手上的事做完");
    return;
  }
  clearTimeout(state.previewTimer);
  state.preview = null;
  state.working = true;
  state.artifact = null;
  if (state.currentScene !== "indoor") {
    setScene("indoor", { silent: true });
  }
  const zone = targetZoneForTask(kind);
  const status = zone.real;
  activeAgent().realStatus = status;
  moveAgentTo(zoneInteractionPoint(zone), status, { working: kind !== "rest" && kind !== "plan" });
  setBubble(kind === "rest" ? "我去休息一下" : "收到，我去对应区域处理");
  window.setTimeout(() => {
    if (kind === "rest") {
      finishRest();
      return;
    }
    state.agent.status = "working";
    renderStatus();
  }, 900);
  const duration = kind === "rest" ? 2200 : 3600 + Math.min(prompt.length * 45, 1800);
  window.setTimeout(() => finishTask(prompt, kind), duration);
}

function finishRest() {
  state.working = false;
  state.agent.status = "idle";
  const agent = activeAgent();
  agent.energy = clamp(agent.energy + 14, 0, 100);
  agent.mood = clamp(agent.mood + 2, 0, 100);
  agent.realStatus = "在卧室休息";
  setBubble("好多了");
  renderStatus();
}

function finishTask(prompt, kind) {
  state.working = false;
  state.agent.status = "idle";
  const agent = activeAgent();
  agent.energy = clamp(agent.energy - 6, 0, 100);
  agent.mood = clamp(agent.mood + 3, 0, 100);
  agent.exp = clamp(agent.exp + 30, 0, 500);
  const title = `完成：${prompt.slice(0, 28)}`;
  state.artifact = {
    title,
    opened: false,
    content: buildArtifact(prompt, kind),
  };
  agent.realStatus = "任务完成，等你查看";
  setBubble("做好了，点我头顶的标记");
  toast("任务完成，点击 Aria 头顶标记查看");
  renderStatus();
}

function buildArtifact(prompt, kind) {
  if (kind === "research") {
    return `# 查资料结果\n\n任务：${prompt}\n\n- Agent 会移动到书柜边，表示查资料 / 搜索\n- 这个状态和电脑前工作分开\n- 真实产品里搜索结果会由本地 Bridge 写入 artifact`;
  }
  if (kind === "cook") {
    return `# 厨房产物\n\n任务：${prompt}\n\nAria 做了一份小菜单：番茄热汤、香草煎蛋、清甜白菜沙拉。`;
  }
  if (kind === "plan") {
    return `# 计划草稿\n\n任务：${prompt}\n\n- 先保持客厅聊天状态\n- 再把确认后的事项转成工作任务\n- 需要执行时移动到电脑前`;
  }
  return `# 本地任务产物\n\n任务：${prompt}\n\nfunction bubbleSort(items) {\n  const arr = [...items];\n  for (let i = 0; i < arr.length - 1; i += 1) {\n    for (let j = 0; j < arr.length - i - 1; j += 1) {\n      if (arr[j] > arr[j + 1]) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n    }\n  }\n  return arr;\n}\n\n真实产品里 artifact 由 Local Bridge 本地存储，不上传云端。`;
}

function openArtifact() {
  if (!state.artifact) return;
  state.artifact.opened = true;
  el.artifactTitle.textContent = state.artifact.title;
  el.artifactContent.textContent = state.artifact.content;
  el.artifactDrawer.classList.add("open");
  el.artifactDrawer.setAttribute("aria-hidden", "false");
}

function renderStatus() {
  const agent = activeAgent();
  el.activeAgentName.textContent = state.activeAgent;
  el.coinValue.textContent = String(gameData.inventory.coins);
  el.energyText.textContent = String(Math.round(agent.energy));
  el.moodText.textContent = String(Math.round(agent.mood));
  el.expText.textContent = String(Math.round(agent.exp));
  el.energyBar.style.width = `${agent.energy}%`;
  el.moodBar.style.width = `${agent.mood}%`;
  el.expBar.style.width = `${(agent.exp / 500) * 100}%`;
  el.moodCopy.textContent =
    agent.mood > 85
      ? "元气满满"
      : agent.mood > 70
        ? "心情愉悦"
        : agent.mood > 50
          ? "状态普通"
          : agent.mood > 30
            ? "有点低落"
            : "需要安慰";
  if (!state.preview) {
    el.currentTask.textContent = agent.realStatus;
    if (state.currentScene === "yard") {
      const selectedZone = selectedFarmZone();
      const summary = selectedZone ? farmSummaryForZone(selectedZone) : null;
      el.previewHint.textContent = farmPreviewHint(summary);
    } else {
      el.previewHint.textContent = "真实状态";
    }
  }
  drawAvatar();
  renderSaveDebug();
  renderFarmActionPanel();
}

function resolveBridgeUrl() {
  const query = new URLSearchParams(window.location.search);
  const override = query.get("bridge");
  if (override === "off") return null;
  if (override) return override;
  return "ws://127.0.0.1:8787/bridge";
}

function bridgeRequest(method, params = {}) {
  if (!bridgeState.url) {
    return Promise.reject(new Error("Local Bridge disabled"));
  }

  return new Promise((resolve, reject) => {
    const requestId = `bridge-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const socket = new window.WebSocket(bridgeState.url);
    let settled = false;
    const timeout = window.setTimeout(() => {
      finalizeReject(new Error("Local Bridge request timeout"));
    }, BRIDGE_TIMEOUT_MS);

    function finalizeResolve(value) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      try {
        socket.close();
      } catch {
        // no-op
      }
      resolve(value);
    }

    function finalizeReject(error) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      try {
        socket.close();
      } catch {
        // no-op
      }
      reject(error);
    }

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          id: requestId,
          method,
          params,
        }),
      );
    });

    socket.addEventListener("message", (event) => {
      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch (error) {
        finalizeReject(new Error(`Local Bridge invalid JSON: ${error.message}`));
        return;
      }

      if (parsed?.event === "bridge.ready") return;
      if (parsed?.id !== requestId) return;
      if (parsed?.ok) {
        finalizeResolve(parsed.result || {});
        return;
      }
      const message = parsed?.error?.message || "Local Bridge request failed";
      finalizeReject(new Error(message));
    });

    socket.addEventListener("error", () => {
      finalizeReject(new Error("Local Bridge connection failed"));
    });

    socket.addEventListener("close", () => {
      if (!settled) {
        finalizeReject(new Error("Local Bridge closed before response"));
      }
    });
  });
}

async function hydrateFromBridge() {
  if (!bridgeState.url) return;
  try {
    const result = await bridgeRequest("snapshot.get");
    if (!result?.snapshot) return;
    applyBridgeSnapshot(result.snapshot);
    updateSaveDebug({
      key: BRIDGE_SAVE_KEY,
      status: "loaded",
      savedAt: result.savedAt || result.snapshot.savedAt || new Date().toISOString(),
      error: null,
    });
    renderStatus();
    if (state.decorating) renderDecoratePanel();
  } catch (error) {
    console.warn("Local Bridge snapshot hydration skipped", error.message);
  }
}

async function syncEquipToBridge(sceneId, objectId, itemId) {
  try {
    const result = await bridgeRequest("scene.equip", {
      sceneId,
      objectId,
      itemId,
    });
    updateSaveDebug({
      key: BRIDGE_SAVE_KEY,
      status: "saved",
      savedAt: result?.savedAt || new Date().toISOString(),
      error: null,
    });
    return true;
  } catch (error) {
    console.warn("Failed to sync equip to Local Bridge", error.message);
    return false;
  }
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function saveStatusText() {
  if (saveDebugState.status === "loaded") return "已加载";
  if (saveDebugState.status === "migrated") return "已迁移旧存档";
  if (saveDebugState.status === "saved") return "已保存";
  if (saveDebugState.status === "invalid") return "存档异常";
  if (saveDebugState.status === "incompatible") return "版本不兼容";
  return "默认初始数据";
}

function renderSaveDebug() {
  if (!el.saveSchemaLabel || !el.saveDebugMeta) return;
  const ownedTotal = Object.values(gameData.inventory.owned).reduce((sum, count) => sum + Math.max(0, Number(count) || 0), 0);
  const placedTotal = Object.values(scenes).reduce((sum, scene) => sum + Object.keys(scene.zones).length, 0);
  const savedAt = saveDebugState.savedAt
    ? new Date(saveDebugState.savedAt).toLocaleString("zh-CN", { hour12: false })
    : "未写入";
  const errorText = saveDebugState.error ? ` · ${saveDebugState.error}` : "";
  el.saveSchemaLabel.textContent = `Schema v${SAVE_SCHEMA_VERSION}`;
  el.saveDebugMeta.textContent = `${saveStatusText()} · ${saveDebugState.key} · 物品 ${ownedTotal} · 摆放 ${placedTotal} · ${savedAt}${errorText}`;
}

function switchAgent(name) {
  if (!agents[name]) return;
  const current = activeAgent();
  current.point = { x: state.agent.x, y: state.agent.y };
  current.scene = state.currentScene;

  state.activeAgent = name;
  const agent = activeAgent();
  state.currentScene = agent.scene || "indoor";
  const point = agent.point || scenes[state.currentScene].entry;
  state.agent.x = point.x;
  state.agent.y = point.y;
  state.agent.fromX = point.x;
  state.agent.fromY = point.y;
  state.agent.targetX = point.x;
  state.agent.targetY = point.y;
  state.agent.status = "idle";
  state.agent.moveMs = 0;
  state.agent.facing = 1;
  state.clickTarget = null;
  state.preview = null;
  state.hoverZone = null;
  clearTimeout(state.previewTimer);
  syncHash();
  document.querySelectorAll(".agent-tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.agent === name);
  });
  el.promptInput.placeholder = `对 ${name} 说句话，或让 TA 做点事...`;
  renderStatus();
  if (state.decorating) renderDecoratePanel();
}

function drawAvatar() {
  avatarCtx.clearRect(0, 0, 72, 72);
  avatarCtx.imageSmoothingEnabled = true;
  if (agentImage.complete && agentImage.naturalWidth) {
    avatarCtx.drawImage(agentImage, 220, 40, 610, 760, 6, 0, 60, 74);
  }
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scenePoint = canvasToScene({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  const agentPoint = sceneToCanvas({ x: state.agent.x, y: state.agent.y });
  const dx = event.clientX - rect.left - agentPoint.x;
  const dy = event.clientY - rect.top - (agentPoint.y - 70);
  if (state.artifact && !state.artifact.opened && Math.hypot(dx, dy) < 54) {
    openArtifact();
    return;
  }
  const zone = zoneAt(scenePoint);
  if (!zone) {
    handleGroundClick(scenePoint);
    return;
  }
  state.hotspotPulse = { zone, until: Date.now() + 650 };
  if (state.decorating && zoneSupportsAction(zone, "decorate_replace")) {
    state.selectedDecorObjectId = zone.objectId;
    renderDecoratePanel();
    return;
  }
  if (zone.type === "navigate") {
    navigateViaZone(zone);
    return;
  }
  if (zone.type === "yard") {
    void handleYardAction(zone);
    return;
  }
  setPreview(zone);
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  state.hoverZone = zoneAt(canvasToScene({ x: event.clientX - rect.left, y: event.clientY - rect.top }));
  canvas.style.cursor = state.hoverZone ? "pointer" : "default";
});

canvas.addEventListener("mouseleave", () => {
  state.hoverZone = null;
  canvas.style.cursor = "default";
});

document.querySelector("#sendBtn").addEventListener("click", sendPrompt);
el.promptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendPrompt();
  }
});

document.querySelector("#closeArtifactBtn").addEventListener("click", () => {
  el.artifactDrawer.classList.remove("open");
  el.artifactDrawer.setAttribute("aria-hidden", "true");
});

document.querySelector("#closeDecorateBtn").addEventListener("click", closeDecoratePanel);
el.resetSaveBtn.addEventListener("click", () => {
  void resetLocalSave();
});
el.farmActionButtons?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-farm-action]");
  if (!button) return;
  const zone = selectedFarmZone();
  if (!zone) return;
  if (state.working) {
    setBubble("我先把手上的任务做完");
    return;
  }
  void executeFarmOwnerAction(zone, button.dataset.farmAction);
});

document.querySelector("#copyArtifactBtn").addEventListener("click", async () => {
  if (!state.artifact) return;
  await navigator.clipboard.writeText(state.artifact.content);
  toast("Artifact 已复制");
});

document.querySelector("#settingsBtn").addEventListener("click", () => {
  if (state.decorating) {
    closeDecoratePanel();
    return;
  }
  openDecoratePanel();
});

el.modeBtn.addEventListener("click", () => {
  const online = el.modeLabel.textContent === "单机";
  el.modeLabel.textContent = online ? "联机预览" : "单机";
  toast(online ? "联机 Hub 是后续模块" : "已回到单机");
});

el.agentTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-agent]");
  if (!button) return;
  switchAgent(button.dataset.agent);
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("hashchange", () => {
  const sceneName = window.location.hash === "#yard" ? "yard" : "indoor";
  if (sceneName !== state.currentScene) {
    setScene(sceneName, { silent: true });
  }
});

renderStatus();
switchAgent("Aria");
void hydrateFromBridge();
requestAnimationFrame(draw);
