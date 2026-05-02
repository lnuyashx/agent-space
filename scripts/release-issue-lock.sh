#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: scripts/release-issue-lock.sh <issue-number> <session-id> [ready|needs-review|blocked]" >&2
  exit 2
fi

ISSUE_NUMBER="$1"
SESSION_ID="$2"
NEXT_STATUS="${3:-needs-review}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/github.sh"
GH_BIN="$(resolve_gh)"

case "$NEXT_STATUS" in
  ready|needs-review|blocked) ;;
  *)
    echo "Invalid next status: $NEXT_STATUS" >&2
    exit 2
    ;;
esac

REPO="$("$GH_BIN" repo view --json nameWithOwner --jq .nameWithOwner)"
LOCK_BRANCH="locks/issue-${ISSUE_NUMBER}"
STATUS_LABEL="status:${NEXT_STATUS}"

"$GH_BIN" issue edit "$ISSUE_NUMBER" \
  --remove-label "status:claimed" \
  --remove-label "status:blocked" \
  --remove-label "status:needs-review" \
  --remove-label "status:ready" \
  --add-label "$STATUS_LABEL" >/dev/null || true

if "$GH_BIN" api -X DELETE "repos/$REPO/git/refs/heads/locks/issue-${ISSUE_NUMBER}" >/dev/null 2>&1; then
  LOCK_NOTE="Released lock: $LOCK_BRANCH"
else
  LOCK_NOTE="No lock deleted: $LOCK_BRANCH may not exist"
fi

"$GH_BIN" issue comment "$ISSUE_NUMBER" --body "LOCK RELEASED
Session: $SESSION_ID
Next status: $STATUS_LABEL
$LOCK_NOTE" >/dev/null

echo "$LOCK_NOTE"
