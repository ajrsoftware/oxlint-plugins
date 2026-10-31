import { runRuleTests } from '@ajrsoftware/oxlint-utils/testing';
import { functionComponent } from '../src/rules/function-component/index.ts';

const arrow = (name: string) =>
    `Component '${name}' must be a function declaration, not an arrow function.`;

runRuleTests('react-preset/function-component', functionComponent, {
    valid: [
        {
            name: 'function declaration component',
            code: 'function Card() { return <div />; }'
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
            name: 'componentNamePattern narrows what counts as a component',
            code: 'const Card = () => <div />;',
            options: [{ componentNamePattern: '^Page$' }]
        }
    ],

    invalid: [
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
        }
    ]
});
