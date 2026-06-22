#!/usr/bin/env bash
set -Eeuo pipefail

DEMO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "${DEMO_ROOT}"

if [[ ! -f run/dgx-dashboard-demo.pid ]]; then
  printf 'No PID file found; dashboard demo does not appear to be running from this install.\n'
  exit 0
fi

pid="$(cat run/dgx-dashboard-demo.pid)"
if [[ -n "${pid}" ]] && kill -0 "${pid}" >/dev/null 2>&1; then
  kill "${pid}" || true
  printf 'Stopped DGX Spark dashboard demo process %s.\n' "${pid}"
else
  printf 'Dashboard demo process %s was not running.\n' "${pid}"
fi

rm -f run/dgx-dashboard-demo.pid
