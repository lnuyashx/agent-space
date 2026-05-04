# Agent Space Demo

这是一个静态 MVP-alpha 体验 demo，可直接用浏览器打开 `index.html`。

新 Codex session / agent 先看 `AGENTS.md` 和 `STATUS.md`。当前任务状态以 GitHub Issues 和 `scripts/status.sh` 为准。

## 当前包含

- 单页大房间：室内是一个完整 agent 房间作为主舞台，不再用多个房间 tab
- 独立小院：点击室内大门进入院子，院子作为单独全屏场景显示
- 底部会话区：agent 切换按钮、设置按钮、输入框集中在底部
- 半透明 HUD：agent 状态、能量、心情、金币覆盖在房间上方
- Hotspot 交互层：背景里的真实美术物品有对应 `hitAreas`，悬浮和点击反馈贴着物品轮廓，不再用大矩形盖住背景
- 状态/功能分离：书柜、电脑桌、床、客厅、厨房只做短暂状态预览；大门是页面导航，点击后 agent 先走到门口再切到院子
- 合并书房：电脑前代表工作，书柜边代表查资料/搜索
- 可走区域：点击空地时 agent 会移动；点击不可走区域会吸附到最近可走点
- 走路表现：移动时有朝向翻转、上下步幅、落点光标和缓动动画
- 会话驱动状态：真实工作/休息由底部会话框触发，agent 自动移动到对应区域
- 装修 / 商城雏形：点击「设置」打开槽位式装修抽屉；已拥有物品可直接装备，未拥有物品可用本地金币购买后装备
- 临时对象层：替换家具后，画面会在对应槽位绘制一个像素风家具占位物，证明 `placedObjects[].itemId` 已经驱动画面变化；正式版会换成真实 sprite atlas
- 本地快照：购买记录、金币和已摆放家具会写入浏览器 `localStorage`，刷新后保留
- Agent 状态面板、能量、心情、经验
- 输入聊天、移动、派任务
- 工作可视化：接任务、走到工作位、工作中、完成标记、Artifact 抽屉
- 院子交互：农田、信箱等是院子页面交互，不触发 agent 工作任务
- `assets/scene-indoor-v2.png` 是当前室内整屋背景
- `assets/scene-yard.png` 是当前院子背景
- `assets/aria-agent-v2.png` 是当前原创 anime agent 角色素材
- `assets/scene-full-room.png` 是上一版完整大房间背景，保留参考
- `assets/scene-main-room.png` 是上一版主房间场景素材，保留参考
- `assets/scene-study.png`、`assets/scene-kitchen.png`、`assets/scene-bedroom.png`、`assets/scene-studio.png` 是新增独立房间底图
- `assets/aria-agent.png` 是透明 agent 角色素材
- `assets/generated-room-backdrop.png` 保留为早期概念参考素材
- `data/*.js` 是当前 demo 的数据模型；`assets.js`、`item-catalog.js`、`inventory.js`、`scenes.js`、`agents.js` 分别维护数据切片，`game-data.js` 只负责组合成兼容入口 `window.AGENT_SPACE_DATA`
- `ARCHITECTURE.md` 记录从当前 demo 迁移到 PixiJS / 装修 / 商城 / 邻居串门的推荐路线
- `docs/collaboration-overview.zh-CN.md` 记录 GitHub Issues / 分支 / 锁 / PR 的多 agent 协作方案
- `AGENTS.md` 和 `STATUS.md` 是新 session 的入口文件

## 需要你确认后可替换的输入

- Agent 名字：当前为 Aria
- 初始主题：当前为温暖橙
- 角色视觉方向：当前为原创成年 anime agent，女仆风夏日装扮
- 品牌名：当前为 Agent Space
- 任务产物类型：当前内置代码、设计、做菜、思考四种模拟结果

## 交互架构

当前 demo 把一张背景图拆成五层处理，但交互数据已经从 `app.js` 抽到 `data/` 下的分层数据文件：

1. 背景层：`scene-indoor-v2.png` / `scene-yard.png`
2. 物品层：`itemCatalog` 定义可售卖/可替换物品，比如床、沙发、电脑桌、农田；当前带 `price` 和临时 `visual` 字段
3. 摆放层：`placedObjects` 标注用户房间里实际摆了什么，以及对应的热区和站位
4. 行走层：`walkableRects` 标注可走地面，点击空地会移动到可走点
5. 角色层：agent 根据 `point`、`facing`、`status` 绘制和移动

一个摆放物 / 热区需要这些输入：

- `itemId`：指向商城/库存里的物品，比如 `computer_desk_basic`
- `itemCatalog[itemId].price`：本地金币价格，当前只做 demo 购买，不涉及真实支付
- `itemCatalog[itemId].visual`：当前 demo 临时用来画像素占位家具，正式版会替换成 `spriteId` / `atlasKey`
- `slot`：槽位，比如 `study.desk`，V1 装修先从槽位替换开始
- `label`：显示名，比如“大门”
- `type`：`preview` / `navigate` / `yard`
- `hitAreas`：贴合背景图里实际物件的命中区，可由多个 `polygon` / `rect` / `ellipse` 组合而成
- `point`：agent 交互时站到哪里
- `bubble`：点击或悬浮后的反馈文案
- `to`：只有导航热区需要，比如大门 `to: "yard"`

长期正式产品会把这些数据拆到后端/本地 Bridge：

- `items`：平台物品目录
- `inventory`：用户拥有的家具/皮肤/道具
- `sceneSnapshot`：用户当前房间装修快照
- `placedObjects`：每个家具实例的摆放位置、槽位、碰撞和交互

当前 demo 用 `localStorage` 存这些数据，正式版再替换成 Local Bridge / SQLite / Hub 同步。
当前浏览器加载顺序是数据切片先挂到 `window.AGENT_SPACE_DATA_MODULES`，再由 `data/game-data.js` 组合为旧入口，保证 `app.js` 和旧测试不需要理解每个切片文件。

## 明确延后

- Local Bridge 真实 WebSocket 服务
- Claude Agent SDK 真实适配器
- SQLite 本地持久化
- Hub 联机广播
- 真实商城和支付
- 桌宠客户端

## 本地验证

```sh
node --check app.js
for file in data/*.js; do node --check "$file"; done
scripts/check-hitareas.sh
```

`scripts/check-hitareas.sh` 会用 headless Chrome / Chromium 打开 `tests/hitareas-browser.html`，验证室内物体主体命中和旧大角落误命中失效。
