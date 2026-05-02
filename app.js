const canvas = document.querySelector("#worldCanvas");
const ctx = canvas.getContext("2d");
const avatarCanvas = document.querySelector("#avatarCanvas");
const avatarCtx = avatarCanvas.getContext("2d");
const gameData = window.AGENT_SPACE_DATA;
const SAVE_KEY = "agent-space-demo-save-v1";
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
applySavedSceneSnapshot(savedState.sceneSnapshot);

const initialScene = window.location.hash === "#yard" ? "yard" : "indoor";

const agents = Object.fromEntries(
  Object.entries(gameData.agents).map(([name, agent]) => {
    const initialObject = agent.initialObject;
    const sceneId = initialObject?.scene || initialScene;
    const objectPoint = initialObject ? scenes[sceneId].zones[initialObject.objectId]?.point : null;
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
};

function readSavedState() {
  try {
    return JSON.parse(window.localStorage.getItem(SAVE_KEY) || "{}");
  } catch (error) {
    console.warn("Failed to read saved Agent Space state", error);
    return {};
  }
}

function applySavedInventory(inventory) {
  if (!inventory) return;
  if (inventory.owned && typeof inventory.owned === "object") {
    Object.entries(inventory.owned).forEach(([itemId, count]) => {
      if (gameData.itemCatalog[itemId]) {
        gameData.inventory.owned[itemId] = Math.max(0, Number(count) || 0);
      }
    });
  }
  if (Number.isFinite(Number(inventory.coins))) {
    gameData.inventory.coins = Math.max(0, Number(inventory.coins));
  }
}

function applySavedSceneSnapshot(sceneSnapshot) {
  if (!sceneSnapshot) return;
  Object.entries(sceneSnapshot).forEach(([sceneId, sceneSave]) => {
    const scene = scenes[sceneId];
    if (!scene || !sceneSave?.placedObjects) return;
    Object.entries(sceneSave.placedObjects).forEach(([objectId, objectSave]) => {
      const zone = scene.zones[objectId];
      const item = gameData.itemCatalog[objectSave?.itemId];
      if (!zone || !item || !item.slots?.includes(zone.slot)) return;
      zone.itemId = objectSave.itemId;
      zone.label = item.label;
    });
  });
}

function saveGameState() {
  const sceneSnapshot = Object.fromEntries(
    Object.entries(scenes).map(([sceneId, scene]) => [
      sceneId,
      {
        placedObjects: Object.fromEntries(
          Object.entries(scene.zones).map(([objectId, zone]) => [objectId, { itemId: zone.itemId }]),
        ),
      },
    ]),
  );
  try {
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        inventory: {
          owned: gameData.inventory.owned,
          coins: gameData.inventory.coins,
        },
        sceneSnapshot,
      }),
    );
  } catch (error) {
    console.warn("Failed to save Agent Space state", error);
  }
}

function activeAgent() {
  return agents[state.activeAgent];
}

function activeScene() {
  return scenes[state.currentScene];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rectForCover(image = activeScene().image) {
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

function itemVisual(item) {
  return item?.visual || { color: "#d96f42", accent: "#fff3d8", short: "ITEM" };
}

function swatchMarkup(item) {
  const visual = itemVisual(item);
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

function pointInWalkable(point) {
  return activeScene().walkableRects.some((rect) => pointInRect(point, rect));
}

function clampPointToRect(point, rect) {
  return {
    x: clamp(point.x, rect.x, rect.x + rect.w),
    y: clamp(point.y, rect.y, rect.y + rect.h),
  };
}

function nearestWalkablePoint(point) {
  if (pointInWalkable(point)) return point;
  let best = null;
  let bestDistance = Infinity;
  activeScene().walkableRects.forEach((rect) => {
    const candidate = clampPointToRect(point, rect);
    const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  });
  return best || activeScene().entry;
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
  const image = activeScene().image;
  if (!image.complete || !image.naturalWidth) {
    ctx.fillStyle = state.currentScene === "yard" ? "#9ec877" : "#ead2b6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const rect = rectForCover(image);
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  ctx.fillStyle = state.currentScene === "yard" ? "rgba(255, 250, 205, 0.03)" : "rgba(255, 236, 203, 0.035)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
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

function drawPixelFurniture(zone, item, options) {
  const visual = itemVisual(item);
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

  if (item?.category === "bed") drawBedSprite(visual);
  else if (item?.category === "sofa") drawSofaSprite(visual);
  else if (item?.category === "bookshelf") drawBookshelfSprite(visual);
  else if (item?.category === "desk") drawDeskSprite(visual, visual.short === "DUAL");
  else if (item?.category === "kitchen") drawKitchenSprite(visual);
  else if (item?.category === "tv") drawTvSprite(visual);
  else drawGenericItemSprite(visual);

  if (options.changed || state.decorating) {
    pixelRect(-25, 36, 50, 16, "rgba(255, 250, 241, .92)", "rgba(47, 33, 24, .26)");
    ctx.fillStyle = "#2d251e";
    ctx.font = "bold 10px ui-sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(visual.short, 0, 47);
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
  const label = zone.label;
  ctx.font = "12px ui-sans-serif";
  const labelWidth = Math.min(120, Math.max(44, ctx.measureText(label).width + 18));
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
  drawRoom();
  updateAgentPosition();
  drawObjectLayer();
  drawClickTarget(performance.now());
  drawZonePreview();
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

function renderDecoratePanel() {
  if (!el.decorateDrawer) return;
  const slots = decoratableObjects();
  el.decorateSlotList.innerHTML = "";
  if (!slots.length) {
    el.decorateSlotList.innerHTML = '<div class="decor-card"><strong>当前场景暂无可替换槽位</strong><span>先回到室内试试</span></div>';
    el.decorateItemList.innerHTML = "";
    el.decorateCurrentSlot.textContent = "无可用槽位";
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
    button.addEventListener("click", () => replaceDecorItem(itemId));
    el.decorateItemList.append(button);
  });
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

function replaceDecorItem(itemId) {
  const zone = activeScene().zones[state.selectedDecorObjectId];
  const item = gameData.itemCatalog[itemId];
  if (!zone || !item || !item.slots?.includes(zone.slot)) return;
  if (!ensureOwned(itemId, item)) return;
  zone.itemId = itemId;
  zone.label = item.label;
  state.hotspotPulse = { zone, until: Date.now() + 900 };
  saveGameState();
  renderDecoratePanel();
  toast(`${zone.slot} 已替换为 ${item.label}`);
}

function ensureOwned(itemId, item) {
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
  gameData.inventory.coins -= price;
  gameData.inventory.owned[itemId] = 1;
  renderStatus();
  toast(`已购买 ${item.label}`);
  return true;
}

function setPreview(zone) {
  clearTimeout(state.previewTimer);
  state.preview = { zone, text: zone.preview };
  el.currentTask.textContent = zone.preview;
  el.previewHint.textContent = "短暂预览";
  setBubble(zone.bubble, 2600);
  toast(`${zone.label}状态预览，真实状态未改变`);
  state.previewTimer = window.setTimeout(() => {
    state.preview = null;
    renderStatus();
  }, 3200);
}

function handleYardAction(zone) {
  clearTimeout(state.previewTimer);
  state.preview = null;
  activeAgent().realStatus = zone.real;
  moveAgentTo(zone.point, zone.real);
  setBubble(zone.bubble, 2600);
  toast(`${zone.label}是院子页面交互，不会触发工作任务`);
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
  moveAgentTo(zone.point, zone.type === "navigate" ? `前往${zone.label}` : zone.real, { showTarget: false });
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
    moveAgentTo(findZoneByAction("indoor", "preview_idle", "livingSofa").point, activeAgent().realStatus);
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
  moveAgentTo(zone.point, status, { working: kind !== "rest" && kind !== "plan" });
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
    el.previewHint.textContent = state.currentScene === "yard" ? "院子页面" : "真实状态";
  }
  drawAvatar();
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
    handleYardAction(zone);
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
requestAnimationFrame(draw);
