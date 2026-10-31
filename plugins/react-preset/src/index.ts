/**
 * react-preset — opinionated React conventions.
 *
 * Rules are namespaced by `meta.name`, so each entry below is configured in
 * .oxlintrc.json as `react-preset/<rule>`. The name can't be plain `react`:
 * oxlint rejects JS plugins that reuse a built-in plugin's name.
 */

import type { Plugin } from '@ajrsoftware/oxlint-utils';
import { functionComponent } from './rules/function-component/index.ts';
import { namedImport } from './rules/named-import/index.ts';
import { noNamespace } from './rules/no-namespace/index.ts';
import { propsWithChildren } from './rules/props-with-children/index.ts';

export default {
    meta: { name: 'react-preset' },
    rules: {
        'no-namespace': noNamespace,
        'named-import': namedImport,
        'function-component': functionComponent,
        'props-with-children': propsWithChildren
    }
} satisfies Plugin;
