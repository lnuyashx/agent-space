# Agent Space Roadmap

语言：中文 | [English](ROADMAP.en.md)

这个路线图把长期产品方向和日常 GitHub Issues 分开。当前目标是把仓库推进成 Agent Space 最终产品主项目，而不是只停在 Web 小屋原型。

## Phase 0：当前可玩原型

- 静态 canvas 房间和小院场景
- 数据驱动的 `itemCatalog`、`inventory`、`scenes`、`placedObjects`
- 物体本体 `hitAreas` 悬浮/点击
- 槽位式装修抽屉
- 本地金币商城原型
- 浏览器 `localStorage` 保存房间快照

## Phase 1：正式 Web 基座

- 引入 Vite + TypeScript + PixiJS
- 当前 Web 从一次性 demo 改为最终 Web 客户端早期版本
- 保留 legacy canvas 行为作为验收基线
- 提供 PixiJS renderer foundation，用于逐步替换 legacy renderer

## Phase 2：物品层强化

- 用真实 object sprites 替换临时像素 overlay
- 增加 `spriteId`、`atlasKey`、`depth`、`anchor`、`footprint`
- 保持 `hitAreas` 和 sprite/object 本体一致
- 区分背景固定装饰和可替换家具

## Phase 3：移动和交互

- 从临时 walkable rects 迁移到 grid/navmesh
- 增加 object-aware collision
- 为家具类型增加 interaction anchors
- 优化点击物体后的自然站位和行走时机

## Phase 4：Game Model 抽包

- 从 `data/game-data.js` 拆出 item catalog、inventory、scene template、scene snapshot
- 为房间、家具、农场、库存、商城建立共享数据模型
- 为 Local Bridge / Hub 同步准备 schema version 和迁移策略

## Phase 5：Local Bridge 和 ASP

- 定义 Agent Space Protocol v0.1 类型和消息流
- 增加 Local Bridge 最小本地服务
- Web 客户端连接 Local Bridge
- 本地保存迁移到 SQLite / 本地数据层

## Phase 6：装修和商城

- 房间主题、地板/墙纸、家具套装
- 物品稀有度、价格、标签、解锁条件、预览状态
- 真实支付暂缓到产品/法务范围明确后

## Phase 7：农场和社交

- 农田、作物状态、计时、收获
- 好友/邻居房间快照
- 邮箱、动态流、访问规则
- 只读邻居房间渲染和串门玩法

## Phase 8：Cloud Hub

- 账号、公钥认证、社交图
- 状态广播、邻居在线状态、动态流
- 资产和公开 scene snapshot 同步
- 不上传 agent 私有记忆、对话内容或本地 artifact

## Phase 9：桌宠和生态

- 桌宠客户端
- 多 agent 同小屋
- 第三方家具/皮肤内容生态
