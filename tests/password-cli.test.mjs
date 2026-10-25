import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const helper = fileURLToPath(new URL("../skills/igapyon-miku-toolbox/lib/password-generator.mjs", import.meta.url));

function run(args) {
  const result = spawnSync(process.execPath, [helper, ...args], {
    cwd: os.tmpdir(),
    encoding: "utf8",
    timeout: 10000
  });
  assert.ifError(result.error);
  return result;
}

test("CLI defaults emit one password line from an unrelated working directory", () => {
  const result = run([]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /^[ADEFHMNRTYadefhmnrty][ADEFHMNRTYadefhmnrty0-9@#$]{7}\n$/);
});

test("CLI runs through a symbolic link in a path containing spaces", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "miku toolbox link-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const alias = path.join(root, "password helper.mjs");
  fs.symlinkSync(helper, alias);
  const result = spawnSync(process.execPath, [alias], {
    cwd: os.tmpdir(),
    encoding: "utf8",
    timeout: 10000
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /^[ADEFHMNRTYadefhmnrty][ADEFHMNRTYadefhmnrty0-9@#$]{7}\n$/);
});

test("CLI applies length and repeated exclusions", () => {
  const custom = run(["--length", "16", "--exclude", "symbols"]);
  assert.equal(custom.status, 0, custom.stderr);
  assert.equal(custom.stderr, "");
  assert.match(custom.stdout, /^[ADEFHMNRTYadefhmnrty][ADEFHMNRTYadefhmnrty0-9]{15}\n$/);
  assert.equal(new Set(custom.stdout.trim()).size, 16);

  const minimal = run(["--length", "1", "--exclude", "lower", "--exclude", "digits", "--exclude", "symbols"]);
  assert.equal(minimal.status, 0, minimal.stderr);
  assert.equal(minimal.stderr, "");
  assert.match(minimal.stdout, /^[ADEFHMNRTY]\n$/);
});

test("CLI help describes options without generating a password", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /^Usage:/);
  assert.ok(result.stdout.includes("--length"));
  assert.ok(result.stdout.includes("--exclude"));
});

const invalidCases = [
  ["zero length", ["--length", "0"]],
  ["negative length", ["--length=-1"]],
  ["fractional length", ["--length", "2.5"]],
  ["non-numeric length", ["--length", "abc"]],
  ["unsafe integer length", ["--length", "9007199254740992"]],
  ["too few characters", ["--length", "3"]],
  ["no character sets", ["--exclude", "upper", "--exclude", "lower", "--exclude", "digits", "--exclude", "symbols"]],
  ["no letter sets", ["--exclude", "upper", "--exclude", "lower"]],
  ["unknown set", ["--exclude", "emoji"]],
  ["missing option value", ["--length"]],
  ["unknown option", ["--unknown"]],
  ["positional input", ["password"]]
];

for (const [label, args] of invalidCases) {
  test(`CLI rejects ${label} with status 2 and no stdout`, () => {
    const result = run(args);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /^エラー: [^\n]+\n$/u);
  });
}
