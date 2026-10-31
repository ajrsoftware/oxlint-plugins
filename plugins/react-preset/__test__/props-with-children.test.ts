import { runRuleTests } from '@ajrsoftware/oxlint-utils/testing';
import { propsWithChildren } from '../src/rules/props-with-children/index.ts';

const children = (where: string) =>
    `Do not declare 'children' in ${where}. Use PropsWithChildren from 'react'.`;

runRuleTests('react-preset/props-with-children', propsWithChildren, {
    valid: [
        {
            name: 'children from PropsWithChildren',
            code: "import type { PropsWithChildren } from 'react';\nfunction Card({ children }: PropsWithChildren<{ title: string }>) { return <div>{children}</div>; }"
        },
        {
            name: 'children on a non-component function',
            code: 'function wrap(props: { children: string }) { return props.children; }'
        },
        {
            name: 'a type declared elsewhere cannot be resolved',
            code: "import type { Props } from './props';\nfunction Card({ children }: Props) { return <div>{children}</div>; }"
        }
    ],

    invalid: [
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
        },
        {
            name: 'children in an arrow component',
            code: 'const Card = ({ children }: { children: string }) => <div>{children}</div>;',
            errors: [{ message: children('this props type') }]
        }
    ]
});
