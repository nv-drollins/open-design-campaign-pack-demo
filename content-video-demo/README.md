# Prompt & Pixel Teaser Video Demo

This demo uses Open Design to generate a polished HTML promo card, then uses HyperFrames to render that HTML into a 6-second vertical MP4 teaser.

It is intentionally local-first:

- Open Design + OpenCode/Qwen create and edit the HTML.
- HyperFrames renders the HTML composition locally.
- Chromium and FFmpeg provide the local browser/video pipeline.

## Assets

```text
assets/DESIGN.md         Prompt & Pixel brand system
assets/announcement.md   Episode launch copy
assets/cover.png         Square cover artwork
```

## One-Time Setup

From this folder:

```bash
./scripts/install-renderer-deps.sh
```

The script checks for `ffmpeg` and a Chromium browser. On Ubuntu/Debian systems it can install missing packages with `sudo`.

The HyperFrames visual skill install is optional for this manual flow because `prompts/02-convert-card-to-hyperframes.md` tells Qwen to write the HyperFrames composition directly. The MP4 renderer still runs through `npx hyperframes render`.

If you want to try installing the visual skill picker anyway, run:

```bash
INSTALL_HYPERFRAMES_SKILL=1 ./scripts/install-renderer-deps.sh
```

If that prints `PromptScript does not support global skill installation`, skip it and continue with the manual prompts.

If Chromium is installed somewhere unusual, set:

```bash
export HYPERFRAMES_BROWSER_PATH=/path/to/chromium
```

## Open Design Flow

1. Create a new Open Design project.
2. Copy the three files from `assets/` into the project folder, or ask the agent to copy them first.
3. Use `prompts/01-create-promo-card.md` to create the initial web promo card.
4. Iterate with the creator until the web card is approved.
5. Use `prompts/02-convert-card-to-hyperframes.md` to turn the approved card into a 6-second vertical MP4-ready HyperFrames composition.

Optional shortcut: use `prompts/01-create-render-ready-hyperframes-card.md` only when you want to skip the web-card iteration step and generate a render-ready composition immediately.

## Repair Prompts

- If the studio preview is blank because the paused render timeline starts at opacity `0`, use `prompts/03-fix-preview-autoplay.md`.
- If render validation reports missing `data-composition-id`, missing dimensions, missing `window.__timelines`, `window.__timelines.push is not a function`, or `repeat: -1`, use `prompts/04-repair-hyperframes-contract.md`.
- If the MP4 renders but looks static, use `prompts/05-add-visible-motion.md`.
- If render gets past metadata resolution but fails during capture with `Runtime ready: false` and `data-duration: 6s`, use `prompts/06-make-timeline-render-safe.md`.

The HyperFrames output should keep this structure:

```html
<div id="stage" data-composition-id="teaser" data-start="0" data-width="1080" data-height="1920" data-duration="6">
  <div class="scene clip" data-start="0" data-duration="6" data-track-index="0">
    <div class="scene-content">...</div>
  </div>
</div>
```

## Render

From the Open Design project folder containing `index.html` and `cover.png`:

```bash
/home/nvidia/dgx-spark-dashboard-demo/content-video-demo/scripts/render-teaser.sh
```

Or from this demo folder, pass a project path:

```bash
./scripts/render-teaser.sh /path/to/open-design/.od/projects/<project-id>
```

The default output is `teaser.mp4` beside the `index.html` file.

## Troubleshooting

If `render-teaser.sh` stops at HyperFrames preflight, apply `prompts/04-repair-hyperframes-contract.md` in the current Open Design project, then rerun the render script.

If the preview is blank, the GSAP timeline is probably paused at time `0`. Apply `prompts/03-fix-preview-autoplay.md`.

If rendering cannot find Chromium, set:

```bash
export HYPERFRAMES_BROWSER_PATH="$(command -v chromium-browser || command -v chromium || command -v google-chrome)"
```

If `cover.png` is missing in the project folder, copy it beside `index.html` before rendering:

```bash
cp /home/nvidia/dgx-spark-dashboard-demo/content-video-demo/assets/cover.png .
```
