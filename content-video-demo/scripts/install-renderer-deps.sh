#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

run_sudo() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

find_chromium() {
  command -v chromium-browser 2>/dev/null \
    || command -v chromium 2>/dev/null \
    || command -v google-chrome 2>/dev/null \
    || command -v google-chrome-stable 2>/dev/null \
    || true
}

echo "Installing HyperFrames skill for Open Design, if the local PromptScript context supports it..."
if ! (cd "${ROOT_DIR}" && npx --yes skills add heygen-com/hyperframes); then
  cat <<'EOF'
HyperFrames skill install was skipped.

This is OK for the manual demo flow. PromptScript can reject global skill
installation when the command is not run inside a supported local skill context.
The renderer itself is still provided by:

  npx --yes hyperframes render --output teaser.mp4

Continue using the prompts in content-video-demo/prompts/.
EOF
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Installing ffmpeg..."
  run_sudo apt-get update
  run_sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg
else
  echo "ffmpeg ready: $(command -v ffmpeg)"
fi

if [[ -z "$(find_chromium)" ]]; then
  echo "Installing Chromium..."
  run_sudo apt-get update
  if ! run_sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y chromium-browser; then
    run_sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y chromium
  fi
fi

browser_path="$(find_chromium)"
if [[ -z "${browser_path}" ]]; then
  echo "Could not find Chromium after install. Set HYPERFRAMES_BROWSER_PATH manually." >&2
  exit 1
fi

cat <<EOF

Renderer dependencies are ready.

Use this before rendering:

  export HYPERFRAMES_BROWSER_PATH="${browser_path}"

Demo assets:

  ${ROOT_DIR}/assets

EOF
