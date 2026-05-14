# 房间主题与家具 Bundle 模型

本文定义房间主题和家具 Bundle 的 V1 数据模型。早期版本曾按装修商城设计；当前第一阶段已调整为本地全解锁自定义，`price` / `saleMode` / 所有权字段仅作为兼容和未来产品实验，不作为 P1 购买流程。

## 数据入口

- `data/theme-bundles.js` 暴露 `window.AGENT_SPACE_DATA.themeBundles`
- `themes` 定义房间主题、风格 token、兼容槽位和渲染依赖
- `bundles` 定义可售卖家具包、包含物品、默认装备计划和重复购买规则
- 当前实现只定义模型，不改变现有设置抽屉 UI

## 主题字段

主题必须包含：

- `id`：稳定主题 id，例如 `oceanFocus`
- `label`：展示名
- `sceneId`：适用场景，当前为 `indoor`
- `rarity` / `price` / `saleMode`：商城展示和售卖字段
- `styleTokens`：墙面、地板、踢脚线、地毯、灯光、强调色等视觉 token
- `compatibleSlots`：主题覆盖的家具槽位范围
- `rendererRequirements`：当前静态 demo 和未来 PixiJS 分别需要什么能力

主题不是一张背景图的名字。正式版应该把主题拆到墙面、地板、灯光、装饰和家具 sprite 变体。

## Bundle 字段

家具包必须包含：

- `id` / `label`
- `themeId`
- `sceneId`
- `rarity` / `price` / `saleMode`
- `grantItems`：购买后加入库存的物品 id
- `equipPlan`：推荐装备方案，映射 `placedObjectId -> itemId`
- `ownership`：解锁方式和重复购买策略

`equipPlan` 是推荐方案，不是唯一状态。玩家仍可以只装备 bundle 里的部分家具，或者继续单槽位替换。

## 所有权与装备流程

V1 流程：

1. `locked`：可预览、可购买
2. `owned`：主题和 bundle 物品进入库存，可整体装备或单件装备
3. `equipped`：`sceneSnapshot[sceneId].themeId` 指向主题，`placedObjects` 写入装备后的 `itemId`

购买写入：

- `inventory.ownedBundles[bundleId]`
- `inventory.ownedThemes[themeId]`
- `inventory.owned[itemId]`

装备写入：

- `sceneSnapshot[sceneId].themeId`
- `sceneSnapshot[sceneId].placedObjects[objectId].itemId`

## 渲染和数据依赖

当前静态背景 demo 不能真正替换墙面/地板，所以主题所有权可以先进入数据和商城，视觉上暂时只体现 bundle 家具。

正式 PixiJS 需要：

- 房间表面 layer：墙面、地板、踢脚线、地毯、灯光
- 家具 sprite atlas 变体
- 主题预览缩略图或预览场景快照
- `sceneSnapshot.themeId` 持久化
- 邻居访问时读取主人当前主题和已摆放家具

## 延后

- 真实支付和后端发货
- 主题碎片/重复购买补偿经济
- 免费试穿和限时主题
- 主题动画、天气、窗景和节日装饰
