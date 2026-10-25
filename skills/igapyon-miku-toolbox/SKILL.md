---
name: igapyon-miku-toolbox
description: Generate passwords locally with miku-toolbox's fixed character sets and rules. Use only when the user explicitly names igapyon-miku-toolbox, miku-toolbox, or miku-toolbox-skills; continue an activated workflow.
license: Apache-2.0
---

# igapyon-miku-toolbox

Use this skill for small local utilities provided by miku-toolbox. The first
available utility generates one password with the fixed miku-toolbox character
sets and rules.

## Activation

Activate only when the user explicitly names `igapyon-miku-toolbox`,
`miku-toolbox`, `miku-toolbox-skills`, or a supported utility while asking to
use miku-toolbox. Do not take over a generic password-generation request when
the product is not named.

Continue a previously activated miku-toolbox workflow without requiring the
user to repeat the product name.

If the user names the skill but does not request an operation, briefly list the
available utilities and ask which one they want. Do not generate a password
from a name-only invocation.

## Password generation

Read [password-generation.md](references/password-generation.md) for the
generation rules and helper command.

- Resolve the absolute directory containing this file and run the helper at
  `<skill-root>/lib/password-generator.mjs`. Do not assume the current working
  directory is the repository root.
- Require Node.js 22 or later. If it is missing or older, explain the runtime
  requirement and do not generate a password manually.
- Pass the length and set names as separate command arguments. Do not insert
  unvalidated user text into a shell command.
- Generate one password per request.
- A request to generate a password without options uses 8 characters and all
  four character sets. A request for another password follows the reuse rule below.
- Apply explicitly requested options and retain the remaining conditions from
  the most recent successful password request in this conversation. If there is no such
  request, use the defaults.
- For “another one” or equivalent, generate a new password using the same
  conditions as the previous request in this conversation.
- Keep conditions only in the current conversation; do not write them to files.
- Return the generated password as a single copyable string.
