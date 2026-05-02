#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: scripts/progress-issue.sh <issue-number> <session-id> <progress|blocked|handoff> [message-file]" >&2
  exit 2
fi

ISSUE_NUMBER="$1"
SESSION_ID="$2"
KIND="$3"
MESSAGE_FILE="${4:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/github.sh"
GH_BIN="$(resolve_gh)"

case "$KIND" in
  progress|blocked|handoff) ;;
  *)
    echo "Invalid kind: $KIND. Use progress, blocked, or handoff." >&2
    exit 2
    ;;
esac

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"

if [[ -n "$MESSAGE_FILE" ]]; then
  BODY_DETAIL="$(cat "$MESSAGE_FILE")"
else
  BODY_DETAIL="$(cat)"
fi

case "$KIND" in
  progress)
    TITLE="PROGRESS"
    ;;
  blocked)
    TITLE="BLOCKED"
    "$GH_BIN" issue edit "$ISSUE_NUMBER" \
      --remove-label "status:ready" \
      --remove-label "status:claimed" \
      --remove-label "status:needs-review" \
      --add-label "status:blocked" >/dev/null || true
    ;;
  handoff)
    TITLE="HANDOFF"
    ;;
esac

"$GH_BIN" issue comment "$ISSUE_NUMBER" --body "$TITLE
Session: $SESSION_ID
Branch: ${CURRENT_BRANCH:-unknown}

$BODY_DETAIL" >/dev/null

echo "Posted $TITLE comment to issue #$ISSUE_NUMBER"
