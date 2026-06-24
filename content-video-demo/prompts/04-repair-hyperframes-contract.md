Edit `index.html` only.

The current page failed HyperFrames render validation. Repair the HyperFrames composition contract without redesigning the card.

Fix these issues exactly:

1. Replace any custom `<stage ...>` element with this exact root element:

```html
<div id="stage" data-composition-id="teaser" data-start="0" data-width="1080" data-height="1920" data-duration="6">
```

Close it with `</div>`, not `</stage>`.

2. Replace the scene wrapper with:

```html
<div class="scene clip" data-start="0" data-duration="6" data-track-index="0">
```

3. Keep all visual content inside:

```html
<div class="scene-content">...</div>
```

4. Update CSS selectors that target `stage` so they target `#stage`.

5. Replace the script at the bottom with a deterministic HyperFrames-compatible GSAP registration:

```javascript
const totalDuration = 6;
const floatCycleDuration = 3;
const tl = gsap.timeline({ paused: true });

// 1. Entrance animation (0.5s delay to avoid jump cuts)
tl.from(".scene-content", { duration: 1, opacity: 0, y: 50, ease: "power2.out" }, 0.5);
tl.from("h1, .episode-title, .episode-number", { duration: 0.8, opacity: 0, scale: 0.9, ease: "back.out(1.7)" }, 1.0);

// 2. Finite mid-scene floating activity
tl.to("img, .cover-container", {
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
- Do not initialize `window.__timelines` as an array.
- Do not call `window.__timelines.push(...)`.
- Do not wrap timeline registration in `DOMContentLoaded`.
- Do not use `repeat: -1`.
- Do not call the composition ID `prompt-pixel-ep42`; use `teaser`.
- Do not output HTML in chat.

After editing, verify `index.html` exists, then reply DONE.
