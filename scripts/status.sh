#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/github.sh"
GH_BIN="$(resolve_gh || true)"

echo "== Repository =="
git remote get-url origin 2>/dev/null || true
git status -sb
echo

echo "== Current Commit =="
git log --oneline --decorate -1
echo

echo "== Open Issues =="
if [[ -n "$GH_BIN" ]] && command -v "$GH_BIN" >/dev/null 2>&1; then
  "$GH_BIN" issue list --state open --limit 20 || true
else
  echo "GitHub CLI not found. Install gh or set GH_BIN=/path/to/gh."
fi
echo

echo "== Issue Locks =="
if [[ -x scripts/list-issue-locks.sh ]]; then
  scripts/list-issue-locks.sh || true
else
  echo "No lock listing script found."
fi
echo

echo "== Recommended Next =="
echo "1. Pick the highest-priority status:ready issue."
echo "2. Claim it with: scripts/claim-issue.sh <issue-number> <session-id> <branch-slug>"
echo "3. Do not work on an issue if locks/issue-<number> already exists."
