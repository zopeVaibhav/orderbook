import { config } from '@repo/eslint-config/base';

/**
 * Root-level ESLint config.
 *
 * Each workspace under apps/* and packages/* ships its own eslint.config.mjs and
 * is linted by `turbo run lint`, so they are ignored here to avoid being linted
 * twice under the wrong config. This config covers loose files at the repo root.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
    ...config,
    {
        ignores: ['apps/**', 'packages/**', 'target/**', '.husky/**'],
    },
];
