# oxlint-plugins

A collection of [oxlint](https://oxc.rs/docs/guide/usage/linter) JS plugins from AJR Software. Each plugin is published on its own to npm, so a project installs only the rules it wants.

| Plugin                                                            | What it offers                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`@ajrsoftware/oxlint-plugin-purist`](plugins/purist)             | Opinionated house style: React conventions, named exports only, kebab-case filenames |
| [`@ajrsoftware/oxlint-plugin-sort-imports`](plugins/sort-imports) | Groups and orders the import block, fully auto-fixable                               |

Each plugin's README covers installing, configuring and what every rule checks.

## Developing

```sh
pnpm install
pnpm build       # bundles each plugin to plugins/<name>/dist/index.mjs
pnpm test        # every __test__ suite (vitest)
pnpm check       # format + lint + typecheck; rewrites nothing
pnpm fix         # oxlint --fix, then oxfmt --write
pnpm update      # pick dependency updates interactively
pnpm changeset   # record a release for the plugins a PR changes
```

CI runs format, lint (warnings as errors), typecheck, test, build and a dry-run pack on every push to `main` and every pull request. On a pull request it also checks that any plugin whose published output changes has a changeset (see [Releasing](#releasing)).

```
plugins/<plugin>/            # published as @ajrsoftware/oxlint-plugin-<plugin>
├── README.md                # what the plugin offers; ships with the package
├── src/
│   ├── index.ts             # the plugin: meta.name + rule map
│   └── rules/<rule>/
│       ├── index.ts         # the rule: meta + create
│       ├── types.ts         # Options and rule-specific node shapes
│       └── *.ts             # logic only this rule uses
└── __test__/<rule>.test.ts  # one RuleTester suite per rule

packages/utils/              # @ajrsoftware/oxlint-utils, private
├── src/                     # plugin API types + shared helpers
└── __test__/
```

Anything more than one rule needs goes in `packages/utils`: the plugin API types (`Rule`, `Context`, `AstNode`…) and generic helpers (AST search, globs, paths). It is never published. tsdown inlines it into each plugin's single `dist/index.mjs`, so consumers install one package per plugin and nothing else.

Rule tests use oxlint's own `RuleTester` through `runRuleTests` from `@ajrsoftware/oxlint-utils/testing`. Each case's `name` becomes the test title; a relative `filename` is seen by the rule as repo-relative.

Shared dependency versions live once in the `catalog` in `pnpm-workspace.yaml`; packages reference them as `catalog:`. `pnpm update` writes new versions there, and Dependabot opens one grouped update PR a week. The `oxlint` peer range in each plugin is deliberately not from the catalog: it is the oldest oxlint the plugin supports, raised by hand (as a major release) only when a plugin needs something newer.

### Changing a rule

- Add cases to that rule's `__test__` suite: valid code that must stay quiet, invalid code with the exact message, and `output` for anything it fixes (`output: null` when it reports without fixing).
- Leave formatting to oxfmt. Fixes must come out clean after `oxlint --fix && oxfmt --write`.
- Update the plugin's README for anything a user would notice: a new rule, option or default, or a change to what a rule flags or fixes.
- Run `pnpm changeset`, pick the plugin and the bump, and write the CHANGELOG line. Changes that don't alter the published bundle (tests, docs, tooling) need no changeset. CI fails a PR that changes a plugin's published output without one.

### Releasing

A changeset is the only thing that releases a plugin. A merge to `main` without one, whoever opened the PR, publishes nothing. With one, the release is automatic: each plugin it names is published to npm and gets its own tag and GitHub release, always together.

The bump you pick in the changeset follows semver as ESLint plugins do:

| Bump  | When                                                                                        |
| ----- | ------------------------------------------------------------------------------------------- |
| patch | a fix that reports fewer errors (false positive), a fix that produced bad code, performance |
| minor | a new rule or option, wider oxlint support, a fix that reports more errors                  |
| major | a removed or renamed rule or option, a stricter default, a higher minimum oxlint or Node    |

1. A PR with a changeset merges to `main`.
2. The release workflow opens a `chore: release` PR that bumps versions and writes each plugin's `CHANGELOG.md`, and turns on auto-merge.
3. Once CI passes it merges, and the next run publishes to npm with provenance, tags `@ajrsoftware/oxlint-plugin-<name>@<version>`, and creates a GitHub release.

So a release can't be forgotten, CI checks every PR with `scripts/check-changesets.mjs`. It packs each plugin from the PR and from `main` and compares what a user would install: everything in the tarball except the docs, plus the `package.json` fields that affect installing (`dependencies`, `peerDependencies`, `exports`…). If a plugin's output changed and the PR adds no changeset naming it, CI fails. A change that alters the output but shouldn't release, such as a refactor that only moves code around in the bundle, opts out with `pnpm changeset --empty`. Run it locally with `node scripts/check-changesets.mjs origin/main`.

Dependabot's minor and patch PRs auto-merge once CI passes, so every week the plugins are tested against the newest oxlint. Majors (a major of the dependency, not of a plugin) wait for review. Most updates only touch tooling (vitest, oxfmt, the oxlint we test against): users never install those, every plugin's output is unchanged, and they release nothing. When an update does change a plugin's output, such as a tsdown release that alters the bundle, CI's changeset check fails, so it doesn't auto-merge. Check out its branch, decide whether the change should ship, add `pnpm changeset` (release) or `pnpm changeset --empty` (no release), and push.

Setup this relies on: a GitHub App installed on the repo (contents and pull requests: read and write) whose client ID and private key are stored as `RELEASE_APP_CLIENT_ID` and `RELEASE_APP_PRIVATE_KEY` in both the Actions and the Dependabot secrets; each plugin on npm linked to `release.yml` as a trusted publisher; auto-merge allowed in the repo settings; and a ruleset on `main` requiring the `Check, test and build` check.

### Adding a plugin

1. Copy an existing `plugins/<name>` directory and rename it. Its `meta.name` must not be one of oxlint's built-in plugin names (`react`, `import`, `jsx-a11y`…), which oxlint rejects.
2. Update `name`, `description` and `repository.directory` in its `package.json`, and reset `version`.
3. Write its README and its `__test__` suites.
