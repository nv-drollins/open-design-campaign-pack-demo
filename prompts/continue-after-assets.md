The assets are already copied into assets/nvidia/. Do not copy them again.

Create index.html now.

Do not plan aloud. Do not use TodoWrite. Do not read templates. Do not search outside this project. Do not output HTML in chat.

First action must be writing index.html.

Use the existing files:
- assets/nvidia/DESIGN.md
- assets/nvidia/BRAND-NOTES.md
- assets/nvidia/nvidia-logo-horz.svg
- assets/nvidia/nvidia-logo-vert.svg

Build the polished DGX Spark consolidated dashboard using same-origin API paths:
- EventSource('/api/v1/gpu_telemetry/stream')
- fetch('/api/v1/updates/available')
- fetch('/api/v1/update_reboot/status')
- fetch('/api/v1/jupyterlab')

Use addEventListener('gpu_telemetry', ...) for telemetry stream events.

After writing index.html, verify it exists, then reply DONE.
