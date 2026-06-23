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

export DGX_DEMO_HOST="${DGX_DEMO_HOST:-127.0.0.1}"
export DGX_DEMO_PORT="${DGX_DEMO_PORT:-11100}"
export DGX_DASHBOARD_BASE="${DGX_DASHBOARD_BASE:-http://127.0.0.1:11000}"
export DGX_DASHBOARD_USER="${DGX_DASHBOARD_USER:-nvidia}"
export DGX_DASHBOARD_PASS="${DGX_DASHBOARD_PASS:-nvidia}"
export START_OPEN_DESIGN="${START_OPEN_DESIGN:-1}"
export OD_WEB_PORT="${OD_WEB_PORT:-7457}"

mkdir -p logs run

if [[ "${START_OPEN_DESIGN}" == "1" ]]; then
  "${DEMO_ROOT}/start-open-design.sh"
fi

if [[ -f run/dgx-dashboard-demo.pid ]]; then
  old_pid="$(cat run/dgx-dashboard-demo.pid)"
  if [[ -n "${old_pid}" ]] && kill -0 "${old_pid}" >/dev/null 2>&1; then
    kill "${old_pid}" || true
    sleep 1
  fi
  rm -f run/dgx-dashboard-demo.pid
fi

nohup node "${DEMO_ROOT}/bin/dgx-dashboard-proxy.mjs" "${DEMO_ROOT}/dashboard" \
  > "${DEMO_ROOT}/logs/dgx-dashboard-demo.log" 2>&1 &
pid="$!"
echo "${pid}" > run/dgx-dashboard-demo.pid

sleep 1
if ! kill -0 "${pid}" >/dev/null 2>&1; then
  printf 'Dashboard proxy failed to start. Log follows:\n' >&2
  sed -n '1,120p' logs/dgx-dashboard-demo.log >&2
  exit 1
fi

printf 'DGX Spark dashboard demo is running.\n'
printf 'Local URL: http://%s:%s/\n' "${DGX_DEMO_HOST}" "${DGX_DEMO_PORT}"
if [[ "${START_OPEN_DESIGN}" == "1" ]]; then
  printf 'Open Design URL: http://127.0.0.1:%s/\n' "${OD_WEB_PORT}"
fi
if [[ "${DGX_DEMO_HOST}" == "127.0.0.1" || "${DGX_DEMO_HOST}" == "localhost" ]]; then
  printf 'Remote laptop tip: ssh -L %s:127.0.0.1:%s nvidia@<spark-host>\n' "${DGX_DEMO_PORT}" "${DGX_DEMO_PORT}"
  if [[ "${START_OPEN_DESIGN}" == "1" ]]; then
    printf 'Open Design tunnel tip: ssh -L %s:127.0.0.1:%s nvidia@<spark-host>\n' "${OD_WEB_PORT}" "${OD_WEB_PORT}"
  fi
fi
printf 'Log: %s/logs/dgx-dashboard-demo.log\n' "${DEMO_ROOT}"
