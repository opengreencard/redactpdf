import { existsSync } from 'node:fs';

const environment: 'production' | 'development' | 'test' | 'ci' =
  // APP_MODE is our own variable, not typed by Next.js like NODE_ENV is.
  // We use our own variable so that we can point `yarn proddb-dev` at .env.production
  // with `yarn proddb-dev`: otherwise, we get the error message from Next.js
  // when running `yarn proddb-dev`
  //
  // > Your environment has a non-standard NODE_ENV value configured.
  // > https://nextjs.org/docs/messages/non-standard-node-env
  (process.env.APP_MODE as 'production' | 'development' | 'test' | 'ci') ||
  'development';
// Load committed non-secret values first, then gitignored secrets. Node's
// loader does not override existing env, so Kubernetes envFrom still wins.
const nonsecretEnvPath = `.env.${environment}.nonsecret`;
if (existsSync(nonsecretEnvPath)) {
  process.loadEnvFile(nonsecretEnvPath);
}
const secretEnvPath = `.env.${environment}`;
if (existsSync(secretEnvPath)) {
  process.loadEnvFile(secretEnvPath);
}

interface Config {
  /** True when running in a test environment (test or ci). */
  isTest: boolean;
  db: {
    host: string | undefined;
    port: number;
    dialect: string;
    username: string | undefined;
    password: string | undefined;
    database: string | undefined;
  };
  auth: {
    secret: string | undefined;
    google: {
      clientId: string | undefined;
      clientSecret: string | undefined;
    };
  };
  s3: {
    bucketPrefix: string | undefined;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

const dbHost = process.env.DB_HOST ?? '127.0.0.1';
const dbPort = Number(process.env.DB_PORT ?? '3306');
const dbDatabase = process.env.DB_DATABASE ?? 'redaction_development';

const config: Config = {
  isTest:
    (environment as string) === 'test' || (environment as string) === 'ci',
  db: {
    host: dbHost,
    port: dbPort,
    dialect: 'mariadb',
    username: process.env.DB_USER ?? 'redaction',
    password: process.env.DB_PASS ?? 'redaction',
    database: dbDatabase,
  },
  auth: {
    secret: process.env.AUTH_SECRET,
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  s3: {
    bucketPrefix: process.env.S3_BUCKET_PREFIX,
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
};

export default config;
