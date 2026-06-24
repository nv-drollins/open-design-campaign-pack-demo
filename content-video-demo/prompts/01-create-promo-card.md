Create a single-file `index.html` web promo card for the Prompt & Pixel podcast.

This is the creator/design iteration step, not the final video-render step. Optimize for a beautiful live web preview that a creator can review and refine.

Use this creative brief:

> Look at `DESIGN.md` to understand my brand identity. Then, take the text from `announcement.md` and the `cover.png` asset in my folder, and build a beautiful, modern, mobile-first responsive promo card. Make it highly polished with a glassmorphism effect on the card.

Before designing, read:
- `DESIGN.md`
- `announcement.md`

If any of these files are missing from the current project folder, copy them from the demo assets folder before writing `index.html`:

```bash
cp /home/nvidia/dgx-spark-dashboard-demo/content-video-demo/assets/DESIGN.md DESIGN.md
cp /home/nvidia/dgx-spark-dashboard-demo/content-video-demo/assets/announcement.md announcement.md
cp /home/nvidia/dgx-spark-dashboard-demo/content-video-demo/assets/cover.png cover.png
```

Use `cover.png` as the main artwork. The file must be referenced with a relative path:

```html
<img src="cover.png" alt="Prompt & Pixel cover art">
```

Design requirements:
- Mobile-first responsive promo card.
- Highly polished glassmorphism effect on the main card.
- Use the Prompt & Pixel brand system from `DESIGN.md`.
- Use the launch copy from `announcement.md`.
- Include the series name, episode number, episode title, short description, host/guest line if useful, CTA, and tags.
- Keep the cover art visually dominant, but leave enough room for readable text.
- Dark premium background with cyan/purple glow accents.
- Make the card feel like a social-ready creative asset, not a generic dashboard or landing page.
- No external APIs.
- No external product photos.
- Vanilla HTML, CSS, and JavaScript only.
- Do not output HTML in chat.

Interaction and polish:
- Add subtle hover/focus states for the CTA and card if useful.
- Keep text readable on mobile and desktop preview sizes.
- Use tasteful glow, blur, border, and depth effects, but avoid clutter.

Future video conversion hooks:
- Structure the card with stable class names so it can be converted into a HyperFrames video later without redesigning it.
- Use `.glass-card` on the main card container.
- Use `.cover-art` on the `cover.png` image.
- Use `.episode-title` on the main title.
- Use `.description` on the short description text.
- Use `.cta` or `.cta-button` on the call-to-action element.
- Use `.tag` on each hashtag/tag.
- If you add background glow elements, use `.bg-orb`, plus `.orb-cyan` and `.orb-purple`.
- Do not add HyperFrames stage markup, GSAP, or `window.__timelines` in this first web-card step. Those belong in the later video conversion prompt.

Write `index.html`, verify it exists, then reply DONE.
