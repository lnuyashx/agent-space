#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_URL="file://${ROOT_DIR}/tests/hitareas-browser.html"
CHROME_TIMEOUT_SEC="${HITAREA_CHROME_TIMEOUT_SEC:-25}"

if [[ -n "${CHROME_BIN:-}" ]]; then
  CHROME="$CHROME_BIN"
elif [[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif command -v google-chrome >/dev/null 2>&1; then
  CHROME="$(command -v google-chrome)"
elif command -v chromium >/dev/null 2>&1; then
  CHROME="$(command -v chromium)"
elif command -v chromium-browser >/dev/null 2>&1; then
  CHROME="$(command -v chromium-browser)"
else
  echo "Chrome or Chromium was not found. Set CHROME_BIN=/path/to/chrome." >&2
  exit 127
fi

run_hitarea_check() {
  local profile_dir
  local output_file
  profile_dir="$(mktemp -d "${TMPDIR:-/tmp}/agent-space-hitareas-XXXXXX")"
  output_file="$(mktemp "${TMPDIR:-/tmp}/agent-space-hitareas-output-XXXXXX")"
  local output
  local status
  set +e
  if command -v perl >/dev/null 2>&1; then
    perl -e 'alarm shift; exec @ARGV' "$CHROME_TIMEOUT_SEC" \
      "$CHROME" \
      --headless=new \
      --disable-gpu \
      --disable-dev-shm-usage \
      --no-sandbox \
      --virtual-time-budget=4000 \
      --user-data-dir="$profile_dir" \
      --dump-dom \
      "$TEST_URL" >"$output_file" 2>&1
  else
    "$CHROME" \
      --headless=new \
      --disable-gpu \
      --disable-dev-shm-usage \
      --no-sandbox \
      --virtual-time-budget=4000 \
      --user-data-dir="$profile_dir" \
      --dump-dom \
      "$TEST_URL" >"$output_file" 2>&1
  fi
  status=$?
  set -e
  output="$(cat "$output_file")"
  rm -rf "$profile_dir"
  rm -f "$output_file"
  printf '%s' "$output"
  return "$status"
}

is_retryable_chrome_status() {
  local status="$1"
  [[ "$status" -eq 134 || "$status" -eq 124 || "$status" -eq 137 || "$status" -eq 142 ]]
}

cleanup_stale_chrome() {
  pkill -f "Google Chrome.*headless" >/dev/null 2>&1 || true
  pkill -f "chromium.*headless" >/dev/null 2>&1 || true
  pkill -f "tests/hitareas-browser.html" >/dev/null 2>&1 || true
}

OUTPUT=""
CHROME_STATUS=1
for attempt in 1 2 3; do
  cleanup_stale_chrome
  set +e
  OUTPUT="$(run_hitarea_check)"
  CHROME_STATUS=$?
  set -e
  if [[ "$CHROME_STATUS" -ne 0 ]] && grep -q "HITAREA_TEST_PASS" <<<"$OUTPUT"; then
    CHROME_STATUS=0
  fi
  if [[ "$CHROME_STATUS" -eq 0 ]]; then
    break
  fi
  cleanup_stale_chrome
  if ! is_retryable_chrome_status "$CHROME_STATUS" || [[ "$attempt" -eq 3 ]]; then
    break
  fi
  sleep 2
done

if [[ "$CHROME_STATUS" -ne 0 ]]; then
  printf '%s\n' "$OUTPUT"
  echo "Chrome hit area check exited with status ${CHROME_STATUS}." >&2
  exit "$CHROME_STATUS"
fi

if ! grep -q "HITAREA_TEST_PASS" <<<"$OUTPUT"; then
  printf '%s\n' "$OUTPUT"
  echo "Hit area browser assertions failed." >&2
  exit 1
fi

echo "HITAREA_TEST_PASS"
SUMMARY="$(grep -Eo '[0-9]+ browser assertions passed\.' <<<"$OUTPUT" | head -n 1 || true)"
if [[ -n "$SUMMARY" ]]; then
  echo "$SUMMARY"
fi
