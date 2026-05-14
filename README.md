# Agent Space（进行中）

语言：中文 | [English](README.en.md)

Agent Space 的目标不是停在 Web 小屋原型，而是做成本地 AI agent / Codex pet 的 2.5D 可视化生活空间。第一阶段优先本地 pet 状态、房间生活、背景和家具自定义；农田、多 agent、联机和社交后续分阶段推进。

当前仓库会逐步升级为 Agent Space 主项目仓库。现在的 Web 体验是最终 Web 客户端的早期版本，不再作为一次性 demo 处理。

新 session / agent 先看 `AGENTS.md` 和 `STATUS.md`。当前任务状态以 GitHub Issues 和 `scripts/status.sh` 为准。

## 当前运行方式

当前已经切到 Vite + TypeScript + PixiJS 项目基座。需要安装依赖后运行：

```sh
npm install
npm run setup:local
npm run dev
```

`npm run dev` 会自动先执行 `setup:local`。本地 setup 只扫描 `$CODEX_HOME/pets` 或 `~/.codex/pets` 下的 Codex pet 视觉资产，生成被 git 忽略的 `public/local-agent-space/` 运行文件；浏览器读不到这些本机目录时会回退到仓库内置 agent 素材。

默认打开的是保留完整玩法的 legacy canvas renderer。PixiJS renderer foundation 已接入，可用查询参数预览：

```text
http://127.0.0.1:5173/?renderer=pixi
```

这个 PixiJS 入口当前是正式渲染层的第一阶段基座，后续会把背景、家具对象层、角色、命中区、深度排序和装修逻辑逐步迁入 PixiJS。

## 当前包含

- 单页大房间：室内是一个完整 agent 房间作为主舞台，不再用多个房间 tab
- 独立小院：点击室内大门进入院子，院子作为单独全屏场景显示
- 底部会话区：agent 切换按钮、设置按钮、输入框集中在底部
- 半透明 HUD：agent 状态、能量、心情和本地自定义状态覆盖在房间上方
- Hotspot 交互层：背景里的真实美术物品有对应 `hitAreas`，悬浮和点击反馈贴着物品轮廓，不再用大矩形盖住背景
- 状态/功能分离：书柜、电脑桌、床、客厅、厨房只做短暂状态预览；大门是页面导航，点击后 agent 先走到门口再切到院子
- 合并书房：电脑前代表工作，书柜边代表查资料/搜索
- 可走区域：点击空地时 agent 会移动；点击不可走区域会吸附到最近可走点
- 走路表现：移动时有朝向翻转、上下步幅、落点光标和缓动动画
- 会话驱动状态：真实工作/休息由底部会话框触发，agent 自动移动到对应区域
- 装修 / 本地全解锁雏形：点击「设置」打开槽位式装修抽屉；第一阶段房间背景、本地家具和主题可直接切换，不做金币购买
- 临时对象层：默认大房间在装修模式和自定义家具时会切到空房间 prototype 背景，其他背景保持所选底图，再按 `itemCatalog[itemId].sprite` 绘制独立家具；正式版会换成真实 sprite atlas 和生产级空房间底图
- 本地快照：房间背景、已摆放家具、主题、家具位置和开发期兼容字段会按 `schemaVersion` 写入浏览器 `localStorage`，刷新后保留；设置抽屉里可查看存档状态并重置本地存档
- 本地 pet runtime：`scripts/setup-local.mjs` 会导入当前机器的 Codex pet 视觉资产，并创建 `agent-state.json` 作为第一阶段状态同步入口
- 本地状态调试：`npm run agent:state -- coding` 会写入状态文件；设置抽屉里的 Agent 状态按钮可快速预览房间行为映射
- Agent 状态面板、能量、心情、经验
- 输入聊天、移动、派任务
- 工作可视化：接任务、走到工作位、工作中、完成标记、Artifact 抽屉
- 院子交互：农田、信箱等是院子页面交互，不触发 agent 工作任务
- 农田状态模型：`data/farm-model.js` 定义空地、播种、生长、可收获、枯萎生命周期，以及主人/邻居动作边界
- 房间主题 / 家具包模型：`data/theme-bundles.js` 定义主题字段、bundle 授权、装备写入和渲染依赖
- PixiJS renderer foundation：`src/pixi/pixi-foundation.ts` 已能加载场景、agent 和物件 marker，当前通过 `?renderer=pixi` 预览
- `assets/scene-indoor-v2.png` 是当前室内整屋背景
- `assets/scene-indoor-empty-prototype.svg` 是装修模式专用的空房间 prototype 背景，用来避免旧家具烘焙在底图里继续露出
- `assets/scene-yard.png` 是当前院子背景
- `assets/aria-agent-v2.png` 是当前原创 anime agent 角色素材
- `assets/furniture-prototype-atlas.svg` 是第一版独立物件 prototype atlas，用来验证 sprite 管线，不代表最终美术品质
- `assets/scene-full-room.png` 是上一版完整大房间背景，保留参考
- `assets/scene-main-room.png` 是上一版主房间场景素材，保留参考
- `assets/scene-study.png`、`assets/scene-kitchen.png`、`assets/scene-bedroom.png`、`assets/scene-studio.png` 是新增独立房间底图
- `assets/aria-agent.png` 是透明 agent 角色素材
- `assets/generated-room-backdrop.png` 保留为早期概念参考素材
- `data/*.js` 是当前 demo 的数据模型；`assets.js`、`item-catalog.js`、`inventory.js`、`scenes.js`、`agents.js`、`farm-model.js`、`theme-bundles.js` 分别维护数据切片，`game-data.js` 只负责组合成兼容入口 `window.AGENT_SPACE_DATA`
- `ARCHITECTURE.md` 记录从当前 demo 迁移到 PixiJS / 装修 / 商城 / 邻居串门的推荐路线
- `docs/collaboration-overview.zh-CN.md` 记录 GitHub Issues / 分支 / 锁 / PR 的多 agent 协作方案
- `AGENTS.md` 和 `STATUS.md` 是新 session 的入口文件

## 项目定位

这个仓库的方向是最终版 Agent Space，而不是只负责 Web 小屋原型。

当前阶段先把 Web 客户端从静态 canvas 原型升级为本地 Codex pet 的 2.5D 可视化空间。之后再逐步推进：

- Codex pet / agentState 本地同步
- 房间背景、主题、套装和单件家具本地自定义
- PixiJS 2.5D object layer 和 Tiled 风格对象数据管线
- 其他本地 agent 接入
- 小院 / 农田作为生活空间扩展
- Cloud Hub、联机和社交

详细阶段见 [ROADMAP.md](ROADMAP.md) 和 [docs/product-evolution.zh-CN.md](docs/product-evolution.zh-CN.md)。

## 交互架构

当前 demo 把一张背景图拆成五层处理，但交互数据已经从 `app.js` 抽到 `data/` 下的分层数据文件：

1. 背景层：常规室内使用 `scene-indoor-v2.png`，装修模式使用 `scene-indoor-empty-prototype.svg`，院子使用 `scene-yard.png`
2. 物品层：`itemCatalog` 定义可替换/可交互物品，比如床、沙发、电脑桌、农田；当前仍保留 `price` 兼容字段，但第一阶段不做购买扣费，`assets.atlases` 提供 prototype atlas 帧表
3. 摆放层：`placedObjects` 标注用户房间里实际摆了什么，以及对应的热区、站位和 `renderRect` 家具绘制框
4. 行走层：`walkableRects` 标注可走地面，点击空地会移动到可走点
5. 角色层：agent 根据 `point`、`facing`、`status` 绘制和移动

一个摆放物 / 热区需要这些输入：

- `itemId`：指向商城/库存里的物品，比如 `computer_desk_basic`
- `itemCatalog[itemId].price`：兼容旧本地商城原型的价格字段；第一阶段 UI 按本地全解锁处理，不做购买扣费
- `itemCatalog[itemId].sprite`：包含 `atlasKey`、`spriteId`、`anchor` 和当前 demo 用的 `fallback`；当前会优先从 `assets/furniture-prototype-atlas.svg` 取帧，缺图时回退到 canvas fallback
- `decoratingAssetId`：场景在装修模式下使用的替代背景；当前室内指向空房间 prototype，方便独立家具层可视化
- `slot`：槽位，比如 `study.desk`，V1 装修先从槽位替换开始
- `renderRect`：家具 sprite 在 2.5D 房间里的绘制位置和尺寸；和 `hitAreas` 分离，避免点击热区影响美术摆放
- `label`：显示名，比如“大门”
- `type`：`preview` / `navigate` / `yard`
- `hitAreas`：贴合实际美术物体的命中区
- `point`：agent 交互时站位
- `bubble`：点击或悬浮后的反馈文案
- `to`：导航目标场景

长期正式产品会把这些数据拆到本地 Bridge / Hub / CDN：

- `items`：平台物品目录
- `inventory`：用户拥有的家具、皮肤、道具
- `sceneSnapshot`：用户当前房间装修快照
- `placedObjects`：每个家具实例的摆放位置、槽位、碰撞和交互
- `farm`：农田生命周期、作物目录、主人动作、邻居动作和地块快照形状；详见 `docs/farm-plot-state-model.zh-CN.md`
- `themeBundles`：房间主题、家具包、所有权状态和装备流程；详见 `docs/room-theme-bundle-model.zh-CN.md`

当前 demo 用 `localStorage` 存这些数据。第一阶段本地 pet 状态通过 `public/local-agent-space/agent-state.json` 进入前端；仓库里已有 Local Bridge v0.1（WebSocket + SQLite）基座，但它现在定位为可选本地 adapter，不是第一阶段后端。
当前浏览器加载顺序是数据切片先挂到 `window.AGENT_SPACE_DATA_MODULES`，再由 `data/game-data.js` 组合为旧入口，保证 `app.js` 和旧测试不需要理解每个切片文件。
当前存档 payload 写入 `schemaVersion: 2` 和 `savedAt`，仍兼容读取旧的 `agent-space-demo-save-v1`。

## Local Bridge（实验）

```sh
npm run bridge:start
```

- WebSocket: `ws://127.0.0.1:8787/bridge`
- Health: `http://127.0.0.1:8787/healthz`
- 协议文档：`docs/asp-v0.1.zh-CN.md`（英文：`docs/asp-v0.1.en.md`）
- SQLite 默认路径：`bridge/.runtime/agent-space-bridge.sqlite`
- 当前前端默认使用 `localStorage`，不要求启动 bridge。需要调试 bridge 时可通过 `?bridge=ws://127.0.0.1:8787/bridge` 显式启用。

## 暂缓范围

- 前端与 Local Bridge 的正式联调迁移
- Claude Code / OpenClaw 真实适配器
- Hub 联机广播
- 金币购买、真实商城和支付
- 完整桌宠客户端；当前只复用 Codex pet 视觉资产到 Web 房间

## 本地验证

```sh
npm install
npm run check
```

`npm run check` 会执行 TypeScript / Vite build、legacy canvas 语法、所有 `data/*.js` 语法和 `scripts/check-hitareas.sh`。
`scripts/check-smoke.sh` 会用 headless Chrome / Chromium 打开真实 `index.html`，模拟启动、物件点击、门导航、装修抽屉、商城购买和刷新后的 `localStorage` 恢复。脚本默认不保存截图。
`scripts/check-save-state.sh` 会打开 `tests/save-state-browser.html`，验证存档版本、写入、旧 key 清理和重置按钮。
