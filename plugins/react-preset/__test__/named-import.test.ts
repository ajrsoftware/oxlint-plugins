import { runRuleTests } from '@ajrsoftware/oxlint-utils/testing';
import { namedImport } from '../src/rules/named-import/index.ts';

const defaultImport =
    "Do not default-import react. Use named imports: import { useState } from 'react'.";
const namespaceImport =
    "Do not namespace-import react. Use named imports: import { useState } from 'react'.";

runRuleTests('react-preset/named-import', namedImport, {
    valid: [
        {
            name: 'named react imports',
            code: "import { useState, type FC } from 'react';"
        },
        {
            name: 'default imports of other modules',
            code: "import clsx from 'clsx';"
        }
    ],

    invalid: [
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
        }
    ]
});
