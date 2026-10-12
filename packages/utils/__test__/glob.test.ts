import { describe, expect, it } from 'vitest';
import { globToRegExp, matchesAny } from '../src/glob.ts';

const matches = (pattern: string, path: string) =>
    globToRegExp(pattern).test(path);

describe('glob', () => {
    it('* matches within a single segment', () => {
        expect(matches('src/*.ts', 'src/index.ts')).toBe(true);
        expect(matches('src/*.ts', 'src/lib/index.ts')).toBe(false);
    });

    it('** crosses directories', () => {
        expect(matches('src/**/page.tsx', 'src/app/blog/page.tsx')).toBe(true);
        expect(matches('src/**/page.tsx', 'src/page.tsx')).toBe(true);
    });

    it('a leading **/ matches at any depth, including the root', () => {
        expect(matches('**/*.config.*', 'vite.config.ts')).toBe(true);
        expect(matches('**/*.config.*', 'apps/web/astro.config.mjs')).toBe(
            true
        );
    });

    it('? matches exactly one character, never a separator', () => {
        expect(matches('src/?.ts', 'src/a.ts')).toBe(true);
        expect(matches('src/?.ts', 'src/ab.ts')).toBe(false);
        expect(matches('src?a.ts', 'src/a.ts')).toBe(false);
    });

    it('a leading ./ is stripped', () => {
        expect(matches('./src/*.ts', 'src/index.ts')).toBe(true);
    });

    it('regex characters are literal', () => {
        expect(matches('src/(app)/[slug].tsx', 'src/(app)/[slug].tsx')).toBe(
            true
        );
        expect(matches('a+b.ts', 'aab.ts')).toBe(false);
        expect(matches('file.ts', 'filexts')).toBe(false);
    });

    it('matches the whole path, not a substring', () => {
        expect(matches('src/*.ts', 'packages/src/index.ts')).toBe(false);
        expect(matches('src/*.ts', 'src/index.tsx')).toBe(false);
    });

    it('matchesAny is true when any pattern matches', () => {
        const patterns = ['src/*.ts', 'lib/**'].map(globToRegExp);
        expect(matchesAny('lib/a/b.ts', patterns)).toBe(true);
        expect(matchesAny('test/a.ts', patterns)).toBe(false);
    });

    it('matchesAny is false for no patterns', () => {
        expect(matchesAny('src/index.ts', [])).toBe(false);
    });
});
