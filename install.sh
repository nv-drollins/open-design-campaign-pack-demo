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
chmod +x start.sh stop.sh start-open-design.sh stop-open-design.sh bin/dgx-dashboard-proxy.mjs bin/opencode bin/opencode-cli bin/aider

is_root() {
  [[ "${EUID}" -eq 0 ]]
}

run_root() {
  if is_root; then
    "$@"
    return
  fi
  if ! command -v sudo >/dev/null 2>&1; then
    printf 'sudo is required to run: %s\n' "$*" >&2
    return 1
  fi
  sudo "$@"
}

apt_install() {
  if ! command -v apt-get >/dev/null 2>&1; then
    printf 'apt-get was not found; install these packages manually: %s\n' "$*" >&2
    return 1
  fi
  run_root apt-get update
  run_root env DEBIAN_FRONTEND=noninteractive apt-get install -y "$@"
}

ensure_base_packages() {
  missing=()
  command -v curl >/dev/null 2>&1 || missing+=(curl)
  command -v gpg >/dev/null 2>&1 || missing+=(gnupg)
  command -v git >/dev/null 2>&1 || missing+=(git)
  if ! command -v make >/dev/null 2>&1 || ! command -v g++ >/dev/null 2>&1; then
    missing+=(build-essential)
  fi
  if ! command -v python3 >/dev/null 2>&1; then
    missing+=(python3 python3-venv)
  elif ! python3 -m venv --help >/dev/null 2>&1; then
    missing+=(python3-venv)
  fi
  if (( ${#missing[@]} > 0 )); then
    printf 'Installing base packages: %s\n' "${missing[*]}"
    apt_install ca-certificates "${missing[@]}"
  fi
}

install_node_24() {
  printf 'Installing Node.js 24 via NodeSource...\n'
  ensure_base_packages
  tmp_script="$(mktemp)"
  curl -fsSL https://deb.nodesource.com/setup_24.x -o "${tmp_script}"
  run_root bash "${tmp_script}"
  run_root env DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
  rm -f "${tmp_script}"
}

ensure_node() {
  printf 'Checking Node.js...\n'
  if ! command -v node >/dev/null 2>&1; then
    install_node_24
  fi

  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  if (( NODE_MAJOR < 24 )); then
    printf 'Found Node %s; upgrading to Node.js 24 for Open Design compatibility.\n' "$(node --version)"
    install_node_24
    NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  fi

  if (( NODE_MAJOR < 24 )); then
    printf 'Node.js 24 is required. Found %s after install attempt.\n' "$(node --version)" >&2
    exit 1
  fi
  printf 'Node.js ready: %s (%s)\n' "$(node --version)" "$(command -v node)"
}

ensure_ollama() {
  if ! command -v ollama >/dev/null 2>&1; then
    printf 'Installing Ollama...\n'
    ensure_base_packages
    tmp_script="$(mktemp)"
    curl -fsSL https://ollama.com/install.sh -o "${tmp_script}"
    sh "${tmp_script}"
    rm -f "${tmp_script}"
  fi

  if ! curl -fsS http://127.0.0.1:11434/api/version >/dev/null 2>&1; then
    printf 'Starting Ollama...\n'
    if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files ollama.service >/dev/null 2>&1; then
      run_root systemctl enable --now ollama
      sleep 3
    fi
  fi

  if ! curl -fsS http://127.0.0.1:11434/api/version >/dev/null 2>&1; then
    if [[ -f run/ollama.pid ]] && kill -0 "$(cat run/ollama.pid)" >/dev/null 2>&1; then
      :
    else
      nohup ollama serve > logs/ollama.log 2>&1 &
      echo "$!" > run/ollama.pid
    fi
  fi

  for attempt in {1..30}; do
    if curl -fsS http://127.0.0.1:11434/api/version >/dev/null 2>&1; then
      printf 'Ollama ready.\n'
      return 0
    fi
    sleep 1
  done

  printf 'Ollama did not become ready. Check logs/ollama.log or systemctl status ollama.\n' >&2
  exit 1
}

ensure_corepack() {
  if ! command -v corepack >/dev/null 2>&1; then
    printf 'corepack was not found after Node.js install. Check the Node.js installation.\n' >&2
    exit 1
  fi

  if ! command -v pnpm >/dev/null 2>&1; then
    run_root corepack enable || corepack enable
  fi
  corepack prepare pnpm@10.33.2 --activate
}

ensure_open_design() {
  ensure_corepack

  local repo ref open_design_dir
  repo="${OPEN_DESIGN_REPO:-https://github.com/nexu-io/open-design.git}"
  ref="${OPEN_DESIGN_REF:-main}"
  open_design_dir="${OPEN_DESIGN_DIR:-${DEMO_ROOT}/open-design}"

  if [[ ! -d "${open_design_dir}/.git" ]]; then
    printf 'Cloning Open Design into %s...\n' "${open_design_dir}"
    git clone --depth 1 --branch "${ref}" "${repo}" "${open_design_dir}"
  else
    printf 'Open Design checkout already exists: %s\n' "${open_design_dir}"
  fi

  printf 'Installing Open Design dependencies...\n'
  (cd "${open_design_dir}" && corepack pnpm install)
}

ensure_base_packages

ensure_node

if [[ "${INSTALL_MODEL:-1}" == "1" ]]; then
  printf 'Configuring Ollama Qwen3-Coder alias...\n'
  ensure_ollama
  if ! ollama show qwen3-coder:30b >/dev/null 2>&1; then
    ollama pull qwen3-coder:30b
  fi
  ollama create qwen3-coder:30b-48k-od -f "${DEMO_ROOT}/ollama/qwen3-coder-30b-48k-od.Modelfile"
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

ensure_open_design

if [[ ! -f ".env" ]]; then
  cp .env.example .env
  printf 'Created .env from .env.example. Review credentials before exposing the proxy beyond localhost.\n'
fi

printf '\nInstall complete.\n'
printf 'Dashboard runtime: ./start.sh\n'
printf 'Dashboard URL after start: http://%s:%s/\n' "${DGX_DEMO_HOST:-127.0.0.1}" "${DGX_DEMO_PORT:-11100}"
printf 'Open Design URL after start: http://127.0.0.1:%s/\n' "${OD_WEB_PORT:-7457}"
printf 'Open Design agent PATH: export PATH="%s/bin:$PATH"\n' "${DEMO_ROOT}"
printf 'OpenCode config: export OPENCODE_CONFIG="%s/opencode/opencode.json"\n' "${DEMO_ROOT}"
