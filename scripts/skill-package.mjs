import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const repoName = "miku-toolbox-skills";
export const skillName = "igapyon-miku-toolbox";
export const requiredSkillFiles = [
  "SKILL.md",
  "LICENSE",
  "references/password-generation.md",
  "lib/password-generator.mjs"
];

export function assertSkillSource(sourceRoot) {
  for (const relativePath of requiredSkillFiles) {
    const sourcePath = path.join(sourceRoot, relativePath);
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile() ||
        fs.statSync(sourcePath).size === 0) {
      throw new Error(`required Skill file is missing or empty: ${relativePath}`);
    }
  }
}

export function includeSkillEntry(relativePath) {
  const parts = relativePath.split(path.sep);
  return !parts.includes(".DS_Store") && !["tmp", "output", "state"].includes(parts[0]);
}

export function copySkill(sourceRoot, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(sourceRoot, destination, {
    recursive: true,
    filter: (sourcePath) => includeSkillEntry(path.relative(sourceRoot, sourcePath))
  });
}
