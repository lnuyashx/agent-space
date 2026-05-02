#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: scripts/claim-issue.sh <issue-number> <session-id> [branch-slug]" >&2
  exit 2
fi

ISSUE_NUMBER="$1"
SESSION_ID="$2"
BRANCH_SLUG="${3:-issue-${ISSUE_NUMBER}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/github.sh"
GH_BIN="$(resolve_gh)"
BRANCH_SLUG="$(sanitize_branch_slug "$BRANCH_SLUG")"

require_clean_worktree

REPO="$("$GH_BIN" repo view --json nameWithOwner --jq .nameWithOwner)"
ISSUE_STATE="$("$GH_BIN" issue view "$ISSUE_NUMBER" --json state --jq .state)"
LABELS="$("$GH_BIN" issue view "$ISSUE_NUMBER" --json labels --jq '.labels[].name')"

if [[ "$ISSUE_STATE" != "OPEN" ]]; then
  echo "Issue #$ISSUE_NUMBER is not open." >&2
  exit 1
fi

if ! echo "$LABELS" | grep -Fxq "status:ready"; then
  echo "Issue #$ISSUE_NUMBER is not status:ready. Do not claim it unless it is returned to ready." >&2
  exit 1
fi

if echo "$LABELS" | grep -Fxq "status:claimed"; then
  echo "Issue #$ISSUE_NUMBER is already marked status:claimed." >&2
  exit 1
fi

if echo "$LABELS" | grep -Fxq "status:blocked"; then
  echo "Issue #$ISSUE_NUMBER is blocked. Do not claim until blocker is resolved." >&2
  exit 1
fi

git fetch origin main --prune
MAIN_SHA="$("$GH_BIN" api "repos/$REPO/git/ref/heads/main" --jq .object.sha)"
LOCK_REF="refs/heads/locks/issue-${ISSUE_NUMBER}"
LOCK_BRANCH="locks/issue-${ISSUE_NUMBER}"
WORK_BRANCH="codex/issue-${ISSUE_NUMBER}-${BRANCH_SLUG}"

if "$GH_BIN" api "repos/$REPO/git/ref/heads/locks/issue-${ISSUE_NUMBER}" >/dev/null 2>&1; then
  echo "Remote lock $LOCK_BRANCH already exists. Another session probably claimed issue #$ISSUE_NUMBER." >&2
  exit 1
fi

echo "Creating remote lock $LOCK_BRANCH ..."
if ! "$GH_BIN" api "repos/$REPO/git/refs" -f ref="$LOCK_REF" -f sha="$MAIN_SHA" >/dev/null; then
  echo "Failed to create $LOCK_BRANCH. Another session probably claimed issue #$ISSUE_NUMBER." >&2
  exit 1
fi

cleanup_lock() {
  "$GH_BIN" api -X DELETE "repos/$REPO/git/refs/heads/locks/issue-${ISSUE_NUMBER}" >/dev/null 2>&1 || true
}
trap cleanup_lock ERR

git switch -c "$WORK_BRANCH" origin/main
git config user.name "$SESSION_ID"
git config user.email "${SESSION_ID}@codex.local"

"$GH_BIN" issue edit "$ISSUE_NUMBER" --remove-label "status:ready" --add-label "status:claimed" >/dev/null
"$GH_BIN" issue comment "$ISSUE_NUMBER" --body "CLAIMED
Session: $SESSION_ID
Branch: $WORK_BRANCH
Lock: $LOCK_BRANCH" >/dev/null

trap - ERR
echo "Claimed issue #$ISSUE_NUMBER on $WORK_BRANCH"
