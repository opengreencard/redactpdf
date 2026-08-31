# Project Agent Notes

- This repository uses Yarn 4.14.1 and Node 26.
- The app is a Next.js App Router codebase using TypeScript, React, and
  Mantine.
- Tests run with Jest; the local MariaDB service is provided by Docker Compose.
- `db.sync()` creates missing tables but does not change existing production
  tables. Apply production schema changes manually in phpMyAdmin before or
  alongside deployment, and include the required SQL in the PR description or
  commit message for the operator.

## Checks

- Typecheck: `yarn typecheck`
- Lint: `yarn lint`
- Tests: `yarn jest`

- Keep this public repository independent from OpenGreenCard. Do not copy
  immigration forms, user data, credentials, or product-specific domain code.
- Before mocking an API in a test, check whether a global mock already
  exists in an adjacent `__mocks__` folder or in `lib/testUtilities/setup.ts`.
  If it does, do not add another `jest.mock` or `jest.mocked` — that
  infrastructure already records, replays, or fakes the service. Put rare
  outage simulations in a dedicated `*.mocked.test.ts` file and suppress
  the mock restriction there.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
