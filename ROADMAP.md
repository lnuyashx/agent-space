# Agent Space Roadmap

语言：中文 | [English](ROADMAP.en.md)

这个路线图把长期产品方向和日常 GitHub Issues 分开。当前目标是把仓库推进成 Agent Space 最终产品主项目，而不是只停在 Web 小屋原型。第一阶段聚焦本地 Codex pet / agent 的 2.5D 可视化生活空间。

## Phase 0：当前可玩原型

- 静态 canvas 房间和小院场景
- 数据驱动的 `itemCatalog`、`inventory`、`scenes`、`placedObjects`
- 物体本体 `hitAreas` 悬浮/点击
- 槽位式装修抽屉
- 本地全解锁装修原型（保留旧金币字段兼容）
- 浏览器 `localStorage` 保存房间快照

## Phase 1：本地 Codex pet 可视化房间

- 引入 Vite + TypeScript + PixiJS
- 当前 Web 从一次性 demo 改为最终 Web 客户端早期版本
- 保留 legacy canvas 行为作为验收基线
- 提供 PixiJS renderer foundation，用于逐步替换 legacy renderer
- `setup:local` 自动导入当前机器的 Codex pet 视觉资产
- `agent-state.json` 提供第一阶段本地状态同步入口
- 房间背景、主题套装和单件家具本地可切换，不做金币购买

## Phase 2：2.5D 房间和物品层强化

- 用真实 object sprites 替换临时像素 overlay
- 增加 `spriteId`、`atlasKey`、`depth`、`anchor`、`footprint`
- 保持 `hitAreas` 和 sprite/object 本体一致
- 区分背景固定装饰和可替换家具
- 引入 Tiled/LDtk 风格对象层导入，优先适配 2.5D 房间和家具摆放

## Phase 3：pet 行为、移动和交互

- 从临时 walkable rects 迁移到 grid/navmesh
- 增加 object-aware collision
- 为家具类型增加 interaction anchors
- 优化点击物体后的自然站位和行走时机
- Codex 状态映射到桌子、床、门、空闲点等行为点

## Phase 4：其他本地 agent 接入

- 定义多本地 agent 状态源
- 多 agent 同房间位置、状态、行为和轻量互动
- 不引入云账号或多人同步

## Phase 5：小院和农田生活扩展

- 农田、作物状态、计时、收获
- pet 可以查看和照料小院
- 农田作为生活节奏的一部分，不优先做复杂经济

## Phase 6：本地数据层和 adapter

- 从 `data/game-data.js` 拆出 item catalog、scene template、scene snapshot、agent state
- Local Bridge 定位为本地 adapter，而不是第一阶段后端
- 为后续 Hub 同步准备 schema version 和迁移策略

## Phase 7：Cloud Hub 和联机

- 好友/邻居房间快照
- 邮箱、动态流、访问规则
- 只读邻居房间渲染和串门玩法
- 账号、公钥认证、社交图
- 状态广播、邻居在线状态、动态流
- 资产和公开 scene snapshot 同步
- 不上传 agent 私有记忆、对话内容或本地 artifact

## Phase 8：生态

- 桌宠客户端
- 第三方家具/皮肤内容生态
