import { runRuleTests } from '@ajrsoftware/oxlint-utils/testing';
import { filenameCase } from '../src/rules/filename-case/index.ts';

const kebab = (file: string) =>
    `Filename '${file}' must be kebab-case (lowercase words separated by '-').`;

runRuleTests('purist/filename-case', filenameCase, {
    valid: [
        {
            name: 'kebab-case filename',
            code: 'export const a = 1;',
            filename: 'src/lib/kebab-case.ts'
        },
        {
            name: 'single-word lowercase filename',
            code: 'export const a = 1;',
            filename: 'src/index.ts'
        },
        {
            name: 'only the part before the first dot is checked',
            code: 'export default {};',
            filename: 'vite.config.ts'
        },
        {
            name: 'Next.js dynamic segments are allowed',
            code: 'export const a = 1;',
            filename: 'src/app/[slug].tsx'
        },
        {
            name: 'ignoreFilenames skips matching files',
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
            name: 'default exports are not checked',
            code: 'export default function Card() {}',
            filename: 'src/card.tsx'
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
        }
    ]
});
