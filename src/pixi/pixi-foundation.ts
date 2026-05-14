import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, TextStyle, Texture } from "pixi.js";
import type {
  AgentSpaceAtlas,
  AgentSpaceData,
  AgentSpaceItem,
  AgentSpacePlacedObject,
  AgentSpacePoint,
  AgentSpaceRect,
  AgentSpaceScene,
  AgentSpaceShape,
} from "../types";

interface PixiFoundationOptions {
  data: AgentSpaceData;
  stageHost: HTMLElement | null;
  legacyCanvas: HTMLCanvasElement | null;
}

interface CoverRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ItemSpriteDescriptor {
  atlasKey: string;
  spriteId: string;
  anchor: AgentSpacePoint;
  fallback: {
    color: string;
    accent: string;
  };
}

const PIXI_RENDERER_PARAM = "pixi";

export async function bootstrapPixiFoundation(options: PixiFoundationOptions): Promise<void> {
  const { data, stageHost, legacyCanvas } = options;
  if (!stageHost) return;

  const enabled = new URLSearchParams(window.location.search).get("renderer") === PIXI_RENDERER_PARAM;
  stageHost.dataset.renderer = enabled ? "active" : "standby";
  stageHost.setAttribute("aria-hidden", enabled ? "false" : "true");

  if (!enabled) return;

  legacyCanvas?.classList.add("legacy-renderer-hidden");

  const app = new Application();
  await app.init({
    resizeTo: stageHost,
    backgroundAlpha: 0,
    antialias: false,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });

  app.canvas.className = "pixi-canvas";
  stageHost.append(app.canvas);
  window.__AGENT_SPACE_PIXI__ = app;

  const renderer = new PixiScenePreview(app, data, stageHost);
  await renderer.load();
  await renderer.render();

  const render = () => {
    renderer.render().catch((error: unknown) => {
      console.warn("PixiJS foundation render failed", error);
    });
  };
  window.addEventListener("resize", render);
  window.addEventListener("hashchange", render);
}

class PixiScenePreview {
  private readonly world = new Container();
  private readonly labels = new Container();
  private readonly sceneTextures = new Map<string, Texture>();
  private readonly atlasTextures = new Map<string, Texture>();
  private readonly frameTextures = new Map<string, Texture>();
  private sceneSprite?: Sprite;
  private agentSprite?: Sprite;

  constructor(
    private readonly app: Application,
    private readonly data: AgentSpaceData,
    private readonly stageHost: HTMLElement,
  ) {
    this.app.stage.addChild(this.world);
    this.app.stage.addChild(this.labels);
  }

  async load(): Promise<void> {
    const scene = this.activeScene();
    const [sceneTexture, agentTexture] = await Promise.all([
      this.sceneTexture(scene),
      this.agentTexture(),
      this.ensureSceneAtlases(scene),
    ]);

    this.sceneSprite = new Sprite(sceneTexture);
    this.world.addChild(this.sceneSprite);

    this.agentSprite = new Sprite(agentTexture);
    this.agentSprite.anchor.set(0.5, 1);
    this.world.addChild(this.agentSprite);
  }

  private async agentTexture(): Promise<Texture> {
    const texture = await Assets.load<Texture>(this.data.assets.agent);
    const pet = this.data.localRuntime?.pet;
    const frameGrid = pet?.frameGrid;
    const idle = frameGrid?.states?.idle;
    if (!frameGrid || !idle) return texture;
    return new Texture({
      source: texture.source,
      frame: new Rectangle(0, idle.row * frameGrid.cellHeight, frameGrid.cellWidth, frameGrid.cellHeight),
    });
  }

  async render(): Promise<void> {
    const scene = this.activeScene();
    const sceneTexture = await this.sceneTexture(scene);
    await this.ensureSceneAtlases(scene);
    const bounds = this.stageBounds();
    this.labels.removeChildren();
    this.world.removeChildren();

    if (!this.sceneSprite) return;

    this.sceneSprite.texture = sceneTexture;
    const cover = coverRect(this.sceneSprite.texture.width, this.sceneSprite.texture.height, bounds.width, bounds.height);
    this.sceneSprite.position.set(cover.x, cover.y);
    this.sceneSprite.width = cover.width;
    this.sceneSprite.height = cover.height;
    this.world.addChild(this.sceneSprite);

    this.drawObjects(scene, cover);
    this.drawAgent(scene, cover);
    this.drawModeLabel(bounds);
  }

  private async sceneTexture(scene: AgentSpaceScene): Promise<Texture> {
    const cached = this.sceneTextures.get(scene.assetId);
    if (cached) return cached;

    const scenePath = this.data.assets.scenes[scene.assetId];
    if (!scenePath) {
      throw new Error(`Missing scene asset path for ${scene.assetId}`);
    }

    const texture = await Assets.load<Texture>(scenePath);
    this.sceneTextures.set(scene.assetId, texture);
    return texture;
  }

  private async ensureSceneAtlases(scene: AgentSpaceScene): Promise<void> {
    const atlasKeys = new Set<string>();
    Object.values(scene.placedObjects).forEach((object) => {
      const item = this.data.itemCatalog[object.itemId];
      if (item?.sprite?.atlasKey) atlasKeys.add(item.sprite.atlasKey);
    });

    const pending = [...atlasKeys].map(async (atlasKey) => {
      if (this.atlasTextures.has(atlasKey)) return;
      const atlas = this.atlasByKey(atlasKey);
      if (!atlas?.image) return;
      const texture = await Assets.load<Texture>(atlas.image);
      this.atlasTextures.set(atlasKey, texture);
    });
    await Promise.all(pending);
  }

  private atlasByKey(atlasKey: string): AgentSpaceAtlas | null {
    const atlases = this.data.assets.atlases || {};
    for (const [manifestId, atlas] of Object.entries(atlases)) {
      if (!atlas) continue;
      if (atlas.key === atlasKey || manifestId === atlasKey) return atlas;
    }
    return null;
  }

  private drawObjects(scene: AgentSpaceScene, cover: CoverRect): void {
    Object.values(scene.placedObjects).forEach((object) => {
      const sprite = this.objectVisual(object, cover);
      this.world.addChild(sprite);
    });
  }

  private objectVisual(object: AgentSpacePlacedObject, cover: CoverRect): Container {
    const container = new Container();
    const point = sceneToPixi(object.point, cover);
    const item = this.data.itemCatalog[object.itemId];
    const spriteDescriptor = itemSpriteDescriptor(item);
    const frameTexture = this.resolveFrameTexture(spriteDescriptor.atlasKey, spriteDescriptor.spriteId);

    container.position.set(point.x, point.y);
    container.addChild(new Graphics().ellipse(0, 12, 24, 7).fill({ color: 0x241810, alpha: 0.18 }));

    if (frameTexture) {
      const sprite = new Sprite(frameTexture);
      sprite.anchor.set(spriteDescriptor.anchor.x, spriteDescriptor.anchor.y);
      const scale = this.objectFrameScale(object, cover, frameTexture.width, frameTexture.height);
      sprite.scale.set(scale);
      container.addChild(sprite);
    } else {
      const color = parseCssColor(spriteDescriptor.fallback.color);
      const accent = parseCssColor(spriteDescriptor.fallback.accent);
      const body = new Graphics()
        .roundRect(-24, -22, 48, 32, 5)
        .fill({ color, alpha: 0.76 })
        .stroke({ color: 0x2d1f17, alpha: 0.24, width: 1 });
      const face = new Graphics().roundRect(-15, -14, 30, 13, 3).fill({ color: accent, alpha: 0.88 });
      container.addChild(body, face);
    }

    container.eventMode = "static";
    container.cursor = "pointer";
    container.on("pointertap", () => {
      this.showFloatingLabel(object.label, point);
    });
    return container;
  }

  private resolveFrameTexture(atlasKey: string, spriteId: string): Texture | null {
    const cacheKey = `${atlasKey}:${spriteId}`;
    const cached = this.frameTextures.get(cacheKey);
    if (cached) return cached;

    const atlas = this.atlasByKey(atlasKey);
    const frame = atlas?.frames?.[spriteId];
    const atlasTexture = this.atlasTextures.get(atlasKey);
    if (!atlasTexture || !frame) return null;

    const texture = new Texture({
      source: atlasTexture.source,
      frame: new Rectangle(frame.x, frame.y, frame.w, frame.h),
    });
    this.frameTextures.set(cacheKey, texture);
    return texture;
  }

  private objectFrameScale(
    object: AgentSpacePlacedObject,
    cover: CoverRect,
    frameWidth: number,
    frameHeight: number,
  ): number {
    const bounds = zoneBounds(object);
    if (!bounds.w || !bounds.h) return 0.78;
    const p1 = sceneToPixi({ x: bounds.x, y: bounds.y }, cover);
    const p2 = sceneToPixi({ x: bounds.x + bounds.w, y: bounds.y + bounds.h }, cover);
    const width = Math.abs(p2.x - p1.x);
    const height = Math.abs(p2.y - p1.y);
    const scale = Math.min(width / frameWidth, height / frameHeight);
    return clamp(scale, 0.5, 1.16);
  }

  private drawAgent(scene: AgentSpaceScene, cover: CoverRect): void {
    if (!this.agentSprite) return;
    const agent = Object.values(this.data.agents)[0];
    const startObject = agent?.initialObject ? scene.placedObjects[agent.initialObject.objectId] : null;
    const point = sceneToPixi(startObject?.point || scene.entry, cover);
    this.agentSprite.position.set(point.x, point.y);
    if (this.data.localRuntime?.pet?.frameGrid) {
      this.agentSprite.width = 92;
      this.agentSprite.height = 100;
    } else {
      this.agentSprite.width = 72;
      this.agentSprite.height = 124;
    }
    this.world.addChild(this.agentSprite);
  }

  private drawModeLabel(bounds: { width: number; height: number }): void {
    const label = new Text({
      text: "PixiJS renderer preview",
      style: new TextStyle({
        fill: "#fffaf0",
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: 14,
        fontWeight: "700",
      }),
    });
    label.position.set(Math.max(16, bounds.width - label.width - 18), Math.max(16, bounds.height - 40));
    this.labels.addChild(label);
  }

  private showFloatingLabel(text: string, point: AgentSpacePoint): void {
    const label = new Text({
      text,
      style: new TextStyle({
        fill: "#2b241c",
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: 13,
        fontWeight: "700",
      }),
    });
    const backing = new Graphics()
      .roundRect(-10, -7, label.width + 20, 28, 7)
      .fill({ color: 0xfffcf7, alpha: 0.94 })
      .stroke({ color: 0x543823, alpha: 0.18, width: 1 });
    const group = new Container();
    group.position.set(point.x - label.width / 2, point.y - 82);
    group.addChild(backing);
    group.addChild(label);
    this.labels.addChild(group);
    window.setTimeout(() => group.destroy({ children: true }), 1400);
  }

  private activeScene(): AgentSpaceScene {
    return window.location.hash === "#yard" ? this.data.scenes.yard : this.data.scenes.indoor;
  }

  private stageBounds(): { width: number; height: number } {
    return {
      width: Math.max(720, this.stageHost.clientWidth),
      height: Math.max(500, this.stageHost.clientHeight),
    };
  }
}

function coverRect(imageWidth: number, imageHeight: number, stageWidth: number, stageHeight: number): CoverRect {
  const imageRatio = imageWidth / imageHeight || 16 / 9;
  const stageRatio = stageWidth / stageHeight;
  if (stageRatio > imageRatio) {
    const height = stageWidth / imageRatio;
    return { x: 0, y: (stageHeight - height) / 2, width: stageWidth, height };
  }
  const width = stageHeight * imageRatio;
  return { x: (stageWidth - width) / 2, y: 0, width, height: stageHeight };
}

function sceneToPixi(point: AgentSpacePoint, cover: CoverRect): AgentSpacePoint {
  return {
    x: cover.x + point.x * cover.width,
    y: cover.y + point.y * cover.height,
  };
}

function zoneBounds(zone: AgentSpacePlacedObject): AgentSpaceRect {
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

function zoneShapes(zone: AgentSpacePlacedObject): AgentSpaceShape[] {
  if (zone.hitAreas) return zone.hitAreas;
  if (zone.polygon) return [{ type: "polygon", points: zone.polygon }];
  if (zone.rect) return [{ type: "rect", ...zone.rect }];
  return [];
}

function shapeBounds(shape: AgentSpaceShape): AgentSpaceRect {
  if (shape.type === "rect") return shape;
  if (shape.type === "polygon") {
    const xs = shape.points.map((point) => point.x);
    const ys = shape.points.map((point) => point.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const w = Math.max(...xs) - x;
    const h = Math.max(...ys) - y;
    return { x, y, w, h };
  }
  const rx = shape.rx || (shape.w || 0) / 2;
  const ry = shape.ry || (shape.h || 0) / 2;
  const cx = shape.cx ?? (shape.x || 0) + rx;
  const cy = shape.cy ?? (shape.y || 0) + ry;
  return {
    x: cx - rx,
    y: cy - ry,
    w: rx * 2,
    h: ry * 2,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseCssColor(value: string): number {
  const normalized = value.replace("#", "");
  const parsed = Number.parseInt(normalized.length === 3 ? normalized.replace(/(.)/g, "$1$1") : normalized, 16);
  return Number.isFinite(parsed) ? parsed : 0xd96f42;
}

function itemSpriteDescriptor(item: AgentSpaceItem | undefined): ItemSpriteDescriptor {
  const fallback = item?.sprite?.fallback;
  return {
    atlasKey: item?.sprite?.atlasKey || "prototype-furniture",
    spriteId: item?.sprite?.spriteId || `${item?.category || "item"}.fallback`,
    anchor: item?.sprite?.anchor || { x: 0.5, y: 1 },
    fallback: {
      color: fallback?.color || "#d96f42",
      accent: fallback?.accent || "#fff3d8",
    },
  };
}
