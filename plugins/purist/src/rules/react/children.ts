import { identifierName, type AstNode } from '@ajrsoftware/oxlint-utils';

/** The `children` signature within a list of type members, if present. */
export function findChildren(members: AstNode[]): AstNode | undefined {
    return members.find(
        (m) =>
            m.type === 'TSPropertySignature' &&
            identifierName(m.key) === 'children'
    );
}

/** Property signatures declared directly on a type literal. */
export function childrenMember(
    typeNode: AstNode | undefined
): AstNode | undefined {
    if (!typeNode) return undefined;

    if (typeNode.type === 'TSTypeLiteral') {
        return findChildren((typeNode.members ?? []) as AstNode[]);
    }

    if (typeNode.type === 'TSIntersectionType') {
        const types = (typeNode.types ?? []) as AstNode[];
        for (const t of types) {
            const hit = childrenMember(t);
            if (hit) return hit;
        }
    }

    return undefined;
}
