Edit index.html only.

Fix the DGX Spark live API calls so this dashboard works both:
- inside Open Design preview on port 7457
- when published through the demo proxy on port 11100

Do not redesign the page. Do not change layout, copy, colors, assets, or brand treatment.

Do not call localhost:11000 directly.

All live Spark API calls must go through the demo proxy. Add or replace the JavaScript API helper with these candidates, in this order:
- same-origin base: `''`
- if `location.port !== '11100'`, fallback base: `http://127.0.0.1:11100`
- if `location.port !== '11100'` and `location.hostname` is not `127.0.0.1` or `localhost`, fallback base: `${location.protocol}//${location.hostname}:11100`

Use only these proxy API paths:
- `/api/v1/gpu_telemetry/stream`
- `/api/v1/updates/available`
- `/api/v1/update_reboot/status`
- `/api/v1/jupyterlab`

Implementation requirements:
- route every fetch through fetchJson(path) or an equivalent helper that tries each API candidate until one returns an ok response
- route EventSource through the same API base list
- use addEventListener('gpu_telemetry', ...) for telemetry events
- if an EventSource connection fails, close it and retry against the next API candidate before marking the dashboard offline
- show a clear "Reconnecting" or "Offline" state only after all API candidates fail
- preserve graceful fallback labels while retrying

After editing, verify index.html exists, then reply DONE.
