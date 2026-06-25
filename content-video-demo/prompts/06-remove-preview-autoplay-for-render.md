Edit `index.html` only.

The HyperFrames render gets past metadata/duration resolution, then fails during headless capture with:

```text
[FrameCapture] Composition has zero duration
Runtime ready: false, __player: true, __hf.seek: true, GSAP timeline: true, data-duration: 6s
```

For the final MP4 render, remove all preview-only GSAP playback. HyperFrames must own the playhead and seek the paused timeline frame-by-frame.

Do not redesign the card. Do not change the copy, layout, assets, or animation timing.

Remove any block like this:

```javascript
if (!window.location.search.includes("render")) {
  tl.play();
  tl.eventCallback("onComplete", () => tl.restart());
}
```

Also remove guarded variants like this:

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
- no `tl.play()`

After editing, verify `index.html` exists, then reply DONE.
