// Scene and character asset paths. This file is loaded by index.html before data/game-data.js.
window.AGENT_SPACE_DATA_MODULES = window.AGENT_SPACE_DATA_MODULES || {};

const PROTOTYPE_ATLAS_FRAMES = {
  "bed.pink_basic": { x: 0, y: 0, w: 160, h: 120 },
  "bed.blue_ocean": { x: 160, y: 0, w: 160, h: 120 },
  "bed.lavender_cloud": { x: 320, y: 0, w: 160, h: 120 },
  "sofa.green_basic": { x: 480, y: 0, w: 160, h: 120 },
  "sofa.cream_modern": { x: 640, y: 0, w: 160, h: 120 },
  "sofa.teal_studio": { x: 0, y: 120, w: 160, h: 120 },
  "tv.cabinet_basic": { x: 160, y: 120, w: 160, h: 120 },
  "bookshelf.wall_basic": { x: 320, y: 120, w: 160, h: 120 },
  "bookshelf.dark_archive": { x: 480, y: 120, w: 160, h: 120 },
  "bookshelf.white_gallery": { x: 640, y: 120, w: 160, h: 120 },
  "desk.computer_basic": { x: 0, y: 240, w: 160, h: 120 },
  "desk.dual_monitor": { x: 160, y: 240, w: 160, h: 120 },
  "desk.creator_pink": { x: 320, y: 240, w: 160, h: 120 },
  "fixture.garden_door": { x: 480, y: 240, w: 160, h: 120 },
  "kitchen.basic": { x: 640, y: 240, w: 160, h: 120 },
  "kitchen.mint": { x: 0, y: 360, w: 160, h: 120 },
  "kitchen.sunrise": { x: 160, y: 360, w: 160, h: 120 },
  "fixture.porch_basic": { x: 320, y: 360, w: 160, h: 120 },
  "farm.plot_basic": { x: 480, y: 360, w: 160, h: 120 },
  "fixture.mailbox_basic": { x: 640, y: 360, w: 160, h: 120 },
};

window.AGENT_SPACE_DATA_MODULES.assets = {
  "agent": "./assets/aria-agent-v2.png",
  "scenes": {
    "indoor": "./assets/scene-indoor-v2.png",
    "yard": "./assets/scene-yard.png"
  },
  "atlases": {
    "furniturePrototype": {
      "key": "prototype-furniture",
      "image": "./assets/furniture-prototype-atlas.svg",
      "frameSize": { "w": 160, "h": 120 },
      "frames": PROTOTYPE_ATLAS_FRAMES,
      "status": "prototype-art"
    }
  }
};
