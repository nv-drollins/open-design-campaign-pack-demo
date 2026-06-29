# Open-Design Campaign Pack Demo

This repo contains a focused Open Design demo for campaign asset creation.

Open Design acts as the designer's local AI assistant. It writes and edits structured campaign JSON. A fixed local renderer then turns that JSON into predictable PNG assets, so the live demo can focus on creative direction instead of fragile HTML generation.

The campaign workflow supports:

- initial campaign direction generation
- designer-guided JSON edits
- three concept directions
- colorway variants for a selected concept
- critique and before/after review
- deterministic local export of production-size PNG assets

## What Runs

The live demo uses two local pieces:

- Open Design at `http://127.0.0.1:7457/`
- the Campaign Asset Pack renderer under `campaign-pack/`

The renderer exports:

```text
exports/keynote-16x9.png      1920x1080
exports/vertical-poster.png   1080x1920
exports/social-square.png     1080x1080
exports/linkedin-banner.png   1584x396
```

## Scripted Install

On a freshly imaged Spark, `install.sh` bootstraps the runtime dependencies it needs:

- Node.js 24 via NodeSource
- base packages such as `curl`, `ca-certificates`, `gnupg`, `git`, `python3`, and `python3-venv`
- a local OpenCode CLI install under `.tools/opencode/`
- Ollama, if it is not already installed
- the local `qwen3-coder:30b-48k-od` Ollama alias
- an optional Aider virtual environment
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

Open:

```text
http://127.0.0.1:7457/
```

Stop the local Open Design runtime with:

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

the Spark probably has another Node binary, such as one from conda/base, earlier in `PATH` than the NodeSource install. The installer prefers `/usr/bin/node` when it is Node 24, but you can also retry from the same shell with:

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

## Campaign Demo Flow

After the scripted install, start Open Design:

```bash
./start.sh
```

Open:

```text
http://127.0.0.1:7457/
```

Use OpenCode/Qwen in Open Design for the main demo prompts.

### One Campaign

Use this flow when you want a fast single-direction campaign asset pack.

1. Create a new Open Design project.
2. Prepare the bundled campaign assets:

   ```bash
   ./campaign-pack/scripts/prepare-project-assets.sh open-design/.od/projects/<project-id>
   ```

3. In Open Design, run `campaign-pack/prompts/01-create-campaign-json.md`.
4. Iterate as the designer by asking Open Design to edit `campaign.json` only. For example:

   ```text
   Edit campaign.json only. Make the campaign feel more premium, shorten the headline, and make the CTA more direct.
   ```

5. Optional: use `campaign-pack/prompts/02-refine-campaign-json.md` as a reusable refinement prompt.
6. Render the asset pack from the repo root:

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

### Stronger Ideation Moment

Use this flow when you want the creator to compare directions, pick a favorite, explore colorways, critique, revise, and export a before/after board.

1. Create a new Open Design project.
2. Prepare the bundled campaign assets:

   ```bash
   ./campaign-pack/scripts/prepare-project-assets.sh open-design/.od/projects/<project-id>
   ```

3. In Open Design, run `campaign-pack/prompts/03-create-concept-set.md`.
4. Render all concepts plus a contact sheet:

   ```bash
   node campaign-pack/scripts/render-concepts.mjs open-design/.od/projects/<project-id>
   ```

   This writes concept folders and `exports/contact-sheet.png`.

5. Pick a favorite concept.
6. Run `campaign-pack/prompts/04-create-colorway-variants.md`.
7. Tell Open Design which concept to use, for example:

   ```text
   Use campaign-a.json as the base and create the colorway variants.
   ```

8. Render only that selected concept's variants:

   ```bash
   node campaign-pack/scripts/render-concepts.mjs \
     open-design/.od/projects/<project-id> \
     --variants-of campaign-a
   ```

   This writes variant folders such as `exports/campaign-a-green/`, `exports/campaign-a-cyan-purple/`, and `exports/campaign-a-mono/`.

9. Critique the chosen direction with `campaign-pack/prompts/05-critique-campaign.md`:

   ```text
   Critique campaign-a-cyan-purple.json.
   ```

10. Snapshot the selected campaign before applying critique:

   ```bash
   node campaign-pack/scripts/snapshot-campaign.mjs \
     open-design/.od/projects/<project-id> \
     campaign-a-cyan-purple.json
   ```

11. Apply the critique with `campaign-pack/prompts/06-apply-critique.md`:

   ```text
   Apply critique.md to campaign-a-cyan-purple.json.
   ```

12. Render the before/after board:

   ```bash
   node campaign-pack/scripts/render-before-after.mjs \
     open-design/.od/projects/<project-id>/campaign-a-cyan-purple-before.json \
     open-design/.od/projects/<project-id>/campaign-a-cyan-purple.json
   ```

   This writes `exports/before-after/before-after.png`.

## Prompt Files

- `campaign-pack/prompts/01-create-campaign-json.md` creates the initial structured campaign direction.
- `campaign-pack/prompts/02-refine-campaign-json.md` is a reusable edit prompt for follow-up design direction.
- `campaign-pack/prompts/03-create-concept-set.md` creates three distinct campaign directions.
- `campaign-pack/prompts/04-create-colorway-variants.md` creates green, cyan/purple, and monochrome variants from an approved concept.
- `campaign-pack/prompts/05-critique-campaign.md` writes a creative-director critique report.
- `campaign-pack/prompts/06-apply-critique.md` applies that critique to the selected campaign JSON.

## Renderer Scripts

- `campaign-pack/scripts/prepare-project-assets.sh` copies stable local demo assets into an Open Design project.
- `campaign-pack/scripts/render-pack.mjs` exports one campaign JSON into four production PNGs.
- `campaign-pack/scripts/render-concepts.mjs` exports multiple campaign JSON files plus a contact sheet.
- `campaign-pack/scripts/snapshot-campaign.mjs` creates a before snapshot before critique changes are applied.
- `campaign-pack/scripts/render-before-after.mjs` exports two campaign JSON files and a before/after board.

## Sample Renderer Test

Render the included sample from the repo root:

```bash
node campaign-pack/scripts/render-pack.mjs campaign-pack/sample/campaign.json
```

Render the sample as a contact sheet:

```bash
node campaign-pack/scripts/render-concepts.mjs campaign-pack/sample
```

The sample uses existing repo assets so the renderer can be tested immediately after install.

## Remote Laptop Access

Recommended: keep Open Design local-only and tunnel it from your laptop:

```bash
ssh -L 7457:127.0.0.1:7457 nvidia@<spark-host>
```

Then open this on the laptop:

```text
http://127.0.0.1:7457/
```

## Agent Workflow

Use OpenCode/Qwen for full campaign generation, concept sets, colorways, critique, and JSON revisions. OpenCode accepts the composed prompt through stdin, so it handles the larger prompts used by this demo.

Use Aider only for small, targeted follow-up edits after the campaign JSON already exists. If Open Design's Aider adapter receives too much composed context, rerun the edit with OpenCode, start a fresh Open Design chat with only the target JSON selected, or run Aider directly from the generated project folder:

```bash
cd /path/to/open-design/.od/projects/<project-id>
/path/to/open-design-campaign-pack-demo/bin/aider --message "Edit campaign.json only. Make this one small copy change: ..."
```

The highest-impact lessons were:

- keep OpenCode and Ollama output limits aligned at `12000`
- keep Qwen3-Coder `RENDERER` and `PARSER` metadata or tool calling breaks
- use OpenCode for larger Open Design prompts; keep Aider for short one-file edits
- keep the renderer fixed and let the model edit structured campaign JSON
- snapshot the chosen campaign before applying critique, so before/after rendering stays reliable

## Files

```text
campaign-pack/                               Campaign JSON prompts, local assets, renderer scripts, and sample
campaign-pack/assets/                        Campaign demo assets, including the NVIDIA horizontal logo
assets/nvidia/                               Local NVIDIA brand notes and reference files
bin/opencode                                 OpenCode wrapper for Open Design
bin/opencode-cli                             Open Design-compatible OpenCode entry
bin/aider                                    Aider wrapper for local Qwen edits
ollama/qwen3-coder-30b-48k-od.Modelfile     Tool-capable Qwen3-Coder alias
opencode/opencode.json                       OpenCode local Ollama provider config
install.sh                                   Install/configure helper
start.sh                                     Start Open Design runtime
stop.sh                                      Stop Open Design runtime
start-open-design.sh                         Start Open Design tools-dev runtime
stop-open-design.sh                          Stop Open Design tools-dev runtime
```

## Brand Note

The included NVIDIA marks should be used only according to NVIDIA's logo and brand usage rules. Do not redraw, recolor, crop, distort, stylize, or apply effects to the logo.
