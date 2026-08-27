import { makeMockedPassThroughFunction } from '../../testUtilities/MockFunctions';

const actualModule = jest.requireActual('../createOpenAICompatibleCompletion');

/** Record live provider responses once, then replay them in regular tests. */
export const { OpenAICompatibleProvider } = actualModule;

export const createOpenAICompatibleCompletion = makeMockedPassThroughFunction(
  actualModule.createOpenAICompatibleCompletion,
  __filename
);
