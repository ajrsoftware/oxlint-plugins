import { runRuleTests } from '@ajrsoftware/oxlint-utils/testing';
import { order } from '../src/rules/order/index.ts';

const errors = [
    {
        message:
            'Imports must be grouped, separated by a blank line, and ordered longest first.'
    }
];

const lines = (...l: string[]) => l.join('\n');

runRuleTests('sort-imports/order', order, {
    valid: [
        { name: 'no imports', code: 'export const a = 1;' },
        { name: 'a single import', code: "import { a } from 'a';" },
        {
            name: 'already grouped and ordered',
            code: lines(
                "import type { FC } from 'react';",
                '',
                "import { readFile } from 'node:fs';",
                "import { z } from 'zod';",
                '',
                "import { b } from './b';"
            )
        },
        {
            name: 'directive followed by a blank line',
            code: lines("'use client';", '', "import { a } from 'a';")
        },
        {
            name: 'imports after other statements are left alone',
            code: lines(
                'const x = 1;',
                "import { b } from './b';",
                "import { a } from 'a';"
            )
        },
        {
            name: 'a lone side-effect import',
            code: "import './styles.css';"
        },
        {
            name: 'unformatted spacing is measured as formatted',
            code: lines(
                "import {aaaaaaa} from 'a';",
                "import { bbbbbb } from 'b';"
            )
        },
        {
            name: 'a wrapped import is measured as one line',
            code: lines(
                "import { bbbbbbbbbb } from 'b';",
                'import {',
                '    a1,',
                '    a2',
                "} from 'a';"
            )
        },
        {
            name: 'a trailing comma in a wrapped import is not counted',
            code: lines(
                "import { bbbbbbbbbb } from 'b';",
                'import {',
                '    a1,',
                '    a2,',
                "} from 'a';"
            )
        },
        {
            name: 'a missing semicolon is not counted',
            code: lines("import { bbb } from 'b'", "import { aa } from 'a';")
        }
    ],

    invalid: [
        {
            name: 'groups: types, then packages, then local',
            code: lines(
                "import { b } from './b';",
                "import { readFile } from 'node:fs';",
                "import type { FC } from 'react';"
            ),
            output: lines(
                "import type { FC } from 'react';",
                '',
                "import { readFile } from 'node:fs';",
                '',
                "import { b } from './b';"
            ),
            errors
        },
        {
            name: 'tight braces still count the spaces a formatter adds',
            code: lines(
                "import { bbbbbb } from 'b';",
                "import {aaaaaaa} from 'a';"
            ),
            output: lines(
                "import {aaaaaaa} from 'a';",
                "import { bbbbbb } from 'b';"
            ),
            errors
        },
        {
            name: 'longest line first within a group',
            code: lines("import { a } from 'a';", "import { bb } from 'bb';"),
            output: lines("import { bb } from 'bb';", "import { a } from 'a';"),
            errors
        },
        {
            name: 'equal length falls back to source order',
            code: lines("import { y } from 'b';", "import { x } from 'a';"),
            output: lines("import { x } from 'a';", "import { y } from 'b';"),
            errors
        },
        {
            name: 'bare node builtins group with packages',
            code: lines("import { a } from './a';", "import fs from 'fs';"),
            output: lines(
                "import fs from 'fs';",
                '',
                "import { a } from './a';"
            ),
            errors
        },
        {
            name: 'default internal prefixes group with local imports',
            code: lines(
                "import { a } from '@/lib/a';",
                "import { z } from 'zod';"
            ),
            output: lines(
                "import { z } from 'zod';",
                '',
                "import { a } from '@/lib/a';"
            ),
            errors
        },
        {
            name: 'missing blank line between groups',
            code: lines("import { z } from 'zod';", "import { b } from './b';"),
            output: lines(
                "import { z } from 'zod';",
                '',
                "import { b } from './b';"
            ),
            errors
        },
        {
            name: 'directive gets a blank line before the imports',
            code: lines(
                "'use client';",
                "import { b } from './b';",
                "import { a } from 'a';"
            ),
            output: lines(
                "'use client';",
                '',
                "import { a } from 'a';",
                '',
                "import { b } from './b';"
            ),
            errors
        },
        {
            name: 'an attached comment moves with its import',
            code: lines(
                "import { b } from './b';",
                '// about a',
                "import { a } from 'a';"
            ),
            output: lines(
                '// about a',
                "import { a } from 'a';",
                '',
                "import { b } from './b';"
            ),
            errors
        },
        {
            name: 'a detached file header stays put',
            code: lines(
                '// header',
                '',
                "import { b } from './b';",
                "import { a } from 'a';"
            ),
            output: lines(
                '// header',
                '',
                "import { a } from 'a';",
                '',
                "import { b } from './b';"
            ),
            errors
        },
        {
            name: 'side-effect imports stay pinned and split the run',
            code: lines(
                "import { b } from './b';",
                "import { a } from 'a';",
                "import './styles.css';",
                "import { d } from './d';",
                "import { c } from 'c';"
            ),
            output: lines(
                "import { a } from 'a';",
                '',
                "import { b } from './b';",
                '',
                "import './styles.css';",
                '',
                "import { c } from 'c';",
                '',
                "import { d } from './d';"
            ),
            errors
        },
        {
            name: 'internalPattern sets which prefixes are internal',
            code: lines(
                "import { x } from '@acme/ui';",
                "import { y } from 'zod';"
            ),
            options: [{ internalPattern: ['@acme/'] }],
            output: lines(
                "import { y } from 'zod';",
                '',
                "import { x } from '@acme/ui';"
            ),
            errors
        },
        {
            name: 'groups replaces the default grouping',
            code: lines(
                "import type { T } from 't';",
                "import { longer } from './longer';"
            ),
            options: [
                {
                    groups: [
                        [
                            'type',
                            'builtin',
                            'external',
                            'internal',
                            'parent',
                            'sibling',
                            'index'
                        ]
                    ]
                }
            ],
            output: lines(
                "import { longer } from './longer';",
                "import type { T } from 't';"
            ),
            errors
        },
        {
            name: 'kinds missing from groups sort last',
            code: lines("import { b } from './b';", "import { a } from 'a';"),
            options: [{ groups: ['sibling'] }],
            output: lines(
                "import { b } from './b';",
                '',
                "import { a } from 'a';"
            ),
            errors
        }
    ]
});
