Create a polished single-file index.html for a DGX Spark consolidated dashboard demo.

Important execution rules:
- Edit index.html only.
- Do not use TodoWrite.
- Do not plan aloud.
- Do not read templates.
- Do not search outside this project.
- Do not output HTML in chat.
- First action must be writing index.html.
- Use vanilla HTML, CSS, and JavaScript only.
- No external libraries, CDNs, fonts, APIs, or product photos.

Before creating index.html, copy these files from /home/nvidia/open_design/assets/nvidia/ into this project at assets/nvidia/:
- BRAND-NOTES.md
- DESIGN.md
- nvidia-logo-horz.svg
- nvidia-logo-vert.svg

Then use only the copied files via relative paths like assets/nvidia/nvidia-logo-horz.svg.

Use the NVIDIA logo asset exactly. Do not redraw, recolor, crop, distort, stylize, or apply effects to the logo.

This page will be served through a local same-origin demo proxy. Do not call localhost:11000 directly. Use these same-origin API paths only:
- EventSource('/api/v1/gpu_telemetry/stream')
- fetch('/api/v1/updates/available')
- fetch('/api/v1/update_reboot/status')
- fetch('/api/v1/jupyterlab')

The GPU telemetry stream emits named events:
- event name: gpu_telemetry

Each gpu_telemetry event has:
- data.TelemetryForGPUs[0].percentage_utilization
- data.TelemetryForGPUs[0].memory_available_in_mb
- data.TelemetryForGPUs[0].memory_total_in_mb
- data.TelemetryForGPUs[0].temperature_in_c
- data.TelemetryForGPUs[0].power_draw_in_w
- data.TelemetryForGPUs[0].power_limit_in_w

The updates endpoint returns:
- available
- otaAvailable
- firmwareAvailable

The update reboot endpoint returns:
- isInProgress

The JupyterLab endpoint returns:
- status
- working_directory
- url

Design goal:
Create a premium, consolidated DGX Spark dashboard that feels like a refined NVIDIA system control center for a SIGGRAPH demo.

The dashboard should include:
- compact NVIDIA top bar
- live connection indicator
- hero/system summary area for DGX Spark
- metric cards for GPU utilization, memory usage, temperature, power draw, updates, and JupyterLab
- live GPU telemetry section with small history bars or sparklines using plain CSS/JS
- software update panel showing available / OTA / firmware / reboot progress
- remote workflows panel showing JupyterLab status and working directory
- resources panel with links to NVIDIA Build, DGX Spark docs, and NVIDIA developer forums
- graceful fallback states if APIs are unavailable
- responsive layout for desktop and laptop browser sizes

Style:
- dark premium workstation mood
- NVIDIA green accents
- restrained dashboard density
- no marketing hero
- no decorative blobs/orbs
- clear hierarchy
- polished spacing
- cards no more than 8px border radius

JavaScript requirements:
- Use EventSource with addEventListener('gpu_telemetry', ...)
- Update the DOM live as telemetry arrives
- Maintain the last 30 GPU and memory samples for mini charts
- Poll updates every 30 seconds
- Poll JupyterLab every 10 seconds
- Show "Live" when telemetry is connected
- Show "Reconnecting" or "Offline" on stream error

After writing index.html, verify it exists, then reply DONE.
