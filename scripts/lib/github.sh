#!/usr/bin/env bash

resolve_gh() {
  if [[ -n "${GH_BIN:-}" ]]; then
    if command -v "$GH_BIN" >/dev/null 2>&1; then
      printf '%s\n' "$GH_BIN"
      return 0
    fi
    echo "GH_BIN is set but not executable: $GH_BIN" >&2
    return 1
  fi

  if command -v gh >/dev/null 2>&1; then
    command -v gh
    return 0
  fi

  local bundled="/Users/inx/Codex/tools/gh-cli/gh_2.90.0_macOS_arm64/bin/gh"
  if [[ -x "$bundled" ]]; then
    printf '%s\n' "$bundled"
    return 0
  fi

  echo "GitHub CLI not found. Install gh or set GH_BIN=/path/to/gh." >&2
  return 1
}

require_clean_worktree() {
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Working tree has unstaged or staged changes. Commit, stash, or discard them before claiming an issue." >&2
    return 1
  fi

  if [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
    echo "Working tree has untracked files. Commit, stash, or ignore them before claiming an issue." >&2
    git ls-files --others --exclude-standard >&2
    return 1
  fi
}

sanitize_branch_slug() {
  local raw="$1"
  printf '%s' "$raw" | tr '[:upper:] /' '[:lower:]--' | sed 's/[^a-z0-9._-]/-/g'
}
