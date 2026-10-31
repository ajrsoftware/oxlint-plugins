/**
 * purist — opinionated house style rules.
 *
 * Rules are namespaced by `meta.name`, so each entry below is configured in
 * .oxlintrc.json as `purist/<rule>`.
 */

import type { Plugin } from '@ajrsoftware/oxlint-utils';
import { filenameCase } from './rules/filename-case/index.ts';
import { noDefaultExport } from './rules/no-default-export/index.ts';

export default {
    meta: { name: 'purist' },
    rules: {
        'no-default-export': noDefaultExport,
        'filename-case': filenameCase
    }
} satisfies Plugin;
