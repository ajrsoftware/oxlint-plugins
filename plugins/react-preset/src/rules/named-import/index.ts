/**
 * react-preset/named-import
 *
 * No default or namespace import of `react`: `import React from 'react'` and
 * `import * as React from 'react'` both become named imports.
 *
 * Not auto-fixed: every `React.foo` use in the file would need rewriting too.
 */

import type { AstNode, Rule } from '@ajrsoftware/oxlint-utils';

export const namedImport = {
    meta: {
        type: 'problem',
        schema: []
    },

    create(context) {
        return {
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
            }
        };
    }
} satisfies Rule;
