/**
 * The linted file's path relative to the working directory, with forward
 * slashes, so globs written in .oxlintrc.json match on every platform.
 */
export function relativePath(filename: string, cwd: string): string {
    const absolute = filename.replace(/\\/g, '/');
    const root = cwd.replace(/\\/g, '/');
    return absolute.startsWith(`${root}/`)
        ? absolute.slice(root.length + 1)
        : absolute;
}

export const basename = (path: string) => path.slice(path.lastIndexOf('/') + 1);
