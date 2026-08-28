import { promises as fs } from 'node:fs';
import path from 'node:path';
import { isNotNullOrUndefined } from '../typescript/isNotNullOrUndefined';
import { promiseAllThrottled } from '../utilities/promiseAllThrottled';
import {
  getMockFunctionCacheDir,
  getUsedMockFunctionCacheFilePaths,
} from './MockFunctions';
import { getLegacyTestFilePrefix, getTestFilePrefix } from './testState';

/**
 * If the user runs a test with `DELETE_UNUSED=1`, this can then be called after
 * running all tests in a file to delete all cache files that were neither
 * written to nor read from during the execution of the test.
 *
 * @param logPrefix Label for the console summary
 * @param module Pass in the `jest.requireActual` for the un-mocked module
 * @param testFilename Pass in `__filename` from within the .test.ts file
 * @param deleteFilename Pass in `__filename` from within the .delete.ts file
 */
export async function maybeDeleteUnusedCacheFiles(
  logPrefix: string,
  module: Record<string, unknown>,
  testFilename: string,
  deleteFilename: string
): Promise<void> {
  const usedTestFiles = new Set(
    getUsedMockFunctionCacheFilePaths().map((filePath) =>
      filePath.toLowerCase()
    )
  );
  const logFiles = process.env.LOG_FILES ?? false;
  if (!process.env.DELETE_UNUSED) {
    console.info(
      `${logPrefix}: not deleting unused cache files. Run DELETE_UNUSED=1 yarn jest ... to delete unused cache files:${
        logFiles ? [...usedTestFiles].map((file) => `\n${file}`).join('') : ''
      }`
    );
    return;
  }

  const functionNames = Object.values(module)
    .map((item) => (typeof item === 'function' ? item.name : null))
    .filter(isNotNullOrUndefined);
  const filePrefix = getTestFilePrefix(testFilename);
  const legacyFilePrefix = getLegacyTestFilePrefix(testFilename);

  const allTestFiles = (
    await promiseAllThrottled(
      functionNames.flatMap((functionName) => [
        () =>
          getCacheFilesMatchingCurrentTest(
            functionName,
            filePrefix,
            deleteFilename
          ),
        () =>
          getCacheFilesMatchingCurrentTest(
            functionName,
            legacyFilePrefix,
            deleteFilename
          ),
      ]),
      3
    )
  ).flat();

  const unusedTestFiles = allTestFiles.filter(
    // We can lower the paths because paths are case-agnostic.
    // Casing caused an issue with request-promise-native where
    // 'Request' was matching to the 'request' files and causing them
    // to be deleted.
    (file) => !usedTestFiles.has(file.toLowerCase())
  );

  await promiseAllThrottled(
    unusedTestFiles.map(
      (filePath) => async (): Promise<void> => fs.rm(filePath)
    ),
    3
  );
  console.info(
    `${logPrefix}: Deleted ${unusedTestFiles.length} unused cache files`
  );
}

async function getCacheFilesMatchingCurrentTest(
  functionName: string,
  filePrefix: string,
  deleteFilename: string
): Promise<string[]> {
  try {
    const cacheDir = getMockFunctionCacheDir({
      scriptFileName: deleteFilename.replaceAll('.delete', ''),
      origFunctionName: functionName,
      overrideCacheDir: null,
    });
    const files = await fs.readdir(cacheDir);
    return files
      .filter((file) => file.startsWith(`${filePrefix}_`))
      .map((file) => path.join(cacheDir, file));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
