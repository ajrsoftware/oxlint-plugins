import type { AstNode } from './types.ts';

/** Walks an arbitrary AST subtree, skipping parent back-references. */
export function some(
    node: unknown,
    predicate: (n: AstNode) => boolean
): boolean {
    if (node === null || typeof node !== 'object') return false;
    if (Array.isArray(node))
        return node.some((child) => some(child, predicate));

    const candidate = node as AstNode;
    if (typeof candidate.type === 'string' && predicate(candidate)) return true;

    for (const key of Object.keys(candidate)) {
        if (key === 'parent') continue;
        if (some(candidate[key], predicate)) return true;
    }
    return false;
}

/** The name of an `Identifier` node, or undefined for anything else. */
export function identifierName(node: unknown): string | undefined {
    const candidate = node as AstNode | null | undefined;
    if (candidate?.type !== 'Identifier') return undefined;
    return typeof candidate.name === 'string' ? candidate.name : undefined;
}
