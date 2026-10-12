# @ajrsoftware/oxlint-plugin-sort-imports

Groups and orders the import block at the top of each file for [oxlint](https://oxc.rs/docs/guide/usage/linter). Fully auto-fixable.

| Rule                 | What it enforces                                                              | Auto-fix |
| -------------------- | ----------------------------------------------------------------------------- | -------- |
| `sort-imports/order` | Imports grouped by kind, groups separated by a blank line, longest line first | Yes      |

```ts
// ✗
import { b } from './b';
import { readFile } from 'node:fs';
import type { FC } from 'react';
import { z } from 'zod';

// ✓ after `oxlint --fix`
import type { FC } from 'react';

import { readFile } from 'node:fs';
import { z } from 'zod';

import { b } from './b';
```

## Install

The package is published to GitHub Packages. Point the `@ajrsoftware` scope there in your project's `.npmrc`; every other package still installs from npmjs.com.

```ini
@ajrsoftware:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` needs the `read:packages` scope, including in CI and deploy builds.

```sh
pnpm add -D @ajrsoftware/oxlint-plugin-sort-imports
```

Requires oxlint `^1.87.0`.

## Configure

```json
{
    "jsPlugins": ["@ajrsoftware/oxlint-plugin-sort-imports"],
    "rules": {
        "sort-imports/order": [
            "error",
            { "internalPattern": ["@/", "@ajrsoftware/"] }
        ]
    }
}
```

## Using with oxfmt

The rule is built to sit alongside oxfmt. Two things to set up:

**Turn off oxfmt's own import sorting.** oxfmt's `sortImports` sorts alphabetically within its own groups and keeps type imports next to their values; this rule puts type imports first and sorts longest first. With both on, each rewrites the other's output on every run.

```json
// .oxfmtrc.json
{ "sortImports": false }
```

**Run the fix before the formatter.**

```json
// package.json
{ "scripts": { "fix": "oxlint --fix && oxfmt --write" } }
```

After that, one pass leaves the file clean for both tools. Lengths are measured as each import reads on one line with standard spacing, not as currently written, so oxfmt adding spaces inside `{a}` or wrapping a long import across lines never changes the order this rule wants.

## How imports are ordered

Each import is classified as one of these kinds:

| Kind       | Matches                                                 |
| ---------- | ------------------------------------------------------- |
| `type`     | `import type …`                                         |
| `builtin`  | `node:*`, or a bare Node builtin such as `fs` or `path` |
| `external` | any other package                                       |
| `internal` | a specifier starting with an `internalPattern` prefix   |
| `parent`   | `../…`                                                  |
| `sibling`  | `./…`                                                   |
| `index`    | `.` or `./`                                             |

Kinds are placed into groups, in order. Groups are separated by one blank line, and within a group the longest import comes first, measured as it would read on one line. Imports of equal length are ordered alphabetically by source.

By default there are three groups:

1. `type`
2. `builtin`, `external`
3. `internal`, `parent`, `sibling`, `index`

What moves, and what doesn't:

- **Only the leading import block.** Imports after the first non-import statement are left alone. Directives such as `'use client'` stay first, followed by a blank line.
- **Comments directly above an import move with it.** A comment separated from the imports by a blank line, such as a file header, stays where it is.
- **Side-effect imports stay put.** Reordering `import './styles.css'` can change behaviour, so each one stays where it is, and the imports above and below it are sorted separately.

## Options

| Option            | Type                 | Default                | Description                                                                    |
| ----------------- | -------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `internalPattern` | `string[]`           | `["~/", "@/", "#"]`    | Specifier prefixes treated as `internal`, e.g. path aliases or your own scope. |
| `groups`          | `(Kind \| Kind[])[]` | the three groups above | The groups, in order. Kinds left out are placed in a final group.              |

```json
{
    "groups": [
        ["type"],
        ["builtin"],
        ["external"],
        ["internal", "parent", "sibling", "index"]
    ]
}
```
