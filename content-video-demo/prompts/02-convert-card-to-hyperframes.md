Turn the approved `index.html` web promo card into a 6-second MP4-ready HyperFrames composition for social media.

Edit `index.html` only.

Preserve the creator-approved visual direction, copy, brand feel, glassmorphism treatment, and `cover.png` artwork. Do not redesign the card from scratch. Adapt the layout only as needed to fit a vertical 9:16 reel.

This is no longer a small mobile webpage. Recompose it as a full-size 1080px by 1920px video frame:
- the stage must be exactly 1080px wide and 1920px tall
- the visible design should fill the frame confidently, not sit as a tiny mobile card in the middle
- the main glass card should be roughly 780px to 900px wide
- avoid mobile-only `max-width` values such as `360px`, `420px`, or `480px` on the main composition/card
- keep all important text, cover art, and CTA at least 96px away from the video edges
- use `overflow: hidden` on the stage so motion never reveals off-canvas content

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
<div id="scene-main" class="scene clip" data-start="0" data-duration="6" data-track-index="0">
```

Inside that scene, put all visible content inside:

```html
<div class="scene-content">...</div>
```

Use CSS selector `#stage`, not `stage`.

Include this render guard CSS near the end of the `<style>` block:

```css
html,
body {
  margin: 0;
  width: 1080px;
  height: 1920px;
  overflow: hidden;
  background: #05070d;
}

#stage {
  position: relative;
  width: 1080px;
  height: 1920px;
  overflow: hidden;
  isolation: isolate;
  transform-origin: 0 0;
}

#scene-main,
#stage .scene,
#stage .clip {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#stage .scene-content {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

#stage .glass-card {
  box-sizing: border-box;
  width: min(860px, calc(100% - 160px));
  max-width: 860px;
}
```

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
const __hfDurationKeeper = { progress: 0 };
tl.to(__hfDurationKeeper, { duration: totalDuration, progress: 1, ease: "none" }, 0);

// 1. Entrance animation (0.5s delay to avoid jump cuts)
tl.from(".scene-content", { duration: 1, opacity: 0, y: 50, ease: "power2.out" }, 0.5);
tl.from("h1, .episode-title, .episode-number", { duration: 0.8, opacity: 0, scale: 0.9, ease: "back.out(1.7)" }, 1.0);
tl.from(".description, .cta, .cta-button, .tag", { duration: 0.7, opacity: 0, y: 24, stagger: 0.08, ease: "power2.out" }, 1.25);

// 2. Visible full-duration motion
tl.to(".cover-art", {
  duration: floatCycleDuration,
  y: "-=16",
  scale: 1.012,
  repeat: Math.floor(totalDuration / floatCycleDuration) - 1,
  yoyo: true,
  ease: "sine.inOut"
}, 0);

tl.to(".glass-card", {
  duration: floatCycleDuration,
  y: "-=8",
  rotate: 0.15,
  repeat: Math.floor(totalDuration / floatCycleDuration) - 1,
  yoyo: true,
  ease: "sine.inOut"
}, 0);

tl.to(".orb-cyan", {
  duration: totalDuration,
  x: 48,
  y: -72,
  scale: 1.08,
  ease: "sine.inOut"
}, 0);

tl.to(".orb-purple", {
  duration: totalDuration,
  x: -54,
  y: 66,
  scale: 1.08,
  ease: "sine.inOut"
}, 0);

window.__timelines = window.__timelines || {};
window.__timelines["teaser"] = tl;
```

## Video Requirements

- Vertical 9:16 reel format: 1080px by 1920px.
- Duration: 6 seconds.
- Keep glassmorphism crisp.
- Motion must be visible across the full MP4: cover art float/scale, card drift, and background glow drift.
- Motion must remain frame-safe: no important element may leave the 1080px by 1920px stage.
- Keep all GSAP repeats finite and deterministic.
- No external libraries except GSAP.
- Do not output HTML in chat.

After editing, verify `index.html` exists, then reply DONE.

Before replying DONE, self-check that `index.html` contains all of these exact strings:

```text
data-composition-id="teaser"
data-start="0"
data-width="1080"
data-height="1920"
data-duration="6"
class="scene clip"
data-track-index="0"
window.__timelines["teaser"]
__hfDurationKeeper
```

Also verify it does not contain:

```text
window.__timelines = []
window.__timelines.push
repeat: -1
tl.play
```
