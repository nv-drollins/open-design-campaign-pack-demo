Turn the approved `index.html` web promo card into a 6-second MP4-ready HyperFrames composition for social media.

Edit `index.html` only.

Preserve the creator-approved visual direction, copy, brand feel, glassmorphism treatment, and `cover.png` artwork. Do not redesign the card from scratch. Adapt the layout only as needed to fit a vertical 9:16 reel.

If `cover.png` is not in the current project folder, copy it before editing `index.html`:

```bash
cp /home/nvidia/dgx-spark-dashboard-demo/content-video-demo/assets/cover.png cover.png
```

The output must still preview well in Open Design, but it must also render successfully with:

```bash
npx --yes hyperframes render --output teaser.mp4
```

## Required HyperFrames Structure

Load GSAP from CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
```

Use this exact root composition element:

```html
<div id="stage" data-composition-id="teaser" data-start="0" data-width="1080" data-height="1920" data-duration="6">
```

Inside it, use this exact scene wrapper:

```html
<div class="scene clip" data-start="0" data-duration="6" data-track-index="0">
```

Inside that scene, put all visible content inside:

```html
<div class="scene-content">...</div>
```

Use CSS selector `#stage`, not `stage`.

Do not use:
- a custom `<stage>` tag
- `data-id` instead of `data-composition-id`
- `data-scene` instead of `data-start` / `data-duration` / `data-track-index`
- `window.__timelines = []`
- `window.__timelines.push(...)`
- `repeat: -1`
- `DOMContentLoaded` around timeline registration

## Required Motion Targets

Make sure the HTML contains real elements matching these classes so the timeline has visible targets:

```html
<div class="bg-orb orb-cyan"></div>
<div class="bg-orb orb-purple"></div>
<article class="glass-card">
  <img src="cover.png" alt="Prompt & Pixel cover art" class="cover-art">
  ...
</article>
```

If the existing card uses different class names, add these classes to the existing elements rather than rebuilding the design.

## Required Timeline

Register a paused GSAP timeline on `window.__timelines["teaser"]` so HyperFrames can seek frame-by-frame.

Use this exact pattern at the bottom of the file. You may add additional finite tweens, but keep these tweens and registry lines:

```javascript
const totalDuration = 6;
const floatCycleDuration = 3;
const tl = gsap.timeline({ paused: true });

// 1. Entrance animation (0.5s delay to avoid jump cuts)
tl.from(".scene-content", { duration: 1, opacity: 0, y: 50, ease: "power2.out" }, 0.5);
tl.from("h1, .episode-title, .episode-number", { duration: 0.8, opacity: 0, scale: 0.9, ease: "back.out(1.7)" }, 1.0);
tl.from(".description, .cta, .cta-button, .tag", { duration: 0.7, opacity: 0, y: 24, stagger: 0.08, ease: "power2.out" }, 1.25);

// 2. Visible full-duration motion
tl.to(".cover-art", {
  duration: floatCycleDuration,
  y: "-=32",
  scale: 1.025,
  repeat: Math.floor(totalDuration / floatCycleDuration) - 1,
  yoyo: true,
  ease: "sine.inOut"
}, 0);

tl.to(".glass-card", {
  duration: floatCycleDuration,
  y: "-=18",
  rotate: 0.35,
  repeat: Math.floor(totalDuration / floatCycleDuration) - 1,
  yoyo: true,
  ease: "sine.inOut"
}, 0);

tl.to(".orb-cyan", {
  duration: totalDuration,
  x: 80,
  y: -120,
  scale: 1.2,
  ease: "sine.inOut"
}, 0);

tl.to(".orb-purple", {
  duration: totalDuration,
  x: -90,
  y: 110,
  scale: 1.15,
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

## Video Requirements

- Vertical 9:16 reel format: 1080px by 1920px.
- Duration: 6 seconds.
- Keep glassmorphism crisp.
- Motion must be visible across the full MP4: cover art float/scale, card drift, and background glow drift.
- Keep all GSAP repeats finite and deterministic.
- No external libraries except GSAP.
- Do not output HTML in chat.

After editing, verify `index.html` exists, then reply DONE.
