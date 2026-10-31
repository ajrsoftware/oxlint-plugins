import { runRuleTests } from '@ajrsoftware/oxlint-utils/testing';
import { noNamespace } from '../src/rules/no-namespace/index.ts';

const namespace = (name: string) =>
    `Do not reach through the React namespace. Import it directly: import { ${name} } from 'react'.`;
const typeNamespace = (name: string) =>
    `Do not reach through the React namespace. Import it directly: import type { ${name} } from 'react'.`;

runRuleTests('react-preset/no-namespace', noNamespace, {
    valid: [
        {
            name: 'named react imports',
            code: "import { useState, type ReactNode } from 'react';\nconst [a] = useState(0);"
        },
        {
            name: 'computed access on React is ignored',
            code: "React['useState'];"
        },
        {
            name: 'the import itself is not checked',
            code: "import React from 'react';"
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
        }
    ]
});
