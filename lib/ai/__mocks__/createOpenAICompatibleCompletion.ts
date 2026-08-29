import {
  createHashForFilename,
  makeMockedPassThroughFunction,
} from '../../testUtilities/MockFunctions';
import { getCurrentTestFile } from '../../testUtilities/testState';
import type { CreateOpenAICompatibleCompletionOptions } from '../createOpenAICompatibleCompletion';

const actualModule = jest.requireActual('../createOpenAICompatibleCompletion');

export const { OpenAICompatibleProvider } = actualModule;

/**
 * For tests, cache OpenAI-compatible completion results so they run faster
 * and don't hit billed providers.
 */
export const createOpenAICompatibleCompletion = makeMockedPassThroughFunction(
  actualModule.createOpenAICompatibleCompletion,
  __filename,
  {
    makeFilename: (
      options: CreateOpenAICompatibleCompletionOptions
    ): string => {
      const hash = createHashForFilename(getMinimalCompletionOptions(options));
      return `${getCurrentTestFile()}_${options.provider}_${hash}`;
    },
  }
);

/**
 * Creates a smaller set of options to stringify, since some options can change
 * often but don't actually affect the response. Omit volatile HTTP-style fields
 * here if they start appearing on the completion request.
 */
function getMinimalCompletionOptions(
  options: CreateOpenAICompatibleCompletionOptions
): CreateOpenAICompatibleCompletionOptions {
  return options;
}
