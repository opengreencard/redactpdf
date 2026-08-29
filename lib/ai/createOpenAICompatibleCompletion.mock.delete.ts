import { maybeDeleteUnusedCacheFiles } from '../testUtilities/maybeDeleteUnusedCacheFiles';

const actualModule = jest.requireActual('./createOpenAICompatibleCompletion');

export async function maybeDeleteUnusedOpenAICompatibleCompletionCacheFiles(
  testFilename: string
): Promise<void> {
  const logPrefix = 'maybeDeleteUnusedOpenAICompatibleCompletionCacheFiles';
  await maybeDeleteUnusedCacheFiles(
    logPrefix,
    actualModule,
    testFilename,
    __filename
  );
}
