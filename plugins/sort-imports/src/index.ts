/**
 * sort-imports — groups and orders the leading import block.
 *
 * Rules are namespaced by `meta.name`, so each entry below is configured in
 * .oxlintrc.json as `sort-imports/<rule>`.
 */

import type { Plugin } from '@ajrsoftware/oxlint-utils';
import { order } from './rules/order/index.ts';

export default {
    meta: { name: 'sort-imports' },
    rules: {
        order
    }
} satisfies Plugin;
