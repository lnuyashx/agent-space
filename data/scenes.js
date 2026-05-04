// Indoor and yard scene templates. This file is loaded by index.html before data/game-data.js.
window.AGENT_SPACE_DATA_MODULES = window.AGENT_SPACE_DATA_MODULES || {};

window.AGENT_SPACE_DATA_MODULES.scenes = {
  "indoor": {
    "label": "室内",
    "assetId": "indoor",
    "entry": {
      "x": 0.43,
      "y": 0.55
    },
    "status": "在客厅休息",
    "hash": "",
    "walkableRects": [
      {
        "x": 0.24,
        "y": 0.36,
        "w": 0.45,
        "h": 0.31
      },
      {
        "x": 0.05,
        "y": 0.57,
        "w": 0.42,
        "h": 0.26
      },
      {
        "x": 0.43,
        "y": 0.3,
        "w": 0.33,
        "h": 0.24
      },
      {
        "x": 0.72,
        "y": 0.27,
        "w": 0.21,
        "h": 0.22
      },
      {
        "x": 0.58,
        "y": 0.69,
        "w": 0.34,
        "h": 0.22
      },
      {
        "x": 0.08,
        "y": 0.34,
        "w": 0.24,
        "h": 0.2
      }
    ],
    "placedObjects": {
      "bedroomBed": {
        "itemId": "bed_pink_basic",
        "room": "bedroom",
        "slot": "bedroom.bed",
        "type": "preview",
        "label": "床",
        "preview": "预览：休息 / 恢复能量",
        "real": "在卧室休息",
        "point": {
          "x": 0.19,
          "y": 0.44
        },
        "hitAreas": [
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.075,
                "y": 0.185
              },
              {
                "x": 0.204,
                "y": 0.145
              },
              {
                "x": 0.338,
                "y": 0.255
              },
              {
                "x": 0.344,
                "y": 0.345
              },
              {
                "x": 0.245,
                "y": 0.438
              },
              {
                "x": 0.107,
                "y": 0.36
              }
            ]
          }
        ],
        "bubble": "这里代表休息状态，不会直接改变真实状态"
      },
      "livingSofa": {
        "itemId": "sofa_green_basic",
        "room": "living",
        "slot": "living.sofa",
        "type": "preview",
        "label": "客厅沙发",
        "preview": "预览：摸鱼 / 闲逛",
        "real": "在客厅休息",
        "point": {
          "x": 0.34,
          "y": 0.74
        },
        "hitAreas": [
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.242,
                "y": 0.655
              },
              {
                "x": 0.356,
                "y": 0.592
              },
              {
                "x": 0.427,
                "y": 0.653
              },
              {
                "x": 0.427,
                "y": 0.864
              },
              {
                "x": 0.311,
                "y": 0.943
              },
              {
                "x": 0.245,
                "y": 0.865
              }
            ]
          }
        ],
        "bubble": "无任务时可以在这里摸鱼"
      },
      "livingTv": {
        "itemId": "tv_cabinet_basic",
        "room": "living",
        "slot": "living.tv",
        "type": "preview",
        "label": "电视柜",
        "preview": "预览：娱乐 / 摸鱼",
        "real": "在客厅摸鱼",
        "point": {
          "x": 0.17,
          "y": 0.6
        },
        "hitAreas": [
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.055,
                "y": 0.485
              },
              {
                "x": 0.185,
                "y": 0.43
              },
              {
                "x": 0.188,
                "y": 0.638
              },
              {
                "x": 0.056,
                "y": 0.673
              },
              {
                "x": 0.042,
                "y": 0.526
              }
            ]
          },
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.024,
                "y": 0.655
              },
              {
                "x": 0.206,
                "y": 0.605
              },
              {
                "x": 0.207,
                "y": 0.725
              },
              {
                "x": 0.035,
                "y": 0.792
              },
              {
                "x": 0.015,
                "y": 0.711
              }
            ]
          }
        ],
        "bubble": "摸鱼状态可以显示在这里"
      },
      "studyBookshelf": {
        "itemId": "bookshelf_wall_basic",
        "room": "study",
        "slot": "study.bookshelf",
        "type": "preview",
        "label": "书柜",
        "preview": "预览：查资料 / 搜索",
        "real": "在书柜边查资料",
        "point": {
          "x": 0.48,
          "y": 0.37
        },
        "hitAreas": [
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.381,
                "y": 0.063
              },
              {
                "x": 0.559,
                "y": 0.006
              },
              {
                "x": 0.568,
                "y": 0.37
              },
              {
                "x": 0.537,
                "y": 0.479
              },
              {
                "x": 0.39,
                "y": 0.516
              },
              {
                "x": 0.354,
                "y": 0.42
              },
              {
                "x": 0.353,
                "y": 0.13
              }
            ]
          }
        ],
        "bubble": "书柜代表查资料和搜索状态"
      },
      "studyDesk": {
        "itemId": "computer_desk_basic",
        "room": "study",
        "slot": "study.desk",
        "type": "preview",
        "label": "电脑桌",
        "preview": "预览：工作 / 写作",
        "real": "在电脑前工作",
        "point": {
          "x": 0.62,
          "y": 0.4
        },
        "hitAreas": [
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.532,
                "y": 0.312
              },
              {
                "x": 0.658,
                "y": 0.255
              },
              {
                "x": 0.683,
                "y": 0.323
              },
              {
                "x": 0.646,
                "y": 0.442
              },
              {
                "x": 0.541,
                "y": 0.435
              },
              {
                "x": 0.502,
                "y": 0.36
              }
            ]
          },
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.568,
                "y": 0.213
              },
              {
                "x": 0.634,
                "y": 0.242
              },
              {
                "x": 0.633,
                "y": 0.303
              },
              {
                "x": 0.569,
                "y": 0.293
              }
            ]
          },
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.638,
                "y": 0.279
              },
              {
                "x": 0.692,
                "y": 0.304
              },
              {
                "x": 0.689,
                "y": 0.353
              },
              {
                "x": 0.635,
                "y": 0.333
              }
            ]
          },
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.526,
                "y": 0.354
              },
              {
                "x": 0.584,
                "y": 0.361
              },
              {
                "x": 0.579,
                "y": 0.522
              },
              {
                "x": 0.526,
                "y": 0.514
              },
              {
                "x": 0.512,
                "y": 0.43
              }
            ]
          }
        ],
        "bubble": "电脑前才是真正的工作点位"
      },
      "gardenDoor": {
        "itemId": "door_garden_basic",
        "room": "entry",
        "slot": "indoor.exit",
        "type": "navigate",
        "label": "大门",
        "preview": "进入小院",
        "real": "在院子里散步",
        "point": {
          "x": 0.82,
          "y": 0.34
        },
        "hitAreas": [
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.815,
                "y": 0.123
              },
              {
                "x": 0.903,
                "y": 0.193
              },
              {
                "x": 0.892,
                "y": 0.512
              },
              {
                "x": 0.832,
                "y": 0.471
              },
              {
                "x": 0.817,
                "y": 0.309
              }
            ]
          },
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.773,
                "y": 0.475
              },
              {
                "x": 0.878,
                "y": 0.502
              },
              {
                "x": 0.844,
                "y": 0.574
              },
              {
                "x": 0.744,
                "y": 0.537
              }
            ]
          }
        ],
        "to": "yard",
        "bubble": "去院子看看"
      },
      "kitchenMain": {
        "itemId": "kitchen_set_basic",
        "room": "kitchen",
        "slot": "kitchen.main",
        "type": "preview",
        "label": "厨房",
        "preview": "预览：做饭 / 茶水",
        "real": "在厨房做点心",
        "point": {
          "x": 0.74,
          "y": 0.78
        },
        "hitAreas": [
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.678,
                "y": 0.65
              },
              {
                "x": 0.879,
                "y": 0.61
              },
              {
                "x": 0.943,
                "y": 0.694
              },
              {
                "x": 0.869,
                "y": 0.785
              },
              {
                "x": 0.673,
                "y": 0.76
              }
            ]
          },
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.87,
                "y": 0.635
              },
              {
                "x": 0.955,
                "y": 0.674
              },
              {
                "x": 0.943,
                "y": 0.93
              },
              {
                "x": 0.864,
                "y": 0.889
              }
            ]
          }
        ],
        "bubble": "厨房只是生活状态预览"
      }
    }
  },
  "yard": {
    "label": "小院子",
    "assetId": "yard",
    "entry": {
      "x": 0.52,
      "y": 0.42
    },
    "status": "在院子里散步",
    "hash": "#yard",
    "walkableRects": [
      {
        "x": 0.37,
        "y": 0.23,
        "w": 0.28,
        "h": 0.2
      },
      {
        "x": 0.3,
        "y": 0.38,
        "w": 0.42,
        "h": 0.2
      },
      {
        "x": 0.34,
        "y": 0.54,
        "w": 0.34,
        "h": 0.26
      },
      {
        "x": 0.47,
        "y": 0.28,
        "w": 0.3,
        "h": 0.3
      },
      {
        "x": 0.18,
        "y": 0.26,
        "w": 0.24,
        "h": 0.14
      }
    ],
    "placedObjects": {
      "porch": {
        "itemId": "porch_basic",
        "room": "yard",
        "slot": "yard.porch",
        "type": "navigate",
        "label": "回屋",
        "preview": "回到室内",
        "real": "在客厅休息",
        "point": {
          "x": 0.54,
          "y": 0.31
        },
        "hitAreas": [
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.41,
                "y": 0.03
              },
              {
                "x": 0.66,
                "y": 0.03
              },
              {
                "x": 0.63,
                "y": 0.27
              },
              {
                "x": 0.44,
                "y": 0.28
              }
            ]
          }
        ],
        "to": "indoor",
        "bubble": "回到室内"
      },
      "fieldLeft": {
        "itemId": "farm_plot_basic",
        "room": "yard",
        "slot": "yard.farm.left",
        "farmPlotId": "yard.fieldLeft",
        "defaultFarmStateId": "empty",
        "type": "yard",
        "label": "左侧农田",
        "preview": "院子：查看农田",
        "real": "在院子查看农田",
        "point": {
          "x": 0.27,
          "y": 0.58
        },
        "hitAreas": [
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.06,
                "y": 0.39
              },
              {
                "x": 0.32,
                "y": 0.38
              },
              {
                "x": 0.35,
                "y": 0.62
              },
              {
                "x": 0.09,
                "y": 0.66
              },
              {
                "x": 0.03,
                "y": 0.52
              }
            ]
          }
        ],
        "bubble": "这里是院子的页面交互，不是工作状态"
      },
      "fieldRight": {
        "itemId": "farm_plot_basic",
        "room": "yard",
        "slot": "yard.farm.right",
        "farmPlotId": "yard.fieldRight",
        "defaultFarmStateId": "empty",
        "type": "yard",
        "label": "右侧农田",
        "preview": "院子：查看农田",
        "real": "在院子查看农田",
        "point": {
          "x": 0.76,
          "y": 0.58
        },
        "hitAreas": [
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.7,
                "y": 0.36
              },
              {
                "x": 0.94,
                "y": 0.36
              },
              {
                "x": 0.97,
                "y": 0.6
              },
              {
                "x": 0.72,
                "y": 0.65
              },
              {
                "x": 0.66,
                "y": 0.51
              }
            ]
          }
        ],
        "bubble": "农田后续会接种植和收获"
      },
      "mailbox": {
        "itemId": "mailbox_basic",
        "room": "yard",
        "slot": "yard.mailbox",
        "type": "yard",
        "label": "信箱",
        "preview": "院子：查看信箱",
        "real": "在院子查看信箱",
        "point": {
          "x": 0.43,
          "y": 0.65
        },
        "hitAreas": [
          {
            "type": "polygon",
            "points": [
              {
                "x": 0.4,
                "y": 0.49
              },
              {
                "x": 0.47,
                "y": 0.5
              },
              {
                "x": 0.46,
                "y": 0.61
              },
              {
                "x": 0.43,
                "y": 0.65
              },
              {
                "x": 0.39,
                "y": 0.61
              }
            ]
          }
        ],
        "bubble": "这里可以放邻居消息和动态"
      }
    }
  }
};
