import {
  createHashForFilename,
  makeMockedPassThroughFunction,
} from '../../testUtilities/MockFunctions';
import { getCurrentTestFile } from '../../testUtilities/testState';
import type { AskTypeSafeBoxOptions } from '../askTypeSafeBox';

const actualModule = jest.requireActual('../askTypeSafeBox');

/**
 * For tests, cache Box answers so they run faster and don't hit the billed
 * TypeSafe API. The cache key includes the crop bytes, so a change to cropping
 * misses the cache.
 */
export const askTypeSafeBox = makeMockedPassThroughFunction(
  actualModule.askTypeSafeBox,
  __filename,
  {
    makeFilename: (options: AskTypeSafeBoxOptions): string => {
      const hash = createHashForFilename({
        instructions: options.instructions,
        crop: Buffer.from(options.crop).toString('base64'),
      });
      return `${getCurrentTestFile()}_typesafe_${hash}`;
    },
  }
);
