/**
 * Test-only entry point (`@ajrsoftware/oxlint-utils/testing`). Plugin source
 * never imports this, so oxlint's RuleTester never ends up in a bundle.
 */

import { RuleTester } from 'oxlint/plugins-dev';
import type { Rule } from './types.ts';

type OxlintRule = Parameters<RuleTester['run']>[1];

/**
 * Runs one of our rules through oxlint's RuleTester. Our `Rule` narrows
 * `context.options` to the rule's own Options while oxlint types them as raw
 * JSON, so the two only meet here, behind a single cast.
 */
export function runRuleTests<Options>(
    name: string,
    rule: Rule<Options>,
    tests: RuleTester.TestCases
): void {
    new RuleTester().run(name, rule as unknown as OxlintRule, tests);
}
