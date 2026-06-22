# DGX Spark Local Dashboard Demo

This package contains the working local DGX Spark dashboard demo flow:

- a single-file `dashboard/index.html`
- official local NVIDIA logo assets under `dashboard/assets/nvidia/`
- a local-only Node proxy that serves the page and forwards `/api/*` to the Spark dashboard at `localhost:11000`
- Ollama/OpenCode/Aider configuration for the local Qwen3-Coder workflow that worked reliably

It focuses only on the local Ollama/OpenCode/Aider/proxy path that worked.

## What Runs

The dashboard is static HTML, CSS, and JavaScript. Live data comes from the Spark dashboard API:

- `/api/v1/gpu_telemetry/stream`
- `/api/v1/updates/available`
- `/api/v1/update_reboot/status`
- `/api/v1/jupyterlab`

The browser should load the demo through the local proxy, usually:

```bash
http://127.0.0.1:11100/
```

The proxy logs into `http://127.0.0.1:11000` using `DGX_DASHBOARD_USER` and `DGX_DASHBOARD_PASS`, then adds the bearer token for proxied API calls. Keep it bound to `127.0.0.1` unless you deliberately want to expose the auto-authenticated proxy.

## Scripted Install

From this directory:

```bash
cp .env.example .env
./install.sh
./start.sh
```

Then open:

```bash
http://127.0.0.1:11100/
```

Stop it with:

```bash
./stop.sh
```

Restart it later with:

```bash
./start.sh
```

## Manual Install

1. Install or verify Node.js.

   Node 18+ can run the dashboard proxy. Node 24 is recommended if you also run Open Design locally.

   ```bash
   node --version
   ```

2. Install and start Ollama.

   ```bash
   ollama pull qwen3-coder:30b
   ollama create qwen3-coder:30b-48k-od -f ollama/qwen3-coder-30b-48k-od.Modelfile
   ollama show qwen3-coder:30b-48k-od --parameters
   ```

   Confirm the alias includes:

   ```text
   num_ctx 49152
   num_predict 12000
   ```

3. Configure OpenCode for Open Design.

   ```bash
   export PATH="$PWD/bin:$PATH"
   export OPENCODE_CONFIG="$PWD/opencode/opencode.json"
   export OPENCODE_DISABLE_PROJECT_CONFIG=true
   export OPENCODE_BIN="$PWD/bin/opencode-cli"
   ```

   The important working settings are:

   - model: `ollama/qwen3-coder:30b-48k-od`
   - context limit: `49152`
   - output limit: `12000`
   - `RENDERER qwen3-coder` and `PARSER qwen3-coder` in the Modelfile, so tool calling works

4. Optional Aider setup for follow-up edits.

   ```bash
   python3 -m venv aider-venv
   aider-venv/bin/python -m pip install --upgrade pip aider-chat
   export PATH="$PWD/bin:$PATH"
   ```

   The packaged `bin/aider` wrapper uses:

   ```text
   ollama_chat/qwen3-coder:30b-48k-od
   diff edit format
   no git auto-commit
   no URL scraping
   no analytics
   ```

5. Start the live dashboard proxy.

   ```bash
   cp .env.example .env
   ./start.sh
   ```

## Remote Laptop Access

Recommended: keep the proxy local-only and tunnel it from your laptop:

```bash
ssh -L 11100:127.0.0.1:11100 nvidia@<spark-host>
```

Then open this on the laptop:

```bash
http://127.0.0.1:11100/
```

If you intentionally bind to the LAN, edit `.env`:

```bash
DGX_DEMO_HOST=0.0.0.0
```

Only do this on a trusted network because the proxy auto-authenticates to the Spark dashboard.

## Open Design Prompts

Use `prompts/create-dashboard.md` for a fresh project.

If a run copies the assets but stops before writing `index.html`, use `prompts/continue-after-assets.md`.

The highest-impact lessons were:

- keep OpenCode and Ollama output limits aligned at `12000`
- keep Qwen3-Coder `RENDERER` and `PARSER` metadata or tool calling breaks
- tell the agent not to read templates, not to plan aloud, and to write `index.html` first
- use the local proxy for live data instead of calling `localhost:11000` directly from the preview

## Files

```text
dashboard/index.html                         Working dashboard
dashboard/assets/nvidia/                     Local brand assets and notes
bin/dgx-dashboard-proxy.mjs                  Static server + DGX API proxy
bin/opencode                                 OpenCode wrapper for Open Design
bin/opencode-cli                             Open Design-compatible OpenCode entry
bin/aider                                    Aider wrapper for local Qwen edits
ollama/qwen3-coder-30b-48k-od.Modelfile     Tool-capable Qwen3-Coder alias
opencode/opencode.json                       OpenCode local Ollama provider config
install.sh                                   Install/configure helper
start.sh                                     Start/restart dashboard proxy
stop.sh                                      Stop dashboard proxy
```

## Brand Note

The included NVIDIA marks should be used only according to NVIDIA's logo and brand usage rules. Do not redraw, recolor, crop, distort, stylize, or apply effects to the logo.
