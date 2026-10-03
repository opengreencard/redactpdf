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

- Install is `.cursor/cloud-agent-install.sh`. Start is
  `.cursor/cloud-agent-start.sh`. Start uses Docker (not systemd) to run
  MariaDB from `docker-compose.yml`, then `yarn init-db-dev` and `yarn dev`
  on port 3000. Use that server instead of starting another one.
- Node 26 is installed at `/usr/local/bin`. Login shells prepend it. Check
  with `bash -lc 'node -v'`. The base image also has Node 22 earlier on
  `PATH`.
- Install copies `.env.development` and `.env.test` from the examples when
  they are missing, then fills blank development keys. `DB_PASS` stays
  `redaction`, matching `docker-compose.yml`. Other blank development keys
  become `local-dev-only`. Test keys stay blank. A new `KEY=` line in an
  example is picked up on the next install. The landing page, email/password
  signup, and `yarn jest` do not call Google, Spaces, or the model APIs.
  Uploading a PDF for redaction needs real Spaces and Gemini credentials.
- GraphicsMagick and Ghostscript are installed for the PDF tests. MariaDB
  is the Compose service `mariadb` (`docker compose --env-file
  .env.development`). The first volume init also creates `redaction_test`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
