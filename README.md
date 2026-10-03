# RedactPDF.ai

RedactPDF.ai is an open-source AI-assisted PDF redaction tool.

## Local development

Requirements: Node 26, Yarn 4.14.1, and Docker.

```bash
cp .env.development.example .env.development
docker-compose --env-file .env.development up -d mariadb
yarn install
yarn init-db-dev
yarn dev
```

The development database uses `redaction_development`. The placeholder
secrets are enough to run the app. Real Google, Spaces, and model keys are
only needed when you upload a PDF for redaction.

## Running tests locally

Jest uses the separate `redaction_test` database and MariaDB user:

```bash
cp .env.test.example .env.test
docker-compose --env-file .env.development up -d mariadb
yarn jest
```

The Compose initialization script creates the test database and user when the
MariaDB volume is first created. If you already have a `redaction-mariadb`
volume from before the separate development user was added, run this
idempotent migration once. It reads the development password from the running
MariaDB service, so it stays in sync with `DB_PASS` in `.env.development`:

```bash
docker-compose --env-file .env.development exec -T mariadb \
  sh -c 'mariadb -uroot -predaction-root -e "
    CREATE DATABASE IF NOT EXISTS redaction_development;
    CREATE USER IF NOT EXISTS '\''redaction_development'\''@'\''%'\'' IDENTIFIED BY '\''$MARIADB_PASSWORD'\'';
    ALTER USER '\''redaction_development'\''@'\''%'\'' IDENTIFIED BY '\''$MARIADB_PASSWORD'\'';
    GRANT ALL PRIVILEGES ON redaction_development.* TO '\''redaction_development'\''@'\''%'\'';
    FLUSH PRIVILEGES;
  "'
```

The migration preserves existing data and can be run more than once. Then
apply the test database and user setup:

```bash
docker-compose exec -T mariadb mariadb -uroot -predaction-root \
  < docker/mariadb/10-create-test-database.sql
```

## Checks

```bash
yarn build
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
