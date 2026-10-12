import { runRuleTests } from '@ajrsoftware/oxlint-utils/testing';
import { preset } from '../src/rules/preset/index.ts';

const namedExport = 'Use a named export. Default exports are not allowed.';
const kebab = (file: string) =>
    `Filename '${file}' must be kebab-case (lowercase words separated by '-').`;

runRuleTests('purist/preset', preset, {
    valid: [
        {
            name: 'named exports in a kebab-case file',
            code: 'export const a = 1;\nexport function b() {}',
            filename: 'src/lib/kebab-case.ts'
        },
        {
            name: 'single-word lowercase filename',
            code: 'export const a = 1;',
            filename: 'src/index.ts'
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
            name: 'Next.js dynamic segments skip the filename check',
            code: 'export const a = 1;',
            filename: 'src/app/[slug].tsx'
        },
        {
            name: 'ignoreFilenames skips the filename check',
            code: 'export const a = 1;',
            filename: 'src/README.ts',
            options: [{ ignoreFilenames: ['src/README.ts'] }]
        },
        {
            name: 'filenamePattern replaces the kebab-case pattern',
            code: 'export const a = 1;',
            filename: 'src/camelCase.ts',
            options: [{ filenamePattern: '^[a-z][a-zA-Z]*$' }]
        },
        {
            name: 'export { x as y } is not a default export',
            code: 'const a = 1;\nexport { a as b };',
            filename: 'src/a.ts'
        }
    ],

    invalid: [
        {
            name: 'camelCase filename',
            code: 'export const a = 1;',
            filename: 'src/camelCase.ts',
            errors: [{ message: kebab('camelCase.ts') }]
        },
        {
            name: 'snake_case filename',
            code: 'export const a = 1;',
            filename: 'src/snake_case.ts',
            errors: [{ message: kebab('snake_case.ts') }]
        },
        {
            name: 'PascalCase component filename',
            code: 'export function Card() {}',
            filename: 'src/Card.tsx',
            errors: [{ message: kebab('Card.tsx') }]
        },
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
        },
        {
            name: 'bad filename and default export together',
            code: 'export default function Card() {}',
            filename: 'src/Card.tsx',
            output: 'export function Card() {}',
            errors: [{ message: kebab('Card.tsx') }, { message: namedExport }]
        }
    ]
});
