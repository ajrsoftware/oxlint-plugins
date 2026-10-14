# Changesets

Each file here describes one pending release: which plugin, whether it's a patch, minor or major, and a line for its CHANGELOG. Add one with `pnpm changeset` in any PR that changes what a plugin publishes; CI fails the PR without one. `pnpm changeset --empty` opts a PR out.

Merging to `main` turns pending changesets into a `chore: release` PR, and merging that publishes. See [Releasing](../README.md#releasing).
