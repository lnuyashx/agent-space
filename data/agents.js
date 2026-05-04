// Default agent state templates. This file is loaded by index.html before data/game-data.js.
window.AGENT_SPACE_DATA_MODULES = window.AGENT_SPACE_DATA_MODULES || {};

window.AGENT_SPACE_DATA_MODULES.agents = {
  "Aria": {
    "mood": 78,
    "energy": 86,
    "exp": 120,
    "coins": 50,
    "color": "#4f83c4"
  },
  "Luna": {
    "mood": 84,
    "energy": 72,
    "exp": 210,
    "coins": 68,
    "color": "#bf6fb8",
    "initialObject": {
      "scene": "indoor",
      "objectId": "studyDesk",
      "status": "在电脑前工作"
    }
  },
  "Mika": {
    "mood": 70,
    "energy": 92,
    "exp": 180,
    "coins": 42,
    "color": "#4f83c4",
    "initialObject": {
      "scene": "indoor",
      "objectId": "studyBookshelf",
      "status": "在书柜边查资料"
    }
  }
};
