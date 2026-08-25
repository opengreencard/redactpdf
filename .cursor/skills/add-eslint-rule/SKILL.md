---
name: add-eslint-rule
description: >-
  Add ESLint rules to the repo: prefer built-in restrictions first, then library
  rules, then custom plugin rules. Roll out on legacy code with bulk suppressions.
  Use when adding or enforcing a new lint rule in .eslintrc.cjs or dev/eslint/.
---

# Adding ESLint rules

When enforcing a new convention, add a rule in this order:

1. **Built-in or library rules** — treat these as the same first tier. Use
   `no-restricted-syntax`, `no-restricted-imports`, or another rule already in
   `.eslintrc.cjs`; also check maintained library rules such as
   `eslint-plugin-unicorn` and `@typescript-eslint/*`.
2. **Custom plugin rules** — only when the first tier cannot express the check.
   Implement in `dev/eslint/src/rules/`, export from `src/rules/index.ts`, add tests, run
   `yarn --cwd dev/eslint build`, and keep `dev/eslint/dist` checked in.

After adding the rule, suppress existing violations (see below) so new code is enforced
immediately while legacy code is cleaned up incrementally.

## Where new rules go in `.eslintrc.cjs`

When adding a project rule in `.eslintrc.cjs`, **extend an existing list** instead of
adding a new `overrides` block. Reserve `overrides` for whole categories of files
(tests, `app/**`, `valuesSchema.ts`) that need a different _bundle_ of rules — not
for one-off exceptions.

| Rule type                                           | Add to                                                  |
| --------------------------------------------------- | ------------------------------------------------------- |
| `no-restricted-syntax` (all files, including tests) | `commonNoRestrictedSyntaxRules`                         |
| `no-restricted-syntax` (production only)            | `commonNoRestrictedSyntaxRulesForNonTests`              |
| `no-restricted-syntax` (tests only)                 | the `**/?(*.)+(spec                                     | test).*` override — one extra object in its array |
| `no-restricted-syntax` (`app/**` only)              | the `app/**/*` override — one extra object in its array |
| `no-restricted-imports`                             | top-level `rules['no-restricted-imports']` array        |
| Built-in ESLint rules (`no-console`, etc.)          | top-level `rules`                                       |
| Custom plugin rules                                 | top-level `rules` as `'redaction/<rule-name>': 'error'` |

Production code already picks up `commonNoRestrictedSyntaxRulesForNonTests` from the
top-level `no-restricted-syntax` rule. Do **not** add an override that repeats the
same spread (e.g. for `**/*.stories.*`) unless stories genuinely need a _different_
rule set.

## Exceptions: prefer `eslint-disable-next-line`

If only a few call sites need to break a rule, add the rule globally and disable it
locally. Do **not** add an `overrides` block with `excludedFiles` for one file.

```ts
// This file is the allowed DEFAULT_THEME merge; callers use resolveMantineThemeColor().
// eslint-disable-next-line no-restricted-imports
import { DEFAULT_THEME, mergeMantineTheme } from '@mantine/core';
```

```tsx
// Next.js requires `export default function` for app/layout.tsx.
// eslint-disable-next-line no-restricted-syntax
export default async function RootLayout(props: RootLayoutProps) { ... }
```

Follow `comments.mdc`: every disable needs a one-line reason and the rule name.
Avoid file-wide disables.

## Keep rule objects inline

Add `{ selector, message }` or `{ name, message }` objects **directly** in the
target array. Avoid extracting them into standalone `const` variables in
`.eslintrc.cjs` — untyped object literals there can fail our own
`no-restricted-syntax` checks.

## `no-restricted-syntax` template

```js
{
  // Bad: ...
  // Good: ...
  selector: '...',
  message: 'Short fix guidance with a concrete example.',
},
```

Match comment style of neighboring entries. Keep selectors on one line when
reasonable.

## Examples from this repo

**Good — global import ban + one allowed file:**

- Add `DEFAULT_THEME` / `DEFAULT_COLORS` to top-level `no-restricted-imports`
- `eslint-disable-next-line no-restricted-imports` in `lib/config/mantineTheme.ts`

**Good — production-only syntax rule:**

- Add PascalCase component convention to `commonNoRestrictedSyntaxRulesForNonTests`
- `eslint-disable-next-line no-restricted-syntax` on Next.js `export default function`
  in `app/layout.tsx`, `app/icon.tsx`, `app/apple-icon.tsx`

**Avoid — override just to exclude one file:**

```js
// Don't do this for a single exception file
{
  files: ['**/*.{ts,tsx}'],
  excludedFiles: ['lib/config/mantineTheme.ts'],
  rules: { 'no-restricted-imports': ['error', /* ... */] },
}
```

**Avoid — override that duplicates the top-level rule:**

```js
// Don't do this — stories already inherit top-level no-restricted-syntax
{
  files: ['**/*.stories.*'],
  rules: {
    'no-restricted-syntax': ['error', ...commonNoRestrictedSyntaxRulesForNonTests],
  },
}
```

## Rolling out a rule on legacy code

After enabling a new rule repo-wide, suppress existing violations so CI stays green.
New code must satisfy the rule; legacy suppressions are removed as files are touched.

### Preferred: ESLint 9+ bulk suppressions (when upgraded)

ESLint 9.24+ has [native bulk suppressions](https://eslint.org/docs/latest/use/suppressions):

```bash
eslint --suppress-rule redaction/require-find-by-pk-attributes .
eslint --prune-suppressions   # remove stale entries later
```

This writes `.eslint-suppressions.json`. Prefer this over third-party codemods once
the repo is on ESLint 9.

### Current repos (ESLint 8): `suppress-eslint-errors`

Until upgrade, use [suppress-eslint-errors](https://github.com/amanda-mitchell/suppress-eslint-errors)
(last published 2024; still works with ESLint 8):

```bash
npx suppress-eslint-errors \
  --extensions=ts,tsx \
  --parser=tsx \
  --rules=redaction/require-find-by-pk-attributes \
  --message "TODO: Fix existing Sequelize query to select specific attributes." \
  app lib scripts
```

**Caveat:** with complex `.eslintrc.cjs` configs, the codemod may not load the repo
config correctly. If it misses violations, use the programmatic fallback below.

### Fallback: programmatic suppressions

Run ESLint via the Node API, find violations for the target rule, and insert disable
comments with a TODO above each line. Re-run ESLint on affected paths to confirm zero
remaining violations for that rule.

Use this TODO + disable pattern for legacy Sequelize queries and similar rollouts:

```ts
// TODO: Fix existing Sequelize query to select specific attributes.
// eslint-disable-next-line redaction/require-find-by-pk-attributes
const row = await Model.findOne({ where: { id } });
```

## Custom plugin rules

- Source: `dev/eslint/src/rules/<rule-name>.ts`
- Tests: `dev/eslint/src/rules/<rule-name>.test.ts` (adjacent to the rule)
- Build: `yarn build:eslint-plugin` or `yarn --cwd dev/eslint build`
- Check in compiled `dev/eslint/dist/` so `eslint .` works without a prior build

Before writing a custom rule, check **immigration** and **itineraries** for an existing
equivalent in their `dev/eslint/` plugins.

## After editing

Run `yarn eslint --fix` on `.eslintrc.cjs` and any files that need new disable
comments. See `eslint-rules.mdc` for the usual lint workflow.
