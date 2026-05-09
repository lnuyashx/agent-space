import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const DATA_SCRIPT_FILES = [
  "data/assets.js",
  "data/item-catalog.js",
  "data/inventory.js",
  "data/scenes.js",
  "data/agents.js",
  "data/farm-model.js",
  "data/theme-bundles.js",
  "data/game-data.js",
];

export function loadGameDataFromScripts(projectRoot = process.cwd()) {
  const context = vm.createContext({
    window: { AGENT_SPACE_DATA_MODULES: {} },
    console,
  });

  DATA_SCRIPT_FILES.forEach((relativePath) => {
    const absolutePath = resolve(projectRoot, relativePath);
    const code = readFileSync(absolutePath, "utf8");
    vm.runInContext(code, context, { filename: absolutePath });
  });

  if (!context.window?.AGENT_SPACE_DATA) {
    throw new Error("Failed to compose AGENT_SPACE_DATA from browser data scripts.");
  }

  return deepClone(context.window.AGENT_SPACE_DATA);
}

export function buildDefaultBridgeState(gameData, nowIso = new Date().toISOString()) {
  const inventory = {
    coins: Number.isFinite(Number(gameData?.inventory?.coins)) ? Number(gameData.inventory.coins) : 0,
    owned: normalizeOwned(gameData?.inventory?.owned || {}),
  };

  const sceneSnapshot = Object.fromEntries(
    Object.entries(gameData?.scenes || {}).map(([sceneId, scene]) => [
      sceneId,
      {
        placedObjects: Object.fromEntries(
          Object.entries(scene?.placedObjects || {}).map(([objectId, objectState]) => [
            objectId,
            { itemId: objectState.itemId },
          ]),
        ),
      },
    ]),
  );

  const farmDefault = deepClone(gameData?.farm?.defaultPlotSnapshot || { state: "empty" });
  const plots = {};

  Object.values(gameData?.scenes || {}).forEach((scene) => {
    Object.values(scene?.placedObjects || {}).forEach((objectState) => {
      const plotId = objectState?.farmPlotId;
      if (!plotId || plots[plotId]) return;
      plots[plotId] = {
        ...farmDefault,
        state: objectState.defaultFarmStateId || farmDefault.state || "empty",
        updatedAt: nowIso,
      };
    });
  });

  return {
    inventory,
    sceneSnapshot,
    farmSnapshot: {
      plots,
    },
    savedAt: nowIso,
  };
}

function normalizeOwned(owned) {
  return Object.fromEntries(
    Object.entries(owned).map(([itemId, count]) => [itemId, Math.max(0, Number(count) || 0)]),
  );
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
