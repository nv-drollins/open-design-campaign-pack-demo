Apply the current critique to one campaign JSON file.

Read `critique.md` first. Then read the campaign JSON file named by the creator. If no file is named, use the source file listed in `critique.md`.

Write one JSON file only:

```text
<base-name>-revised.json
```

Examples:
- if the base is `campaign-a.json`, write `campaign-a-revised.json`
- if the base is `campaign-a-cyan-purple.json`, write `campaign-a-cyan-purple-revised.json`
- if the base is `campaign.json`, write `campaign-revised.json`

Do not edit the original JSON. Do not create or edit HTML, CSS, JavaScript, SVG, renderer, markdown, or image files.

Preserve the base file's schema exactly:

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
    "Creator remains the art director."
  ]
}
```

Rules:

- Preserve `brand.logo` and `assets.hero` exactly unless the creator explicitly asks to change assets.
- Keep the headline under 9 words.
- Keep the subhead under 26 words.
- Make revisions visible enough to justify a before/after review board.
- Improve clarity, hierarchy, brand fit, and format adaptability based on `critique.md`.
- Keep valid JSON only.
- Do not include markdown fences in the JSON file.
- Do not output JSON in chat.

After writing the revised JSON, verify it exists and is valid JSON, then reply DONE.
