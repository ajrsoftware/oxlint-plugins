import { runRuleTests } from '@ajrsoftware/oxlint-utils/testing';
import { react } from '../src/rules/react/index.ts';

const namespace = (name: string) =>
    `Do not reach through the React namespace. Import it directly: import { ${name} } from 'react'.`;
const typeNamespace = (name: string) =>
    `Do not reach through the React namespace. Import it directly: import type { ${name} } from 'react'.`;
const arrow = (name: string) =>
    `Component '${name}' must be a function declaration, not an arrow function.`;
const children = (where: string) =>
    `Do not declare 'children' in ${where}. Use PropsWithChildren from 'react'.`;
const defaultImport =
    "Do not default-import react. Use named imports: import { useState } from 'react'.";
const namespaceImport =
    "Do not namespace-import react. Use named imports: import { useState } from 'react'.";

runRuleTests('purist/react', react, {
    valid: [
        {
            name: 'function declaration component',
            code: 'function Card() { return <div />; }'
        },
        {
            name: 'named react imports',
            code: "import { useState, type FC } from 'react';"
        },
        {
            name: 'PascalCase arrow that returns no JSX is not a component',
            code: 'const GET = () => new Response();'
        },
        {
            name: 'lowercase arrow returning JSX is not a component',
            code: 'const render = () => <div />;'
        },
        {
            name: 'children from PropsWithChildren',
            code: "import type { PropsWithChildren } from 'react';\nfunction Card({ children }: PropsWithChildren<{ title: string }>) { return <div>{children}</div>; }"
        },
        {
            name: 'children on a non-component function',
            code: 'function wrap(props: { children: string }) { return props.children; }'
        },
        {
            name: 'computed access on React is ignored',
            code: "React['useState'];"
        },
        {
            name: 'componentNamePattern narrows what counts as a component',
            code: 'const Card = () => <div />;',
            options: [{ componentNamePattern: '^Page$' }]
        }
    ],

    invalid: [
        {
            name: 'React.useState',
            code: 'const [a] = React.useState(0);',
            errors: [{ message: namespace('useState') }]
        },
        {
            name: 'React.ReactNode in a type',
            code: 'let node: React.ReactNode;',
            errors: [{ message: typeNamespace('ReactNode') }]
        },
        {
            name: 'default import of react',
            code: "import React from 'react';",
            errors: [{ message: defaultImport }]
        },
        {
            name: 'namespace import of react',
            code: "import * as R from 'react';",
            errors: [{ message: namespaceImport }]
        },
        {
            name: 'default and named import together',
            code: "import React, { useState } from 'react';",
            errors: [{ message: defaultImport }]
        },
        {
            name: 'arrow component with an expression body',
            code: 'const Card = () => <div />;',
            output: 'function Card() {\nreturn <div />;\n}',
            errors: [{ message: arrow('Card') }]
        },
        {
            name: 'exported arrow component with a block body',
            code: 'export const Card = (props: { title: string }) => {\n    return <h1>{props.title}</h1>;\n};',
            output: 'export function Card(props: { title: string }) {\n    return <h1>{props.title}</h1>;\n}',
            errors: [{ message: arrow('Card') }]
        },
        {
            name: 'async generic arrow component keeps async, type params and return type',
            code: 'const List = async <T,>(props: { items: T[] }): Promise<JSX.Element> => <ul />;',
            output: 'async function List<T,>(props: { items: T[] }): Promise<JSX.Element> {\nreturn <ul />;\n}',
            errors: [{ message: arrow('List') }]
        },
        {
            name: 'function expression component',
            code: 'const Card = function () { return <div />; };',
            output: 'function Card() { return <div />; }',
            errors: [{ message: arrow('Card') }]
        },
        {
            name: 'wrapper that delegates to another component',
            code: 'const Page = (p: object) => RootPage(p);',
            output: 'function Page(p: object) {\nreturn RootPage(p);\n}',
            errors: [{ message: arrow('Page') }]
        },
        {
            name: 'wrapper that awaits another component',
            code: 'const Page = async () => { return await RootPage(); };',
            output: 'async function Page() { return await RootPage(); }',
            errors: [{ message: arrow('Page') }]
        },
        {
            name: 'type-annotated component is reported but not fixed',
            code: 'const Card: FC = () => <div />;',
            output: null,
            errors: [{ message: arrow('Card') }]
        },
        {
            name: 'multiple declarators are reported but not fixed',
            code: 'const A = () => <a />, B = () => <b />;',
            output: null,
            errors: [{ message: arrow('A') }, { message: arrow('B') }]
        },
        {
            name: 'componentNamePattern widens what counts as a component',
            code: 'const card = () => <div />;',
            options: [{ componentNamePattern: '^[a-z]' }],
            output: 'function card() {\nreturn <div />;\n}',
            errors: [{ message: arrow('card') }]
        },
        {
            name: 'children in an inline props type',
            code: 'function Card({ children }: { children: string }) { return <div>{children}</div>; }',
            errors: [{ message: children('this props type') }]
        },
        {
            name: 'children in an intersection props type',
            code: 'function Card(p: { title: string } & { children: string }) { return <div />; }',
            errors: [{ message: children('this props type') }]
        },
        {
            name: 'children in a type alias declared in the file',
            code: 'type Props = { children: string };\nfunction Card({ children }: Props) { return <div>{children}</div>; }',
            errors: [{ message: children("type 'Props'") }]
        },
        {
            name: 'children in an interface declared in the file',
            code: 'interface Props { children?: string }\nfunction Card({ children }: Props) { return <div>{children}</div>; }',
            errors: [{ message: children("type 'Props'") }]
        }
    ]
});
