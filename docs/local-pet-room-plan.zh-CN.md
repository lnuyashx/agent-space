# 本地 Codex Pet 房间第一阶段方案

语言：中文 | [English](local-pet-room-plan.en.md)

## 目标

第一阶段目标是本地 Codex pet / agent 的 2.5D 可视化生活空间，不是线上家园游戏。

必须完成：

- 本地启动时自动导入 Codex pet 视觉资产。
- 前端能显示 pet，并根据抽象 agent 状态切换动画和行为点。
- 房间背景、主题套装、单件家具可本地切换。
- 本地刷新后保留房间自定义。
- 不做金币购买、真实商城、支付、账号、联机。

## 首次同步

本地运行流程：

```sh
npm install
npm run setup:local
npm run dev
```

`npm run dev` 会自动先执行 `setup:local`。

`setup:local` 做这些事：

1. 扫描 `$CODEX_HOME/pets`，没有设置时扫描 `~/.codex/pets`。
2. 找到第一个包含 `pet.json` 和 spritesheet 的 Codex pet。
3. 复制 pet 资源到 `public/local-agent-space/pets/<pet-id>/`。
4. 生成 `public/local-agent-space/pet-manifest.json`。
5. 如果还没有状态文件，生成 `public/local-agent-space/agent-state.json`。

`public/local-agent-space/` 被 `.gitignore` 忽略，只用于本机运行，不提交到 GitHub。

## 同步边界

第一阶段自动同步的是 pet 视觉资产和抽象状态通道。

会读取：

- pet id
- pet displayName
- pet description
- pet spritesheet
- 抽象 agent 状态：`idle` / `thinking` / `coding` / `tool_calling` / `waiting_user` / `error` / `done`
- 可选工具名：例如 `terminal`

不会读取：

- 对话内容
- 私有记忆
- 本地文件内容
- 终端输出详情
- Codex 内部日志

## 状态文件

第一版状态入口是：

```text
public/local-agent-space/agent-state.json
```

示例：

```json
{
  "schemaVersion": 1,
  "agentId": "codex-local",
  "petId": "kikyo",
  "status": "coding",
  "taskLabel": "正在处理当前任务",
  "activeTool": "terminal",
  "updatedAt": "2026-05-12T00:00:00.000Z"
}
```

前端每隔短时间轮询该文件，并把状态映射到房间行为。

## 状态映射

| agent 状态 | pet 动画 | 房间行为点 |
|---|---|---|
| `idle` | `idle` | 客厅/空闲点 |
| `thinking` | `review` | 书柜 |
| `coding` | `running` | 工作桌 |
| `tool_calling` | `running` | 工作桌 |
| `waiting_user` | `waiting` | 门口 |
| `error` | `failed` | 工作桌 |
| `done` | `waving` | 客厅/放松点 |

如果没有本地 Codex pet，前端使用仓库内置 agent 素材，不阻断预览。

## 成熟方案使用

第一阶段继续使用当前项目基座：

- PixiJS：正式 2.5D 渲染层。
- Codex pet spritesheet：本地 pet 视觉体。
- Tiled/LDtk 对象层思想：后续用于房间、家具、行为点和碰撞数据。

不在第一阶段引入 Reldens / Colyseus，因为联机不是当前目标。
