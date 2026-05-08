# 新 Session 启动提示词

以后开新的 Codex session，可以直接复制下面的提示词。

## 自动选任务

```text
继续推进这个项目：
https://github.com/lnuyashx/agent-space

请先阅读：
- CONTEXT.md
- ROADMAP.md
- CONTRIBUTING.md
- docs/collaboration.zh-CN.md

然后查看 GitHub open issues，选择最高优先级的 status:ready issue。
开始前必须运行 scripts/claim-issue.sh 认领 issue，创建 locks/issue-<编号> 远程锁。
如果锁已存在，不要处理该 issue，换下一个。

认领成功后新建/使用 codex/issue-<编号>-<任务名> 分支开发。
Codex commit 身份使用当前 session id：
- user.name = <session-id>
- user.email = <session-id>@codex.local

做完后运行验证、提交代码、推送分支、开 draft PR，并在 issue 里记录验证结果。
```

## 指定任务

```text
继续推进这个项目：
https://github.com/lnuyashx/agent-space

请处理 issue #<编号>。
开始前先阅读 CONTEXT.md、ROADMAP.md、CONTRIBUTING.md、docs/collaboration.zh-CN.md。
必须先运行 scripts/claim-issue.sh <编号> <当前-session-id> <任务名> 认领任务。
如果认领失败或 locks/issue-<编号> 已存在，停止并说明原因。

按 issue 验收标准实现、验证、提交，并开 draft PR。
```

## 只做交接

```text
继续推进这个项目：
https://github.com/lnuyashx/agent-space

请先阅读 CONTEXT.md 和当前工作分支状态。
不要改代码。
请总结当前 issue、分支、锁、未完成事项和下一步建议。
```

## 当前优先级建议

1. `#2` 物品本体 hitAreas 校准
2. `#3` 点击物品后角色自然走到交互点
3. `#1` 用 sprite metadata 替代临时家具占位层
4. `#6` 增加自动浏览器 smoke test
