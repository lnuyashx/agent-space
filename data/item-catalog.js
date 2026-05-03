// Furniture, fixture, farm, and mailbox item catalog. This file is loaded by index.html before data/game-data.js.
window.AGENT_SPACE_DATA_MODULES = window.AGENT_SPACE_DATA_MODULES || {};

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
    "visual": {
      "color": "#f3a3b9",
      "accent": "#fff1f5",
      "short": "BED"
    }
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
    "visual": {
      "color": "#6faed6",
      "accent": "#eaf8ff",
      "short": "BED"
    }
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
    "visual": {
      "color": "#b695d8",
      "accent": "#fff0fb",
      "short": "BED"
    }
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
    "visual": {
      "color": "#75a66f",
      "accent": "#f5edca",
      "short": "SOFA"
    }
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
    "visual": {
      "color": "#ead7b3",
      "accent": "#7fb4a5",
      "short": "SOFA"
    }
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
    "visual": {
      "color": "#368c8f",
      "accent": "#ffd7a8",
      "short": "SOFA"
    }
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
    "visual": {
      "color": "#5e493b",
      "accent": "#c9dce3",
      "short": "TV"
    }
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
    "visual": {
      "color": "#936944",
      "accent": "#d8b772",
      "short": "BOOK"
    }
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
    "visual": {
      "color": "#4f372c",
      "accent": "#b88e56",
      "short": "BOOK"
    }
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
    "visual": {
      "color": "#e7dfd2",
      "accent": "#7b9ec8",
      "short": "BOOK"
    }
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
    "visual": {
      "color": "#7b5940",
      "accent": "#86a8c8",
      "short": "DESK"
    }
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
    "visual": {
      "color": "#4b5f7d",
      "accent": "#b8def7",
      "short": "DUAL"
    }
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
    "visual": {
      "color": "#c77a98",
      "accent": "#ffe1ec",
      "short": "DUAL"
    }
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
    "visual": {
      "color": "#8b5a35",
      "accent": "#7bd0ff",
      "short": "EXIT"
    }
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
    "visual": {
      "color": "#d99162",
      "accent": "#fff1c4",
      "short": "KIT"
    }
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
    "visual": {
      "color": "#7ec7ad",
      "accent": "#fff5cf",
      "short": "KIT"
    }
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
    "visual": {
      "color": "#e48b55",
      "accent": "#ffe2a8",
      "short": "KIT"
    }
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
    "visual": {
      "color": "#8b5a35",
      "accent": "#f5d08a",
      "short": "HOME"
    }
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
    "visual": {
      "color": "#8d633c",
      "accent": "#7ebc66",
      "short": "FARM"
    }
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
    "visual": {
      "color": "#d85c58",
      "accent": "#fff7d6",
      "short": "MAIL"
    }
  }
};
