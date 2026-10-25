#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { repoRoot, repoName, skillName, assertSkillSource, copySkill } from "./skill-package.mjs";
const sourceRoot = path.join(repoRoot, "skills", skillName);
const bundleRoot = path.join(repoRoot, "bundle", repoName);
const destination = path.join(bundleRoot, "skills", skillName);

assertSkillSource(sourceRoot);
fs.rmSync(bundleRoot, { recursive: true, force: true });
copySkill(sourceRoot, destination);

process.stdout.write(`[build:bundle] generated bundle/${repoName}\n`);
