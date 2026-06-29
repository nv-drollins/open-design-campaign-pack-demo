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

if [[ -x "${DEMO_ROOT}/stop-open-design.sh" ]]; then
  "${DEMO_ROOT}/stop-open-design.sh" || true
fi

printf 'Open Design campaign pack demo stopped.\n'
