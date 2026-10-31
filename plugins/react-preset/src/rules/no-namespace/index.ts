/**
 * react-preset/no-namespace
 *
 * No reaching through the `React` namespace, in values (`React.useState`) or
 * types (`React.ReactNode`). Import the member directly instead.
 *
 * Not auto-fixed: the fix needs a coordinated edit to the react import, and
 * several can land in one file at once.
 */

import {
    identifierName,
    type AstNode,
    type Rule
} from '@ajrsoftware/oxlint-utils';

export const noNamespace = {
    meta: {
        type: 'problem',
        schema: []
    },

    create(context) {
        return {
            MemberExpression(node: AstNode) {
                if (node.computed) return;
                if (identifierName(node.object) !== 'React') return;

                const name = identifierName(node.property) ?? 'x';

                context.report({
                    node,
                    message: `Do not reach through the React namespace. Import it directly: import { ${name} } from 'react'.`
                });
            },

            // React.Foo in type position parses as TSQualifiedName, not
            // MemberExpression, so it needs its own visitor
            TSQualifiedName(node: AstNode) {
                if (identifierName(node.left) !== 'React') return;

                const name = identifierName(node.right) ?? 'Foo';

                context.report({
                    node,
                    message: `Do not reach through the React namespace. Import it directly: import type { ${name} } from 'react'.`
                });
            }
        };
    }
} satisfies Rule;
