import "../data/assets.js";
import "../data/item-catalog.js";
import "../data/inventory.js";
import "../data/scenes.js";
import "../data/agents.js";
import "../data/farm-model.js";
import "../data/theme-bundles.js";
import "../data/game-data.js";
import { applyLocalRuntime } from "./local-runtime";
import { bootstrapPixiFoundation } from "./pixi/pixi-foundation";

const gameData = window.AGENT_SPACE_DATA;

if (!gameData) {
  throw new Error("Agent Space data did not load.");
}
const data = gameData;

async function bootstrap(): Promise<void> {
  await applyLocalRuntime(data);
  await import("./legacy/canvas-app.js");
  await bootstrapPixiFoundation({
    data,
    stageHost: document.querySelector<HTMLElement>("#pixiStage"),
    legacyCanvas: document.querySelector<HTMLCanvasElement>("#worldCanvas"),
  });
}

bootstrap().catch((error: unknown) => {
  console.warn("Agent Space failed to start", error);
});
