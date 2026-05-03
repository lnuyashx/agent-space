# 当前状态

这个文件给新 session 快速判断“项目现在是什么情况、下一步该做什么”。

最后整理时间：2026-05-03

## 项目状态

- GitHub 仓库：`https://github.com/lnuyashx/agent-space`
- 主分支：`main`
- 协作方式：GitHub Issues + labels + milestones + remote lock branches
- 锁分支格式：`locks/issue-<编号>`
- 工作分支格式：`codex/issue-<编号>-<任务名>`
- 自动校验：GitHub Actions `Smoke`

## 当前能力

- 室内 / 小院两个场景。
- 点击门可导航到院子。
- 点击空地角色会移动。
- 物件交互已从大矩形热区改为 `hitAreas` 本体轮廓。
- 装修抽屉支持槽位替换。
- 本地商城原型支持金币购买未拥有家具。
- `localStorage` 保存金币、库存和摆放快照。
- Vite + TypeScript + PixiJS 项目基座已开始接入。
- 默认 renderer 仍保留完整 legacy canvas 行为。
- `?renderer=pixi` 可进入 PixiJS renderer foundation 预览。

## 当前技术方向

项目目标不是只做 Web 小屋原型，而是最终版 Agent Space。当前技术方向是：

- Vite + TypeScript + PixiJS Web client
- tile/grid 或 navmesh 行走空间
- sprite/object layer
- item catalog + inventory + scene snapshot
- Local Bridge / SQLite / ASP / Hub
- 装修、农场、社交都走数据模型

## 当前推荐任务

如果用户没有指定任务，按这个顺序处理 GitHub Issues：

1. `#11` Web: Convert current client to Vite TypeScript PixiJS foundation
2. `#3` Interaction: Improve walking target selection around furniture
3. `#1` Renderer: Replace temporary furniture overlay with sprite metadata
4. `#6` QA: Add headless browser smoke test script

实际可做任务以 `scripts/status.sh` 输出和 GitHub Issues 为准。

## 新 session 最短操作

```sh
scripts/status.sh
scripts/claim-issue.sh <issue-number> <session-id> <branch-slug>
```

认领成功后再改代码。
认领前本地工作区必须干净。

## 关键文档

- `AGENTS.md`：新 agent/session 入口
- `CONTEXT.md`：当前上下文和恢复信息
- `ROADMAP.md`：长期路线
- `ROADMAP.en.md`：英文路线
- `docs/product-evolution.zh-CN.md`：产品演进说明
- `docs/product-evolution.en.md`：英文产品演进说明
- `CONTRIBUTING.md`：协作和提交规则
- `docs/collaboration-overview.zh-CN.md`：协作机制总览
- `docs/collaboration.zh-CN.md`：任务锁、进度、交接细则
- `docs/new-session-prompt.zh-CN.md`：可复制的新 session 提示词
