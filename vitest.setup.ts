/**
 * oxlint's RuleTester is test-framework agnostic: it builds one `describe`
 * per rule and one `it` per case through whichever functions it is handed.
 *
 * It parses every case as TSX so the React rules can see JSX and types.
 * A relative `filename` resolves against the tester's cwd, which is also
 * `context.cwd`, so rules see it exactly as a repo-relative path.
 */

import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vitest';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

RuleTester.setDefaultConfig({
    languageOptions: { parserOptions: { lang: 'tsx' } }
});
