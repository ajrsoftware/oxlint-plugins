/**
 * The slice of oxlint's JS plugin API these plugins rely on. oxlint follows
 * the ESLint rule shape, so the names mirror ESLint's.
 */

export type Range = [number, number];

export interface Ranged {
    range: Range;
}

/** Any ESTree node, with its fields left for the rule to narrow. */
export interface AstNode extends Ranged {
    type: string;
    [key: string]: unknown;
}

export type Comment = Ranged;

export interface SourceCode {
    getText(node?: unknown): string;
    getCommentsBefore(node: unknown): Comment[] | undefined;
}

export interface Fixer {
    replaceTextRange(range: Range, text: string): unknown;
}

export interface ReportDescriptor {
    node: unknown;
    message: string;
    fix?: (fixer: Fixer) => unknown;
}

export interface Context<Options> {
    options: readonly [Options?];
    filename: string;
    cwd: string;
    sourceCode: SourceCode;
    report(descriptor: ReportDescriptor): void;
}

/** Selector → handler. Each handler annotates the node shape it expects. */
export type Visitor = Record<string, (node: never) => void>;

export interface RuleMeta {
    type: 'problem' | 'suggestion' | 'layout';
    fixable?: 'code' | 'whitespace';
    schema: unknown[];
}

/** Rules without options omit `Options`, leaving `context.options` unusable. */
export interface Rule<Options = never> {
    meta: RuleMeta;
    create(context: Context<Options>): Visitor;
}

export interface Plugin {
    meta: { name: string };
    rules: Record<string, Rule<unknown>>;
}
