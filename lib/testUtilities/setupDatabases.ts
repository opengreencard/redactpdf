import db from '../db';
import '../allDatabaseModels';

/**
 * Set up databases before running tests in case the database schema has
 * changed.
 */
export default async function setupDatabases() {
  if (process.env.SETUP_TEST_DB) {
    // eslint-disable-next-line no-console
    console.log('\nSetting up databases');

    // Always set up the main database
    try {
      await db.sync({ force: true });
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
}
