import { describe, expect, it } from 'vitest';
import { basename, relativePath } from '../src/path.ts';

describe('path', () => {
    it('relativePath strips the cwd', () => {
        expect(relativePath('/repo/src/index.ts', '/repo')).toBe(
            'src/index.ts'
        );
    });

    it('relativePath leaves files outside the cwd absolute', () => {
        expect(relativePath('/other/src/index.ts', '/repo')).toBe(
            '/other/src/index.ts'
        );
    });

    it('relativePath does not strip a sibling directory sharing a prefix', () => {
        expect(relativePath('/repo-two/index.ts', '/repo')).toBe(
            '/repo-two/index.ts'
        );
    });

    it('relativePath normalises Windows separators', () => {
        expect(relativePath('C:\\repo\\src\\index.ts', 'C:\\repo')).toBe(
            'src/index.ts'
        );
    });

    it('basename returns the last segment', () => {
        expect(basename('src/app/page.tsx')).toBe('page.tsx');
    });

    it('basename returns a bare filename unchanged', () => {
        expect(basename('index.ts')).toBe('index.ts');
    });
});
