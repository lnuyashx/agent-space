#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${AGENT_SPACE_TEST_PORT:-5174}"
HOST="127.0.0.1"
TEST_URL="http://${HOST}:${PORT}/tests/smoke-browser.html"
VIRTUAL_TIME_BUDGET_MS="${SMOKE_VIRTUAL_TIME_BUDGET_MS:-12000}"

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

VITE_LOG="$(mktemp -t agent-space-smoke-vite.XXXXXX.log)"
"${ROOT_DIR}/node_modules/.bin/vite" --host "$HOST" --port "$PORT" --strictPort >"$VITE_LOG" 2>&1 &
VITE_PID=$!
cleanup() {
  kill "$VITE_PID" >/dev/null 2>&1 || true
  wait "$VITE_PID" >/dev/null 2>&1 || true
  rm -f "$VITE_LOG"
}
trap cleanup EXIT

for _ in $(seq 1 60); do
  if curl -fsS "http://${HOST}:${PORT}/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done

if ! curl -fsS "http://${HOST}:${PORT}/" >/dev/null 2>&1; then
  cat "$VITE_LOG" >&2
  echo "Vite test server did not start." >&2
  exit 1
fi

set +e
OUTPUT="$(
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --no-sandbox \
    --window-size=1360,960 \
    --virtual-time-budget="$VIRTUAL_TIME_BUDGET_MS" \
    --dump-dom \
    "$TEST_URL" 2>&1
)"
CHROME_STATUS=$?
set -e

if [[ "$CHROME_STATUS" -ne 0 ]]; then
  printf '%s\n' "$OUTPUT"
  echo "Chrome smoke check exited with status ${CHROME_STATUS}." >&2
  exit "$CHROME_STATUS"
fi

if ! grep -q "<title>PASS Agent Space Smoke</title>" <<<"$OUTPUT"; then
  printf '%s\n' "$OUTPUT"
  echo "Smoke browser assertions failed." >&2
  exit 1
fi

echo "SMOKE_TEST_PASS"
SUMMARY="$(grep -Eo '[0-9]+ smoke assertions passed\.' <<<"$OUTPUT" | head -n 1 || true)"
if [[ -n "$SUMMARY" ]]; then
  echo "$SUMMARY"
fi
