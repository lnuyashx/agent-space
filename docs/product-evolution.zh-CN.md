# 产品演进

语言：中文 | [English](product-evolution.en.md)

这个仓库的目标是最终版 Agent Space，不是只负责 Web 小屋原型。

## 当前原则

- 当前 Web 就是正式 Web 客户端的早期版本。
- 不再新建一套平行 Web demo 等未来替换。
- 保留现有 legacy canvas 行为作为验收基线。
- 新渲染、物件层、装修、pet 状态、农场和社交都在正式 Web 基座上继续迭代。
- 第一阶段不做线上游戏后端；先做本地 Codex pet / agent 的 2.5D 可视化生活空间。

## 演进路径

1. Web 基座：Vite + TypeScript + PixiJS。
2. 本地 pet 层：`setup:local` 导入 Codex pet 视觉资产，`agent-state.json` 提供第一版状态同步入口。
3. 渲染层：把背景、家具、pet、交互反馈逐步迁到 PixiJS。
4. 房间自定义层：背景、主题套装、单件家具本地全解锁切换。
5. 数据层：拆出 scene template、scene snapshot、placed items、agent state。
6. 本地 agent 层：接入其他本地 agent 状态源和多 agent 同房间行为。
7. 生活扩展层：小院、农田和轻量生活循环。
8. 云端层：Hub 处理账号、社交图、广播、动态流和公开资产。
9. 生态层：桌宠客户端、第三方家具/皮肤内容生态。

## 与本地 PRD 的关系

根目录的 Agent Space PRD / 技术开工文档是总产品蓝图。本仓库会逐步吸收其中内容，转成可执行的 GitHub issues、架构文档和模块代码。

当前阶段优先 Web，因为 Web 小屋是 Agent Space 的视觉和交互核心。
