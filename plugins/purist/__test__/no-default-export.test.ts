import { runRuleTests } from '@ajrsoftware/oxlint-utils/testing';
import { noDefaultExport } from '../src/rules/no-default-export/index.ts';

const namedExport = 'Use a named export. Default exports are not allowed.';

runRuleTests('purist/no-default-export', noDefaultExport, {
    valid: [
        {
            name: 'named exports',
            code: 'export const a = 1;\nexport function b() {}',
            filename: 'src/lib/kebab-case.ts'
        },
        {
            name: 'config files may default export',
            code: 'export default {};',
            filename: 'vite.config.ts'
        },
        {
            name: 'allowDefaultExport globs exempt framework entry points',
            code: 'export default function Page() {}',
            filename: 'src/app/blog/page.tsx',
            options: [{ allowDefaultExport: ['src/app/**/page.tsx'] }]
        },
        {
            name: 'a leading ./ on a glob still matches',
            code: 'export default function Page() {}',
            filename: 'src/app/page.tsx',
            options: [{ allowDefaultExport: ['./src/app/*.tsx'] }]
        },
        {
            name: 'export { x as y } is not a default export',
            code: 'const a = 1;\nexport { a as b };',
            filename: 'src/a.ts'
        },
        {
            name: 'the filename is not checked',
            code: 'export const a = 1;',
            filename: 'src/camelCase.ts'
        }
    ],

    invalid: [
        {
            name: 'named default function drops the default',
            code: 'export default function Card() {}',
            filename: 'src/card.tsx',
            output: 'export function Card() {}',
            errors: [{ message: namedExport }]
        },
        {
            name: 'named default class drops the default',
            code: 'export default class Store {}',
            filename: 'src/store.ts',
            output: 'export class Store {}',
            errors: [{ message: namedExport }]
        },
        {
            name: 'anonymous default function is reported but not fixed',
            code: 'export default function () {}',
            filename: 'src/card.tsx',
            output: null,
            errors: [{ message: namedExport }]
        },
        {
            name: 'default exported expression is reported but not fixed',
            code: 'export default {};',
            filename: 'src/options.ts',
            output: null,
            errors: [{ message: namedExport }]
        },
        {
            name: 'export { x as default }',
            code: 'const a = 1;\nexport { a as default };',
            filename: 'src/a.ts',
            errors: [{ message: namedExport }]
        },
        {
            name: "export { x as 'default' }",
            code: "const a = 1;\nexport { a as 'default' };",
            filename: 'src/a.ts',
            errors: [{ message: namedExport }]
        },
        {
            name: 're-exported default',
            code: "export { default } from './card';",
            filename: 'src/index.ts',
            errors: [{ message: namedExport }]
        },
        {
            name: 'passing allowDefaultExport replaces the config default',
            code: 'export default {};',
            filename: 'vite.config.ts',
            options: [{ allowDefaultExport: ['src/app/**'] }],
            output: null,
            errors: [{ message: namedExport }]
        }
    ]
});
