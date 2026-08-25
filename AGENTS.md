# Project Agent Notes

- This repository uses Yarn 4.14.1 and Node 26.
- The app is a Next.js App Router codebase using TypeScript, React, and
  Mantine.
- Tests run with Jest; the local MariaDB service is provided by Docker Compose.
- Keep this public repository independent from OpenGreenCard. Do not copy
  immigration forms, user data, credentials, or product-specific domain code.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
