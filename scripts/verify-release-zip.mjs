#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { repoRoot, skillName, requiredSkillFiles, assertSkillSource, includeSkillEntry } from "./skill-package.mjs";

const skillPrefix = `skills/${skillName}/`;
const requiredEntries = requiredSkillFiles.map((relative) => `${skillPrefix}${relative}`);

try {
  const suppliedPath = process.argv[2];
  if (!suppliedPath || process.argv.length !== 3) {
    throw new Error("usage: node scripts/verify-release-zip.mjs <release.zip>");
  }

  const zipPath = path.resolve(process.cwd(), suppliedPath);
  if (!fs.existsSync(zipPath) || !fs.statSync(zipPath).isFile() || fs.statSync(zipPath).size === 0) {
    throw new Error(`release ZIP is missing or empty: ${zipPath}`);
  }

  execFileSync("unzip", ["-tqq", zipPath], { cwd: repoRoot });
  const entries = execFileSync("unzip", ["-Z1", zipPath], {
    cwd: repoRoot,
    encoding: "utf8"
  }).split(/\r?\n/).filter(Boolean);

  for (const entry of requiredEntries) {
    if (!entries.includes(entry)) throw new Error(`required ZIP entry is missing: ${entry}`);
  }
  for (const entry of entries) {
    const parts = entry.replace(/\/$/, "").split("/");
    if (entry.includes("\\") || path.posix.isAbsolute(entry) ||
        parts.some((part) => !part || part === ".." || part === ".")) {
      throw new Error(`unsafe path in release ZIP: ${entry}`);
    }
    const isSkillPath = entry === "skills/" || entry === `skills/${skillName}/` ||
      entry.startsWith(`skills/${skillName}/`);
    if (!isSkillPath) throw new Error(`unexpected entry in release ZIP: ${entry}`);
    if (entry.startsWith(skillPrefix) &&
        !includeSkillEntry(entry.slice(skillPrefix.length).split("/").join(path.sep))) {
      throw new Error(`development-only entry in release ZIP: ${entry}`);
    }
  }

  verifyPackagedHelper(zipPath);
  process.stdout.write(`[verify-release-zip] verified ${path.basename(zipPath)}\n`);
} catch (error) {
  process.stderr.write(`[verify-release-zip] ${error.message}\n`);
  process.exitCode = 1;
}

function verifyPackagedHelper(zipPath) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "miku-toolbox-release-"));
  try {
    const skillRoot = path.join(temporaryRoot, "skills", skillName);
    // Extract only the fixed required files. Archive paths never select write destinations.
    for (const relative of requiredSkillFiles) {
      const destination = path.join(skillRoot, relative);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, execFileSync("unzip", ["-p", zipPath, `${skillPrefix}${relative}`]));
    }
    assertSkillSource(skillRoot);
    const output = execFileSync(process.execPath, [path.join(skillRoot, "lib/password-generator.mjs")], {
      cwd: temporaryRoot,
      encoding: "utf8",
      timeout: 10000
    });
    const password = output.slice(0, -1);
    if (!/^[ADEFHMNRTYadefhmnrty][ADEFHMNRTYadefhmnrty0-9@#$]{7}\n$/.test(output) ||
        new Set(password).size !== 8 || !/[ADEFHMNRTY]/.test(password) ||
        !/[adefhmnrty]/.test(password) || !/[0-9]/.test(password) || !/[@#$]/.test(password)) {
      throw new Error("packaged helper failed its default password check");
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}
