import '../lib/allDatabaseModels';
import db from '../lib/db';

/** Synchronize the authentication schema for local development. */
async function run(): Promise<void> {
  // eslint-disable-next-line no-console
  await db.sync({ logging: console.log });
}

run();
