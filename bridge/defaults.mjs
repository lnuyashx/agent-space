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
    Object.entries(gameData?.scenes || {}).map(([sceneId, scene]) => {
      const themeId = defaultThemeIdForScene(gameData, sceneId);
      const ownedThemeIds = [themeId].filter(Boolean);
      return [
        sceneId,
        {
          themeId,
          ownedThemeIds,
          ownedBundleIds: inferBundleOwnershipFromThemes(gameData, sceneId, ownedThemeIds),
          placedObjects: Object.fromEntries(
            Object.entries(scene?.placedObjects || {}).map(([objectId, objectState]) => [
              objectId,
              { itemId: objectState.itemId },
            ]),
          ),
        },
      ];
    }),
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

function themeBundlesForScene(gameData, themeId, sceneId) {
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

function defaultThemeIdForScene(gameData, sceneId) {
  const themes = Object.values(gameData?.themeBundles?.themes || {}).filter((theme) => theme.sceneId === sceneId);
  if (!themes.length) return null;
  return themes.find((theme) => theme.saleMode === "default")?.id || themes[0].id;
}

function inferBundleOwnershipFromThemes(gameData, sceneId, themeIds = []) {
  const sourceThemeIds = Array.isArray(themeIds) && themeIds.length
    ? themeIds
    : [defaultThemeIdForScene(gameData, sceneId)].filter(Boolean);
  const ownedBundleIds = [];
  sourceThemeIds.forEach((themeId) => {
    themeBundlesForScene(gameData, themeId, sceneId).forEach((bundle) => {
      if (bundle?.id) ownedBundleIds.push(bundle.id);
    });
  });
  return Array.from(new Set(ownedBundleIds));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
