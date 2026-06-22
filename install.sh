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

mkdir -p logs run
chmod +x start.sh stop.sh bin/dgx-dashboard-proxy.mjs bin/opencode bin/opencode-cli bin/aider

printf 'Checking Node.js...\n'
if ! command -v node >/dev/null 2>&1; then
  printf 'Node.js is required. Install Node 24 for Open Design compatibility.\n' >&2
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if (( NODE_MAJOR < 18 )); then
  printf 'Node.js 18+ is required for the dashboard proxy; Node 24 is recommended. Found %s.\n' "$(node --version)" >&2
  exit 1
fi
if (( NODE_MAJOR < 24 )); then
  printf 'Node %s can run the proxy. Use Node 24 when running Open Design itself.\n' "$(node --version)"
fi

if [[ "${INSTALL_MODEL:-1}" == "1" ]]; then
  printf 'Configuring Ollama Qwen3-Coder alias...\n'
  if ! command -v ollama >/dev/null 2>&1; then
    printf 'Ollama was not found. Install/start Ollama, then run: ollama pull qwen3-coder:30b && ollama create qwen3-coder:30b-48k-od -f ollama/qwen3-coder-30b-48k-od.Modelfile\n' >&2
  else
    if ! ollama show qwen3-coder:30b >/dev/null 2>&1; then
      ollama pull qwen3-coder:30b
    fi
    ollama create qwen3-coder:30b-48k-od -f "${DEMO_ROOT}/ollama/qwen3-coder-30b-48k-od.Modelfile"
  fi
fi

if [[ "${INSTALL_AIDER:-1}" == "1" ]]; then
  printf 'Configuring Aider virtual environment...\n'
  if ! command -v python3 >/dev/null 2>&1; then
    printf 'python3 was not found; skipping Aider install.\n' >&2
  else
    if [[ ! -x "${DEMO_ROOT}/aider-venv/bin/aider" ]]; then
      python3 -m venv "${DEMO_ROOT}/aider-venv"
      "${DEMO_ROOT}/aider-venv/bin/python" -m pip install --upgrade pip
      "${DEMO_ROOT}/aider-venv/bin/python" -m pip install --upgrade aider-chat
    fi
  fi
fi

if [[ ! -f ".env" ]]; then
  cp .env.example .env
  printf 'Created .env from .env.example. Review credentials before exposing the proxy beyond localhost.\n'
fi

printf '\nInstall complete.\n'
printf 'Dashboard runtime: ./start.sh\n'
printf 'Open Design agent PATH: export PATH="%s/bin:$PATH"\n' "${DEMO_ROOT}"
printf 'OpenCode config: export OPENCODE_CONFIG="%s/opencode/opencode.json"\n' "${DEMO_ROOT}"
