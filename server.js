// Hostinger Node.js Application Entry Point
const fs = require("fs");
const path = require("path");

const bundlePath = path.join(__dirname, "dist", "server.cjs");

if (fs.existsSync(bundlePath)) {
  require(bundlePath);
} else {
  console.log("Starting server bundle...");
  try {
    require("./dist/server.cjs");
  } catch (e) {
    console.error("Could not load dist/server.cjs:", e);
  }
}
