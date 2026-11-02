# @ajrsoftware/oxlint-plugin-sort-imports

## 1.1.0

### Minor Changes

- 3d46f97: Treat SvelteKit's `$lib/` alias as `internal` by default, so `$lib/…` imports group with local imports instead of packages.

### Patch Changes

- 3d46f97: Keep the indentation of an indented `<script>` block in `.svelte` and `.vue` files. The fix wrote every import after the first one at column 0.

## 1.0.1

### Patch Changes

- ad008ce: No code changes. First release published by the release workflow, so it carries npm provenance.
