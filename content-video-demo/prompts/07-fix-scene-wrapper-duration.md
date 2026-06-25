Edit `index.html` only.

The root HyperFrames composition is now valid, but render still fails during capture. HyperFrames logs the scene as:

```html
<div class="scene" data-start="0" data-track-index="0">
```

That scene wrapper is missing the required `clip` class and `data-duration="6"`. Fix only the scene wrapper and do not redesign the card.

Replace the scene wrapper with this exact opening tag:

```html
<div id="scene-main" class="scene clip" data-start="0" data-duration="6" data-track-index="0">
```

Keep the existing `.scene-content` and all visual content inside this scene.

Also verify the root still contains:

```text
data-composition-id="teaser"
data-start="0"
data-width="1080"
data-height="1920"
data-duration="6"
```

And verify the timeline still contains:

```text
window.__timelines["teaser"]
```

Do not add `tl.play()`. Do not use `repeat: -1`. Do not output HTML in chat.

After editing, verify `index.html` exists, then reply DONE.
