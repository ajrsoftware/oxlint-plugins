/**
 * react-preset/function-component
 *
 * Components are function declarations, never arrow functions or function
 * expressions. Auto-fixed, unless the rewrite can't carry everything over.
 */

import {
    identifierName,
    isComponentBody,
    type AstNode,
    type Ranged,
    type Rule
} from '@ajrsoftware/oxlint-utils';
import type { Options } from './types.ts';

const DEFAULT_COMPONENT_NAME = '^[A-Z][A-Za-z0-9]*$';

export const functionComponent = {
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

        return {
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
            }
        };
    }
} satisfies Rule<Options>;
