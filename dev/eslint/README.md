# Local ESLint plugin: redaction

This folder contains custom ESLint rules for the repository, authored in TypeScript under `src` and compiled to `dist`.

## Current rules

- `restricted-imports-needs-client-directive`
  - Requires `"use client"` at the top of files that use imports matched by configurable `paths` restrictions.
- `no-import-reexport`
  - Disallows named re-exports of a symbol that was imported in the same file (for example, `import type { X } from '...'` followed by `export type { X }`). `export default` is allowed so Next.js pages can re-export a page component.
- `require-find-by-pk-attributes`
  - Requires an `attributes` option on Sequelize `.findOne()`, `.findAll()`, and `.findByPk()` calls.
- `require-sequelize-type-assertion`
  - Requires a `PartialInstance` assertion when queries select a subset of columns.

## Working with this plugin

- Build once with `yarn --cwd dev/eslint build` after rule changes.
- Keep `dev/eslint/dist` checked in so `next lint` can consume the plugin without rebuilding.
- Add new rules by implementing them in `src/rules`, exporting from `src/rules/index.ts`, then rerunning the build.
