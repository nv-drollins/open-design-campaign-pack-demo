#!/usr/bin/env node
import { createReadStream, existsSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { Readable } from "node:stream";

const repoRoot = resolve(new URL("../..", import.meta.url).pathname);
const port = Number(process.env.DGX_DEMO_PORT || 11100);
const host = process.env.DGX_DEMO_HOST || "127.0.0.1";
const dashboardBase = process.env.DGX_DASHBOARD_BASE || "http://127.0.0.1:11000";
const dashboardUser = process.env.DGX_DASHBOARD_USER || "nvidia";
const dashboardPass = process.env.DGX_DASHBOARD_PASS || "nvidia";

let token = "";

async function latestProjectWithIndex() {
  const projectsRoot = join(repoRoot, ".od", "projects");
  const entries = await readdir(projectsRoot, { withFileTypes: true }).catch(() => []);
  const candidates = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(projectsRoot, entry.name))
    .filter((dir) => existsSync(join(dir, "index.html")))
    .map((dir) => ({ dir, mtime: statSync(join(dir, "index.html")).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.dir;
}

const packagedDashboardDir = join(repoRoot, "dashboard");
const projectDir = resolve(
  process.argv[2]
    || process.env.DGX_DEMO_PROJECT_DIR
    || (existsSync(join(packagedDashboardDir, "index.html")) ? packagedDashboardDir : "")
    || (await latestProjectWithIndex())
    || process.cwd(),
);

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization,content-type",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    ...headers,
  });
  res.end(body);
}

async function login() {
  const response = await fetch(`${dashboardBase}/api/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: dashboardUser, password: dashboardPass }),
  });
  if (!response.ok) {
    throw new Error(`dashboard login failed: ${response.status}`);
  }
  const body = await response.json();
  if (!body.token) throw new Error("dashboard login did not return a token");
  token = body.token;
  return token;
}

async function proxyApi(req, res, retry = true) {
  if (req.method === "OPTIONS") {
    send(res, 204, "");
    return;
  }

  const target = new URL(req.url, dashboardBase);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || ["host", "connection", "content-length"].includes(key.toLowerCase())) continue;
    headers.set(key, Array.isArray(value) ? value.join(",") : value);
  }

  if (target.pathname.startsWith("/api/v1/") && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token || (await login())}`);
  }

  const response = await fetch(target, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method || "GET") ? undefined : Readable.toWeb(req),
    duplex: ["GET", "HEAD"].includes(req.method || "GET") ? undefined : "half",
  });

  if (response.status === 401 && retry && target.pathname.startsWith("/api/v1/")) {
    token = "";
    return proxyApi(req, res, false);
  }

  const outHeaders = {};
  response.headers.forEach((value, key) => {
    if (!["connection", "content-encoding", "content-length", "transfer-encoding"].includes(key.toLowerCase())) {
      outHeaders[key] = value;
    }
  });
  outHeaders["access-control-allow-origin"] = "*";
  outHeaders["cache-control"] = target.pathname.includes("/stream") ? "no-cache" : "no-store";

  res.writeHead(response.status, outHeaders);
  if (response.body) Readable.fromWeb(response.body).pipe(res);
  else res.end();
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function serveStatic(req, res) {
  const url = new URL(req.url || "/", "http://local");
  const requestPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = resolve(projectDir, `.${normalize(requestPath)}`);
  if (!filePath.startsWith(`${projectDir}${sep}`) && filePath !== projectDir) {
    send(res, 403, "Forbidden");
    return;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    send(res, 404, "Not found");
    return;
  }
  res.writeHead(200, {
    "content-type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(filePath).pipe(res);
}

createServer(async (req, res) => {
  try {
    if ((req.url || "").startsWith("/api/")) {
      await proxyApi(req, res);
      return;
    }
    serveStatic(req, res);
  } catch (error) {
    send(res, 502, JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      "content-type": "application/json; charset=utf-8",
    });
  }
}).listen(port, host, () => {
  console.log(`DGX dashboard demo: http://${host}:${port}/`);
  console.log(`Project directory: ${projectDir}`);
  console.log(`Proxy target: ${dashboardBase}`);
});
