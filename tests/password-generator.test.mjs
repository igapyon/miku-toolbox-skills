import assert from "node:assert/strict";
import test from "node:test";
import { generatePassword } from "../skills/igapyon-miku-toolbox/lib/password-generator.mjs";

const characterSets = {
  upper: "ADEFHMNRTY",
  lower: "adefhmnrty",
  digits: "0123456789",
  symbols: "@#$"
};
const keys = Object.keys(characterSets);

function assertPassword(password, length, selected) {
  const allowed = new Set(selected.flatMap((key) => [...characterSets[key]]));
  assert.equal(password.length, length);
  assert.match(password[0], /^[ADEFHMNRTYadefhmnrty]$/);
  assert.ok([...password].every((character) => allowed.has(character)));
  for (const key of selected) {
    assert.ok([...password].some((character) => characterSets[key].includes(character)), `missing ${key}`);
  }
  assert.equal(new Set(password).size, Math.min(length, allowed.size));
}

test("defaults produce eight distinct characters covering all four sets", () => {
  assertPassword(generatePassword(), 8, keys);
});

for (let mask = 1; mask < 16; mask += 1) {
  const selected = keys.filter((_, index) => mask & (1 << index));
  if (!selected.includes("upper") && !selected.includes("lower")) continue;
  const exclude = keys.filter((key) => !selected.includes(key));
  const uniqueCount = selected.reduce((count, key) => count + characterSets[key].length, 0);
  const lengths = new Set([
    selected.length,
    Math.max(8, selected.length),
    uniqueCount - 1,
    uniqueCount,
    uniqueCount + 1,
    uniqueCount * 2
  ]);

  test(`${selected.join("+")} preserves its character and duplicate boundaries`, () => {
    for (const length of lengths) {
      for (let sample = 0; sample < 8; sample += 1) {
        assertPassword(generatePassword({ length, exclude }), length, selected);
      }
    }
    if (selected.length > 1) {
      assert.throws(() => generatePassword({ length: selected.length - 1, exclude }), /文字数/);
    }
  });
}

test("invalid lengths and selections are rejected before generation", () => {
  for (const length of [0, -1, 1.5, NaN, Infinity, "8", Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => generatePassword({ length }), RangeError);
  }
  for (const exclude of ["symbols", null, ["unknown"], [1]]) {
    assert.throws(() => generatePassword({ exclude }), TypeError);
  }
  assert.throws(() => generatePassword({ exclude: keys }), /文字種/);
  assert.throws(() => generatePassword({ exclude: ["upper", "lower"] }), /英大文字/);
});
