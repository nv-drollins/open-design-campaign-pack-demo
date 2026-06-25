#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
PROJECT_DIR="${1:-$PWD}"
OUTPUT="${2:-teaser.mp4}"

cd "${PROJECT_DIR}"

if [[ ! -f "index.html" ]]; then
  echo "index.html not found in ${PROJECT_DIR}" >&2
  exit 1
fi

if [[ ! -f "cover.png" && -f "${DEMO_DIR}/assets/cover.png" ]]; then
  cp "${DEMO_DIR}/assets/cover.png" ./cover.png
fi

if [[ ! -f "cover.png" ]]; then
  echo "cover.png not found in ${PROJECT_DIR}. Copy it beside index.html before rendering." >&2
  exit 1
fi

if [[ "${SKIP_HYPERFRAMES_PREFLIGHT:-0}" != "1" ]]; then
  preflight_failed=0

  require_html() {
    local needle="$1"
    local message="$2"
    if ! grep -Fq "${needle}" index.html; then
      echo "HyperFrames preflight: ${message}" >&2
      preflight_failed=1
    fi
  }

  reject_html() {
    local needle="$1"
    local message="$2"
    if grep -Fq "${needle}" index.html; then
      echo "HyperFrames preflight: ${message}" >&2
      preflight_failed=1
    fi
  }

  require_html 'data-composition-id="teaser"' 'root is missing data-composition-id="teaser".'
  require_html 'data-start="0"' 'root is missing data-start="0".'
  require_html 'data-width="1080"' 'root is missing data-width="1080".'
  require_html 'data-height="1920"' 'root is missing data-height="1920".'
  require_html 'data-duration="6"' 'root is missing data-duration="6".'
  require_html 'window.__timelines["teaser"]' 'timeline is not registered as window.__timelines["teaser"].'
  reject_html 'window.__timelines = []' 'window.__timelines must be an object, not an array.'
  reject_html 'window.__timelines.push' 'do not use window.__timelines.push(...); assign by composition id.'
  reject_html 'repeat: -1' 'GSAP repeat:-1 is not deterministic; use a finite repeat count.'

  if grep -Fq 'tl.play' index.html && ! grep -Fq 'navigator.webdriver' index.html; then
    echo 'HyperFrames preflight: preview auto-play must be guarded with navigator.webdriver so it stays paused during headless render.' >&2
    preflight_failed=1
  fi

  if (( preflight_failed != 0 )); then
    cat >&2 <<EOF

index.html is not render-ready yet.

Apply this Open Design prompt to the current project, then rerun this script:

  ${DEMO_DIR}/prompts/04-repair-hyperframes-contract.md

If the only failure mentions preview auto-play or navigator.webdriver, use:

  ${DEMO_DIR}/prompts/06-make-timeline-render-safe.md

To bypass this local preflight anyway:

  SKIP_HYPERFRAMES_PREFLIGHT=1 ${SCRIPT_DIR}/render-teaser.sh "${PROJECT_DIR}" "${OUTPUT}"

EOF
    exit 2
  fi
fi

if [[ -z "${HYPERFRAMES_BROWSER_PATH:-}" ]]; then
  HYPERFRAMES_BROWSER_PATH="$(command -v chromium-browser 2>/dev/null || command -v chromium 2>/dev/null || command -v google-chrome 2>/dev/null || command -v google-chrome-stable 2>/dev/null || true)"
  export HYPERFRAMES_BROWSER_PATH
fi

if [[ -z "${HYPERFRAMES_BROWSER_PATH}" ]]; then
  echo "No Chromium browser found. Run ${DEMO_DIR}/scripts/install-renderer-deps.sh or set HYPERFRAMES_BROWSER_PATH." >&2
  exit 1
fi

echo "Rendering ${PROJECT_DIR}/index.html to ${OUTPUT}"
echo "Using browser: ${HYPERFRAMES_BROWSER_PATH}"

npx --yes hyperframes render --output "${OUTPUT}"

echo "Rendered ${PROJECT_DIR}/${OUTPUT}"
