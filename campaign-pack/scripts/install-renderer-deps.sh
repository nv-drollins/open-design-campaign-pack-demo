#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
TOOLS_DIR="${DEMO_DIR}/.tools/playwright"
NPM_CACHE_DIR="${DEMO_DIR}/.tools/npm-cache"
BROWSERS_DIR="${DEMO_DIR}/.tools/playwright-browsers"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Run the repo install first so Node.js is available." >&2
  exit 1
fi

mkdir -p "${TOOLS_DIR}" "${NPM_CACHE_DIR}" "${BROWSERS_DIR}"

if [[ ! -d "${TOOLS_DIR}/node_modules/playwright" ]]; then
  echo "Installing local Playwright renderer package..."
  npm install --prefix "${TOOLS_DIR}" --cache "${NPM_CACHE_DIR}" --no-audit --no-fund playwright@latest
else
  echo "Local Playwright renderer package already installed."
fi

echo "Installing Playwright Chromium browser..."
PLAYWRIGHT_BROWSERS_PATH="${BROWSERS_DIR}" "${TOOLS_DIR}/node_modules/.bin/playwright" install chromium

echo "Renderer dependencies installed."
