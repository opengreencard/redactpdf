import { createHash } from 'node:crypto';
import path from 'node:path';

/**
 * Returns a unique cache filename prefix consisting of the basename and the
 * hash of the path relative to the project root.
 *
 * The hash uses the first 8 hex digits of the SHA256 hash of the relative path.
 * This is unique enough to avoid collisions without being too long.
 *
 * The hash is joined with a hyphen instead of an underscore so that new files
 * don't start with `legacyPrefix_`. When we delete unused cache files, we
 * check for files starting with either the new or legacy prefix followed by an
 * underscore. If we used an underscore to join the basename and hash, the
 * legacy prefix `basename_...` would match the new prefix `basename_hash_...`
 * and we would unintentionally delete the new files. However, using a hyphen,
 * `basename_...` does not match the new prefix `basename-hash_...`.
 */
export function getTestFilePrefix(fullPath: string): string {
  const relativePath = path.relative(process.cwd(), fullPath);
  return `${path.basename(fullPath)}-${hashPath(relativePath)}`;
}

/**
 * Returns the legacy cache filename prefix consisting of just the basename.
 *
 * We changed the format to include the path hash to avoid collisions when two
 * files have the same basename. However, we still read the old files so we can
 * migrate gradually.
 */
export function getLegacyTestFilePrefix(fullPath: string): string {
  return path.basename(fullPath);
}

/**
 * Returns the cache filename prefix for the current test file.
 */
export function getCurrentTestFile(): string {
  const testPath = getCurrentTestPath();
  return testPath
    ? getTestFilePrefix(testPath)
    : // Return rather than throw when we are outside a Jest test (for example
      // while loading a mock module). Cache writes should not happen then.
      'unknownTestFileDeleteThis';
}

/**
 * Returns the legacy cache filename prefix for the current test file.
 */
export function getCurrentTestFileLegacy(): string {
  const testPath = getCurrentTestPath();
  return testPath
    ? getLegacyTestFilePrefix(testPath)
    : 'unknownTestFileDeleteThis';
}

/**
 * Description of the current `it()` plus any parent `describe()` names, like
 * `manual test annotates a JPEG`.
 *
 * Used to decide whether the current test should reuse recorded network
 * responses. Empty when we are outside an `it()` (for example in `beforeAll`).
 */
export function getCurrentTestName(): string {
  try {
    return expect.getState().currentTestName ?? '';
  } catch {
    return '';
  }
}

function getCurrentTestPath(): string | undefined {
  try {
    return expect.getState().testPath;
  } catch {
    return undefined;
  }
}

function hashPath(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 8);
}
