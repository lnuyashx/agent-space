# 农田地块状态模型

本文定义小院农田的 V1 数据模型，目标是让后续种植、收获和邻居串门先依赖稳定数据，而不是直接绑死当前静态背景 demo。

## 数据入口

- `data/farm-model.js` 暴露 `window.AGENT_SPACE_DATA.farm`
- `data/scenes.js` 中的农田对象通过 `farmPlotId` 连接到农田快照
- 当前 `fieldLeft` / `fieldRight` 默认都是 `defaultFarmStateId: "empty"`

## 地块快照

后续保存到 `sceneSnapshot` 或独立 `farmSnapshot` 的单个地块建议使用：

```js
{
  state: "empty",
  cropId: null,
  plantedAt: null,
  updatedAt: null,
  lastWateredAt: null,
  neighborHelps: [],
  stolenBy: []
}
```

`farmPlotId` 应稳定，例如 `yard.fieldLeft`，不要依赖 UI 文案或数组顺序。

## 生命周期

V1 生命周期固定为：

1. `empty`：空地，只能播种
2. `seeded`：已播种，可浇水，可被邻居帮忙浇水
3. `growing`：生长中，可浇水、施肥、被帮忙
4. `ready`：可收获，主人可收获，邻居可偷取有限产出
5. `withered`：已枯萎，主人可清理回空地

时间推进可以先由前端本地计算，正式版应由 Local Bridge 或后端权威时间校验。

## 动作

主人动作：

- `plant`：`empty -> seeded`，写入 `cropId`、`plantedAt`
- `water`：`seeded/growing -> growing`，写入 `lastWateredAt`
- `fertilize`：`growing -> growing`，写入成长加成
- `harvest`：`ready -> empty`，发放作物和经验
- `clear`：`withered -> empty`

邻居动作：

- `help_water`：帮忙浇水，有冷却，写入 `neighborHelps`
- `steal`：只能对 `ready` 地块执行，有每邻居/每作物上限，写入 `stolenBy`

当前 `farm_plot_basic` 物品仍只暴露 `plant`、`harvest`、`steal`，用于和现有院子交互保持一致；`water` / `help_water` / `fertilize` 是后续 UI 扩展动作。

## 社交影响

- 邻居访问只应读取必要地块状态：`state`、`cropId`、是否可收获、有限 owner profile
- `steal` 不应把产量偷到负数，且需要记录谁偷过
- `help_water` 是正向社交动作，应能给主人加速或增加少量产出
- Hub 同步应发布农田快照，而不是发布当前 canvas 坐标或临时热区

## 延后

- 作物背包道具和种子经济
- 成熟/枯萎的真实计时器
- 农田动画和阶段 sprite
- 邻居权限、冷却和反作弊校验
