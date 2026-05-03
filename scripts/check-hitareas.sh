#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_URL="file://${ROOT_DIR}/tests/hitareas-browser.html"

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

set +e
OUTPUT="$("$CHROME" --headless=new --disable-gpu --no-sandbox --dump-dom "$TEST_URL" 2>&1)"
CHROME_STATUS=$?
set -e

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
