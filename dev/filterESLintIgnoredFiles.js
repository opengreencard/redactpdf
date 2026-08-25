#!/usr/bin/env node

// This script intentionally imports eslint from devDependencies because it is
// only used by our local git hook tooling.
//
// It also is not based on our typical script format, because we'd like to keep
// this as a JavaScript script with minimal transpilation time when running
// (rather than a Typescript script)
//
// Usage:
//
// ```
// node dev/filterESLintIgnoredFiles.js dev/eslint/file1.js file2.tsx
// ```
//
// Assuming .eslintignore contains /dev/eslint/**/*.js, the above will return:
// ```
// file2.tsx
// ```

const { ESLint } = require('eslint');

async function main() {
  const inputFiles = process.argv.slice(2);

  if (inputFiles.length === 0) {
    return;
  }

  const eslint = new ESLint({
    cache: true,
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  });

  const filteredFiles =
    // Disable warning to use promiseAllThrottled: this mostly polls
    // the local filesystem and is very fast
    // Note that eslint-disable-next-line doesn't work here due to Prettier
    /* eslint-disable no-restricted-syntax */
    (
      await Promise.all(
        inputFiles.map(async (inputFile) =>
          (await eslint.isPathIgnored(inputFile)) ? null : inputFile
        )
      )
    ).filter((inputFile) => inputFile !== null);
  /* eslint-enable no-restricted-syntax */

  // lefthook expands {push_files} into repo-relative paths, so returning the
  // filtered list as plain space-separated paths lets the hook splice them
  // directly into the eslint command.
  process.stdout.write(filteredFiles.join(' '));
}

main().catch((error) => {
  // Hook tooling must surface failures to stderr without importing a logger.
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
