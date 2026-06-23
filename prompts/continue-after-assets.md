If assets/nvidia/DESIGN.md does not exist, copy the NVIDIA design assets into this project first. Run this exact shell block before writing index.html:

```bash
mkdir -p assets/nvidia
for source in \
  "$HOME/.local/share/dgx-spark-dashboard-demo/assets/nvidia" \
  "$PWD/../../../../assets/nvidia" \
  "$PWD/../../../assets/nvidia" \
  "$PWD/../../../../dashboard/assets/nvidia" \
  "$PWD/../../../dashboard/assets/nvidia" \
  "/home/nvidia/open_design/dgx-spark-dashboard-demo/assets/nvidia" \
  "/home/nvidia/dgx-spark-dashboard-demo/assets/nvidia" \
  "/home/nvidia/open_design/dgx-spark-dashboard-demo/dashboard/assets/nvidia" \
  "/home/nvidia/dgx-spark-dashboard-demo/dashboard/assets/nvidia" \
  "/home/nvidia/open_design/assets/nvidia"
do
  if [ -f "$source/DESIGN.md" ]; then
    cp "$source/BRAND-NOTES.md" assets/nvidia/BRAND-NOTES.md
    cp "$source/DESIGN.md" assets/nvidia/DESIGN.md
    cp "$source/nvidia-logo-horz.svg" assets/nvidia/nvidia-logo-horz.svg
    cp "$source/nvidia-logo-vert.svg" assets/nvidia/nvidia-logo-vert.svg
    break
  fi
done
test -f assets/nvidia/BRAND-NOTES.md
test -f assets/nvidia/DESIGN.md
test -f assets/nvidia/nvidia-logo-horz.svg
test -f assets/nvidia/nvidia-logo-vert.svg
ls -la assets/nvidia
```

If the asset copy verification fails, stop and reply ASSET_COPY_FAILED with the current working directory and the failed command output.

If the assets already exist in assets/nvidia/, do not copy them again.

Create index.html now.

Allowed writes are assets/nvidia/* and index.html only. Do not plan aloud. Do not use TodoWrite. Do not read templates. Do not search outside this project. Do not output HTML in chat.

After any needed asset copy, write index.html.

Use the existing files:
- assets/nvidia/DESIGN.md
- assets/nvidia/BRAND-NOTES.md
- assets/nvidia/nvidia-logo-horz.svg
- assets/nvidia/nvidia-logo-vert.svg

Build the polished DGX Spark consolidated dashboard so it works both in Open Design preview on port 7457 and when published through the demo proxy on port 11100.

Do not call localhost:11000 directly.

All live Spark API calls must go through the demo proxy. Add a small JavaScript API helper with these candidates, in this order:
- same-origin base: `''`
- if `location.port !== '11100'`, fallback base: `http://127.0.0.1:11100`
- if `location.port !== '11100'` and `location.hostname` is not `127.0.0.1` or `localhost`, fallback base: `${location.protocol}//${location.hostname}:11100`

Use only these proxy API paths:
- EventSource through helper path `/api/v1/gpu_telemetry/stream`
- fetch through helper path `/api/v1/updates/available`
- fetch through helper path `/api/v1/update_reboot/status`
- fetch through helper path `/api/v1/jupyterlab`

Use addEventListener('gpu_telemetry', ...) for telemetry stream events, and retry the telemetry stream against the next API candidate if a connection fails.

After writing index.html, verify it exists, then reply DONE.
