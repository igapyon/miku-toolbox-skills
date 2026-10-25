import { randomInt } from "node:crypto";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// Compatibility reference: local-html-tools password generator at
// 9e4e8fcb71ddecc055fcc0add6b75c97df70e9d9 (Apache-2.0). This helper is a
// behavior-level rewrite, not a copied source file.
const GROUPS = [
  { key: "upper", characters: "ADEFHMNRTY" },
  { key: "lower", characters: "adefhmnrty" },
  { key: "digits", characters: "0123456789" },
  { key: "symbols", characters: "@#$" }
];

const GROUP_KEYS = new Set(GROUPS.map(({ key }) => key));

export function generatePassword({ length = 8, exclude = [] } = {}) {
  if (!Number.isSafeInteger(length) || length < 1) {
    throw new RangeError("文字数は1以上の整数で指定してください。");
  }
  if (!Array.isArray(exclude) || exclude.some((key) => typeof key !== "string" || !GROUP_KEYS.has(key))) {
    throw new TypeError("文字種は upper、lower、digits、symbols のいずれかで指定してください。");
  }

  const excluded = new Set(exclude);
  const groups = GROUPS.filter(({ key }) => !excluded.has(key));
  if (groups.length === 0) {
    throw new Error("文字種を1つ以上選択してください。");
  }

  const letterGroups = groups.filter(({ key }) => key === "upper" || key === "lower");
  if (letterGroups.length === 0) {
    throw new Error("英大文字または英小文字を選択してください。");
  }
  if (length < groups.length) {
    throw new Error("選択した文字種の数より文字数が少ないため生成できません。");
  }

  const remaining = groups.flatMap(({ characters }) => [...characters]);
  const allCharacters = remaining.slice();
  const firstGroup = letterGroups[randomInt(letterGroups.length)];
  const passwordCharacters = [pickAndRemove(firstGroup.characters.split(""))];
  removeCharacter(remaining, passwordCharacters[0]);

  for (const group of groups) {
    if (group === firstGroup) continue;
    const character = pickAndRemove(group.characters.split(""));
    removeCharacter(remaining, character);
    passwordCharacters.push(character);
  }

  while (passwordCharacters.length < length) {
    if (remaining.length > 0) {
      passwordCharacters.push(pickAndRemove(remaining));
    } else {
      passwordCharacters.push(allCharacters[randomInt(allCharacters.length)]);
    }
  }

  for (let index = passwordCharacters.length - 1; index > 1; index -= 1) {
    const otherIndex = 1 + randomInt(index);
    [passwordCharacters[index], passwordCharacters[otherIndex]] =
      [passwordCharacters[otherIndex], passwordCharacters[index]];
  }

  return passwordCharacters.join("");
}

function pickAndRemove(characters) {
  return characters.splice(randomInt(characters.length), 1)[0];
}

function removeCharacter(characters, target) {
  const index = characters.indexOf(target);
  if (index !== -1) characters.splice(index, 1);
}

function runCli() {
  let parsed;
  try {
    parsed = parseArgs({
      options: {
        length: { type: "string", short: "l" },
        exclude: { type: "string", multiple: true },
        help: { type: "boolean", short: "h" }
      },
      strict: true,
      allowPositionals: false
    });
  } catch {
    writeError("引数が不正です。--help で使用方法を確認してください。");
    return;
  }

  if (parsed.values.help) {
    process.stdout.write(
      "Usage: node password-generator.mjs [--length <integer>] [--exclude <upper|lower|digits|symbols>]...\n"
    );
    return;
  }

  try {
    const length = parsed.values.length === undefined
      ? 8
      : parseLength(parsed.values.length);
    const password = generatePassword({
      length,
      exclude: parsed.values.exclude ?? []
    });
    process.stdout.write(`${password}\n`);
  } catch (error) {
    writeError(error.message);
  }
}

function parseLength(value) {
  if (!/^\d+$/.test(value)) {
    throw new RangeError("文字数は1以上の整数で指定してください。");
  }
  const length = Number(value);
  if (!Number.isSafeInteger(length) || length < 1) {
    throw new RangeError("文字数は1以上の整数で指定してください。");
  }
  return length;
}

function writeError(message) {
  process.stderr.write(`エラー: ${message}\n`);
  process.exitCode = 2;
}

function isDirectExecution() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectExecution()) {
  runCli();
}
