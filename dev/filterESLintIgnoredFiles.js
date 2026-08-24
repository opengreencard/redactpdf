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

  const filteredFiles = (
    await Promise.all(
      inputFiles.map(async (inputFile) =>
        (await eslint.isPathIgnored(inputFile)) ? null : inputFile,
      ),
    )
  ).filter((inputFile) => inputFile !== null);

  // lefthook expands {push_files} into repo-relative paths, so returning the
  // filtered list as plain space-separated paths lets the hook splice them
  // directly into the eslint command.
  process.stdout.write(filteredFiles.join(' '));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
