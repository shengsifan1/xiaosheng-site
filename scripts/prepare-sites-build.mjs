import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(".");
const hostingSource = resolve(root, ".openai/hosting.json");
const hostingTarget = resolve(root, "dist/.openai/hosting.json");
const workerTarget = resolve(root, "dist/server/index.js");

mkdirSync(dirname(hostingTarget), { recursive: true });
mkdirSync(dirname(workerTarget), { recursive: true });
copyFileSync(hostingSource, hostingTarget);

writeFileSync(
  workerTarget,
  `const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".mp4": "video/mp4",
};

function contentType(pathname) {
  const match = pathname.match(/\\.[^.\\/]+$/);
  return match ? mime[match[0].toLowerCase()] : undefined;
}

async function fetchAsset(request, env, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  const response = await env.ASSETS.fetch(new Request(url, request));
  if (response.status === 404) return response;
  const headers = new Headers(response.headers);
  const type = contentType(pathname);
  if (type) headers.set("content-type", type);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    const assetPath = pathname === "/" ? "/index.html" : pathname;
    const asset = await fetchAsset(request, env, assetPath);
    if (asset.status !== 404) return asset;
    return fetchAsset(request, env, "/index.html");
  },
};
`,
  "utf8",
);
