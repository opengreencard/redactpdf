import setupDatabases from './setupDatabases';

/**
 * Jest runs this once before all test files. Every file shares one database,
 * so the tables are recreated here instead of once per file.
 */
export default async function globalSetup(): Promise<void> {
  await setupDatabases();
}
