# Agent Entry

新 Codex session / agent 进入这个仓库时，先看这个文件。

## 先做什么

1. 运行状态检查：

```sh
scripts/status.sh
```

2. 阅读最小上下文：

```text
STATUS.md
CONTEXT.md
docs/collaboration-overview.zh-CN.md
```

3. 从 GitHub Issues 选择一个 `status:ready` 的任务。

4. 认领任务，必须先创建远程锁：

```sh
scripts/claim-issue.sh <issue-number> <session-id> <branch-slug>
```

认领失败就不要处理该 issue，换下一个。
认领脚本要求本地工作区干净。如果有未提交改动，先提交、stash 或换一个干净 checkout。

## 当前默认优先级

如果用户没有指定 issue，优先看：

1. `#2` 物品本体 hitAreas 校准
2. `#3` 点击物品后角色自然走到交互点
3. `#1` 用 sprite metadata 替代临时家具占位层
4. `#6` 增加自动浏览器 smoke test

实际状态以 GitHub Issues 和 `scripts/status.sh` 输出为准。

## 提交规则

Codex commit 必须使用当前 session id：

```sh
git config user.name "<session-id>"
git config user.email "<session-id>@codex.local"
```

不要直接在 `main` 上开发。工作分支命名：

```text
codex/issue-<编号>-<任务名>
```

## 交付规则

做完后：

1. 跑验证。
2. 提交 commit。
3. push 工作分支。
4. 开 draft PR。
5. 在 issue 里记录进度/验证。
6. 释放锁：

```sh
scripts/release-issue-lock.sh <issue-number> <session-id> needs-review
```

## 不要做什么

- 不要无锁处理 issue。
- 不要直接改别人正在处理的 issue。
- 不要无声删除 `locks/issue-<编号>`。
- 不要把 `demo-*.png` 验证截图提交进仓库。

## GitHub CLI

脚本会按顺序寻找 GitHub CLI：

1. 环境变量 `GH_BIN`
2. 系统 PATH 里的 `gh`
3. 当前 Codex 机器的 bundled `gh`

如果新机器找不到 `gh`，安装 GitHub CLI 或设置：

```sh
export GH_BIN=/path/to/gh
```
