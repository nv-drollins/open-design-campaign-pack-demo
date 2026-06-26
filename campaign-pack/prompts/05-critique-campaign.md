Create a design critique report for the current campaign concept.

Write one markdown file only:

```text
critique.md
```

Do not edit any JSON, HTML, CSS, JavaScript, SVG, renderer, or image files.

Use the campaign JSON file named by the creator. If no file is named, prefer:

1. `campaign-a-cyan-purple.json`
2. `campaign-a.json`
3. `campaign.json`

Read the selected JSON and inspect local assets only enough to understand the concept. Then write a practical creative-director critique that helps the designer improve the next iteration.

The report must include:

- selected source file
- one-paragraph summary of the current direction
- scorecard from 1 to 5 for:
  - philosophy
  - hierarchy
  - execution
  - specificity
  - restraint
  - brand fit
  - format adaptability
- what is working
- what needs revision
- concrete recommended JSON changes for:
  - `copy.eyebrow`
  - `copy.headline`
  - `copy.subhead`
  - `copy.cta`
  - `theme`
  - `layout.mood`
  - `notes`
- final recommendation: keep, revise, or reject

Rules:

- Be specific and useful, not generic.
- Keep the designer as the art director.
- Do not suggest modifying official logo artwork.
- Preserve local asset paths in your recommendations.
- Do not include long JSON blocks. Use short field-level recommendations.

After writing `critique.md`, verify it exists, then reply DONE.
