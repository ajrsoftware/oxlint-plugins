# @ajrsoftware/oxlint-plugin-react-preset

Opinionated React conventions for [oxlint](https://oxc.rs/docs/guide/usage/linter): named `react` imports, function-declaration components, and `children` from `PropsWithChildren`.

| Rule                                                                   | What it enforces                          | Auto-fix |
| ---------------------------------------------------------------------- | ----------------------------------------- | -------- |
| [`react-preset/no-namespace`](#react-presetno-namespace)               | No `React.useState` or `React.ReactNode`  | No       |
| [`react-preset/named-import`](#react-presetnamed-import)               | No default or namespace import of `react` | No       |
| [`react-preset/function-component`](#react-presetfunction-component)   | Components are function declarations      | Yes      |
| [`react-preset/props-with-children`](#react-presetprops-with-children) | `children` comes from `PropsWithChildren` | No       |

Loading the plugin enables nothing on its own. Turn on the rules you want.

For framework-agnostic conventions (named exports only, kebab-case filenames), see [`@ajrsoftware/oxlint-plugin-purist`](../purist).

## Install

```sh
pnpm add -D @ajrsoftware/oxlint-plugin-react-preset
```

Requires oxlint `^1.87.0`.

## Configure

```json
{
    "jsPlugins": ["@ajrsoftware/oxlint-plugin-react-preset"],
    "rules": {
        "react-preset/no-namespace": "error",
        "react-preset/named-import": "error",
        "react-preset/function-component": "error",
        "react-preset/props-with-children": "error"
    }
}
```

Each rule can be set to `"off"`, `"warn"` or `"error"` on its own, and disabled on its own with a comment such as `// oxlint-disable-next-line react-preset/function-component`.

The plugin is `react-preset` rather than `react` because oxlint rejects JS plugins that reuse a built-in plugin's name.

## Upgrading from `purist/react`

These rules were the single `purist/react` rule in `@ajrsoftware/oxlint-plugin-purist` 1.x. Each check is now its own rule:

| `purist/react` check                      | Rule                                                             |
| ----------------------------------------- | ---------------------------------------------------------------- |
| No `React.foo` namespace access           | `react-preset/no-namespace`                                      |
| No default or namespace import of `react` | `react-preset/named-import`                                      |
| Components are function declarations      | `react-preset/function-component` (takes `componentNamePattern`) |
| `children` from `PropsWithChildren`       | `react-preset/props-with-children`                               |

What each check flags and fixes is unchanged. Disable comments naming `purist/react` need the new rule names.

## Using with oxfmt

Nothing in oxfmt's config conflicts with these rules. Run the fix before the formatter:

```json
// package.json
{ "scripts": { "fix": "oxlint --fix && oxfmt --write" } }
```

Auto-fixes leave formatting to oxfmt. Turning `const Card = () => <div />` into a function declaration, for example, writes a plain `{ return <div />; }` body without indentation. Run the formatter after the fix, and one pass leaves the file clean for both tools. Run it before, and `oxfmt --check` fails until you format again.

## `react-preset/no-namespace`

No reaching through the `React` namespace, in values or types.

```tsx
// ✗
const [open, setOpen] = React.useState(false);
let node: React.ReactNode;

// ✓
import { useState, type ReactNode } from 'react';
```

Not auto-fixed: the fix needs a coordinated edit to the `react` import, and several can land in one file at once, so it is reported for a person to fix.

## `react-preset/named-import`

No default or namespace import of `react`.

```tsx
// ✗
import React from 'react';
import * as React from 'react';

// ✓
import { useState } from 'react';
```

Not auto-fixed: every `React.foo` use in the file would need rewriting too.

## `react-preset/function-component`

Components are function declarations, never arrow functions or function expressions. Auto-fixed.

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

### Options

| Option                 | Type     | Default               | Description                                                    |
| ---------------------- | -------- | --------------------- | -------------------------------------------------------------- |
| `componentNamePattern` | `string` | `^[A-Z][A-Za-z0-9]*$` | Regex a variable name must match to be treated as a component. |

## `react-preset/props-with-children`

`children` comes from `PropsWithChildren`, never declared by hand. This checks inline props types, intersections, and type aliases or interfaces declared in the same file.

```tsx
// ✗
type Props = { title: string; children: ReactNode };

// ✓
type Props = PropsWithChildren<{ title: string }>;
```

Not auto-fixed: the fix needs a coordinated edit to the `react` import.
