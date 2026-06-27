#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const demoDir = resolve(scriptDir, "..");
const renderPackScript = join(scriptDir, "render-pack.mjs");
const localBrowsersPath = join(demoDir, ".tools/playwright-browsers");
const options = parseArgs(process.argv.slice(2));
const input = resolve(options.input || ".");
const projectDir = existsSync(input) && statIsDir(input) ? input : dirname(input);
const outputRoot = resolve(options.output || join(projectDir, "exports"));
const conceptFiles = findConceptFiles(input, options);

if (conceptFiles.length === 0) {
  const suffix = options.variantsOf ? ` for variants of ${options.variantsOf}` : "";
  throw new Error(`No campaign concept JSON files found in ${input}${suffix}`);
}

mkdirSync(outputRoot, { recursive: true });

const concepts = [];

for (const file of conceptFiles) {
  const id = basename(file, extname(file));
  const outDir = join(outputRoot, id);
  console.log(`\nRendering concept ${id}`);
  const result = spawnSync(process.execPath, [renderPackScript, file, outDir], {
    stdio: "inherit",
    env: process.env
  });

  if (result.status !== 0) {
    throw new Error(`Render failed for ${file}`);
  }

  const campaign = JSON.parse(readFileSync(file, "utf8"));
  concepts.push({
    id,
    file,
    outDir,
    campaignName: text(campaign.campaignName, id),
    headline: text(campaign.copy?.headline, "Untitled campaign"),
    subhead: text(campaign.copy?.subhead, ""),
    mood: text(campaign.layout?.mood, ""),
    primary: text(campaign.theme?.primary, "#76B900"),
    accent: text(campaign.theme?.accent, "#4de7ff")
  });
}

const contactHtml = join(outputRoot, "contact-sheet.html");
const contactPng = join(outputRoot, "contact-sheet.png");
writeFileSync(contactHtml, renderContactSheet(concepts, outputRoot));
await captureContactSheet(contactHtml, contactPng);
verifyPng(contactPng, 2400, 1600);

console.log(`\nContact sheet: ${contactPng}`);
console.log(`Concept export root: ${outputRoot}`);

function parseArgs(args) {
  const positional = [];
  const parsed = {
    input: ".",
    output: "",
    variantsOf: ""
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    if (arg === "--variants-of") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--variants-of requires a base concept name, such as campaign-a");
      }
      parsed.variantsOf = baseNameWithoutJson(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--variants-of=")) {
      parsed.variantsOf = baseNameWithoutJson(arg.slice("--variants-of=".length));
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positional.push(arg);
  }

  parsed.input = positional[0] || ".";
  parsed.output = positional[1] || "";
  return parsed;
}

function printUsage() {
  console.log(`Usage:
  node campaign-pack/scripts/render-concepts.mjs [project-dir-or-json] [output-dir]
  node campaign-pack/scripts/render-concepts.mjs [project-dir] --variants-of campaign-a

Examples:
  node campaign-pack/scripts/render-concepts.mjs open-design/.od/projects/<project-id>
  node campaign-pack/scripts/render-concepts.mjs open-design/.od/projects/<project-id> --variants-of campaign-a`);
}

function statIsDir(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function findConceptFiles(path, currentOptions) {
  if (existsSync(path) && !statIsDir(path)) {
    return [path];
  }

  const names = readdirSync(path)
    .filter((name) => name.endsWith(".json"))
    .filter((name) => /^(campaign|concept)([-_][a-z0-9]+)*\.json$/i.test(name))
    .sort();

  if (currentOptions.variantsOf) {
    const base = currentOptions.variantsOf;
    const preferredVariants = [
      `${base}-green.json`,
      `${base}-cyan-purple.json`,
      `${base}-mono.json`
    ].filter((name) => names.includes(name));
    const selectedVariants = preferredVariants.length > 0
      ? preferredVariants
      : names.filter((name) => baseNameWithoutJson(name).startsWith(`${base}-`));

    return selectedVariants.map((name) => resolve(path, name));
  }

  const namedConcepts = names.filter((name) => /^(campaign|concept)([-_][a-z0-9]+)+\.json$/i.test(name));
  const selected = namedConcepts.length > 0 ? namedConcepts : names;

  return selected.map((name) => resolve(path, name));
}

function baseNameWithoutJson(value) {
  const name = basename(String(value).trim(), ".json");
  if (!name) {
    throw new Error("Expected a campaign base name.");
  }
  return name;
}

function text(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function renderContactSheet(concepts, outputRootForSheet) {
  const cards = concepts.map((concept, index) => {
    const keynote = pathToFileURL(join(concept.outDir, "keynote-16x9.png")).href;
    const vertical = pathToFileURL(join(concept.outDir, "vertical-poster.png")).href;
    const square = pathToFileURL(join(concept.outDir, "social-square.png")).href;
    const banner = pathToFileURL(join(concept.outDir, "linkedin-banner.png")).href;
    const label = String.fromCharCode(65 + index);

    return `<article class="concept">
      <header>
        <span class="badge" style="background:${escapeAttr(concept.primary)}">Concept ${label}</span>
        <div>
          <h2>${escapeHtml(concept.campaignName)}</h2>
          <p>${escapeHtml(concept.mood)}</p>
        </div>
      </header>
      <img class="hero" src="${keynote}" alt="">
      <div class="mini-grid">
        <img src="${vertical}" alt="">
        <img src="${square}" alt="">
        <img src="${banner}" alt="">
      </div>
      <h3>${escapeHtml(concept.headline)}</h3>
      <p class="subhead">${escapeHtml(concept.subhead)}</p>
    </article>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=2400, initial-scale=1">
<title>Campaign Concept Contact Sheet</title>
<style>
* { box-sizing: border-box; }
html, body {
  margin: 0;
  width: 2400px;
  min-height: 1600px;
  background: #070a10;
  color: #f5f8ff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
body {
  padding: 72px;
}
.sheet {
  width: 2256px;
  min-height: 1456px;
  border: 1px solid rgba(255,255,255,.14);
  background:
    radial-gradient(circle at 18% 0%, rgba(118,185,0,.18), transparent 30%),
    radial-gradient(circle at 92% 20%, rgba(77,231,255,.13), transparent 28%),
    linear-gradient(135deg, #0c111b, #070a10);
  padding: 56px;
}
.title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 36px;
  margin-bottom: 42px;
}
h1 {
  margin: 0;
  font-size: 74px;
  line-height: .96;
  letter-spacing: 0;
}
.title p {
  margin: 0;
  max-width: 720px;
  color: #aab5c5;
  font-size: 28px;
  line-height: 1.35;
}
.concepts {
  display: grid;
  grid-template-columns: repeat(${Math.min(concepts.length, 3)}, 1fr);
  gap: 28px;
}
.concept {
  min-height: 1150px;
  border: 1px solid rgba(255,255,255,.13);
  background: rgba(255,255,255,.055);
  padding: 28px;
}
.concept header {
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: 82px;
}
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 118px;
  height: 46px;
  color: #071008;
  font-size: 20px;
  font-weight: 850;
}
h2 {
  margin: 0;
  font-size: 30px;
}
header p {
  margin: 5px 0 0;
  color: #9ba7b8;
  font-size: 18px;
}
.hero {
  display: block;
  width: 100%;
  margin-top: 26px;
  border: 1px solid rgba(255,255,255,.16);
}
.mini-grid {
  display: grid;
  grid-template-columns: 0.62fr 0.62fr 1fr;
  align-items: stretch;
  gap: 12px;
  height: 230px;
  margin-top: 14px;
}
.mini-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 1px solid rgba(255,255,255,.13);
}
h3 {
  margin: 28px 0 12px;
  font-size: 42px;
  line-height: 1.02;
}
.subhead {
  margin: 0;
  color: #b2bdcc;
  font-size: 24px;
  line-height: 1.34;
}
</style>
</head>
<body>
  <main class="sheet">
    <section class="title">
      <h1>Campaign<br>Concept Review</h1>
      <p>AI-generated directions rendered by a fixed local exporter. The creator can compare, critique, pick a direction, and iterate the JSON.</p>
    </section>
    <section class="concepts">
      ${cards}
    </section>
  </main>
</body>
</html>`;
}

async function captureContactSheet(htmlPath, outPath) {
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(localBrowsersPath)) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowsersPath;
  }

  const playwright = process.env.CAMPAIGN_RENDER_BROWSER_PATH ? null : loadPlaywright();
  if (playwright) {
    const browser = await playwright.chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({
        viewport: { width: 2400, height: 1600 },
        deviceScaleFactor: 1
      });
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
      await page.screenshot({ path: outPath, type: "png", fullPage: false });
      return;
    } finally {
      await browser.close();
    }
  }

  captureWithChromium(findBrowser(), htmlPath, outPath);
}

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const localPackage = resolve(scriptDir, "../.tools/playwright/node_modules/playwright");

  for (const candidate of [localPackage, "playwright"]) {
    try {
      return require(candidate);
    } catch {
      // Fall back to the next candidate, then to system Chromium.
    }
  }

  return null;
}

function findBrowser() {
  if (process.env.CAMPAIGN_RENDER_BROWSER_PATH) {
    return process.env.CAMPAIGN_RENDER_BROWSER_PATH;
  }

  for (const candidate of ["chromium-browser", "chromium", "google-chrome", "google-chrome-stable"]) {
    const result = spawnSync("sh", ["-lc", `command -v ${candidate}`], { encoding: "utf8" });
    if (result.status === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
  }

  throw new Error("No Chromium/Chrome browser found. Run campaign-pack/scripts/install-renderer-deps.sh.");
}

function captureWithChromium(browserPath, htmlPath, outPath) {
  const profileDir = join(dirname(outPath), ".contact-sheet-browser-profile");
  mkdirSync(profileDir, { recursive: true });
  const result = spawnSync(
    browserPath,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-crash-reporter",
      "--disable-crashpad",
      "--hide-scrollbars",
      "--allow-file-access-from-files",
      `--user-data-dir=${profileDir}`,
      "--window-size=2400,1600",
      `--screenshot=${outPath}`,
      pathToFileURL(htmlPath).href
    ],
    { encoding: "utf8" }
  );

  rmSync(profileDir, { recursive: true, force: true });

  if (result.status !== 0) {
    throw new Error(`Chromium failed for contact sheet:\n${result.stderr || result.stdout}`);
  }
}

function verifyPng(file, width, height) {
  const buffer = readFileSync(file);
  if (buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`${file} is not a PNG.`);
  }
  const actualWidth = buffer.readUInt32BE(16);
  const actualHeight = buffer.readUInt32BE(20);
  if (actualWidth !== width || actualHeight !== height) {
    throw new Error(`${file} has size ${actualWidth}x${actualHeight}; expected ${width}x${height}.`);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return String(value).replaceAll('"', "&quot;");
}
