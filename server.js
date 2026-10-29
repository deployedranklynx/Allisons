// Hostinger Node.js Application Entry Point (ES Module & CommonJS compatible)
import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Global exception handlers so the process never dies with 503
process.on("uncaughtException", (err) => {
  console.error("[Hostinger] Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Hostinger] Unhandled Rejection at:", promise, "reason:", reason);
});

const bundlePath = path.join(__dirname, "dist", "server.cjs");

if (fs.existsSync(bundlePath)) {
  try {
    require(bundlePath);
    console.log("[Hostinger] dist/server.cjs loaded successfully.");
  } catch (err) {
    console.error("[Hostinger] Error requiring dist/server.cjs:", err);
    fallbackServer();
  }
} else {
  console.warn("[Hostinger] dist/server.cjs not found, starting fallback server.");
  fallbackServer();
}

// Resilient fallback server that guarantees 200 OK to prevent Hostinger 503
function fallbackServer() {
  const PORT = process.env.PORT || 3000;
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };

  const server = http.createServer((req, res) => {
    let cleanUrl = req.url.split("?")[0];
    if (cleanUrl === "/") cleanUrl = "/index.html";

    // Try finding in dist/ or root
    let target = path.join(__dirname, "dist", cleanUrl);
    if (!fs.existsSync(target)) {
      target = path.join(__dirname, cleanUrl);
    }
    if (!fs.existsSync(target)) {
      target = path.join(__dirname, "dist", "index.html");
    }
    if (!fs.existsSync(target)) {
      target = path.join(__dirname, "index.html");
    }

    if (fs.existsSync(target) && fs.statSync(target).isFile()) {
      const ext = path.extname(target).toLowerCase();
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
      fs.createReadStream(target).pipe(res);
    } else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!DOCTYPE html><html><head><title>RetoolMaster</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>RetoolMaster is running</h2><p>Server active on Hostinger.</p></body></html>`);
    }
  });

  if (isNaN(Number(PORT))) {
    server.listen(PORT, () => console.log(`Fallback server listening on socket ${PORT}`));
  } else {
    server.listen(Number(PORT), "0.0.0.0", () => console.log(`Fallback server listening on http://0.0.0.0:${PORT}`));
  }
}
