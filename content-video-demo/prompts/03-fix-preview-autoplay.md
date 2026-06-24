Edit `index.html` only.

The HyperFrames preview pane is blank because the GSAP timeline is paused at `0.00s`, where the intro opacity may still be `0`.

Update the script at the bottom of `index.html` so the renderer can still drive a paused timeline, but the studio/browser preview auto-plays and loops.

Keep the existing timeline animations. Do not redesign the card.

Also verify and fix the HyperFrames root contract if needed:

```html
<div id="stage" data-composition-id="teaser" data-start="0" data-width="1080" data-height="1920" data-duration="6">
```

Do not use a custom `<stage>` tag. Do not use `data-id` instead of `data-composition-id`.

The script must follow this pattern:

```javascript
const tl = gsap.timeline({ paused: true });

// Keep the existing tl.from and tl.to animations here.

window.__timelines = window.__timelines || {};
window.__timelines["teaser"] = tl;

// PREVIEW HELPER: Auto-play and loop in the studio panel, but stay paused for headless rendering
if (!window.location.search.includes("render")) {
  tl.play();
  tl.eventCallback("onComplete", () => tl.restart());
}
```

Do not initialize `window.__timelines` as an array. Do not use `window.__timelines.push(...)`. Do not use `repeat: -1`; use a finite repeat count instead.

After editing, verify `index.html` exists and reply DONE.

