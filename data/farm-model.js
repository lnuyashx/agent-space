// Farm plot state model. This file is loaded by index.html before data/game-data.js.
window.AGENT_SPACE_DATA_MODULES = window.AGENT_SPACE_DATA_MODULES || {};

window.AGENT_SPACE_DATA_MODULES.farm = {
  schemaVersion: 1,
  lifecycle: ["empty", "seeded", "growing", "ready", "withered"],
  states: {
    empty: {
      label: "空地",
      ownerActions: ["plant"],
      neighborActions: [],
      canExpire: false,
    },
    seeded: {
      label: "已播种",
      ownerActions: ["water"],
      neighborActions: ["help_water"],
      canExpire: false,
    },
    growing: {
      label: "生长中",
      ownerActions: ["water", "fertilize"],
      neighborActions: ["help_water"],
      canExpire: false,
    },
    ready: {
      label: "可收获",
      ownerActions: ["harvest"],
      neighborActions: ["steal"],
      canExpire: true,
    },
    withered: {
      label: "已枯萎",
      ownerActions: ["clear"],
      neighborActions: [],
      canExpire: false,
    },
  },
  crops: {
    tomato: {
      label: "番茄",
      rarity: "starter",
      growMinutes: 30,
      readyWindowMinutes: 240,
      yield: { itemId: "crop_tomato", min: 2, max: 4 },
      social: { stealLimit: 1, helpBonusPercent: 10 },
    },
    herb: {
      label: "香草",
      rarity: "starter",
      growMinutes: 12,
      readyWindowMinutes: 180,
      yield: { itemId: "crop_herb", min: 1, max: 3 },
      social: { stealLimit: 1, helpBonusPercent: 8 },
    },
  },
  actions: {
    plant: {
      actor: "owner",
      from: ["empty"],
      to: "seeded",
      requires: ["cropId"],
      writes: ["cropId", "plantedAt", "updatedAt"],
    },
    water: {
      actor: "owner",
      from: ["seeded", "growing"],
      to: "growing",
      writes: ["lastWateredAt", "updatedAt"],
    },
    fertilize: {
      actor: "owner",
      from: ["growing"],
      to: "growing",
      writes: ["growthBoostPercent", "updatedAt"],
    },
    harvest: {
      actor: "owner",
      from: ["ready"],
      to: "empty",
      rewards: ["cropYield", "farmExp"],
      writes: ["harvestedAt", "updatedAt"],
    },
    clear: {
      actor: "owner",
      from: ["withered"],
      to: "empty",
      writes: ["clearedAt", "updatedAt"],
    },
    help_water: {
      actor: "neighbor",
      from: ["seeded", "growing"],
      to: "growing",
      cooldownMinutes: 60,
      writes: ["neighborHelps", "updatedAt"],
    },
    steal: {
      actor: "neighbor",
      from: ["ready"],
      to: "ready",
      cooldownMinutes: 360,
      limits: ["perNeighbor", "cropStealLimit"],
      writes: ["stolenBy", "updatedAt"],
    },
  },
  defaultPlotSnapshot: {
    state: "empty",
    cropId: null,
    plantedAt: null,
    updatedAt: null,
    lastWateredAt: null,
    neighborHelps: [],
    stolenBy: [],
  },
  social: {
    visibility: "neighbors can read plot state, crop id, ready state, and limited owner profile",
    ownerOnlyActions: ["plant", "water", "fertilize", "harvest", "clear"],
    neighborActions: ["help_water", "steal"],
    syncPolicy: "publish farm plot snapshots through Hub after local save",
  },
};
