import { describe, expect, it } from 'vitest';
import { identifierName, some } from '../src/ast.ts';

const node = (type: string, fields: Record<string, unknown> = {}) => ({
    type,
    range: [0, 0],
    ...fields
});

describe('ast', () => {
    it('some matches the root node', () => {
        expect(some(node('JSXElement'), (n) => n.type === 'JSXElement')).toBe(
            true
        );
    });

    it('some finds a deeply nested node', () => {
        const tree = node('Program', {
            body: [node('ReturnStatement', { argument: node('JSXFragment') })]
        });
        expect(some(tree, (n) => n.type === 'JSXFragment')).toBe(true);
    });

    it('some returns false when nothing matches', () => {
        const tree = node('Program', { body: [node('Literal')] });
        expect(some(tree, (n) => n.type === 'JSXElement')).toBe(false);
    });

    it('some skips parent back-references', () => {
        const parent = node('JSXElement');
        const child = node('Identifier', { parent });
        expect(some(child, (n) => n.type === 'JSXElement')).toBe(false);
    });

    it('some ignores primitives and null', () => {
        expect(some(null, () => true)).toBe(false);
        expect(some('JSXElement', () => true)).toBe(false);
        expect(some(42, () => true)).toBe(false);
    });

    it('some ignores objects without a type', () => {
        expect(some({ name: 'x' }, () => true)).toBe(false);
    });

    it('identifierName reads an Identifier', () => {
        expect(identifierName(node('Identifier', { name: 'React' }))).toBe(
            'React'
        );
    });

    it('identifierName is undefined for other nodes', () => {
        expect(
            identifierName(node('Literal', { name: 'React' }))
        ).toBeUndefined();
    });

    it('identifierName is undefined for missing nodes', () => {
        expect(identifierName(undefined)).toBeUndefined();
        expect(identifierName(null)).toBeUndefined();
    });

    it('identifierName is undefined when name is not a string', () => {
        expect(identifierName(node('Identifier'))).toBeUndefined();
    });
});
