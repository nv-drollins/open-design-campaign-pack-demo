Edit `index.html` only.

The MP4 renders successfully, but it looks static. Keep the current visual design and HyperFrames structure, but make the motion clearly visible across the full 6-second render.

Do not redesign the card. Do not change the episode copy. Do not output HTML in chat.

Fix the animation script and, if needed, add harmless wrapper/classes so the animation selectors match real elements.

Required motion:
- cover image floats upward/downward by about 32px and subtly scales
- glass card drifts by about 18px and rotates slightly
- at least two background glow elements drift slowly for the full 6 seconds
- text/CTA/tags have a short entrance animation

The script at the bottom must use this pattern:

```javascript
const totalDuration = 6;
const floatCycleDuration = 3;
const tl = gsap.timeline({ paused: true });

tl.from(".scene-content", { duration: 1, opacity: 0, y: 50, ease: "power2.out" }, 0.5);
tl.from("h1, .episode-title, .episode-number", { duration: 0.8, opacity: 0, scale: 0.9, ease: "back.out(1.7)" }, 1.0);
tl.from(".description, .cta, .cta-button, .tag", { duration: 0.7, opacity: 0, y: 24, stagger: 0.08, ease: "power2.out" }, 1.25);

tl.to("img, .cover-art, .cover-container", {
  duration: floatCycleDuration,
  y: "-=32",
  scale: 1.025,
  repeat: Math.floor(totalDuration / floatCycleDuration) - 1,
  yoyo: true,
  ease: "sine.inOut"
}, 0);

tl.to(".glass-card, .content, .card", {
  duration: floatCycleDuration,
  y: "-=18",
  rotate: 0.35,
  repeat: Math.floor(totalDuration / floatCycleDuration) - 1,
  yoyo: true,
  ease: "sine.inOut"
}, 0);

tl.to(".orb-cyan, .glow-cyan", {
  duration: totalDuration,
  x: 80,
  y: -120,
  scale: 1.2,
  ease: "sine.inOut"
}, 0);

tl.to(".orb-purple, .glow-purple", {
  duration: totalDuration,
  x: -90,
  y: 110,
  scale: 1.15,
  ease: "sine.inOut"
}, 0);

window.__timelines = window.__timelines || {};
window.__timelines["teaser"] = tl;

if (!window.location.search.includes("render")) {
  tl.play();
  tl.eventCallback("onComplete", () => tl.restart());
}
```

Important:
- Do not use `repeat: -1`.
- Do not initialize `window.__timelines` as an array.
- Do not call `window.__timelines.push(...)`.
- Do not wrap the timeline registration in `DOMContentLoaded`.
- Preserve `data-composition-id="teaser"` on the root stage.

After editing, verify `index.html` exists, then reply DONE.
