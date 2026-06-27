# Campaign Asset Pack Demo

This demo uses Open Design as a campaign design assistant while keeping final rendering deterministic.

Open Design creates and edits `campaign.json`. A fixed local Chromium renderer reads that JSON and exports production-size PNG assets:

```text
exports/keynote-16x9.png      1920x1080
exports/vertical-poster.png   1080x1920
exports/social-square.png     1080x1080
exports/linkedin-banner.png   1584x396
```

The model never writes the renderer HTML. That keeps the live demo predictable: the creator can iterate on message, mood, hierarchy, and asset choices without breaking export formatting.

The demo also supports concept sets. Open Design can create `campaign-a.json`, `campaign-b.json`, and `campaign-c.json`, then the renderer exports every pack plus a `contact-sheet.png` for creative review. A follow-up critique flow can create `critique.md`, apply the critique into a revised JSON file, and render a fixed before/after board.

## One-Time Setup

From the repo root:

```bash
./campaign-pack/scripts/install-renderer-deps.sh
```

This installs a local Playwright renderer under `campaign-pack/.tools/playwright/` and downloads Playwright's Chromium browser.

## Project Assets

For a reliable live demo, prepare every new Open Design project with the bundled local assets:

```bash
./campaign-pack/scripts/prepare-project-assets.sh open-design/.od/projects/<project-id>
```

This copies these files into the project:

```text
assets/nvidia-logo-horz.svg
assets/premium-workstation.svg
assets/creator-energy.svg
assets/minimal-launch.svg
```

The concept-set prompt uses them as fixed local references:

- `campaign-a.json`: premium workstation / executive keynote
- `campaign-b.json`: energetic creator campaign / social-first
- `campaign-c.json`: minimalist technical launch / product-led

## Demo Flow

1. Create a new Open Design project.
2. Prepare the local assets:

   ```bash
   ./campaign-pack/scripts/prepare-project-assets.sh open-design/.od/projects/<project-id>
   ```

3. In Open Design, run `campaign-pack/prompts/01-create-campaign-json.md`.
4. Iterate with the creator using plain-language direction:

   ```text
   Edit campaign.json only. Make the campaign feel more premium and reduce the headline to six words.
   ```

5. Render the asset pack:

   ```bash
   node campaign-pack/scripts/render-pack.mjs open-design/.od/projects/<project-id>/campaign.json
   ```

The PNGs are written to `exports/` beside the `campaign.json` file.

## Multi-Concept Review Flow

Use this when you want a more visual ideation moment.

1. Create a new Open Design project and prepare the local assets:

   ```bash
   ./campaign-pack/scripts/prepare-project-assets.sh open-design/.od/projects/<project-id>
   ```

2. In Open Design, run `campaign-pack/prompts/03-create-concept-set.md`.
3. Iterate on one or more JSON files:

   ```text
   Edit campaign-b.json only. Make this direction more cinematic and reduce the subhead.
   ```

4. Render all concepts and a contact sheet:

   ```bash
   node campaign-pack/scripts/render-concepts.mjs open-design/.od/projects/<project-id>
   ```

The renderer writes:

```text
exports/campaign-a/
exports/campaign-b/
exports/campaign-c/
exports/contact-sheet.html
exports/contact-sheet.png
```

## Colorway Variant Flow

Use this after the creator picks a favorite concept direction.

1. Start from an existing concept file, such as `campaign-a.json`.
2. In Open Design, run `campaign-pack/prompts/04-create-colorway-variants.md`.
3. Tell the assistant which base concept to use:

   ```text
   Use campaign-a.json as the base and create the colorway variants.
   ```

4. Render only that selected concept's variants and contact sheet:

   ```bash
   node campaign-pack/scripts/render-concepts.mjs \
     open-design/.od/projects/<project-id> \
     --variants-of campaign-a
   ```

The prompt writes files such as:

```text
campaign-a-green.json
campaign-a-cyan-purple.json
campaign-a-mono.json
```

The `--variants-of campaign-a` flag keeps this review board focused on the selected direction's variants instead of re-rendering unrelated concepts such as `campaign-b.json` and `campaign-c.json`.

## Critique And Before/After Flow

Use this after the creator has a promising concept or colorway.

1. In Open Design, run `campaign-pack/prompts/05-critique-campaign.md`.
2. Tell the assistant which file to critique:

   ```text
   Critique campaign-a-cyan-purple.json.
   ```

3. Review the generated `critique.md` with the designer.
4. In Open Design, run `campaign-pack/prompts/06-apply-critique.md`.
5. Tell the assistant which file to revise:

   ```text
   Apply critique.md to campaign-a-cyan-purple.json.
   ```

6. Render a before/after board:

   ```bash
   node campaign-pack/scripts/render-before-after.mjs \
     open-design/.od/projects/<project-id>/campaign-a-cyan-purple.json \
     open-design/.od/projects/<project-id>/campaign-a-cyan-purple-revised.json
   ```

The renderer writes:

```text
exports/before-after/before/
exports/before-after/after/
exports/before-after/before-after.html
exports/before-after/before-after.png
```

## Prompt Files

- `prompts/01-create-campaign-json.md` creates the initial structured campaign direction.
- `prompts/02-refine-campaign-json.md` is a reusable edit prompt for follow-up design direction.
- `prompts/03-create-concept-set.md` creates three distinct campaign directions.
- `prompts/04-create-colorway-variants.md` creates green, cyan/purple, and monochrome variants from an approved concept.
- `prompts/05-critique-campaign.md` writes a creative-director critique report.
- `prompts/06-apply-critique.md` applies that critique into a revised campaign JSON.

## Script Files

- `scripts/prepare-project-assets.sh` copies stable local demo assets into an Open Design project.
- `scripts/render-pack.mjs` exports one campaign JSON into four production PNGs.
- `scripts/render-concepts.mjs` exports multiple campaign JSON files plus a contact sheet.
- `scripts/render-before-after.mjs` exports two campaign JSON files and a before/after board.

## Sample

Render the included sample from the repo root:

```bash
node campaign-pack/scripts/render-pack.mjs campaign-pack/sample/campaign.json
```

Render the sample as a contact sheet:

```bash
node campaign-pack/scripts/render-concepts.mjs campaign-pack/sample
```

The sample uses existing repo assets so the renderer can be tested immediately after install.
