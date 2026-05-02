# 协作方案总览

这个项目的协作方式是：

```text
GitHub Repo
  -> Issues 管任务
  -> Labels 管状态/模块/优先级
  -> Milestones 管阶段
  -> Remote lock branches 防止重复认领
  -> Feature branches 写代码
  -> Draft PR 交付和评审
  -> GitHub Actions 做基础校验
  -> CONTEXT.md / ADR 做跨 session 记忆
```

## 1. 任务在哪里

任务在 GitHub Issues：

- 一个 issue = 一个可交付任务
- label 标记模块、类型、状态、优先级
- milestone 标记阶段

常用状态：

- `status:ready`：可以认领
- `status:claimed`：已经有人处理
- `status:blocked`：被阻塞
- `status:needs-review`：等待评审

## 2. 怎么避免两个 session 同时做一个任务

靠远程锁分支：

```text
locks/issue-<编号>
```

认领 issue 时，脚本会尝试创建这个远程分支。

- 创建成功：说明你抢到任务锁，可以开始做。
- 创建失败：说明别人已经在做，不能继续。

认领命令：

```sh
scripts/claim-issue.sh <issue-number> <session-id> <branch-slug>
```

认领前本地工作区必须干净，且 issue 必须是 `status:ready`。

查看当前锁：

```sh
scripts/list-issue-locks.sh
```

## 3. 代码在哪里写

每个任务一个工作分支：

```text
codex/issue-<编号>-<任务名>
```

不要直接在 `main` 上写代码。

## 4. 进度怎么记录

进度记录在 GitHub issue comments。

脚本：

```sh
scripts/progress-issue.sh <issue-number> <session-id> progress
scripts/progress-issue.sh <issue-number> <session-id> blocked
scripts/progress-issue.sh <issue-number> <session-id> handoff
```

这样后续 session 不需要读旧聊天记录，只看 issue 就能知道任务状态。

## 5. 怎么交付

做完后：

1. 跑本地验证。
2. commit。
3. push 工作分支。
4. 开 draft PR。
5. issue 改成 `status:needs-review`。
6. 释放锁。

释放锁：

```sh
scripts/release-issue-lock.sh <issue-number> <session-id> needs-review
```

## 6. 新 session 应该先读什么

按顺序读：

1. `AGENTS.md`
2. `STATUS.md`
3. 运行 `scripts/status.sh`
4. `CONTEXT.md`
5. `ROADMAP.md`
6. `CONTRIBUTING.md`
7. `docs/collaboration-overview.zh-CN.md`
8. `docs/collaboration.zh-CN.md`
9. GitHub open issues

可以直接用：

```text
docs/new-session-prompt.zh-CN.md
```

里的提示词启动新 session。

## 7. Commit 怎么追溯到 session

Codex commit 必须使用当前 session id：

```sh
git config user.name "<session-id>"
git config user.email "<session-id>@codex.local"
```

这样 Git log 可以追溯是谁做的。

## 8. 什么信息写在哪里

| 信息 | 放哪里 |
| --- | --- |
| 当前项目状态 | `CONTEXT.md` |
| 长期路线 | `ROADMAP.md` |
| 任务列表 | GitHub Issues |
| 任务进度 | Issue comments |
| 架构决策 | `docs/adr/` |
| 协作规则 | `CONTRIBUTING.md` |
| 新 session 提示词 | `docs/new-session-prompt.zh-CN.md` |
| 自动校验 | `.github/workflows/smoke.yml` |

## 9. 当前不做什么

暂时不启用 GitHub Projects 看板。

原因：

- 目前 Issues + labels + milestones 足够。
- Projects 需要额外维护字段和视图。
- 等任务超过 20 个或多人长期并行时再加。

未来如果要加 Projects，看板字段建议：

- Status
- Area
- Priority
- Milestone
- Owner Session
