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

if [[ ! -d "${OPEN_DESIGN_DIR}" ]]; then
  printf 'Open Design directory not found at %s; nothing to stop.\n' "${OPEN_DESIGN_DIR}"
  exit 0
fi

cd "${OPEN_DESIGN_DIR}"

corepack pnpm exec tools-dev stop web >/dev/null 2>&1 || true
corepack pnpm exec tools-dev stop daemon >/dev/null 2>&1 || true

printf 'Stopped Open Design tools-dev runtime.\n'
