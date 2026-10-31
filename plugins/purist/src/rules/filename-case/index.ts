/**
 * purist/filename-case
 *
 * Filenames are kebab-case: the part before the first `.` must match
 * `filenamePattern`. Next.js dynamic segments (`[slug].tsx`) are always
 * allowed.
 */

import {
    basename,
    globToRegExp,
    matchesAny,
    relativePath,
    type AstNode,
    type Rule
} from '@ajrsoftware/oxlint-utils';
import type { Options } from './types.ts';

const DEFAULT_FILENAME_PATTERN = '^[a-z0-9]+(-[a-z0-9]+)*$';

export const filenameCase = {
    meta: {
        type: 'suggestion',
        schema: [
            {
                type: 'object',
                properties: {
                    filenamePattern: { type: 'string' },
                    ignoreFilenames: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                },
                additionalProperties: false
            }
        ]
    },

    create(context) {
        const opts = context.options[0] ?? {};
        const ignoreFilenames = (opts.ignoreFilenames ?? []).map(globToRegExp);
        const filenamePattern = new RegExp(
            opts.filenamePattern ?? DEFAULT_FILENAME_PATTERN
        );

        const relative = relativePath(context.filename, context.cwd);
        const file = basename(relative);

        return {
            Program(node: AstNode) {
                if (matchesAny(relative, ignoreFilenames)) return;

                // Next.js dynamic segments (`[slug].tsx`) are a framework
                // filename convention, not a naming choice.
                const stem = file.slice(0, file.indexOf('.'));
                if (stem.startsWith('[')) return;
                if (filenamePattern.test(stem)) return;

                context.report({
                    node,
                    message: `Filename '${file}' must be kebab-case (lowercase words separated by '-').`
                });
            }
        };
    }
} satisfies Rule<Options>;
