#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const demoDir = resolve(scriptDir, "..");
const renderPackScript = join(scriptDir, "render-pack.mjs");
const localBrowsersPath = join(demoDir, ".tools/playwright-browsers");
const beforePath = process.argv[2] ? resolve(process.argv[2]) : "";
const afterPath = process.argv[3] ? resolve(process.argv[3]) : "";

if (!beforePath || !afterPath) {
  console.error("Usage: node campaign-pack/scripts/render-before-after.mjs before.json after.json [output-dir]");
  process.exit(1);
}

const outputRoot = resolve(process.argv[4] || join(dirname(afterPath), "exports", "before-after"));
const beforeOut = join(outputRoot, "before");
const afterOut = join(outputRoot, "after");
const boardHtml = join(outputRoot, "before-after.html");
const boardPng = join(outputRoot, "before-after.png");

mkdirSync(outputRoot, { recursive: true });

renderPack(beforePath, beforeOut);
renderPack(afterPath, afterOut);

const before = readCampaign(beforePath);
const after = readCampaign(afterPath);

writeFileSync(boardHtml, renderBoard({ before, after, beforeOut, afterOut }));
await captureBoard(boardHtml, boardPng);
verifyPng(boardPng, 2400, 1400);

console.log(`Before/after board: ${boardPng}`);
console.log(`Before exports: ${beforeOut}`);
console.log(`After exports: ${afterOut}`);

function renderPack(jsonPath, outDir) {
  const result = spawnSync(process.execPath, [renderPackScript, jsonPath, outDir], {
    stdio: "inherit",
    env: process.env
  });

  if (result.status !== 0) {
    throw new Error(`Render failed for ${jsonPath}`);
  }
}

function readCampaign(file) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  return {
    id: basename(file, extname(file)),
    file,
    campaignName: text(data.campaignName, basename(file)),
    headline: text(data.copy?.headline, "Untitled campaign"),
    eyebrow: text(data.copy?.eyebrow, ""),
    subhead: text(data.copy?.subhead, ""),
    cta: text(data.copy?.cta, ""),
    mood: text(data.layout?.mood, ""),
    primary: text(data.theme?.primary, "#76B900"),
    accent: text(data.theme?.accent, "#4de7ff")
  };
}

function text(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function renderBoard({ before, after, beforeOut: beforeDir, afterOut: afterDir }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=2400, initial-scale=1">
<title>Campaign Before After Review</title>
<style>
* { box-sizing: border-box; }
html, body {
  margin: 0;
  width: 2400px;
  height: 1400px;
  overflow: hidden;
  background: #070a10;
  color: #f5f8ff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
body {
  padding: 64px;
}
.board {
  position: relative;
  width: 2272px;
  height: 1272px;
  padding: 54px;
  border: 1px solid rgba(255,255,255,.14);
  background:
    radial-gradient(circle at 16% 2%, rgba(118,185,0,.18), transparent 30%),
    radial-gradient(circle at 86% 28%, rgba(77,231,255,.13), transparent 28%),
    linear-gradient(135deg, #0c111b, #070a10);
}
.title {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 48px;
  margin-bottom: 38px;
}
h1 {
  margin: 0;
  font-size: 72px;
  line-height: .96;
  letter-spacing: 0;
}
.title p {
  max-width: 860px;
  margin: 0;
  color: #aab5c5;
  font-size: 27px;
  line-height: 1.35;
}
.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 34px;
}
.card {
  min-height: 1010px;
  padding: 30px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.055);
}
.label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 58px;
  margin-bottom: 22px;
}
.pill {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 20px;
  color: #071008;
  font-size: 20px;
  font-weight: 850;
}
.filename {
  color: #9faabb;
  font-size: 18px;
}
.preview {
  display: block;
  width: 100%;
  border: 1px solid rgba(255,255,255,.18);
}
.mini-grid {
  display: grid;
  grid-template-columns: .58fr .58fr 1fr;
  gap: 12px;
  height: 214px;
  margin-top: 14px;
}
.mini-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 1px solid rgba(255,255,255,.14);
}
h2 {
  margin: 26px 0 10px;
  font-size: 42px;
  line-height: 1.02;
}
.meta {
  margin: 0 0 14px;
  color: #8f9bad;
  font-size: 20px;
}
.subhead {
  margin: 0;
  color: #c3ccd8;
  font-size: 24px;
  line-height: 1.34;
}
.cta {
  margin-top: 18px;
  color: #ffffff;
  font-size: 22px;
  font-weight: 800;
}
</style>
</head>
<body>
  <main class="board">
    <section class="title">
      <h1>Campaign<br>Before / After</h1>
      <p>A fixed renderer compares the creator's starting direction with the critique-guided revision. Open Design changes the structured campaign JSON; export formatting stays deterministic.</p>
    </section>
    <section class="columns">
      ${renderCard("Before", before, beforeDir)}
      ${renderCard("After", after, afterDir)}
    </section>
  </main>
</body>
</html>`;
}

function renderCard(label, campaign, outDir) {
  const keynote = pathToFileURL(join(outDir, "keynote-16x9.png")).href;
  const vertical = pathToFileURL(join(outDir, "vertical-poster.png")).href;
  const square = pathToFileURL(join(outDir, "social-square.png")).href;
  const banner = pathToFileURL(join(outDir, "linkedin-banner.png")).href;

  return `<article class="card">
    <div class="label">
      <span class="pill" style="background:${escapeAttr(campaign.primary)}">${escapeHtml(label)}</span>
      <span class="filename">${escapeHtml(campaign.id)}.json</span>
    </div>
    <img class="preview" src="${keynote}" alt="">
    <div class="mini-grid">
      <img src="${vertical}" alt="">
      <img src="${square}" alt="">
      <img src="${banner}" alt="">
    </div>
    <h2>${escapeHtml(campaign.headline)}</h2>
    <p class="meta">${escapeHtml(campaign.eyebrow)} / ${escapeHtml(campaign.mood)}</p>
    <p class="subhead">${escapeHtml(campaign.subhead)}</p>
    <div class="cta">${escapeHtml(campaign.cta)}</div>
  </article>`;
}

async function captureBoard(htmlPath, outPath) {
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(localBrowsersPath)) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowsersPath;
  }

  const playwright = process.env.CAMPAIGN_RENDER_BROWSER_PATH ? null : loadPlaywright();
  if (playwright) {
    const browser = await playwright.chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({
        viewport: { width: 2400, height: 1400 },
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
  const profileDir = join(dirname(outPath), ".before-after-browser-profile");
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
      "--window-size=2400,1400",
      `--screenshot=${outPath}`,
      pathToFileURL(htmlPath).href
    ],
    { encoding: "utf8" }
  );

  rmSync(profileDir, { recursive: true, force: true });

  if (result.status !== 0) {
    throw new Error(`Chromium failed for before/after board:\n${result.stderr || result.stdout}`);
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
