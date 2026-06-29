# Open-Design Campaign Pack Demo

This package contains the working local DGX Spark dashboard demo flow:

- a single-file `dashboard/index.html`
- official local NVIDIA logo assets under `assets/nvidia/` and `dashboard/assets/nvidia/`
- a local-only Node proxy that serves the page and forwards `/api/*` to the Spark dashboard at `localhost:11000`
- Ollama/OpenCode/Aider configuration for the local Qwen3-Coder workflow that worked reliably

It focuses only on the local Ollama/OpenCode/Aider/proxy path that worked.

## Included Demos

- `dashboard/` is the DGX Spark live dashboard demo.
- `content-video-demo/` is a Prompt & Pixel content-creator demo that generates a glassmorphism HTML promo card and renders it into a 6-second vertical MP4 with HyperFrames.
- `campaign-pack/` is a deterministic campaign asset-pack demo: Open Design edits `campaign.json`, and a fixed local renderer exports production-size PNGs.

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

On a freshly imaged Spark, `install.sh` can bootstrap the runtime dependencies it needs:

- Node.js 24 via NodeSource
- base packages such as `curl`, `ca-certificates`, `gnupg`, `python3`, and `python3-venv`
- a local OpenCode CLI install under `.tools/opencode/`
- a stable asset source symlink at `~/.local/share/dgx-spark-dashboard-demo/assets/nvidia`
- Ollama, if it is not already installed
- the local `qwen3-coder:30b-48k-od` Ollama alias
- an Aider virtual environment
- the Campaign Asset Pack Playwright/Chromium renderer under `campaign-pack/.tools/`
- Open Design cloned into `open-design/` and installed with `pnpm`

The bootstrap path assumes an Ubuntu/Debian-like system with network access and `sudo`. If packages or services need elevated privileges, the script will prompt for your password.

Clone the repo and enter it:

```bash
git clone https://github.com/nv-drollins/open-design-campaign-pack-demo.git
cd open-design-campaign-pack-demo
```

Then run:

```bash
cp .env.example .env
./install.sh
./start.sh
```

Then open:

```bash
http://127.0.0.1:11100/
```

Open Design is started by `./start.sh` because it is required for editing and regenerating the dashboard:

```bash
http://127.0.0.1:7457/
```

Stop it with:

```bash
./stop.sh
```

Restart it later with:

```bash
./start.sh
```

Installer toggles in `.env`:

```bash
INSTALL_MODEL=1
INSTALL_AIDER=1
INSTALL_CAMPAIGN_RENDERER=1
OD_WEB_PORT=7457
OD_DAEMON_PORT=7456
```

Set `INSTALL_MODEL`, `INSTALL_AIDER`, or `INSTALL_CAMPAIGN_RENDERER` to `0` only if those pieces are already installed or not needed. Open Design is mandatory for this demo flow.

### Node 24 Path Note

If `./install.sh` ends with:

```text
Node.js 24 is required. Found v22.x after install attempt.
```

the Spark probably has another Node binary, such as one from conda/base, earlier in `PATH` than the NodeSource install. The installer now prefers `/usr/bin/node` when it is Node 24, but you can also retry from the same shell with:

```bash
export PATH="/usr/bin:$PATH"
hash -r
./install.sh
```

To inspect what your shell is resolving:

```bash
command -v node
node --version
/usr/bin/node --version
```

## Demo

After the scripted install, start the stack:

```bash
./start.sh
```

Open these pages:

```text
Dashboard:   http://127.0.0.1:11100/
Open Design: http://127.0.0.1:7457/
```

Use OpenCode/Qwen in Open Design for the main demo prompts.

### Dashboard Demo

Use this flow when you want to show Open Design generating or modifying the DGX Spark dashboard.

1. Create a new Open Design project.
2. Run `prompts/create-dashboard.md`.
3. If the run copies assets but stops before writing `index.html`, run `prompts/continue-after-assets.md`.
4. If the generated dashboard looks good but live stats show empty values or `Error`, run `prompts/fix-api-preview.md`.
5. Preview the generated project through the dashboard proxy if needed:

   ```bash
   DGX_DEMO_PORT=11101 node bin/dgx-dashboard-proxy.mjs open-design/.od/projects/<project-id>
   ```

   Then open `http://127.0.0.1:11101/`.

### Content Creator Video Demo

Use this flow when you want to show a designer creating a promo card, iterating on it, and turning the approved design into a short social teaser video.

One-time renderer setup:

```bash
./content-video-demo/scripts/install-renderer-deps.sh
```

Create a new Open Design project, then copy the content-demo assets into that project folder:

```bash
cp content-video-demo/assets/DESIGN.md open-design/.od/projects/<project-id>/
cp content-video-demo/assets/announcement.md open-design/.od/projects/<project-id>/
cp content-video-demo/assets/cover.png open-design/.od/projects/<project-id>/
```

Prompt order:

1. Run `content-video-demo/prompts/01-create-promo-card.md` to create the initial responsive web promo card.
2. Iterate as the designer: adjust hierarchy, spacing, tone, CTA, glass effect, and cover-art placement until the card is approved.
3. Run `content-video-demo/prompts/02-convert-card-to-hyperframes.md` to convert the approved card into a 6-second vertical HyperFrames composition.
4. Run `content-video-demo/prompts/08-fix-video-size-and-framing.md` as the production framing pass. This makes the video fill the 1080x1920 frame and keeps motion inside the safe area.
5. Render the MP4 from the repo root:

   ```bash
   ./content-video-demo/scripts/render-teaser.sh open-design/.od/projects/<project-id>
   ```

The output is `teaser.mp4` beside the generated `index.html` in the Open Design project folder.

Optional repair prompts:

- Use `content-video-demo/prompts/05-add-visible-motion.md` if the MP4 renders but looks too static.
- Use `content-video-demo/prompts/04-repair-hyperframes-contract.md` if preflight reports missing HyperFrames attributes, bad timeline registration, or `repeat: -1`. This is intended as a surgical repair that preserves the approved visual card.
- Use `content-video-demo/prompts/06-remove-preview-autoplay-for-render.md` if render preflight reports `tl.play`.
- Use `content-video-demo/prompts/07-fix-scene-wrapper-duration.md` if HyperFrames logs a scene missing `class="scene clip"` or `data-duration="6"`.
- Use `content-video-demo/prompts/08-fix-video-size-and-framing.md` again if the output still looks too small or motion drifts out of frame.

### Campaign Asset Pack Demo

Use this flow when you want the creator to art-direct a campaign while the final renderer stays fixed and predictable.

Renderer setup:

```bash
./campaign-pack/scripts/install-renderer-deps.sh
```

The main `./install.sh` runs this by default when `INSTALL_CAMPAIGN_RENDERER=1`, so you only need to run it manually if you skipped that installer step or want to repair the renderer setup. It installs a local Playwright/Chromium screenshot renderer under `campaign-pack/.tools/`.

Create a new Open Design project, then copy any campaign assets into that project folder. For a quick first run with existing repo assets:

```bash
./campaign-pack/scripts/prepare-project-assets.sh open-design/.od/projects/<project-id>
```

Prompt order:

1. Run `campaign-pack/prompts/01-create-campaign-json.md` to create the initial campaign direction.
2. Iterate as the designer by asking Open Design to edit `campaign.json` only. For example:

   ```text
   Edit campaign.json only. Make the campaign feel more premium, shorten the headline, and make the CTA more direct.
   ```

3. Optional: use `campaign-pack/prompts/02-refine-campaign-json.md` as a reusable refinement prompt.
4. Render the asset pack from the repo root:

   ```bash
   node campaign-pack/scripts/render-pack.mjs open-design/.od/projects/<project-id>/campaign.json
   ```

The renderer writes predictable PNG exports beside `campaign.json`:

```text
exports/keynote-16x9.png
exports/vertical-poster.png
exports/social-square.png
exports/linkedin-banner.png
```

You can test the renderer without Open Design:

```bash
node campaign-pack/scripts/render-pack.mjs campaign-pack/sample/campaign.json
```

For a stronger ideation moment, use the complete campaign workflow:

1. Run `campaign-pack/prompts/03-create-concept-set.md` in an Open Design project.
2. Render all concepts plus a review board:

   ```bash
   node campaign-pack/scripts/render-concepts.mjs open-design/.od/projects/<project-id>
   ```

   This writes concept folders and `exports/contact-sheet.png`.

3. Pick a favorite, then run `campaign-pack/prompts/04-create-colorway-variants.md`.
4. Tell Open Design which concept to use, for example:

   ```text
   Use campaign-a.json as the base and create the colorway variants.
   ```

5. Render only that selected concept's variants and review board:

   ```bash
   node campaign-pack/scripts/render-concepts.mjs \
     open-design/.od/projects/<project-id> \
     --variants-of campaign-a
   ```

   This writes variant folders such as `exports/campaign-a-green/`, `exports/campaign-a-cyan-purple/`, and `exports/campaign-a-mono/`.

6. Critique the chosen direction with `campaign-pack/prompts/05-critique-campaign.md`:

   ```text
   Critique campaign-a-cyan-purple.json.
   ```

7. Snapshot the selected campaign before applying critique:

   ```bash
   node campaign-pack/scripts/snapshot-campaign.mjs \
     open-design/.od/projects/<project-id> \
     campaign-a-cyan-purple.json
   ```

8. Apply the critique with `campaign-pack/prompts/06-apply-critique.md`:

   ```text
   Apply critique.md to campaign-a-cyan-purple.json.
   ```

9. Render the before/after board:

   ```bash
   node campaign-pack/scripts/render-before-after.mjs \
     open-design/.od/projects/<project-id>/campaign-a-cyan-purple-before.json \
     open-design/.od/projects/<project-id>/campaign-a-cyan-purple.json
   ```

   This writes `exports/before-after/before-after.png`.

Shorter colorway-only flow after choosing a favorite concept:

1. Run `campaign-pack/prompts/04-create-colorway-variants.md`.
2. Tell Open Design which concept to use, for example:

   ```text
   Use campaign-a.json as the base and create the colorway variants.
   ```

3. Render only that selected concept's variants and review board:

   ```bash
   node campaign-pack/scripts/render-concepts.mjs \
     open-design/.od/projects/<project-id> \
     --variants-of campaign-a
   ```

This writes variant folders such as `exports/campaign-a-green/`, `exports/campaign-a-cyan-purple/`, and `exports/campaign-a-mono/`.

## Manual Install

1. Install or verify Node.js.

   Node 24 is recommended and is what the installer bootstraps.

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
   npm install --prefix .tools/opencode --no-audit --no-fund opencode-ai@latest
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

   By default, this also starts Open Design at `http://127.0.0.1:7457/`.

## Runtime Scripts

Use `./start.sh` for normal demo startup. It starts Open Design first, then starts the live dashboard proxy.

Use `./stop.sh` for normal shutdown. It stops both Open Design and the dashboard proxy.

Use `./start-open-design.sh` only when you want to start or restart just the Open Design editor without touching the dashboard proxy.

Use `./stop-open-design.sh` only when you want to stop just the Open Design editor and leave the dashboard proxy running. The filename includes the hyphen: `stop-open-design.sh`.

## Remote Laptop Access

Recommended: keep the proxy local-only and tunnel it from your laptop:

```bash
ssh -L 11100:127.0.0.1:11100 -L 7457:127.0.0.1:7457 nvidia@<spark-host>
```

Then open these on the laptop:

```bash
Dashboard:   http://127.0.0.1:11100/
Open Design: http://127.0.0.1:7457/
```

If you intentionally bind to the LAN, edit `.env`:

```bash
DGX_DEMO_HOST=0.0.0.0
```

Only do this on a trusted network because the proxy auto-authenticates to the Spark dashboard.

## Open Design Prompts

Use `prompts/create-dashboard.md` for a fresh project.

If a run copies the assets but stops before writing `index.html`, use `prompts/continue-after-assets.md`.

If a fresh project starts without the NVIDIA files, rerun `./install.sh` once so it recreates the stable asset source symlink, then use the updated `prompts/create-dashboard.md`. The prompt now verifies that these files exist before it writes the page:

```text
assets/nvidia/BRAND-NOTES.md
assets/nvidia/DESIGN.md
assets/nvidia/nvidia-logo-horz.svg
assets/nvidia/nvidia-logo-vert.svg
```

The package also includes those same files at the repo root under `assets/nvidia/`, so you can quickly verify the install with:

```bash
ls -la assets/nvidia
```

If a generated dashboard looks good but all live stats show empty values or `Error` inside the Open Design preview, use `prompts/fix-api-preview.md`. The preview runs on Open Design's port, so the page needs fallback API routing to the dashboard proxy on port `11100`.

You can also preview any generated project through the live proxy directly:

```bash
DGX_DEMO_PORT=11101 node bin/dgx-dashboard-proxy.mjs /path/to/open-design/.od/projects/<project-id>
```

Then open `http://127.0.0.1:11101/`.

## Agent Workflow

Use OpenCode/Qwen for full dashboard generation, asset bootstrap, API wiring, and any prompt that includes the design system or long Open Design context. OpenCode accepts the composed prompt through stdin, so it handles the larger prompts used by this demo.

Use Aider only for small, targeted follow-up edits after `index.html` already exists. A tiny typed request can still fail if Open Design's composed prompt includes a long chat history, selected design-system context, project instructions, and the full dashboard file. The Open Design Aider adapter passes that composed prompt as a command-line argument, so very large runs can fail before Aider starts with:

```text
Aider requires the prompt as a command-line argument and this run's composed prompt exceeds the safe size
```

If that happens, rerun the edit with OpenCode, start a fresh Open Design chat with only `index.html` selected, or run Aider directly from the generated project folder so it does not receive Open Design's full composed context:

```bash
cd /path/to/open-design/.od/projects/<project-id>
/path/to/open-design-campaign-pack-demo/bin/aider --message "Edit index.html only. Make this one small layout change: ..."
```

The highest-impact lessons were:

- keep OpenCode and Ollama output limits aligned at `12000`
- keep Qwen3-Coder `RENDERER` and `PARSER` metadata or tool calling breaks
- use OpenCode for large Open Design prompts; keep Aider for short one-file edits
- tell the agent not to read templates, not to plan aloud, and to write `index.html` first
- use the local proxy for live data instead of calling `localhost:11000` directly from the preview

## Files

```text
dashboard/index.html                         Working dashboard
assets/nvidia/                              Local brand assets and notes for new projects
dashboard/assets/nvidia/                     Local brand assets and notes
content-video-demo/                          HTML card to MP4 teaser workflow
campaign-pack/                               JSON to deterministic campaign PNG exports
bin/dgx-dashboard-proxy.mjs                  Static server + DGX API proxy
bin/opencode                                 OpenCode wrapper for Open Design
bin/opencode-cli                             Open Design-compatible OpenCode entry
bin/aider                                    Aider wrapper for local Qwen edits
ollama/qwen3-coder-30b-48k-od.Modelfile     Tool-capable Qwen3-Coder alias
opencode/opencode.json                       OpenCode local Ollama provider config
install.sh                                   Install/configure helper
start.sh                                     Start/restart dashboard proxy
stop.sh                                      Stop dashboard proxy
start-open-design.sh                         Start Open Design tools-dev runtime
stop-open-design.sh                          Stop Open Design tools-dev runtime
```

## Brand Note

The included NVIDIA marks should be used only according to NVIDIA's logo and brand usage rules. Do not redraw, recolor, crop, distort, stylize, or apply effects to the logo.
