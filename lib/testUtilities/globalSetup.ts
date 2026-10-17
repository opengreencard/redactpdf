import setupDatabases from './setupDatabases';

/**
 * Jest runs this once before all test files. Each Jest worker uses its own
 * database, so the databases are recreated here, one per worker. Each test
 * file then creates the tables in its worker's database.
 */
export default async function globalSetup({
  maxWorkers,
}: {
  maxWorkers: number;
}): Promise<void> {
  await setupDatabases(maxWorkers);
}
