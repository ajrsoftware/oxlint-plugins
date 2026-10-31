import { describe, expect, it } from 'vitest';
import { isComponentBody } from '../src/react.ts';
import type { AstNode } from '../src/types.ts';

const node = (type: string, fields: Record<string, unknown> = {}) =>
    ({ type, range: [0, 0], ...fields }) as AstNode;

const call = (name: string) =>
    node('CallExpression', { callee: node('Identifier', { name }) });

const arrow = (body: AstNode) => node('ArrowFunctionExpression', { body });

describe('react', () => {
    it('isComponentBody accepts a function that contains JSX', () => {
        expect(isComponentBody(arrow(node('JSXElement')))).toBe(true);
    });

    it('isComponentBody accepts an expression body calling a component', () => {
        expect(isComponentBody(arrow(call('RootPage')))).toBe(true);
    });

    it('isComponentBody accepts a returned, awaited component call', () => {
        const body = node('BlockStatement', {
            body: [
                node('ReturnStatement', {
                    argument: node('AwaitExpression', {
                        argument: call('RootPage')
                    })
                })
            ]
        });
        expect(isComponentBody(arrow(body))).toBe(true);
    });

    it('isComponentBody rejects a call to a lowercase function', () => {
        expect(isComponentBody(arrow(call('render')))).toBe(false);
    });

    it('isComponentBody rejects a constructor call', () => {
        const body = node('NewExpression', {
            callee: node('Identifier', { name: 'Response' })
        });
        expect(isComponentBody(arrow(body))).toBe(false);
    });
});
