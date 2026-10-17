import config from '../config';
import db from '../db';
import '../allDatabaseModels';
import { promiseAllThrottled } from '../utilities/promiseAllThrottled';

/**
 * Name of the database that Jest worker `workerId` uses. Keep in sync with the
 * suffix that lib/config adds when `JEST_WORKER_ID` is set.
 */
function getWorkerDatabaseName(workerId: number): string {
  return `${config.db.database}${workerId}`;
}

/**
 * Create one empty database for each Jest worker, so that test files running in
 * parallel never share rows. Each file creates its tables in `beforeAll`.
 *
 * Runs only when SETUP_TEST_DB is set, which recreates the databases so schema
 * changes take effect. Workers are numbered from 1.
 */
export default async function setupDatabases(
  workerCount: number
): Promise<void> {
  if (!process.env.SETUP_TEST_DB) {
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`\nSetting up databases for ${workerCount} Jest workers`);

  try {
    // Connect through the base database, which always exists: `JEST_WORKER_ID`
    // is not set in this process.
    const workerIds = Array.from(
      { length: workerCount },
      (_, index) => index + 1
    );
    // One at a time: these are few and fast, and parallel DROP/CREATE
    // statements on one server can deadlock on the metadata lock.
    await promiseAllThrottled(
      workerIds.map((workerId) => async (): Promise<void> => {
        const name = getWorkerDatabaseName(workerId);
        await db.query(`DROP DATABASE IF EXISTS \`${name}\``);
        await db.query(
          `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
      }),
      1
    );
    await db.close();
  } catch (err) {
    // Add logging: otherwise, we get cryptic errors with no messages when
    // setting up databases
    // eslint-disable-next-line no-console
    console.error(err.message);
    // eslint-disable-next-line no-console
    console.error(err.stack);
    throw err;
  }

  // eslint-disable-next-line no-console
  console.log('\nDone setting up databases');
}
