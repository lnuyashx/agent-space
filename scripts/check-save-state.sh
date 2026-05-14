#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${AGENT_SPACE_TEST_PORT:-5175}"
HOST="127.0.0.1"
TEST_URL="http://${HOST}:${PORT}/tests/save-state-browser.html"

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

VITE_LOG="$(mktemp -t agent-space-save-vite.XXXXXX.log)"
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

OUTPUT="$("$CHROME" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=3000 --dump-dom "$TEST_URL" 2>&1)"
printf '%s\n' "$OUTPUT"

if ! grep -q "SAVE_STATE_TEST_PASS" <<<"$OUTPUT"; then
  echo "Save state browser assertions failed." >&2
  exit 1
fi
