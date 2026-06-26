#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const FORMATS = [
  { id: "keynote-16x9", width: 1920, height: 1080, mode: "wide" },
  { id: "vertical-poster", width: 1080, height: 1920, mode: "vertical" },
  { id: "social-square", width: 1080, height: 1080, mode: "square" },
  { id: "linkedin-banner", width: 1584, height: 396, mode: "banner" }
];

const inputPath = resolve(process.argv[2] || "campaign.json");
const projectDir = dirname(inputPath);
const outputDir = resolve(process.argv[3] || join(projectDir, "exports"));
const renderDir = join(outputDir, ".render");
const scriptDir = dirname(fileURLToPath(import.meta.url));
const localBrowsersPath = resolve(scriptDir, "../.tools/playwright-browsers");

if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(localBrowsersPath)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowsersPath;
}

const campaign = loadCampaign(inputPath);
const playwright = process.env.CAMPAIGN_RENDER_BROWSER_PATH ? null : loadPlaywright();
const browser = playwright ? null : findBrowser();

mkdirSync(renderDir, { recursive: true });

for (const format of FORMATS) {
  const htmlPath = join(renderDir, `${format.id}.html`);
  const outPath = join(outputDir, `${format.id}.png`);
  writeFileSync(htmlPath, renderHtml(campaign, projectDir, format));
  if (playwright) {
    try {
      await captureWithPlaywright(playwright, htmlPath, outPath, format);
    } catch (error) {
      throw new Error(`Playwright render failed for ${format.id}. Run campaign-pack/scripts/install-renderer-deps.sh, then retry.\n${error.message}`);
    }
  } else {
    captureWithChromium(browser, htmlPath, outPath, format);
  }
  verifyPng(outPath, format);
  console.log(`Rendered ${format.id}: ${outPath}`);
}

rmSync(renderDir, { recursive: true, force: true });
console.log(`Campaign pack complete: ${outputDir}`);

function loadCampaign(file) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  return {
    campaignName: stringOr(data.campaignName, "Campaign"),
    brand: {
      name: stringOr(data.brand?.name, "Brand"),
      logo: stringOr(data.brand?.logo, "")
    },
    assets: {
      hero: stringOr(data.assets?.hero, "")
    },
    theme: {
      background: stringOr(data.theme?.background, "#05070d"),
      surface: stringOr(data.theme?.surface, "rgba(14, 19, 29, 0.78)"),
      primary: stringOr(data.theme?.primary, "#76B900"),
      accent: stringOr(data.theme?.accent, "#4de7ff"),
      secondary: stringOr(data.theme?.secondary, "#b26cff"),
      text: stringOr(data.theme?.text, "#f7fbff"),
      muted: stringOr(data.theme?.muted, "#9da8b7")
    },
    copy: {
      eyebrow: stringOr(data.copy?.eyebrow, "Campaign"),
      headline: stringOr(data.copy?.headline, "Create the next direction"),
      subhead: stringOr(data.copy?.subhead, "A designer-guided workflow for fast campaign exploration."),
      cta: stringOr(data.copy?.cta, "Explore"),
      footer: stringOr(data.copy?.footer, "")
    },
    layout: {
      mood: stringOr(data.layout?.mood, "premium technical"),
      imagePlacement: stringOr(data.layout?.imagePlacement, "right"),
      density: stringOr(data.layout?.density, "balanced")
    },
    notes: Array.isArray(data.notes) ? data.notes.map((note) => stringOr(note, "")).filter(Boolean).slice(0, 4) : []
  };
}

function stringOr(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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

function resolveAsset(projectDirForAsset, assetPath) {
  if (!assetPath) {
    return "";
  }
  const absolute = isAbsolute(assetPath) ? assetPath : resolve(projectDirForAsset, assetPath);
  return pathToFileURL(absolute).href;
}

function renderHtml(campaignData, projectDirForAssets, format) {
  const logo = resolveAsset(projectDirForAssets, campaignData.brand.logo);
  const hero = resolveAsset(projectDirForAssets, campaignData.assets.hero);
  const theme = campaignData.theme;
  const isBanner = format.mode === "banner";
  const isVertical = format.mode === "vertical";
  const isSquare = format.mode === "square";
  const isWide = format.mode === "wide";
  const notes = campaignData.notes.length ? campaignData.notes : ["Designer-led exploration", "Local deterministic export"];
  const noteMarkup = notes.map((note) => `<span>${escapeHtml(note)}</span>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${format.width}, initial-scale=1">
<title>${escapeHtml(campaignData.campaignName)} - ${format.id}</title>
<style>
* { box-sizing: border-box; }
html, body {
  margin: 0;
  width: ${format.width}px;
  height: ${format.height}px;
  overflow: hidden;
  background: ${theme.background};
  color: ${theme.text};
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.frame {
  position: relative;
  width: ${format.width}px;
  height: ${format.height}px;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 14%, ${alpha(theme.accent, 0.28)}, transparent 30%),
    radial-gradient(circle at 84% 72%, ${alpha(theme.secondary, 0.28)}, transparent 34%),
    linear-gradient(135deg, ${theme.background}, #0d121d 46%, #05070d);
  isolation: isolate;
}
.frame::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(${alpha(theme.text, 0.08)} 1px, transparent 1px),
    linear-gradient(90deg, ${alpha(theme.text, 0.08)} 1px, transparent 1px);
  background-size: ${isBanner ? 48 : 72}px ${isBanner ? 48 : 72}px;
  mask-image: radial-gradient(circle at center, black, transparent 75%);
  opacity: 0.42;
  z-index: -2;
}
.frame::after {
  content: "";
  position: absolute;
  inset: ${isBanner ? 18 : 42}px;
  border: 1px solid ${alpha(theme.text, 0.13)};
  pointer-events: none;
}
.layout {
  position: relative;
  display: grid;
  grid-template-columns: ${isWide ? "1.05fr 0.95fr" : "1fr"};
  grid-template-rows: ${isBanner ? "1fr" : "auto 1fr"};
  gap: ${isBanner ? 24 : isVertical ? 52 : 40}px;
  width: 100%;
  height: 100%;
  padding: ${paddingFor(format)};
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  grid-column: 1 / -1;
}
.logo {
  display: block;
  max-width: ${isBanner ? 210 : isSquare ? 280 : 320}px;
  max-height: ${isBanner ? 72 : 96}px;
  object-fit: contain;
}
.eyebrow {
  color: ${theme.primary};
  font-size: ${fontFor(format, 24, 28, 22, 22)}px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0;
}
.copy {
  align-self: ${isBanner ? "center" : "end"};
  max-width: ${isWide ? 820 : isBanner ? 690 : 880}px;
  z-index: 2;
}
h1 {
  margin: ${isBanner ? "10px 0 10px" : "18px 0 24px"};
  font-size: ${fontFor(format, 106, 118, 86, 54)}px;
  line-height: 0.94;
  letter-spacing: 0;
  max-width: ${isBanner ? 760 : 940}px;
}
.subhead {
  margin: 0;
  color: ${theme.muted};
  font-size: ${fontFor(format, 34, 40, 30, 22)}px;
  line-height: 1.32;
  max-width: ${isBanner ? 730 : 820}px;
}
.cta-row {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: ${isBanner ? 24 : 42}px;
  flex-wrap: wrap;
}
.cta {
  display: inline-flex;
  align-items: center;
  min-height: ${isBanner ? 54 : 72}px;
  padding: ${isBanner ? "0 28px" : "0 38px"};
  background: ${theme.primary};
  color: #061008;
  font-size: ${fontFor(format, 24, 28, 22, 20)}px;
  font-weight: 850;
}
.footer {
  color: ${alpha(theme.text, 0.72)};
  font-size: ${fontFor(format, 22, 24, 19, 18)}px;
}
.visual {
  position: relative;
  align-self: center;
  justify-self: ${isWide ? "end" : "center"};
  width: ${visualWidth(format)};
  max-width: 100%;
  aspect-ratio: ${isBanner ? "1.6" : "1"};
  z-index: 1;
}
.glass {
  position: absolute;
  inset: ${isBanner ? "2%" : "4%"};
  border: 1px solid ${alpha(theme.text, 0.18)};
  background: linear-gradient(145deg, ${theme.surface}, ${alpha(theme.background, 0.74)});
  box-shadow: 0 42px 120px ${alpha("#000000", 0.36)}, inset 0 1px 0 ${alpha(theme.text, 0.16)};
  backdrop-filter: blur(28px);
}
.hero {
  position: absolute;
  inset: ${isBanner ? "8% 9%" : "10%"};
  width: ${isBanner ? "82%" : "80%"};
  height: ${isBanner ? "84%" : "80%"};
  object-fit: contain;
  filter: drop-shadow(0 32px 48px ${alpha("#000000", 0.42)});
}
.signal {
  position: absolute;
  border: 1px solid ${alpha(theme.primary, 0.4)};
  inset: ${isBanner ? "-5% -4%" : "-7%"};
  transform: rotate(-4deg);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  max-width: ${isBanner ? 520 : 760}px;
}
.chips span {
  padding: ${isBanner ? "8px 12px" : "12px 16px"};
  color: ${alpha(theme.text, 0.76)};
  border: 1px solid ${alpha(theme.text, 0.16)};
  background: ${alpha(theme.text, 0.06)};
  font-size: ${fontFor(format, 18, 20, 16, 14)}px;
}
${isVertical ? `.visual { margin-top: 8px; }
.copy { align-self: start; }
h1 { max-width: 900px; }` : ""}
${isSquare ? `.layout { grid-template-rows: auto auto 1fr; }
.visual { width: min(620px, 78vw); }
.copy { align-self: start; }` : ""}
${isBanner ? `.layout { grid-template-columns: 0.96fr 0.54fr; align-items: center; }
.topbar { position: absolute; top: 34px; left: 56px; right: 56px; }
.copy { padding-top: 42px; }
.chips { display: none; }` : ""}
</style>
</head>
<body>
  <main class="frame">
    <section class="layout">
      <header class="topbar">
        ${logo ? `<img class="logo" src="${logo}" alt="${escapeHtml(campaignData.brand.name)} logo">` : `<div class="eyebrow">${escapeHtml(campaignData.brand.name)}</div>`}
        <div class="footer">${escapeHtml(campaignData.copy.footer)}</div>
      </header>
      <article class="copy">
        <div class="eyebrow">${escapeHtml(campaignData.copy.eyebrow)}</div>
        <h1>${escapeHtml(campaignData.copy.headline)}</h1>
        <p class="subhead">${escapeHtml(campaignData.copy.subhead)}</p>
        <div class="cta-row">
          <div class="cta">${escapeHtml(campaignData.copy.cta)}</div>
          <div class="chips">${noteMarkup}</div>
        </div>
      </article>
      <aside class="visual" aria-label="${escapeHtml(campaignData.layout.mood)}">
        <div class="signal"></div>
        <div class="glass"></div>
        ${hero ? `<img class="hero" src="${hero}" alt="">` : ""}
      </aside>
    </section>
  </main>
</body>
</html>`;
}

function paddingFor(format) {
  if (format.mode === "banner") return "44px 56px";
  if (format.mode === "vertical") return "96px 90px";
  if (format.mode === "square") return "72px";
  return "76px 86px";
}

function visualWidth(format) {
  if (format.mode === "banner") return "min(500px, 34vw)";
  if (format.mode === "vertical") return "min(760px, 80vw)";
  if (format.mode === "square") return "min(620px, 74vw)";
  return "min(780px, 42vw)";
}

function fontFor(format, wide, vertical, square, banner) {
  if (format.mode === "vertical") return vertical;
  if (format.mode === "square") return square;
  if (format.mode === "banner") return banner;
  return wide;
}

function alpha(color, amount) {
  const hex = color.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return color;
  }
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${amount})`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function captureWithPlaywright(playwrightApi, htmlPath, outPath, format) {
  const browserInstance = await playwrightApi.chromium.launch({ headless: true });
  try {
    const page = await browserInstance.newPage({
      viewport: { width: format.width, height: format.height },
      deviceScaleFactor: 1
    });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
    await page.screenshot({ path: outPath, type: "png", fullPage: false });
  } finally {
    await browserInstance.close();
  }
}

function captureWithChromium(browserPath, htmlPath, outPath, format) {
  const url = pathToFileURL(htmlPath).href;
  const profileDir = join(dirname(outPath), `.browser-profile-${format.id}`);
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
      `--window-size=${format.width},${format.height}`,
      `--screenshot=${outPath}`,
      url
    ],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    throw new Error(`Chromium failed for ${format.id}:\n${result.stderr || result.stdout}`);
  }
  rmSync(profileDir, { recursive: true, force: true });
}

function verifyPng(file, format) {
  const buffer = readFileSync(file);
  if (buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`${file} is not a PNG.`);
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== format.width || height !== format.height) {
    throw new Error(`${file} has size ${width}x${height}; expected ${format.width}x${format.height}.`);
  }
}
