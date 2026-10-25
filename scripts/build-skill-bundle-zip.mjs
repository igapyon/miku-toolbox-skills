#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoName = "miku-toolbox-skills";
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const bundleRoot = path.join(repoRoot, "bundle", repoName);
const zipPath = path.join(repoRoot, "bundle", `igapyon-${repoName}-${packageJson.version}.zip`);

execFileSync(process.execPath, ["scripts/build-skill-bundle.mjs"], {
  cwd: repoRoot,
  stdio: "inherit"
});
fs.rmSync(zipPath, { force: true });
execFileSync("zip", ["-qr", zipPath, "."], { cwd: bundleRoot, stdio: "inherit" });
execFileSync(process.execPath, ["scripts/verify-release-zip.mjs", zipPath], {
  cwd: repoRoot,
  stdio: "inherit"
});
process.stdout.write(`[build:bundle:zip] generated bundle/${path.basename(zipPath)}\n`);
