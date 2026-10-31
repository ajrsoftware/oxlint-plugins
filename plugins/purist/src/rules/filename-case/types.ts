export interface Options {
    /** Regex the filename stem must match. */
    filenamePattern?: string;
    /** Globs, repo-relative, exempt from the filename check. */
    ignoreFilenames?: string[];
}
