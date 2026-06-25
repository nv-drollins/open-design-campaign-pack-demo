#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.argv[2] || "index.html");
let html = readFileSync(file, "utf8");
const original = html;
const changes = [];

const stageOpen =
  '<div id="stage" data-composition-id="teaser" data-start="0" data-width="1080" data-height="1920" data-duration="6">';
const sceneOpen =
  '<div id="scene-main" class="scene clip" data-start="0" data-duration="6" data-track-index="0">';

function replace(pattern, replacement, label) {
  const next = html.replace(pattern, replacement);
  if (next !== html) {
    html = next;
    changes.push(label);
  }
}

function ensureTimelineDurationKeeper() {
  if (html.includes("__hfDurationKeeper")) {
    return;
  }

  if (!/\bconst\s+totalDuration\s*=/.test(html)) {
    replace(
      /\bconst\s+tl\s*=\s*gsap\.timeline\s*\(/,
      "const totalDuration = 6;\nconst tl = gsap.timeline(",
      "added totalDuration"
    );
  }

  replace(
    /(const\s+tl\s*=\s*gsap\.timeline\s*\(\s*\{\s*paused\s*:\s*true\s*\}\s*\)\s*;)/,
    `$1
const __hfDurationKeeper = { progress: 0 };
tl.to(__hfDurationKeeper, { duration: totalDuration, progress: 1, ease: "none" }, 0);`,
    "added GSAP duration keeper"
  );
}

function ensureRenderGuardCss() {
  if (html.includes("hf-render-guard")) {
    return;
  }

  const css = `<style id="hf-render-guard">
html,
body {
  margin: 0;
  width: 1080px;
  height: 1920px;
  overflow: hidden;
  background: #05070d;
}

#stage {
  position: relative;
  width: 1080px;
  height: 1920px;
  overflow: hidden;
  isolation: isolate;
  transform-origin: 0 0;
}

#scene-main,
#stage .scene,
#stage .clip {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#stage .scene-content {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

#stage .glass-card {
  box-sizing: border-box;
  max-width: min(900px, calc(100% - 120px));
}
</style>`;

  if (html.includes("</head>")) {
    replace(/<\/head>/i, `${css}\n</head>`, "added render guard CSS");
  } else {
    replace(/<body\b[^>]*>/i, `$&\n${css}`, "added render guard CSS");
  }
}

replace(/<stage\b[^>]*>/i, stageOpen, "normalized custom stage tag");
replace(/<\/stage>/gi, "</div>", "closed custom stage tag as div");
replace(
  /<div\b(?=[^>]*\bid=(["'])stage\1)[^>]*>/i,
  stageOpen,
  "normalized stage attributes"
);
replace(
  /<div\b(?=[^>]*\bclass=(["'])(?:[^"']*\s)?scene(?:\s[^"']*)?\1)[^>]*>/i,
  sceneOpen,
  "normalized scene attributes"
);

replace(
  /window\.__timelines\s*=\s*\[\]\s*;?/g,
  "window.__timelines = window.__timelines || {};",
  "changed timeline registry from array to object"
);
replace(
  /window\.__timelines\.push\s*\(\s*tl\s*\)\s*;?/g,
  'window.__timelines["teaser"] = tl;',
  "changed timeline push to keyed assignment"
);
replace(
  /window\.__timelines\.push\s*\([^)]*\)\s*;?/g,
  'window.__timelines["teaser"] = tl;',
  "changed timeline push to keyed assignment"
);

replace(
  /\n\s*\/\/\s*PREVIEW HELPER:[\s\S]*?if\s*\([^)]*window\.location\.search\.includes\(["']render["']\)[\s\S]*?\n\s*}\s*/g,
  "\n",
  "removed preview autoplay helper"
);
replace(
  /\n\s*if\s*\(!window\.location\.search\.includes\(["']render["']\)\)\s*\{[\s\S]*?tl\.play\(\);[\s\S]*?\n\s*}\s*/g,
  "\n",
  "removed preview autoplay block"
);
replace(/^\s*tl\.play\([^)]*\);\s*$/gm, "", "removed tl.play");
replace(/^\s*tl\.eventCallback\([^;]*;\s*$/gm, "", "removed timeline eventCallback");

replace(/repeat\s*:\s*-1/g, "repeat: 1", "changed infinite repeat to finite repeat");

ensureTimelineDurationKeeper();
ensureRenderGuardCss();

if (!html.includes('window.__timelines["teaser"]')) {
  replace(
    /window\.__timelines\s*=\s*window\.__timelines\s*\|\|\s*\{\}\s*;?/,
    'window.__timelines = window.__timelines || {};\nwindow.__timelines["teaser"] = tl;',
    "registered teaser timeline"
  );
}

if (html !== original) {
  writeFileSync(file, html);
  console.log(`Normalized HyperFrames contract in ${file}`);
  for (const change of changes) {
    console.log(`- ${change}`);
  }
} else {
  console.log(`HyperFrames contract already normalized in ${file}`);
}
