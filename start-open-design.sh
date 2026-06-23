#!/usr/bin/env bash
set -Eeuo pipefail

DEMO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "${DEMO_ROOT}"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

OPEN_DESIGN_DIR="${OPEN_DESIGN_DIR:-${DEMO_ROOT}/open-design}"
OD_DAEMON_PORT="${OD_DAEMON_PORT:-7456}"
OD_WEB_PORT="${OD_WEB_PORT:-7457}"

if [[ ! -d "${OPEN_DESIGN_DIR}" ]]; then
  printf 'Open Design is not installed at %s. Run ./install.sh first, or set OPEN_DESIGN_DIR in .env.\n' "${OPEN_DESIGN_DIR}" >&2
  exit 1
fi

export PATH="${DEMO_ROOT}/bin:/usr/bin:/home/nvidia/.local/bin:${PATH}"
export OPENCODE_BIN="${DEMO_ROOT}/bin/opencode-cli"
export OPENCODE_CONFIG="${DEMO_ROOT}/opencode/opencode.json"
export OPENCODE_DISABLE_PROJECT_CONFIG=true

cd "${OPEN_DESIGN_DIR}"

corepack pnpm exec tools-dev stop web >/dev/null 2>&1 || true
corepack pnpm exec tools-dev stop daemon >/dev/null 2>&1 || true

corepack pnpm exec tools-dev start daemon \
  --daemon-port "${OD_DAEMON_PORT}" \
  --web-port "${OD_WEB_PORT}"

corepack pnpm exec tools-dev start web \
  --daemon-port "${OD_DAEMON_PORT}" \
  --web-port "${OD_WEB_PORT}"

corepack pnpm exec tools-dev status

printf '\nOpen Design web UI: http://127.0.0.1:%s/\n' "${OD_WEB_PORT}"
printf 'OpenCode model: ollama/qwen3-coder:30b-48k-od\n'
