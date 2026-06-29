#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Usage: $0 /path/to/open-design/.od/projects/<project-id>" >&2
  exit 1
fi

project_dir="$1"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pack_dir="$(cd "$script_dir/.." && pwd)"
target_dir="$project_dir/assets"

mkdir -p "$target_dir"

copy_asset() {
  local source="$1"
  local name="$2"

  if [ ! -f "$source" ]; then
    echo "Missing asset: $source" >&2
    exit 1
  fi

  cp "$source" "$target_dir/$name"
  echo "Copied assets/$name"
}

copy_asset "$pack_dir/assets/nvidia-logo-horz.svg" "nvidia-logo-horz.svg"
copy_asset "$pack_dir/assets/premium-workstation.svg" "premium-workstation.svg"
copy_asset "$pack_dir/assets/creator-energy.svg" "creator-energy.svg"
copy_asset "$pack_dir/assets/minimal-launch.svg" "minimal-launch.svg"

cat <<EOF

Campaign project assets are ready in:
  $target_dir

Use these relative paths in campaign JSON:
  assets/nvidia-logo-horz.svg
  assets/premium-workstation.svg
  assets/creator-energy.svg
  assets/minimal-launch.svg
EOF
