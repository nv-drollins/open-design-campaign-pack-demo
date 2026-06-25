Edit `index.html` only.

The MP4 renders, but the video design is too small, the layout looks like a mobile card placed inside a large canvas, or the animation moves important elements out of frame.

Keep the approved visual design, copy, brand feel, glassmorphism treatment, and `cover.png` artwork. Do not redesign from scratch. Only fix video sizing, composition scale, and frame-safe motion.

## Fix The Video Frame

Make the composition a true 1080px by 1920px vertical reel:

- `#stage` must be exactly 1080px wide and 1920px tall.
- `.scene-content` must fill the stage.
- The main glass card should be roughly 780px to 900px wide.
- Remove or override tiny mobile `max-width` values such as `360px`, `420px`, or `480px` on the main composition/card.
- Keep all important text, cover art, and CTA at least 96px away from the video edges.
- Use `overflow: hidden` on the stage.

Add or update this CSS near the end of the `<style>` block:

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

## Fix The Motion

Replace the bottom GSAP timeline with this frame-safe version. It keeps visible motion but uses smaller travel values so nothing important exits the frame:

```javascript
const totalDuration = 6;
const floatCycleDuration = 3;
const tl = gsap.timeline({ paused: true });
const __hfDurationKeeper = { progress: 0 };
tl.to(__hfDurationKeeper, { duration: totalDuration, progress: 1, ease: "none" }, 0);

tl.from(".scene-content", { duration: 1, opacity: 0, y: 36, ease: "power2.out" }, 0.5);
tl.from("h1, .episode-title, .episode-number", { duration: 0.8, opacity: 0, scale: 0.94, ease: "back.out(1.45)" }, 1.0);
tl.from(".description, .cta, .cta-button, .tag", { duration: 0.7, opacity: 0, y: 18, stagger: 0.08, ease: "power2.out" }, 1.25);

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

tl.to(".orb-cyan, .glow-cyan", {
  duration: totalDuration,
  x: 48,
  y: -72,
  scale: 1.08,
  ease: "sine.inOut"
}, 0);

tl.to(".orb-purple, .glow-purple", {
  duration: totalDuration,
  x: -54,
  y: 66,
  scale: 1.08,
  ease: "sine.inOut"
}, 0);

window.__timelines = window.__timelines || {};
window.__timelines["teaser"] = tl;
```

Important:
- Do not use `repeat: -1`.
- Do not call `tl.play()`.
- Do not initialize `window.__timelines` as an array.
- Do not call `window.__timelines.push(...)`.
- Do not wrap the timeline registration in `DOMContentLoaded`.
- Do not output HTML in chat.

After editing, verify `index.html` exists, then reply DONE.
