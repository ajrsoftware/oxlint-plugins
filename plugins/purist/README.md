# @ajrsoftware/oxlint-plugin-purist

Opinionated house style for [oxlint](https://oxc.rs/docs/guide/usage/linter): React conventions, named exports only, and kebab-case filenames.

| Rule                             | What it enforces                                                          | Auto-fix |
| -------------------------------- | ------------------------------------------------------------------------- | -------- |
| [`purist/react`](#puristreact)   | Named React imports, function-declaration components, `PropsWithChildren` | Partly   |
| [`purist/preset`](#puristpreset) | Named exports only, kebab-case filenames                                  | Partly   |

Loading the plugin enables nothing on its own. Turn on the rules you want, so a non-React project can use `purist/preset` alone.

## Install

The package is published to GitHub Packages. Point the `@ajrsoftware` scope there in your project's `.npmrc`; every other package still installs from npmjs.com.

```ini
@ajrsoftware:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` needs the `read:packages` scope, including in CI and deploy builds.

```sh
pnpm add -D @ajrsoftware/oxlint-plugin-purist
```

Requires oxlint `^1.87.0`.

## Configure

```json
{
    "jsPlugins": ["@ajrsoftware/oxlint-plugin-purist"],
    "rules": {
        "purist/react": "error",
        "purist/preset": [
            "error",
            {
                "allowDefaultExport": [
                    "**/*.config.*",
                    "src/app/**/page.tsx",
                    "src/app/**/layout.tsx"
                ]
            }
        ]
    }
}
```

## Using with oxfmt

Nothing in oxfmt's config conflicts with these rules. Run the fix before the formatter:

```json
// package.json
{ "scripts": { "fix": "oxlint --fix && oxfmt --write" } }
```

Auto-fixes leave formatting to oxfmt. Turning `const Card = () => <div />` into a function declaration, for example, writes a plain `{ return <div />; }` body without indentation. Run the formatter after the fix, and one pass leaves the file clean for both tools. Run it before, and `oxfmt --check` fails until you format again.

## `purist/react`

Four React conventions in one rule.

**1. No reaching through the `React` namespace**, in values or types.

```tsx
// ✗
const [open, setOpen] = React.useState(false);
let node: React.ReactNode;

// ✓
import { useState, type ReactNode } from 'react';
```

**2. No default or namespace import of `react`.**

```tsx
// ✗
import React from 'react';
import * as React from 'react';

// ✓
import { useState } from 'react';
```

**3. Components are function declarations**, never arrow functions or function expressions. Auto-fixed.

```tsx
// ✗
export const Card = ({ title }: Props) => <h1>{title}</h1>;

// ✓
export function Card({ title }: Props) {
    return <h1>{title}</h1>;
}
```

A variable counts as a component when its name matches `componentNamePattern` and its function either contains JSX or returns a call to another PascalCase function (a wrapper like `const Page = (p) => RootPage(p)`). `const GET = () => new Response()` is left alone.

The fix is skipped, and the problem only reported, when the rewrite can't carry everything over: a type annotation on the variable (`const Card: FC = …`), several declarators in one statement, or a generator.

**4. `children` comes from `PropsWithChildren`**, never declared by hand. This checks inline props types, intersections, and type aliases or interfaces declared in the same file.

```tsx
// ✗
type Props = { title: string; children: ReactNode };

// ✓
type Props = PropsWithChildren<{ title: string }>;
```

Only (3) auto-fixes. The others need coordinated edits to the `react` import, and several can land in one file at once, so they are reported for a person to fix.

### Options

| Option                 | Type     | Default               | Description                                                    |
| ---------------------- | -------- | --------------------- | -------------------------------------------------------------- |
| `componentNamePattern` | `string` | `^[A-Z][A-Za-z0-9]*$` | Regex a variable name must match to be treated as a component. |

## `purist/preset`

House conventions that aren't tied to a framework.

**1. Named exports only.** Flags `export default …`, `export { x as default }` and `export { default } from …`.

```ts
// ✗
export default function Card() {}

// ✓
export function Card() {}
```

A named `export default function Name` or `export default class Name` is auto-fixed by dropping `default`. Anonymous defaults and default-exported expressions are only reported.

Frameworks that need a default export (Next.js pages and layouts, config files) are exempted with `allowDefaultExport` instead of a disable comment in each file.

**2. Filenames are kebab-case.** The part of the filename before the first `.` must match `filenamePattern`.

```
✗ src/Card.tsx   src/useThing.ts   src/snake_case.ts
✓ src/card.tsx   src/use-thing.ts  src/vite.config.ts
```

Next.js dynamic segments such as `[slug].tsx` are always allowed.

### Options

| Option               | Type       | Default                    | Description                                           |
| -------------------- | ---------- | -------------------------- | ----------------------------------------------------- |
| `allowDefaultExport` | `string[]` | `["**/*.config.*"]`        | Globs of files allowed a default export.              |
| `filenamePattern`    | `string`   | `^[a-z0-9]+(-[a-z0-9]+)*$` | Regex the filename (before the first `.`) must match. |
| `ignoreFilenames`    | `string[]` | `[]`                       | Globs of files skipped by the filename check.         |

Globs are matched against the path relative to where oxlint runs, usually the repo root. `**` crosses directories; `*` and `?` stay within one. Setting `allowDefaultExport` replaces the default, so include `**/*.config.*` yourself if you still want it.
