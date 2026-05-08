import "../data/assets.js";
import "../data/item-catalog.js";
import "../data/inventory.js";
import "../data/scenes.js";
import "../data/agents.js";
import "../data/farm-model.js";
import "../data/theme-bundles.js";
import "../data/game-data.js";
import "./legacy/canvas-app.js";
import { bootstrapPixiFoundation } from "./pixi/pixi-foundation";

const gameData = window.AGENT_SPACE_DATA;

if (!gameData) {
  throw new Error("Agent Space data did not load.");
}

bootstrapPixiFoundation({
  data: gameData,
  stageHost: document.querySelector<HTMLElement>("#pixiStage"),
  legacyCanvas: document.querySelector<HTMLCanvasElement>("#worldCanvas"),
}).catch((error: unknown) => {
  console.warn("PixiJS foundation failed to start", error);
});
