Edit `index.html` only.

The HyperFrames render gets past metadata/duration resolution, then fails during headless capture with:

```text
[FrameCapture] Composition has zero duration
Runtime ready: false, __player: true, __hf.seek: true, GSAP timeline: true, data-duration: 6s
```

This usually means preview-only timeline playback is interfering with HyperFrames' frame-by-frame seeking.

Do not redesign the card. Do not change the copy, layout, assets, or timing. Only make the preview helper render-safe.

Find any preview helper like this:

```javascript
if (!window.location.search.includes("render")) {
  tl.play();
  tl.eventCallback("onComplete", () => tl.restart());
}
```

Replace it with this guarded version:

```javascript
const isHeadlessRender = window.location.search.includes("render") || navigator.webdriver;
if (!isHeadlessRender) {
  tl.play();
  tl.eventCallback("onComplete", () => tl.restart());
}
```

Keep these requirements intact:
- `data-composition-id="teaser"`
- `data-start="0"`
- `data-width="1080"`
- `data-height="1920"`
- `data-duration="6"`
- `window.__timelines["teaser"] = tl`
- no `repeat: -1`
- no `window.__timelines.push(...)`

After editing, verify `index.html` exists, then reply DONE.
