import fs from 'node:fs';
// This development-only utility formats generated fixture files with Prettier.
// eslint-disable-next-line import/no-extraneous-dependencies
import prettier from 'prettier';
import { describeTestDataGeneratorTest } from './testTypes';

/**
 * Create a test that writes generated JSON fixture data.
 *
 * Existing files are left untouched unless `UPDATE=1` is set or
 * `UPDATE_PATTERN` matches the output path. This keeps an ordinary generator
 * run safe while still making intentional fixture refreshes explicit.
 */
// This exported helper defines Jest tests by design; it is a reusable test
// utility rather than a test file.
// eslint-disable-next-line jest/no-export
export function makeTestDataGeneratorTest(
  outputFile: string,
  outputDataGenerator: () => Promise<unknown>,
  options: {
    timeoutMs?: number;
  } = {}
): void {
  describeTestDataGeneratorTest(() => {
    // This test verifies fixture generation by writing a file rather than an
    // assertion; the generated file is the result being tested.
    // eslint-disable-next-line jest/expect-expect
    it(
      `generates data for ${outputFile}`,
      async () => {
        const updatePattern = process.env.UPDATE_PATTERN;
        const shouldUpdate =
          process.env.UPDATE === '1' ||
          (updatePattern !== undefined &&
            updatePattern.length > 0 &&
            outputFile.toLowerCase().includes(updatePattern.toLowerCase()));
        if (!shouldUpdate && fs.existsSync(outputFile)) {
          return;
        }

        console.info('Writing', outputFile);
        const data = await outputDataGenerator();
        const serializedData = JSON.stringify(data);
        if (serializedData === undefined) {
          throw new Error(
            `makeTestDataGeneratorTest for ${outputFile}: generator returned undefined`
          );
        }
        const contents = await prettier.format(serializedData, {
          parser: 'json',
        });
        await fs.promises.writeFile(outputFile, contents, 'utf8');
      },
      options.timeoutMs ?? 30_000
    );
  });
}
