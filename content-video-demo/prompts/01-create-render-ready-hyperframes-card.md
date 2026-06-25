Create a single-file `index.html` promo card for the Prompt & Pixel podcast that is already a valid HyperFrames composition.

Before designing, read:
- `DESIGN.md`
- `announcement.md`

Use `cover.png` as the main artwork. The file must be referenced with a relative path:

```html
<img src="cover.png" alt="Prompt & Pixel cover art" class="cover-art">
```

## Hard Contract

Your output must use this HyperFrames-safe structure from the start.

Use this exact root element:

```html
<div id="stage" data-composition-id="teaser" data-start="0" data-width="1080" data-height="1920" data-duration="6">
```

Inside it, use this exact scene wrapper:

```html
<div id="scene-main" class="scene clip" data-start="0" data-duration="6" data-track-index="0">
```

Inside the scene, put every visible element inside:

```html
<div class="scene-content">...</div>
```

The visible composition must include these class names exactly so the required motion timeline always has targets:

```html
<div class="bg-orb orb-cyan"></div>
<div class="bg-orb orb-purple"></div>
<article class="glass-card">
  <img src="cover.png" alt="Prompt & Pixel cover art" class="cover-art">
  <h1 class="episode-title">...</h1>
  <p class="description">...</p>
  <div class="cta">...</div>
  <div class="tag-row">
    <span class="tag">...</span>
  </div>
</article>
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

## Required Script

Load GSAP from CDN in the document:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
```

At the bottom of the HTML, include this exact timeline registration pattern. You may add more finite tweens, but preserve this object registry and finite repeat structure:

```javascript
const totalDuration = 6;
const floatCycleDuration = 3;
const tl = gsap.timeline({ paused: true });
const __hfDurationKeeper = { progress: 0 };
tl.to(__hfDurationKeeper, { duration: totalDuration, progress: 1, ease: "none" }, 0);

// 1. Entrance animation (0.5s delay to avoid jump cuts)
tl.from(".scene-content", { duration: 1, opacity: 0, y: 50, ease: "power2.out" }, 0.5);
tl.from(".episode-title", { duration: 0.8, opacity: 0, scale: 0.9, ease: "back.out(1.7)" }, 1.0);
tl.from(".description, .cta, .tag", { duration: 0.7, opacity: 0, y: 24, stagger: 0.08, ease: "power2.out" }, 1.25);

// 2. Finite full-duration motion, visible throughout the MP4
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
```

## Visual Requirements

- Vertical 9:16 reel composition: 1080px by 1920px.
- Highly polished glassmorphism effect on the main card.
- Use the Prompt & Pixel brand system from `DESIGN.md`.
- Use the launch copy from `announcement.md`.
- Include the series name, episode number, episode title, short description, host/guest line if useful, CTA, and tags.
- Keep the cover art visually dominant, but leave enough room for readable text.
- Dark premium background with cyan/purple glow accents.
- Include visible motion across the full 6 seconds: cover art float/scale, card drift, and background glow drift.
- Motion must be obvious enough to notice in the MP4, not just a subtle entrance.
- No external APIs.
- No external product photos.
- Vanilla HTML, CSS, and JavaScript only, except for GSAP.
- Do not output HTML in chat.

Write `index.html`, verify it exists, then reply DONE.
