import type { Ranged } from '@ajrsoftware/oxlint-utils';

export interface Options {
    groups?: (string | string[])[];
    internalPattern?: string[];
}

export type Kind =
    | 'type'
    | 'builtin'
    | 'external'
    | 'internal'
    | 'parent'
    | 'sibling'
    | 'index';

export interface ImportNode extends Ranged {
    type: string;
    importKind?: 'type' | 'value';
    specifiers: unknown[];
    source: { value: string };
}

export interface StatementNode extends Ranged {
    type: string;
    expression?: { type: string; value?: unknown };
    body?: StatementNode[];
}

/** An import plus the comments attached to it, as it will be moved. */
export interface Entry {
    node: ImportNode;
    start: number;
    text: string;
    length: number;
    sideEffect: boolean;
    kind: Kind;
}
