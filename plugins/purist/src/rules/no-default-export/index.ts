/**
 * purist/no-default-export
 *
 * Named exports only. Flags `export default …`, `export { x as default }` and
 * `export { default } from …`.
 *
 * Framework entry points genuinely require a default export (Next.js and
 * Astro configs, oxlint plugins), so `allowDefaultExport` carries globs that
 * are exempt rather than forcing an inline disable comment in each one.
 */

import {
    globToRegExp,
    identifierName,
    matchesAny,
    relativePath,
    type AstNode,
    type Fixer,
    type Rule
} from '@ajrsoftware/oxlint-utils';
import type { Options } from './types.ts';

const DEFAULT_ALLOW_DEFAULT_EXPORT = ['**/*.config.*'];
const MESSAGE = 'Use a named export. Default exports are not allowed.';

export const noDefaultExport = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        schema: [
            {
                type: 'object',
                properties: {
                    allowDefaultExport: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                },
                additionalProperties: false
            }
        ]
    },

    create(context) {
        const opts = context.options[0] ?? {};
        const allowDefault = (
            opts.allowDefaultExport ?? DEFAULT_ALLOW_DEFAULT_EXPORT
        ).map(globToRegExp);

        const relative = relativePath(context.filename, context.cwd);
        const defaultExportAllowed = matchesAny(relative, allowDefault);
        const source = context.sourceCode;

        /** `export default function Foo() {}` can simply drop the `default`. */
        const fixNamedDeclaration = (node: AstNode) => {
            const declaration = node.declaration as AstNode | undefined;
            const named =
                (declaration?.type === 'FunctionDeclaration' ||
                    declaration?.type === 'ClassDeclaration') &&
                Boolean(declaration.id);
            if (!named || !declaration) return undefined;

            const text = source.getText();
            const body = text.slice(declaration.range[0], declaration.range[1]);
            return (fixer: Fixer) =>
                fixer.replaceTextRange(
                    [node.range[0], node.range[1]],
                    `export ${body}`
                );
        };

        return {
            ExportDefaultDeclaration(node: AstNode) {
                if (defaultExportAllowed) return;

                context.report({
                    node,
                    message: MESSAGE,
                    fix: fixNamedDeclaration(node)
                });
            },

            // `export { thing as default }`
            ExportNamedDeclaration(node: AstNode) {
                if (defaultExportAllowed) return;

                for (const specifier of (node.specifiers ?? []) as AstNode[]) {
                    const exported = specifier.exported as AstNode | undefined;
                    const name =
                        identifierName(exported) ??
                        (exported?.value as string | undefined);
                    if (name !== 'default') continue;

                    context.report({ node: specifier, message: MESSAGE });
                }
            }
        };
    }
} satisfies Rule<Options>;
