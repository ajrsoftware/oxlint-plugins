/**
 * Minimal glob support: `**` crosses separators, `*` and `?` do not.
 * Paths are matched repo-relative with no `./`, so a leading `./` on the
 * pattern is stripped rather than silently never matching.
 */
export function globToRegExp(pattern: string): RegExp {
    const glob = pattern.startsWith('./') ? pattern.slice(2) : pattern;
    let out = '';
    for (let i = 0; i < glob.length; i++) {
        const char = glob[i];
        if (char === '*') {
            if (glob[i + 1] === '*') {
                out += '.*';
                i++;
                if (glob[i + 1] === '/') i++;
            } else {
                out += '[^/]*';
            }
        } else if (char === '?') {
            out += '[^/]';
        } else {
            out += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        }
    }
    return new RegExp(`^${out}$`);
}

export const matchesAny = (path: string, patterns: RegExp[]) =>
    patterns.some((p) => p.test(path));
