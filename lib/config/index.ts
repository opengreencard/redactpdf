import { config as loadConfig } from 'dotenv';

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
loadConfig({ path: `.env.${environment}` });

interface Config {
  /** True when running in a test environment (test or ci). */
  isTest: boolean;
  db: {
    host: string | undefined;
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
const dbDatabase = process.env.DB_DATABASE ?? 'redaction_development';

const config: Config = {
  isTest:
    (environment as string) === 'test' || (environment as string) === 'ci',
  db: {
    host: dbHost,
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
