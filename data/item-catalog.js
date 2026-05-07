// Furniture, fixture, farm, and mailbox item catalog. This file is loaded by index.html before data/game-data.js.
window.AGENT_SPACE_DATA_MODULES = window.AGENT_SPACE_DATA_MODULES || {};

function prototypeSprite(spriteId, kind, color, accent, short, options = {}) {
  return {
    atlasKey: "prototype-furniture",
    spriteId,
    anchor: { x: 0.5, y: 1 },
    fallback: {
      kind,
      ...options,
      color,
      accent,
      short,
    },
  };
}

window.AGENT_SPACE_DATA_MODULES.itemCatalog = {
  "bed_pink_basic": {
    "type": "furniture",
    "category": "bed",
    "label": "粉色床",
    "rarity": "starter",
    "price": 0,
    "slots": [
      "bedroom.bed"
    ],
    "actions": [
      "preview_rest",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("bed.pink_basic", "bed", "#f3a3b9", "#fff1f5", "BED")
  },
  "bed_blue_ocean": {
    "type": "furniture",
    "category": "bed",
    "label": "海盐蓝床",
    "rarity": "rare",
    "price": 28,
    "slots": [
      "bedroom.bed"
    ],
    "actions": [
      "preview_rest",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("bed.blue_ocean", "bed", "#6faed6", "#eaf8ff", "BED")
  },
  "bed_lavender_cloud": {
    "type": "furniture",
    "category": "bed",
    "label": "薰衣草云床",
    "rarity": "epic",
    "price": 46,
    "slots": [
      "bedroom.bed"
    ],
    "actions": [
      "preview_rest",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("bed.lavender_cloud", "bed", "#b695d8", "#fff0fb", "BED")
  },
  "sofa_green_basic": {
    "type": "furniture",
    "category": "sofa",
    "label": "绿色沙发",
    "rarity": "starter",
    "price": 0,
    "slots": [
      "living.sofa"
    ],
    "actions": [
      "preview_idle",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("sofa.green_basic", "sofa", "#75a66f", "#f5edca", "SOFA")
  },
  "sofa_cream_modern": {
    "type": "furniture",
    "category": "sofa",
    "label": "奶油白沙发",
    "rarity": "rare",
    "price": 24,
    "slots": [
      "living.sofa"
    ],
    "actions": [
      "preview_idle",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("sofa.cream_modern", "sofa", "#ead7b3", "#7fb4a5", "SOFA")
  },
  "sofa_teal_studio": {
    "type": "furniture",
    "category": "sofa",
    "label": "孔雀蓝沙发",
    "rarity": "rare",
    "price": 32,
    "slots": [
      "living.sofa"
    ],
    "actions": [
      "preview_idle",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("sofa.teal_studio", "sofa", "#368c8f", "#ffd7a8", "SOFA")
  },
  "tv_cabinet_basic": {
    "type": "furniture",
    "category": "tv",
    "label": "电视柜",
    "rarity": "starter",
    "price": 0,
    "slots": [
      "living.tv"
    ],
    "actions": [
      "preview_idle",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("tv.cabinet_basic", "tv", "#5e493b", "#c9dce3", "TV")
  },
  "bookshelf_wall_basic": {
    "type": "furniture",
    "category": "bookshelf",
    "label": "整墙书柜",
    "rarity": "starter",
    "price": 0,
    "slots": [
      "study.bookshelf"
    ],
    "actions": [
      "preview_research",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("bookshelf.wall_basic", "bookshelf", "#936944", "#d8b772", "BOOK")
  },
  "bookshelf_dark_archive": {
    "type": "furniture",
    "category": "bookshelf",
    "label": "深木档案书柜",
    "rarity": "epic",
    "price": 40,
    "slots": [
      "study.bookshelf"
    ],
    "actions": [
      "preview_research",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("bookshelf.dark_archive", "bookshelf", "#4f372c", "#b88e56", "BOOK")
  },
  "bookshelf_white_gallery": {
    "type": "furniture",
    "category": "bookshelf",
    "label": "白橡展示书柜",
    "rarity": "rare",
    "price": 26,
    "slots": [
      "study.bookshelf"
    ],
    "actions": [
      "preview_research",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("bookshelf.white_gallery", "bookshelf", "#e7dfd2", "#7b9ec8", "BOOK")
  },
  "computer_desk_basic": {
    "type": "furniture",
    "category": "desk",
    "label": "电脑桌",
    "rarity": "starter",
    "price": 0,
    "slots": [
      "study.desk"
    ],
    "actions": [
      "preview_work",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("desk.computer_basic", "desk", "#7b5940", "#86a8c8", "DESK")
  },
  "computer_desk_dual_monitor": {
    "type": "furniture",
    "category": "desk",
    "label": "双屏工作桌",
    "rarity": "rare",
    "price": 36,
    "slots": [
      "study.desk"
    ],
    "actions": [
      "preview_work",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("desk.dual_monitor", "desk", "#4b5f7d", "#b8def7", "DUAL", { variant: "dual-monitor" })
  },
  "computer_desk_creator_pink": {
    "type": "furniture",
    "category": "desk",
    "label": "创作者粉桌",
    "rarity": "epic",
    "price": 48,
    "slots": [
      "study.desk"
    ],
    "actions": [
      "preview_work",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("desk.creator_pink", "desk", "#c77a98", "#ffe1ec", "DUAL", { variant: "dual-monitor" })
  },
  "door_garden_basic": {
    "type": "fixture",
    "category": "door",
    "label": "通往小院的大门",
    "rarity": "system",
    "price": 0,
    "slots": [
      "indoor.exit"
    ],
    "actions": [
      "navigate_yard"
    ],
    "sprite": prototypeSprite("fixture.garden_door", "door", "#8b5a35", "#7bd0ff", "EXIT")
  },
  "kitchen_set_basic": {
    "type": "furniture",
    "category": "kitchen",
    "label": "厨房套装",
    "rarity": "starter",
    "price": 0,
    "slots": [
      "kitchen.main"
    ],
    "actions": [
      "preview_cook",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("kitchen.basic", "kitchen", "#d99162", "#fff1c4", "KIT")
  },
  "kitchen_set_mint": {
    "type": "furniture",
    "category": "kitchen",
    "label": "薄荷厨房套装",
    "rarity": "rare",
    "price": 34,
    "slots": [
      "kitchen.main"
    ],
    "actions": [
      "preview_cook",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("kitchen.mint", "kitchen", "#7ec7ad", "#fff5cf", "KIT")
  },
  "kitchen_set_sunrise": {
    "type": "furniture",
    "category": "kitchen",
    "label": "晨光厨房套装",
    "rarity": "rare",
    "price": 30,
    "slots": [
      "kitchen.main"
    ],
    "actions": [
      "preview_cook",
      "decorate_replace"
    ],
    "sprite": prototypeSprite("kitchen.sunrise", "kitchen", "#e48b55", "#ffe2a8", "KIT")
  },
  "porch_basic": {
    "type": "fixture",
    "category": "door",
    "label": "回屋门廊",
    "rarity": "system",
    "price": 0,
    "slots": [
      "yard.porch"
    ],
    "actions": [
      "navigate_indoor"
    ],
    "sprite": prototypeSprite("fixture.porch_basic", "door", "#8b5a35", "#f5d08a", "HOME")
  },
  "farm_plot_basic": {
    "type": "farm",
    "category": "plot",
    "label": "基础农田",
    "rarity": "starter",
    "price": 0,
    "slots": [
      "yard.farm"
    ],
    "actions": [
      "plant",
      "harvest",
      "steal"
    ],
    "sprite": prototypeSprite("farm.plot_basic", "farm", "#8d633c", "#7ebc66", "FARM")
  },
  "mailbox_basic": {
    "type": "fixture",
    "category": "mailbox",
    "label": "信箱",
    "rarity": "starter",
    "price": 0,
    "slots": [
      "yard.mailbox"
    ],
    "actions": [
      "open_feed"
    ],
    "sprite": prototypeSprite("fixture.mailbox_basic", "mailbox", "#d85c58", "#fff7d6", "MAIL")
  }
};
