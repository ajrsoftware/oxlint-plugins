/**
 * react-preset/props-with-children
 *
 * `children` comes from `PropsWithChildren`, never declared by hand. Checks
 * inline props types, intersections, and type aliases or interfaces declared
 * in the same file.
 *
 * Not auto-fixed: the fix needs a coordinated edit to the react import.
 */

import {
    identifierName,
    isComponentBody,
    type AstNode,
    type Rule
} from '@ajrsoftware/oxlint-utils';
import { childrenMember, findChildren } from './children.ts';

export const propsWithChildren = {
    meta: {
        type: 'problem',
        schema: []
    },

    create(context) {
        // type aliases / interfaces declared in this file, so a props type
        // referenced by name can be resolved back to its members
        const typeDeclarations = new Map<string, AstNode>();

        return {
            TSTypeAliasDeclaration(node: AstNode) {
                const name = identifierName(node.id);
                if (name) typeDeclarations.set(name, node);
            },

            TSInterfaceDeclaration(node: AstNode) {
                const name = identifierName(node.id);
                if (name) typeDeclarations.set(name, node);
            },

            'FunctionDeclaration, ArrowFunctionExpression, FunctionExpression'(
                node: AstNode
            ) {
                if (!isComponentBody(node)) return;

                const firstParam = ((node.params ?? []) as AstNode[])[0];
                const annotation = firstParam?.typeAnnotation as
                    | AstNode
                    | undefined;
                const typeNode = annotation?.typeAnnotation as
                    | AstNode
                    | undefined;
                if (!typeNode) return;

                let target = childrenMember(typeNode);
                let where = 'this props type';

                // props declared as `({ children }: Args)` — resolve Args in-file
                if (!target && typeNode.type === 'TSTypeReference') {
                    const name = identifierName(typeNode.typeName);
                    const declared = name
                        ? typeDeclarations.get(name)
                        : undefined;
                    if (declared) {
                        const inner =
                            declared.type === 'TSTypeAliasDeclaration'
                                ? (declared.typeAnnotation as AstNode)
                                : (declared.body as AstNode);
                        target =
                            inner?.type === 'TSInterfaceBody'
                                ? findChildren((inner.body ?? []) as AstNode[])
                                : childrenMember(inner);
                        where = `type '${name}'`;
                    }
                }

                if (!target) return;

                context.report({
                    node: target,
                    message: `Do not declare 'children' in ${where}. Use PropsWithChildren from 'react'.`
                });
            }
        };
    }
} satisfies Rule;
