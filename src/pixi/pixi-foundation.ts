import { Application, Assets, Container, Graphics, Sprite, Text, TextStyle } from "pixi.js";
import type { AgentSpaceData, AgentSpacePlacedObject, AgentSpacePoint, AgentSpaceScene } from "../types";

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
  renderer.render();

  window.addEventListener("resize", () => renderer.render());
  window.addEventListener("hashchange", () => renderer.render());
}

class PixiScenePreview {
  private readonly world = new Container();
  private readonly labels = new Container();
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
    const scenePath = this.data.assets.scenes[scene.assetId];
    const [sceneTexture, agentTexture] = await Promise.all([Assets.load(scenePath), Assets.load(this.data.assets.agent)]);

    this.sceneSprite = new Sprite(sceneTexture);
    this.world.addChild(this.sceneSprite);

    this.agentSprite = new Sprite(agentTexture);
    this.agentSprite.anchor.set(0.5, 1);
    this.world.addChild(this.agentSprite);
  }

  render(): void {
    const scene = this.activeScene();
    const bounds = this.stageBounds();
    this.labels.removeChildren();
    this.world.removeChildren();

    if (this.sceneSprite) {
      const cover = coverRect(this.sceneSprite.texture.width, this.sceneSprite.texture.height, bounds.width, bounds.height);
      this.sceneSprite.position.set(cover.x, cover.y);
      this.sceneSprite.width = cover.width;
      this.sceneSprite.height = cover.height;
      this.world.addChild(this.sceneSprite);

      this.drawObjects(scene, cover);
      this.drawAgent(scene, cover);
      this.drawModeLabel(bounds);
    }
  }

  private drawObjects(scene: AgentSpaceScene, cover: CoverRect): void {
    Object.values(scene.placedObjects).forEach((object) => {
      const marker = this.objectMarker(object, cover);
      this.world.addChild(marker);
    });
  }

  private objectMarker(object: AgentSpacePlacedObject, cover: CoverRect): Container {
    const container = new Container();
    const point = sceneToPixi(object.point, cover);
    const item = this.data.itemCatalog[object.itemId];
    const color = parseCssColor(item?.visual?.color || "#d96f42");
    const accent = parseCssColor(item?.visual?.accent || "#fff3d8");

    const shadow = new Graphics().ellipse(0, 12, 24, 7).fill({ color: 0x241810, alpha: 0.18 });
    const body = new Graphics()
      .roundRect(-24, -22, 48, 32, 5)
      .fill({ color, alpha: 0.76 })
      .stroke({ color: 0x2d1f17, alpha: 0.24, width: 1 });
    const face = new Graphics().roundRect(-15, -14, 30, 13, 3).fill({ color: accent, alpha: 0.88 });

    container.position.set(point.x, point.y);
    container.addChild(shadow, body, face);
    container.eventMode = "static";
    container.cursor = "pointer";
    container.on("pointertap", () => {
      this.showFloatingLabel(object.label, point);
    });
    return container;
  }

  private drawAgent(scene: AgentSpaceScene, cover: CoverRect): void {
    if (!this.agentSprite) return;
    const agent = Object.values(this.data.agents)[0];
    const startObject = agent?.initialObject ? scene.placedObjects[agent.initialObject.objectId] : null;
    const point = sceneToPixi(startObject?.point || scene.entry, cover);
    this.agentSprite.position.set(point.x, point.y);
    this.agentSprite.width = 72;
    this.agentSprite.height = 124;
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

function parseCssColor(value: string): number {
  const normalized = value.replace("#", "");
  const parsed = Number.parseInt(normalized.length === 3 ? normalized.replace(/(.)/g, "$1$1") : normalized, 16);
  return Number.isFinite(parsed) ? parsed : 0xd96f42;
}

