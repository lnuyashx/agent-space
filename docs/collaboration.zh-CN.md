# 多 Agent / 多 Session 协作协议

这个仓库用 GitHub 作为所有 session 的共同状态源。

核心原则：

- GitHub Issue 是任务卡。
- Issue comment 是过程记录。
- PR 是代码交付记录。
- `CONTEXT.md` 是新 session 的恢复上下文。
- `locks/issue-<编号>` 远程分支是任务锁，用来避免多个 session 同时处理同一个 issue。

## 新 Session 如何开始

1. 先读：
   - `CONTEXT.md`
   - `ROADMAP.md`
   - `CONTRIBUTING.md`
   - 当前文档
2. 查看 GitHub open issues。
3. 优先选择 `status:ready` + 高优先级的 issue。
4. 运行认领脚本。
5. 认领成功后再开始改代码。

示例：

```sh
scripts/claim-issue.sh 2 019dc8bc-0e29-72d1-94cf-2ca2ac016b3e interaction-hitareas
```

脚本会做这些事：

- 检查本地工作区必须干净。
- 检查 issue 状态。
- 要求 issue 必须是 `status:ready`。
- 创建远程锁分支 `locks/issue-2`。
- 创建本地工作分支 `codex/issue-2-interaction-hitareas`。
- 把 issue 从 `status:ready` 改成 `status:claimed`。
- 在 issue 里评论认领记录。

如果远程锁已经存在，说明另一个 session 已经认领，不要继续处理这个 issue。

## 为什么需要远程锁分支

只改 issue label 不够稳，因为两个 agent 可能同时看到 `status:ready`。

GitHub 创建 ref 是原子操作：

- 第一个创建 `locks/issue-2` 的 session 成功。
- 第二个创建同名 ref 会失败。

所以 `locks/issue-<编号>` 是这个仓库的任务锁。

## GitHub CLI 怎么找

协作脚本会按这个顺序找 `gh`：

1. `GH_BIN` 环境变量
2. 系统 PATH 里的 `gh`
3. 当前 Codex 机器的 bundled `gh`

新环境如果找不到 GitHub CLI，设置：

```sh
export GH_BIN=/path/to/gh
```

## 任务进度怎么记录

每个 session 在 issue comments 里留记录。

### 认领

认领脚本会自动评论：

```text
CLAIMED
Session: <session-id>
Branch: codex/issue-2-interaction-hitareas
Lock: locks/issue-2
```

### 进度更新

如果任务超过 30 分钟，或者中途有重要变化，评论：

```text
PROGRESS
Session: <session-id>
Done:
- ...
Next:
- ...
Risk:
- ...
```

也可以用脚本：

```sh
cat <<'EOF' | scripts/progress-issue.sh 2 <session-id> progress
Done:
- ...
Next:
- ...
Risk:
- ...
EOF
```

### 阻塞

如果卡住，评论：

```text
BLOCKED
Session: <session-id>
Reason:
- ...
Need:
- ...
```

同时把 label 改成 `status:blocked`。

脚本方式：

```sh
cat <<'EOF' | scripts/progress-issue.sh 2 <session-id> blocked
Reason:
- ...
Need:
- ...
EOF
```

### 交接

如果 session 要结束但任务没完成，评论：

```text
HANDOFF
Session: <session-id>
Branch:
- codex/issue-2-interaction-hitareas
Current state:
- ...
Next step:
- ...
Files in scope:
- ...
```

脚本方式：

```sh
cat <<'EOF' | scripts/progress-issue.sh 2 <session-id> handoff
Current state:
- ...
Next step:
- ...
Files in scope:
- ...
EOF
```

## 怎么查看哪些任务被锁住

```sh
scripts/list-issue-locks.sh
```

输出会列出：

- issue 编号
- lock ref 的 commit sha
- issue 标题
- 当前 labels

## 做完后怎么交付

1. 本地跑验证。
2. 提交 commit。
3. push 工作分支。
4. 开 draft PR。
5. PR body 写 `Closes #<issue-number>` 或 `Refs #<issue-number>`。
6. 把 issue label 从 `status:claimed` 改成 `status:needs-review`。
7. 释放锁：

```sh
scripts/release-issue-lock.sh 2 019dc8bc-0e29-72d1-94cf-2ca2ac016b3e needs-review
```

## 如果 session 崩了怎么办

如果一个 issue 有 `locks/issue-<编号>`，但 24 小时没有进展：

1. 新 session 先在 issue 评论询问接管。
2. 如果确认无人继续，删除旧锁。
3. 重新运行认领脚本。

不要无声删除别人的锁。

## Commit 身份

Codex 提交必须使用当前 session id：

```sh
git config user.name "<session-id>"
git config user.email "<session-id>@codex.local"
```

这样可以从 commit 直接追溯是哪一个 session 做的。

## 分支命名

工作分支：

```text
codex/issue-<编号>-<简短任务名>
```

锁分支：

```text
locks/issue-<编号>
```

不要直接在 `main` 上开发。
