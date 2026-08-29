# RedactPDF.ai

RedactPDF.ai is an open-source AI-assisted PDF redaction tool.

## Local development

Requirements: Node 26, Yarn 4.14.1, and Docker.

```bash
cp .env.development.example .env.development
docker compose up -d mariadb
yarn install
yarn init-db-dev
yarn dev
```

The development database uses local defaults when the environment file is
empty. Cloud credentials are only needed for the upload and redaction pipeline.

## Checks

```bash
yarn typecheck
yarn lint
yarn jest
```

The application is intentionally separate from OpenGreenCard. It copies
general-purpose infrastructure patterns without importing immigration forms or
domain data.

## License

RedactPDF.ai is licensed under the GNU Affero General Public License, version 3
only. See [LICENSE](./LICENSE) for the complete license text.
