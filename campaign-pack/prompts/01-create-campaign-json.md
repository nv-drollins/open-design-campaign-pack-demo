Create a campaign direction for a deterministic asset-pack renderer.

Write `campaign.json` only. Do not create or edit HTML, CSS, JavaScript, SVG, or renderer files.

Before writing, inspect the project folder for available assets. Use local relative asset paths only.

If the project was prepared with `campaign-pack/scripts/prepare-project-assets.sh`, use:

- logo: `assets/nvidia-logo-horz.svg`
- hero: `assets/premium-workstation.svg`

If those files are not present, prefer:

- a brand logo file if present
- a product, cover, or hero image if present
- `DESIGN.md` or brand notes if present

The output file must be valid JSON and must follow this structure:

```json
{
  "campaignName": "Short campaign name",
  "brand": {
    "name": "Brand or product name",
    "logo": "relative/path/to/logo.svg"
  },
  "assets": {
    "hero": "relative/path/to/hero-or-product-image.png"
  },
  "theme": {
    "background": "#05070d",
    "surface": "rgba(14, 19, 29, 0.78)",
    "primary": "#76B900",
    "accent": "#4de7ff",
    "secondary": "#b26cff",
    "text": "#f7fbff",
    "muted": "#9da8b7"
  },
  "copy": {
    "eyebrow": "Short context line",
    "headline": "Strong campaign headline",
    "subhead": "One sentence value proposition.",
    "cta": "Short call to action",
    "footer": "Short footer or event label"
  },
  "layout": {
    "mood": "visual mood in one phrase",
    "imagePlacement": "right",
    "density": "balanced"
  },
  "notes": [
    "Creator remains the art director.",
    "AI helps explore layout, copy, variants, and critique."
  ]
}
```

Rules:
- Keep the headline under 9 words.
- Keep the subhead under 26 words.
- Use punchy, designer-friendly copy.
- Do not include markdown fences in `campaign.json`.
- Do not invent remote URLs.
- Do not output JSON in chat.

After writing `campaign.json`, verify it exists and is valid JSON, then reply DONE.
