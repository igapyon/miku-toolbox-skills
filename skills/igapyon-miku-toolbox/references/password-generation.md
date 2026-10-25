# Password generation

The helper uses Node.js 22 or later. It uses Node's cryptographic random number
generator and writes no files.

## Defaults

- Length: 8
- Uppercase, lowercase, digits, and symbols: all enabled
- Passwords per request: 1

## Character sets

| Set | Characters |
| --- | --- |
| `upper` | `ADEFHMNRTY` |
| `lower` | `adefhmnrty` |
| `digits` | `0123456789` |
| `symbols` | `@#$` |

Only ASCII characters are used.

## Rules

- Length must be a positive integer.
- Select at least one set, including at least one of `upper` or `lower`.
- Length must be at least the number of selected sets.
- The first character is selected from an enabled letter set.
- Include at least one character from every enabled set.
- Do not repeat a character until all enabled characters have been used. If the
  requested length exceeds the enabled character count, allow repeats after
  using every enabled character once.
- Shuffle the characters after the first character.

## Run the helper

From the repository root:

```sh
node skills/igapyon-miku-toolbox/lib/password-generator.mjs
node skills/igapyon-miku-toolbox/lib/password-generator.mjs --length 16 --exclude symbols
```

When installed as a Skill, resolve the absolute directory containing this
Skill's `SKILL.md` and invoke `<skill-root>/lib/password-generator.mjs`,
independent of the current working directory. Pass `--length` and `--exclude`
values as separate arguments. If Node.js 22 or later is unavailable, do not
try to generate the password in the conversation instead.

Options:

- `--length <integer>` sets the length. The default is `8`.
- `--exclude <set>` disables one set. Use `upper`, `lower`, `digits`, or
  `symbols`; repeat the option to disable more than one set.
- `--help` prints the command syntax.

On success, stdout contains only the password followed by a newline. Invalid
options or generation conditions produce a Japanese error on stderr and exit
with status `2`.
