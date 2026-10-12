/**
 * sort-imports/order
 *
 * Orders the leading import block: grouped, groups separated by a blank line,
 * and longest line first within each group.
 *
 * oxfmt owns layout but never reorders statements, so `sortImports` must stay
 * `false` in .oxfmtrc.json — it has no "group but don't sort" mode and would
 * fight this rule for the same lines.
 */

import type { Rule } from '@ajrsoftware/oxlint-utils';
import { classify } from './classify.ts';
import { measure } from './measure.ts';
import type {
    Entry,
    ImportNode,
    Kind,
    Options,
    StatementNode
} from './types.ts';

const DEFAULT_GROUPS: (string | string[])[] = [
    ['type'],
    ['builtin', 'external'],
    ['internal', 'parent', 'sibling', 'index']
];

const DEFAULT_INTERNAL = ['~/', '@/', '#'];

export const order = {
    meta: {
        type: 'layout',
        fixable: 'code',
        schema: [
            {
                type: 'object',
                properties: {
                    groups: {
                        type: 'array',
                        items: {
                            anyOf: [
                                { type: 'string' },
                                {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            ]
                        }
                    },
                    internalPattern: {
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
        const groups = (opts.groups ?? DEFAULT_GROUPS).map((g) =>
            Array.isArray(g) ? g : [g]
        );
        const internalPattern = opts.internalPattern ?? DEFAULT_INTERNAL;
        const sc = context.sourceCode;

        const groupIndexOf = (kind: Kind) => {
            const i = groups.findIndex((g) => g.includes(kind));
            return i === -1 ? groups.length : i;
        };

        return {
            Program(program: StatementNode) {
                const body = program.body ?? [];
                const source = sc.getText();

                let i = 0;
                while (
                    i < body.length &&
                    body[i].type === 'ExpressionStatement' &&
                    body[i].expression?.type === 'Literal' &&
                    typeof body[i].expression?.value === 'string'
                ) {
                    i++;
                }
                const directiveEnd = i > 0 ? body[i - 1].range[1] : null;

                const run: ImportNode[] = [];
                while (
                    i < body.length &&
                    body[i].type === 'ImportDeclaration'
                ) {
                    run.push(body[i++] as unknown as ImportNode);
                }
                if (run.length === 0) return;

                // A comment belongs to an import only when no blank line
                // separates them. Anything past a blank line is a detached
                // file header and must not travel with the import.
                const attachedStart = (node: ImportNode) => {
                    const before = sc.getCommentsBefore(node) ?? [];
                    let start = node.range[0];
                    for (let k = before.length - 1; k >= 0; k--) {
                        if (
                            /\n\s*\n/.test(
                                source.slice(before[k].range[1], start)
                            )
                        ) {
                            break;
                        }
                        start = before[k].range[0];
                    }
                    return start;
                };

                const entries = run.map((node): Entry => {
                    const start = attachedStart(node);
                    return {
                        node,
                        start,
                        text: source.slice(start, node.range[1]),
                        length: measure(
                            source.slice(node.range[0], node.range[1])
                        ),
                        sideEffect: node.specifiers.length === 0,
                        kind: classify(node, internalPattern)
                    };
                });

                // Reordering a side-effect import can change runtime
                // behaviour, so each one is pinned and splits the run.
                const partitions: Entry[][] = [];
                let pending: Entry[] = [];
                for (const entry of entries) {
                    if (entry.sideEffect) {
                        if (pending.length) partitions.push(pending);
                        partitions.push([entry]);
                        pending = [];
                    } else {
                        pending.push(entry);
                    }
                }
                if (pending.length) partitions.push(pending);

                const blocks: string[] = [];
                for (const partition of partitions) {
                    if (partition.length === 1 && partition[0].sideEffect) {
                        blocks.push(partition[0].text);
                        continue;
                    }
                    const buckets = new Map<number, Entry[]>();
                    for (const entry of partition) {
                        const g = groupIndexOf(entry.kind);
                        const bucket = buckets.get(g);
                        if (bucket) bucket.push(entry);
                        else buckets.set(g, [entry]);
                    }
                    for (const g of [...buckets.keys()].sort((a, b) => a - b)) {
                        const sorted = buckets
                            .get(g)!
                            .sort(
                                (a, b) =>
                                    b.length - a.length ||
                                    a.node.source.value.localeCompare(
                                        b.node.source.value
                                    )
                            );
                        blocks.push(sorted.map((e) => e.text).join('\n'));
                    }
                }

                const desired = blocks.join('\n\n');
                const rangeEnd = run[run.length - 1].range[1];

                // Only absorb the gap after a directive when it is pure
                // whitespace; a comment parked there must survive.
                const gapIsBlank =
                    directiveEnd !== null &&
                    source.slice(directiveEnd, entries[0].start).trim() === '';
                const rangeStart = gapIsBlank ? directiveEnd : entries[0].start;
                const replacement = (gapIsBlank ? '\n\n' : '') + desired;

                if (source.slice(rangeStart, rangeEnd) === replacement) return;

                context.report({
                    node: run[0],
                    message:
                        'Imports must be grouped, separated by a blank line, and ordered longest first.',
                    fix: (fixer) =>
                        fixer.replaceTextRange(
                            [rangeStart, rangeEnd],
                            replacement
                        )
                });
            }
        };
    }
} satisfies Rule<Options>;
