/**
 * purist — opinionated house style rules.
 *
 * Rules are namespaced by `meta.name`, so each entry below is configured in
 * .oxlintrc.json as `purist/<rule>`.
 */

import type { Plugin } from '@ajrsoftware/oxlint-utils';
import { preset } from './rules/preset/index.ts';
import { react } from './rules/react/index.ts';

export default {
    meta: { name: 'purist' },
    rules: {
        react,
        preset
    }
} satisfies Plugin;
