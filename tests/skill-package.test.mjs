import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const skillName = "igapyon-miku-toolbox";
const sourceRoot = path.join(repoRoot, "skills", skillName);
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const zipName = `igapyon-miku-toolbox-skills-${packageJson.version}.zip`;
const skillFiles = ["LICENSE", "SKILL.md", "lib/password-generator.mjs", "references/password-generation.md"];

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "miku toolbox package-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const entry of ["package.json", "LICENSE", "scripts", "skills"]) {
    fs.cpSync(path.join(repoRoot, entry), path.join(root, entry), { recursive: true });
  }
  return root;
}

function writeFile(root, relative, content = "fixture") {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function runScript(root, script, args = []) {
  const result = spawnSync(process.execPath, [path.join(root, "scripts", script), ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 30000
  });
  assert.ifError(result.error);
  return result;
}

function assertSuccess(result) {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}

function runInstalledHelper(skillRoot, cwd) {
  const result = spawnSync(process.execPath, [path.join(skillRoot, "lib/password-generator.mjs")], {
    cwd,
    encoding: "utf8",
    timeout: 10000
  });
  assert.ifError(result.error);
  assertSuccess(result);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /^[ADEFHMNRTYadefhmnrty][ADEFHMNRTYadefhmnrty0-9@#$]{7}\n$/);
}

test("Skill references resolve inside its distributable tree and the license matches", () => {
  assert.equal(fs.readFileSync(path.join(sourceRoot, "LICENSE"), "utf8"),
    fs.readFileSync(path.join(repoRoot, "LICENSE"), "utf8"));
  for (const relative of skillFiles.filter((entry) => entry.endsWith(".md"))) {
    const markdownPath = path.join(sourceRoot, relative);
    const markdown = fs.readFileSync(markdownPath, "utf8");
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split("#")[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      const resolved = path.resolve(path.dirname(markdownPath), target);
      assert.ok(resolved.startsWith(`${sourceRoot}${path.sep}`), `reference escapes Skill: ${target}`);
      assert.ok(fs.statSync(resolved).isFile(), `missing reference: ${target}`);
    }
  }
});

test("release ZIP includes the complete Skill and runs after isolated extraction", (t) => {
  const root = fixture(t);
  for (const entry of [".DS_Store", "tmp/scratch", "output/scratch", "state/scratch", "references/.DS_Store"]) {
    writeFile(root, `skills/${skillName}/${entry}`);
  }
  writeFile(root, `skills/${skillName}/references/state/kept.md`, "nested reference directory");
  writeFile(root, "docs/development-only.md");
  writeFile(root, "tests/development-only.mjs");
  assertSuccess(runScript(root, "build-skill-bundle-zip.mjs"));

  const zipPath = path.join(root, "bundle", zipName);
  const entries = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" })
    .trim().split(/\r?\n/).filter((entry) => !entry.endsWith("/"));
  assert.deepEqual(entries.sort(), [...skillFiles, "references/state/kept.md"]
    .map((entry) => `skills/${skillName}/${entry}`).sort());

  const stagedZip = path.join(root, "release-assets", zipName);
  fs.mkdirSync(path.dirname(stagedZip));
  fs.copyFileSync(zipPath, stagedZip);
  assertSuccess(runScript(root, "verify-release-zip.mjs", [stagedZip]));

  const extractionRoot = path.join(root, "isolated install");
  execFileSync("unzip", ["-q", stagedZip, "-d", extractionRoot]);
  const installedSkill = path.join(extractionRoot, "skills", skillName);
  assert.equal(fs.readFileSync(path.join(installedSkill, "lib/password-generator.mjs"), "utf8"),
    fs.readFileSync(path.join(sourceRoot, "lib/password-generator.mjs"), "utf8"));
  runInstalledHelper(installedSkill, os.tmpdir());
});

test("local sync replaces only its own Skill and copies executable helpers", (t) => {
  const root = fixture(t);
  writeFile(root, `.codex/skills/${skillName}/stale.txt`);
  writeFile(root, ".codex/skills/unrelated/SKILL.md", "keep unrelated Skill");
  writeFile(root, `skills/${skillName}/state/scratch`);
  writeFile(root, `skills/${skillName}/.DS_Store`);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    assertSuccess(runScript(root, "sync-codex-skill.mjs"));
  }
  const installedSkill = path.join(root, ".codex", "skills", skillName);
  for (const entry of skillFiles) {
    assert.equal(fs.readFileSync(path.join(installedSkill, entry), "utf8"),
      fs.readFileSync(path.join(sourceRoot, entry), "utf8"));
  }
  for (const excluded of ["stale.txt", "state", ".DS_Store"]) {
    assert.ok(!fs.existsSync(path.join(installedSkill, excluded)));
  }
  assert.equal(fs.readFileSync(path.join(root, ".codex/skills/unrelated/SKILL.md"), "utf8"), "keep unrelated Skill");
  runInstalledHelper(installedSkill, os.tmpdir());
});

test("missing or empty source files preserve previous bundles and installations", (t) => {
  for (const kind of ["missing helper", "empty license"]) {
    const root = fixture(t);
    writeFile(root, "bundle/miku-toolbox-skills/previous.txt", "keep previous bundle");
    writeFile(root, `.codex/skills/${skillName}/previous.txt`, "keep previous install");
    if (kind === "missing helper") {
      fs.unlinkSync(path.join(root, "skills", skillName, "lib/password-generator.mjs"));
    } else {
      fs.writeFileSync(path.join(root, "skills", skillName, "LICENSE"), "");
    }
    for (const script of ["build-skill-bundle.mjs", "sync-codex-skill.mjs"]) {
      const result = runScript(root, script);
      assert.notEqual(result.status, 0, `${kind}: ${script}`);
      assert.match(result.stderr, /required Skill file is missing or empty/);
    }
    assert.equal(fs.readFileSync(path.join(root, "bundle/miku-toolbox-skills/previous.txt"), "utf8"), "keep previous bundle");
    assert.equal(fs.readFileSync(path.join(root, `.codex/skills/${skillName}/previous.txt`), "utf8"), "keep previous install");
  }
});

test("release ZIP checks reject missing files, empty files, and unexpected roots", (t) => {
  const root = fixture(t);
  assertSuccess(runScript(root, "build-skill-bundle-zip.mjs"));
  const originalZip = path.join(root, "bundle", zipName);

  const missingZip = path.join(root, "missing-helper.zip");
  fs.copyFileSync(originalZip, missingZip);
  execFileSync("zip", ["-dq", missingZip, `skills/${skillName}/lib/password-generator.mjs`]);
  const missing = runScript(root, "verify-release-zip.mjs", [missingZip]);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /required ZIP entry is missing/);

  const emptyZip = path.join(root, "empty-license.zip");
  fs.copyFileSync(originalZip, emptyZip);
  writeFile(root, `skills/${skillName}/LICENSE`, "");
  execFileSync("zip", ["-q", emptyZip, `skills/${skillName}/LICENSE`], { cwd: root });
  const empty = runScript(root, "verify-release-zip.mjs", [emptyZip]);
  assert.equal(empty.status, 1);
  assert.match(empty.stderr, /required Skill file is missing or empty/);

  const extraZip = path.join(root, "unexpected-root.zip");
  fs.copyFileSync(originalZip, extraZip);
  writeFile(root, "docs/unexpected.txt");
  execFileSync("zip", ["-q", extraZip, "docs/unexpected.txt"], { cwd: root });
  const extra = runScript(root, "verify-release-zip.mjs", [extraZip]);
  assert.equal(extra.status, 1);
  assert.match(extra.stderr, /unexpected entry/);
});
