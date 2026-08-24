# Local ESLint plugin: redaction

This folder contains custom ESLint rules for the repository, authored in TypeScript under `src` and compiled to `dist`.

## Current rules
- `restricted-imports-needs-client-directive`
  - Requires `"use client"` at the top of files that use imports matched by configurable `paths` restrictions.

## Working with this plugin
- Build once with `yarn --cwd dev/eslint build` after rule changes.
- Keep `dev/eslint/dist` checked in so `next lint` can consume the plugin without rebuilding.
- Add new rules by implementing them in `src/rules`, exporting from `src/rules/index.ts`, then rerunning the build.
