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

prefer_system_node_24() {
  local candidate major dir
  for candidate in /usr/bin/node /usr/local/bin/node; do
    if [[ -x "${candidate}" ]]; then
      major="$("${candidate}" -p 'process.versions.node.split(".")[0]' 2>/dev/null || printf '0')"
      if [[ "${major}" =~ ^[0-9]+$ ]] && (( major >= 24 )); then
        dir="$(dirname "${candidate}")"
        case ":${PATH}:" in
          *":${dir}:"*) ;;
          *) export PATH="${dir}:${PATH}" ;;
        esac
        hash -r 2>/dev/null || true
        return 0
      fi
    fi
  done
  return 1
}

prefer_system_node_24 || true

export OD_WEB_PORT="${OD_WEB_PORT:-7457}"

mkdir -p logs run

"${DEMO_ROOT}/start-open-design.sh"

printf 'Open Design campaign pack demo is running.\n'
printf 'Open Design URL: http://127.0.0.1:%s/\n' "${OD_WEB_PORT}"
printf 'Remote laptop tip: ssh -L %s:127.0.0.1:%s nvidia@<spark-host>\n' "${OD_WEB_PORT}" "${OD_WEB_PORT}"
