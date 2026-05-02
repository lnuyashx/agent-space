#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/github.sh"
GH_BIN="$(resolve_gh)"
REPO="$("$GH_BIN" repo view --json nameWithOwner --jq .nameWithOwner)"

"$GH_BIN" api "repos/$REPO/git/matching-refs/heads/locks/issue-" --jq '.[] | [.ref, .object.sha] | @tsv' |
while IFS=$'\t' read -r ref sha; do
  issue="${ref##refs/heads/locks/issue-}"
  title="$("$GH_BIN" issue view "$issue" --json title --jq .title 2>/dev/null || echo "unknown issue")"
  labels="$("$GH_BIN" issue view "$issue" --json labels --jq '[.labels[].name] | join(", ")' 2>/dev/null || echo "")"
  printf "#%s\t%s\t%s\t%s\n" "$issue" "$sha" "$title" "$labels"
done
