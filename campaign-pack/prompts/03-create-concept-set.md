Create three distinct campaign directions for the deterministic asset-pack renderer.

Write these files only:

```text
campaign-a.json
campaign-b.json
campaign-c.json
```

Do not create or edit HTML, CSS, JavaScript, SVG, renderer files, or image files.

Before writing, inspect the project folder for available assets. Use local relative asset paths only.

If the project was prepared with `campaign-pack/scripts/prepare-project-assets.sh`, use these exact assets:

- logo: `assets/nvidia-logo-horz.svg`
- campaign-a hero: `assets/premium-workstation.svg`
- campaign-b hero: `assets/creator-energy.svg`
- campaign-c hero: `assets/minimal-launch.svg`

If those files are not present, prefer:

- a brand logo file if present
- a product, cover, or hero image if present
- `DESIGN.md` or brand notes if present

Each JSON file must follow the same schema as `campaign.json`:

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

Use three clearly different creative directions:

1. `campaign-a.json`: premium workstation / executive keynote
2. `campaign-b.json`: energetic creator campaign / social-first
3. `campaign-c.json`: minimalist technical launch / product-led

Rules:
- Keep each headline under 9 words.
- Keep each subhead under 26 words.
- Make the three directions meaningfully different in copy, mood, and palette.
- Use the same local logo path across all three unless a better local brand logo exists.
- Use different local hero asset paths for the three concepts when `assets/premium-workstation.svg`, `assets/creator-energy.svg`, and `assets/minimal-launch.svg` exist.
- Use valid JSON only.
- Do not include markdown fences in the JSON files.
- Do not output JSON in chat.

After writing all three files, verify they exist and are valid JSON, then reply DONE.
