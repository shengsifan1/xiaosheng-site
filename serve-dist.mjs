import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("./dist", import.meta.url)));
const port = Number(process.env.PORT || 8802);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".mp4": "video/mp4",
};

createServer((request, response) => {
  const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const file = resolve(join(root, pathname.replace(/^\/+/, "")));

  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, { "content-type": mime[extname(file).toLowerCase()] || "application/octet-stream" });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Serving dist at http://127.0.0.1:${port}/`);
});
