import { identifierName, some, type AstNode } from '@ajrsoftware/oxlint-utils';

const JSX_NODES = new Set(['JSXElement', 'JSXFragment']);

const containsJsx = (node: unknown) => some(node, (n) => JSX_NODES.has(n.type));

const isPascalCase = (name: string | undefined) =>
    name !== undefined && /^[A-Z][A-Za-z0-9]*$/.test(name);

/** `Foo(...)` or `await Foo(...)` — delegating to another component. */
function callsComponent(node: unknown): boolean {
    let call = node as AstNode | null | undefined;
    if (call?.type === 'AwaitExpression') call = call.argument as AstNode;
    if (call?.type !== 'CallExpression') return false;

    return isPascalCase(identifierName(call.callee));
}

/**
 * A component either writes JSX or hands off to another component. The second
 * case covers wrappers like `const Page = (p) => RootPage(p)`, while leaving
 * `const GET = () => new Response()` alone — a NewExpression, not a call.
 */
export function isComponentBody(fn: AstNode): boolean {
    if (containsJsx(fn)) return true;

    const body = fn.body as AstNode | undefined;
    if (!body) return false;
    if (body.type !== 'BlockStatement') return callsComponent(body);

    return some(
        body,
        (n) => n.type === 'ReturnStatement' && callsComponent(n.argument)
    );
}
