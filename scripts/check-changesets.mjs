/**
 * Fails when a plugin's published output changes without a changeset for it.
 *
 * Packs every plugin at HEAD and at the base ref, and compares what a user
 * installs: each file in the tarball except the docs (README, CHANGELOG,
 * LICENSE), and the package.json fields that change what gets installed or
 * how it resolves. `version` and `devDependencies` are left out, so the
 * release PR and tooling-only updates pass.
 *
 * A changeset added since the base covers the plugins it names. An empty one
 * (`pnpm changeset --empty`) covers every plugin: the way to say "this
 * changes the output, but needs no release".
 *
 * Usage: node scripts/check-changesets.mjs <base-ref> [--report-only]
 *
 * --report-only exits 0 whatever it finds. In GitHub Actions the plugins
 * missing a changeset are also written to the step's `missing` output,
 * space-separated.
 */

import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import {
    appendFileSync,
    existsSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync
} from 'node:fs';

const [base, ...flags] = process.argv.slice(2);
if (!base) {
    console.error(
        'Usage: node scripts/check-changesets.mjs <base-ref> [--report-only]'
    );
    process.exit(2);
}
const reportOnly = flags.includes('--report-only');

// Shipped alongside the code, but editing them changes nothing a user runs.
const DOCS = /^(readme|changelog|license)(\.|$)/i;

// The package.json fields that decide what a user installs and how it loads.
const MANIFEST_FIELDS = [
    'dependencies',
    'optionalDependencies',
    'peerDependencies',
    'peerDependenciesMeta',
    'bundleDependencies',
    'bundledDependencies',
    'exports',
    'main',
    'module',
    'types',
    'bin',
    'type',
    'engines',
    'os',
    'cpu'
];

const root = process.cwd();
const tmp = mkdtempSync(join(tmpdir(), 'check-changesets-'));

/** Runs a command and returns its stdout. */
const read = (command, args, cwd) =>
    execFileSync(command, args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit']
    });

/** Runs a command with its output going to the log, as a build should. */
const run = (command, args, cwd) =>
    execFileSync(command, args, { cwd, stdio: ['ignore', 2, 'inherit'] });

/** Builds and packs each published plugin in `dir`: name → (path → contents). */
function snapshot(dir, label) {
    run('pnpm', ['--filter', './plugins/*', 'build'], dir);

    const plugins = new Map();
    for (const entry of readdirSync(join(dir, 'plugins'))) {
        const pluginDir = join(dir, 'plugins', entry);
        if (!existsSync(join(pluginDir, 'package.json'))) continue;
        const { name, private: isPrivate } = JSON.parse(
            readFileSync(join(pluginDir, 'package.json'), 'utf8')
        );
        if (isPrivate) continue;

        const dest = join(tmp, label, entry);
        run('pnpm', ['pack', '--pack-destination', dest], pluginDir);
        const tarball = readdirSync(dest).find((file) => file.endsWith('.tgz'));
        read('tar', ['-xzf', join(dest, tarball), '-C', dest]);
        plugins.set(name, published(join(dest, 'package')));
    }
    return plugins;
}

/** What a user gets from an unpacked tarball, minus the docs and dev-only fields. */
function published(dir) {
    const files = new Map();
    for (const file of readdirSync(dir, {
        recursive: true,
        withFileTypes: true
    })) {
        if (!file.isFile()) continue;
        const path = relative(dir, join(file.parentPath, file.name));
        if (path === 'package.json' || (!path.includes('/') && DOCS.test(path)))
            continue;
        files.set(path, readFileSync(join(dir, path), 'base64'));
    }

    const manifest = JSON.parse(
        readFileSync(join(dir, 'package.json'), 'utf8')
    );
    const fields = MANIFEST_FIELDS.filter((field) => field in manifest).map(
        (field) => [field, manifest[field]]
    );
    files.set('package.json', JSON.stringify(fields));
    return files;
}

/** The paths that differ between two snapshots of one plugin. */
function changes(before, after) {
    const paths = new Set([...before.keys(), ...after.keys()]);
    return [...paths]
        .filter((path) => before.get(path) !== after.get(path))
        .sort();
}

/** The plugins covered by changesets added since the base, or 'all' for an empty one. */
function covered() {
    const added = read(
        'git',
        [
            'diff',
            '--name-only',
            '--diff-filter=A',
            `${base}...HEAD`,
            '--',
            '.changeset/*.md'
        ],
        root
    )
        .split('\n')
        .filter((file) => file && !file.endsWith('/README.md'));

    const names = new Set();
    for (const file of added) {
        const [, frontmatter = ''] = readFileSync(
            join(root, file),
            'utf8'
        ).split(/^---\s*$/m);
        const packages = [
            ...frontmatter.matchAll(/^\s*['"]?([^'":\s]+)['"]?\s*:/gm)
        ].map((match) => match[1]);
        if (packages.length === 0) return 'all';
        for (const name of packages) names.add(name);
    }
    return names;
}

try {
    const after = snapshot(root, 'head');

    const worktree = join(tmp, 'base');
    read('git', ['worktree', 'add', '--detach', worktree, base], root);
    let before;
    try {
        run(
            'pnpm',
            ['install', '--frozen-lockfile', '--prefer-offline'],
            worktree
        );
        before = snapshot(worktree, 'base-pack');
    } finally {
        read('git', ['worktree', 'remove', '--force', worktree], root);
    }

    const changesets = covered();
    const missing = [];
    console.log();
    for (const [name, files] of after) {
        const changed = before.has(name)
            ? changes(before.get(name), files)
            : ['new plugin'];
        if (changed.length === 0) {
            console.log(`✓ ${name}: published output unchanged`);
        } else if (changesets === 'all' || changesets.has(name)) {
            console.log(
                `✓ ${name}: ${changed.join(', ')} changed, covered by a changeset`
            );
        } else {
            console.log(
                `✗ ${name}: ${changed.join(', ')} changed, with no changeset`
            );
            missing.push(name);
        }
    }

    if (process.env.GITHUB_OUTPUT)
        appendFileSync(
            process.env.GITHUB_OUTPUT,
            `missing=${missing.join(' ')}\n`
        );

    if (missing.length > 0 && !reportOnly) {
        console.error(
            `\nThis changes what ${missing.join(' and ')} publishes. Run \`pnpm changeset\` and pick ` +
                'it so the change is released, or `pnpm changeset --empty` if it should not be.'
        );
        process.exitCode = 1;
    }
} finally {
    rmSync(tmp, { recursive: true, force: true });
}
