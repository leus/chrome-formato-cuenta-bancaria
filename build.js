#!/usr/bin/env node
// ---------------------------------------------------------------------------
// build.js – Package the extension into a .zip ready for the Chrome Web Store
// Zero dependencies: uses Node's built-in modules only
// Usage: node build.js
// ---------------------------------------------------------------------------

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");
const ZIP_NAME = "chrome-formato-cuenta-bancaria.zip";
const ZIP_PATH = path.join(OUT, ZIP_NAME);

// Files and folders to include in the extension package
const INCLUDE = [
  "manifest.json",
  "background.js",
  "banks.js",
  "parser.js",
  "converter.js",
  "converter.html",
  "converter.css",
  "icons",
];

// ---- helpers ---------------------------------------------------------------

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function rimraf(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) rimraf(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(dir);
}

// ---- main ------------------------------------------------------------------

console.log("Building extension package…\n");

// 1. Clean previous build
rimraf(OUT);
ensureDir(OUT);

const stage = path.join(OUT, "_stage");
ensureDir(stage);

// 2. Copy files to staging area
for (const name of INCLUDE) {
  const src = path.join(ROOT, name);
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ Skipping missing file: ${name}`);
    continue;
  }
  copyRecursive(src, path.join(stage, name));
  console.log(`  ✓ ${name}`);
}

// 3. Create zip using PowerShell (available on Windows) or zip command
try {
  // Remove old zip if it exists
  if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);

  const isWin = process.platform === "win32";
  if (isWin) {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${stage}\\*' -DestinationPath '${ZIP_PATH}'"`,
      { stdio: "pipe" }
    );
  } else {
    execSync(`cd "${stage}" && zip -r "${ZIP_PATH}" .`, { stdio: "pipe" });
  }

  console.log(`\n✓ Created ${path.relative(ROOT, ZIP_PATH)}`);
} catch (err) {
  console.error("\n✗ Failed to create zip:", err.message);
  process.exit(1);
} finally {
  // 4. Clean up staging directory
  rimraf(stage);
}

// 5. Print summary
const stat = fs.statSync(ZIP_PATH);
const sizeKB = (stat.size / 1024).toFixed(1);
console.log(`  Size: ${sizeKB} KB`);
console.log(`\nUpload this file to the Chrome Web Store Developer Dashboard:`);
console.log(`  ${ZIP_PATH}\n`);
