# @ajrsoftware/oxlint-plugin-purist

Opinionated house style for [oxlint](https://oxc.rs/docs/guide/usage/linter): named exports only and kebab-case filenames.

| Rule                                                   | What it enforces     | Auto-fix |
| ------------------------------------------------------ | -------------------- | -------- |
| [`purist/no-default-export`](#puristno-default-export) | Named exports only   | Partly   |
| [`purist/filename-case`](#puristfilename-case)         | Kebab-case filenames | No       |

Loading the plugin enables nothing on its own. Turn on the rules you want.

For React conventions, see [`@ajrsoftware/oxlint-plugin-react-preset`](../react-preset).

## Install

```sh
pnpm add -D @ajrsoftware/oxlint-plugin-purist
```

Requires oxlint `^1.87.0`.

## Configure

```json
{
    "jsPlugins": ["@ajrsoftware/oxlint-plugin-purist"],
    "rules": {
        "purist/no-default-export": [
            "error",
            {
                "allowDefaultExport": [
                    "**/*.config.*",
                    "src/app/**/page.tsx",
                    "src/app/**/layout.tsx"
                ]
            }
        ],
        "purist/filename-case": "error"
    }
}
```

Each rule can be set to `"off"`, `"warn"` or `"error"` on its own, and disabled on its own with a comment such as `// oxlint-disable-next-line purist/no-default-export`.

## Upgrading from 1.x

2.0 split `purist/preset` into one rule per check and moved `purist/react` to its own plugin:

| 1.x                                                               | 2.x                                                                                     |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `purist/preset` → named exports, `allowDefaultExport`             | `purist/no-default-export` → `allowDefaultExport`                                       |
| `purist/preset` → filenames, `filenamePattern`, `ignoreFilenames` | `purist/filename-case` → `filenamePattern`, `ignoreFilenames`                           |
| `purist/react`                                                    | [`@ajrsoftware/oxlint-plugin-react-preset`](../react-preset#upgrading-from-puristreact) |

What each check flags and fixes is unchanged. Disable comments naming `purist/preset` or `purist/react` need the new rule names.

## `purist/no-default-export`

Named exports only. Flags `export default …`, `export { x as default }` and `export { default } from …`.

```ts
// ✗
export default function Card() {}

// ✓
export function Card() {}
```

A named `export default function Name` or `export default class Name` is auto-fixed by dropping `default`. Anonymous defaults and default-exported expressions are only reported.

Frameworks that need a default export (Next.js pages and layouts, config files) are exempted with `allowDefaultExport` instead of a disable comment in each file.

### Options

| Option               | Type       | Default             | Description                              |
| -------------------- | ---------- | ------------------- | ---------------------------------------- |
| `allowDefaultExport` | `string[]` | `["**/*.config.*"]` | Globs of files allowed a default export. |

Setting `allowDefaultExport` replaces the default, so include `**/*.config.*` yourself if you still want it.

## `purist/filename-case`

Filenames are kebab-case. The part of the filename before the first `.` must match `filenamePattern`.

```
✗ src/Card.tsx   src/useThing.ts   src/snake_case.ts
✓ src/card.tsx   src/use-thing.ts  src/vite.config.ts
```

Next.js dynamic segments such as `[slug].tsx` are always allowed.

### Options

| Option            | Type       | Default                    | Description                                           |
| ----------------- | ---------- | -------------------------- | ----------------------------------------------------- |
| `filenamePattern` | `string`   | `^[a-z0-9]+(-[a-z0-9]+)*$` | Regex the filename (before the first `.`) must match. |
| `ignoreFilenames` | `string[]` | `[]`                       | Globs of files skipped by this rule.                  |

Globs, here and in `allowDefaultExport`, are matched against the path relative to where oxlint runs, usually the repo root. `**` crosses directories; `*` and `?` stay within one.
