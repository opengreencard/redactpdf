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

- Build: `yarn build`
- Typecheck: `yarn typecheck` (whole project) or
  `yarn typecheck:files -- <file.ts> [...]` (specific files)
- Lint: `yarn lint`
- Tests: `yarn jest`

## Tests

`yarn jest` is what CI runs. These other suites are skipped unless you
opt in:

- **Manual tests** (`describeManualTest` / `*.manual.test.ts`): live,
  billed, or hand-run work. Run with
  `yarn manual-jest path/to/file.manual.test.ts`.
- **Test-data generator tests** (`makeTestDataGeneratorTest`): write
  committed `__testData__` JSON. Run with
  `yarn devdb-testdata-jest path/to/index.test.ts`, or
  `yarn proddb-testdata-jest` when the fixture must come from production.

## Recorded API responses

Some tests replay recorded API responses from `__mocks__/__testData__`. The
cache key includes the full request, including image bytes, so any change to
rendering or compression misses the cache.

- Run `CI=true yarn jest ...` when checking changes. A cache miss then fails
  instead of making a live, billed call.
- To re-record, run `DELETE_UNUSED=1 yarn jest <file>`. This makes live calls
  and deletes recordings that the file didn't use during the run.

## PDF rendering

- Ghostscript runs only in `pdf-renderer/`. ESLint enforces this for
  `execFile('gs', ...)`-style calls and for the PDF wrapper packages.
- `lib/pdf/pdfRenderer.ts` is the client. It calls the renderer at
  `PDF_RENDERER_URL` when that is set. Otherwise it runs Ghostscript in-process,
  which is how dev and tests run.
- Production sets `PDF_RENDERER_URL` in `.env.production.nonsecret`. Each pod
  runs the renderer as a sidecar container with no app secrets (see
  `k8s/templates/cluster.template.yml`).
- To test the HTTP path locally, run `yarn pdf-renderer` and set
  `PDF_RENDERER_URL=http://127.0.0.1:4100` in the shell.

## Local Jest database

Jest uses the separate `redaction_test` database and `redaction_test` MariaDB
user. To configure a local checkout:

```bash
cp .env.test.example .env.test
docker-compose --env-file .env.development up -d mariadb
```

The Compose SQL initialization script creates the test database and user when
the MariaDB volume is first created. If the volume already exists from before
the separate development user was added, follow the existing-volume migration
in the README before applying that idempotent test setup:

```bash
docker-compose exec -T mariadb mariadb -uroot -predaction-root \
  < docker/mariadb/10-create-test-database.sql
```

- Keep this public repository independent from OpenGreenCard. Do not copy
  immigration forms, user data, credentials, or product-specific domain code.
- Before mocking an API in a test, check whether a global mock already
  exists in an adjacent `__mocks__` folder or in `lib/testUtilities/setup.ts`.
  If it does, do not add another `jest.mock` or `jest.mocked` — that
  infrastructure already records, replays, or fakes the service. Put rare
  outage simulations in a dedicated `*.mocked.test.ts` file and suppress
  the mock restriction there.

## Cursor Cloud specific instructions

- `.cursor/cloud-agent-install.sh` copies `.env.development.example` and
  `.env.test.example` when those files are missing, then runs `yarn install`.
  The `replace-with-...` placeholders are enough to boot. It does not
  overwrite an env file that is already there.
- `.cursor/cloud-agent-start.sh` starts Docker, MariaDB from
  `docker-compose.yml`, `yarn init-db-dev`, and `yarn dev` on port 3000.
  Use that server instead of starting another one.
- Node 26 is at `/usr/local/bin`. `bash -lc 'node -v'` should print v26.
  The image also has Node 22 earlier on `PATH`.
- Signup and `yarn jest` do not need real Google, Spaces, or model keys.
  Uploading a PDF does.
- Ghostscript is installed for the PDF tests and `yarn dev`. See
  [PDF rendering](#pdf-rendering).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
