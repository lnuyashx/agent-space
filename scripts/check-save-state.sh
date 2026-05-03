#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_URL="file://${ROOT_DIR}/tests/save-state-browser.html"

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

OUTPUT="$("$CHROME" --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files --virtual-time-budget=3000 --dump-dom "$TEST_URL" 2>&1)"
printf '%s\n' "$OUTPUT"

if ! grep -q "SAVE_STATE_TEST_PASS" <<<"$OUTPUT"; then
  echo "Save state browser assertions failed." >&2
  exit 1
fi
