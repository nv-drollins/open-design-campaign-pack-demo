Convert the active `index.html` promo card into a valid HyperFrames HTML video composition.

Edit `index.html` only.

Use the existing visual direction, copy, and `cover.png` artwork. Keep the Prompt & Pixel brand identity from `DESIGN.md`.

## Core Structure Rules

1. Load GSAP from CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
```

2. Wrap everything in this root stage element:

```html
<div id="stage" data-composition-id="teaser" data-start="0" data-width="1080" data-height="1920" data-duration="6">
```

Use this exact element. Do not use a custom `<stage>` tag. Do not use `data-id`, `data-scene`, or `data-version` as substitutes for the required HyperFrames attributes.

3. Inside the stage, create one main scene:

```html
<div class="scene clip" data-start="0" data-duration="6" data-track-index="0">
```

Use these exact scene attributes. Do not use `data-scene` as a substitute.

4. Place all visual elements inside a `.scene-content` wrapper inside that scene.

5. Size the composition as a vertical 9:16 reel:
- width: `1080px`
- height: `1920px`
- overflow hidden
- no scrollbars

## Timeline Rules

Register a paused GSAP timeline on the global window object so the renderer can drive the playhead frame-by-frame.

Include this exact script structure at the bottom, adapting selectors only if absolutely necessary. Do not wrap the timeline registration in `DOMContentLoaded`. Do not initialize `window.__timelines` as an array. Do not use `window.__timelines.push(...)`. Do not use `repeat: -1`.

```javascript
const totalDuration = 6;
const floatCycleDuration = 3;
const tl = gsap.timeline({ paused: true });

// 1. Entrance animation (0.5s delay to avoid jump cuts)
tl.from(".scene-content", { duration: 1, opacity: 0, y: 50, ease: "power2.out" }, 0.5);
tl.from("h1", { duration: 0.8, opacity: 0, scale: 0.9, ease: "back.out(1.7)" }, 1.0);

// 2. Finite mid-scene floating activity (so it's not a static image)
tl.to("img", {
  duration: floatCycleDuration,
  y: "-=15",
  repeat: Math.floor(totalDuration / floatCycleDuration) - 1,
  yoyo: true,
  ease: "sine.inOut"
}, 0);

window.__timelines = window.__timelines || {};
window.__timelines["teaser"] = tl;

// PREVIEW HELPER: Auto-play and loop in the studio panel, but stay paused for headless rendering
if (!window.location.search.includes("render")) {
  tl.play();
  tl.eventCallback("onComplete", () => tl.restart());
}
```

Important:
- Keep glassmorphism crisp.
- Keep animation smooth and loop-friendly.
- Keep the renderer deterministic: no infinite GSAP repeats.
- The root composition must have `data-composition-id="teaser"`, `data-width="1080"`, `data-height="1920"`, and `data-duration="6"`.
- The registered timeline key must match the composition ID exactly: `window.__timelines["teaser"] = tl`.
- Do not use external libraries other than GSAP.
- Do not output HTML in chat.

After editing, verify `index.html` exists, then reply DONE.
