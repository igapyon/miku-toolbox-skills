#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { repoRoot, skillName, assertSkillSource, copySkill } from "./skill-package.mjs";
const source = path.join(repoRoot, "skills", skillName);
const destination = path.join(repoRoot, ".codex", "skills", skillName);

assertSkillSource(source);
fs.rmSync(destination, { recursive: true, force: true });
copySkill(source, destination);
process.stdout.write(`[sync:codex] installed .codex/skills/${skillName}\n`);
