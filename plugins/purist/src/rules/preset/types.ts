export interface Options {
    /** Globs, repo-relative, permitted to use a default export. */
    allowDefaultExport?: string[];
    /** Regex the filename stem must match. */
    filenamePattern?: string;
    /** Globs, repo-relative, exempt from the filename check. */
    ignoreFilenames?: string[];
}
