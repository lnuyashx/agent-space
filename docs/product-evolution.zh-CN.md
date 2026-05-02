# 产品演进

语言：中文 | [English](product-evolution.en.md)

这个仓库的目标是最终版 Agent Space，不是只负责 Web 小屋原型。

## 当前原则

- 当前 Web 就是正式 Web 客户端的早期版本。
- 不再新建一套平行 Web demo 等未来替换。
- 保留现有 legacy canvas 行为作为验收基线。
- 新渲染、物件层、装修、农场和社交都在正式 Web 基座上继续迭代。

## 演进路径

1. Web 基座：Vite + TypeScript + PixiJS。
2. 渲染层：把背景、家具、角色、交互反馈逐步迁到 PixiJS。
3. 数据层：拆出 game model，服务装修、商城、农场、社交。
4. 本地层：Local Bridge 接入 agent 和本地持久化。
5. 协议层：ASP 连接 Web、Bridge、Hub。
6. 云端层：Hub 处理账号、社交图、广播、动态流和公开资产。
7. 玩法层：装修、农场、邻居、串门、动态流、商城。
8. 扩展层：桌宠、多 agent、第三方内容生态。

## 与本地 PRD 的关系

根目录的 Agent Space PRD / 技术开工文档是总产品蓝图。本仓库会逐步吸收其中内容，转成可执行的 GitHub issues、架构文档和模块代码。

当前阶段优先 Web，因为 Web 小屋是 Agent Space 的视觉和交互核心。

