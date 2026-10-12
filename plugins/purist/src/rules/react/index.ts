/**
 * purist/react
 *
 * House React conventions:
 *   1. no `React.foo` namespace access
 *   2. no default or namespace import of react
 *   3. components are function declarations, never arrow/function expressions
 *   4. `children` comes from `PropsWithChildren`, never hand-declared
 *
 * Only (3) auto-fixes. The others need coordinated edits to the react import
 * statement, and several of them can land in one file at once — overlapping
 * fixes get dropped, so they are reported for a human instead.
 */

import {
    identifierName,
    type AstNode,
    type Ranged,
    type Rule
} from '@ajrsoftware/oxlint-utils';
import { childrenMember, findChildren } from './children.ts';
import { isComponentBody } from './components.ts';
import type { Options } from './types.ts';

const DEFAULT_COMPONENT_NAME = '^[A-Z][A-Za-z0-9]*$';

export const react = {
    meta: {
        type: 'problem',
        fixable: 'code',
        schema: [
            {
                type: 'object',
                properties: { componentNamePattern: { type: 'string' } },
                additionalProperties: false
            }
        ]
    },

    create(context) {
        const opts = context.options[0] ?? {};
        const isComponentName = new RegExp(
            opts.componentNamePattern ?? DEFAULT_COMPONENT_NAME
        );
        const sc = context.sourceCode;

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

            // 1. React.foo
            MemberExpression(node: AstNode) {
                if (node.computed) return;
                if (identifierName(node.object) !== 'React') return;

                const name = identifierName(node.property) ?? 'x';

                context.report({
                    node,
                    message: `Do not reach through the React namespace. Import it directly: import { ${name} } from 'react'.`
                });
            },

            // 1b. React.Foo in type position parses as TSQualifiedName,
            // not MemberExpression, so it needs its own visitor
            TSQualifiedName(node: AstNode) {
                if (identifierName(node.left) !== 'React') return;

                const name = identifierName(node.right) ?? 'Foo';

                context.report({
                    node,
                    message: `Do not reach through the React namespace. Import it directly: import type { ${name} } from 'react'.`
                });
            },

            // 2. import React / import * as React
            ImportDeclaration(node: AstNode) {
                const source = node.source as AstNode;
                if (source?.value !== 'react') return;

                for (const specifier of (node.specifiers ?? []) as AstNode[]) {
                    if (specifier.type === 'ImportDefaultSpecifier') {
                        context.report({
                            node: specifier,
                            message:
                                "Do not default-import react. Use named imports: import { useState } from 'react'."
                        });
                    } else if (specifier.type === 'ImportNamespaceSpecifier') {
                        context.report({
                            node: specifier,
                            message:
                                "Do not namespace-import react. Use named imports: import { useState } from 'react'."
                        });
                    }
                }
            },

            // 3. components must be function declarations
            VariableDeclarator(node: AstNode) {
                const id = node.id as AstNode;
                const init = node.init as AstNode | null;
                const name = identifierName(id);
                if (!name || !isComponentName.test(name)) return;
                if (
                    init?.type !== 'ArrowFunctionExpression' &&
                    init?.type !== 'FunctionExpression'
                ) {
                    return;
                }
                if (!isComponentBody(init)) return;

                const declaration = node.parent as AstNode | undefined;
                const source = sc.getText();

                // Bail on anything the rewrite cannot carry over faithfully.
                const declarators = (declaration?.declarations ??
                    []) as AstNode[];
                const unfixable =
                    !declaration ||
                    declaration.type !== 'VariableDeclaration' ||
                    declarators.length !== 1 ||
                    Boolean(id.typeAnnotation) ||
                    Boolean(init.generator);

                const report = {
                    node: id,
                    message: `Component '${name}' must be a function declaration, not an arrow function.`
                };

                if (unfixable) {
                    context.report(report);
                    return;
                }

                const slice = (n: unknown) => {
                    const r = (n as Ranged | undefined)?.range;
                    return r ? source.slice(r[0], r[1]) : '';
                };

                const isAsync = init.async ? 'async ' : '';
                const typeParams = init.typeParameters
                    ? slice(init.typeParameters)
                    : '';
                const params = ((init.params ?? []) as AstNode[])
                    .map(slice)
                    .join(', ');
                const returnType = init.returnType
                    ? slice(init.returnType)
                    : '';
                const bodyNode = init.body as AstNode;
                const body =
                    bodyNode.type === 'BlockStatement'
                        ? slice(bodyNode)
                        : `{\nreturn ${slice(bodyNode)};\n}`;

                const replacement = `${isAsync}function ${name}${typeParams}(${params})${returnType} ${body}`;

                context.report({
                    ...report,
                    fix: (fixer) =>
                        fixer.replaceTextRange(
                            [declaration.range[0], declaration.range[1]],
                            replacement
                        )
                });
            },

            // 4. hand-declared children
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
} satisfies Rule<Options>;
