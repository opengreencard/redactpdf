import { promises as fs } from 'node:fs';
import path from 'node:path';

import { createOpenAICompatibleCompletion } from '../../../../lib/ai/createOpenAICompatibleCompletion';
import ClientFakeData from '../../../../lib/testUtilities/ClientFakeData';
import FakeData from '../../../../lib/testUtilities/FakeData';
import Redaction, {
  RedactionAttributes,
  generateRedactionKey,
} from '../../../../lib/models/Redaction';
import { PartialInstance } from '../../../../lib/db/types';
import { RedactionStatus } from '../../../../lib/models/redactionTypes';
import { processRedaction } from './processRedaction';
// Disable the warning not to mock OpenAI: here we want to simulate rare
// outage paths which wouldn't be possible with regular code.
// eslint-disable-next-line no-restricted-syntax
jest.mock('../../../../lib/ai/createOpenAICompatibleCompletion', () => {
  const actualModule = jest.requireActual(
    '../../../../lib/ai/createOpenAICompatibleCompletion'
  );
  return {
    ...actualModule,
    createOpenAICompatibleCompletion: jest.fn(),
  };
});

const createOpenAICompatibleCompletionMock =
  createOpenAICompatibleCompletion as jest.MockedFunction<
    typeof createOpenAICompatibleCompletion
  >;

describe(processRedaction, () => {
  let twoPagePDF: Buffer;

  beforeAll(async () => {
    twoPagePDF = await fs.readFile(
      path.join(
        process.cwd(),
        'lib/redaction/__testData__/irs1040Scenario2First2Pages.pdf'
      )
    );
  });

  beforeEach(() => {
    createOpenAICompatibleCompletionMock.mockResolvedValue(
      ClientFakeData.makeOpenAICompatibleCompletionResult()
    );
  });

  afterEach(() => {
    createOpenAICompatibleCompletionMock.mockReset();
  });

  it('continues processing later pages when one vision request fails', async () => {
    const redactionKey = generateRedactionKey();
    const redaction = await FakeData.makeDBRedaction({
      key: redactionKey,
      pageCount: 2,
    });
    createOpenAICompatibleCompletionMock.mockRejectedValueOnce(
      new Error('vision unavailable for page one')
    );

    await processRedaction(redaction, twoPagePDF);

    const updatedRedaction = (await Redaction.findOne({
      where: { key: redactionKey },
      attributes: ['status', 'redactionBoundingBoxes', 'errorMessage'],
    })) as PartialInstance<
      RedactionAttributes,
      'status' | 'redactionBoundingBoxes' | 'errorMessage'
    > | null;

    expect(updatedRedaction?.status).toBe(RedactionStatus.redacted);
    expect(updatedRedaction?.errorMessage).toBeNull();
    expect(
      updatedRedaction?.redactionBoundingBoxes.some((box) => box.page === 2)
    ).toBe(true);
  }, 120000);

  it('marks the row as errored when every vision request fails', async () => {
    const redactionKey = generateRedactionKey();
    const redaction = await FakeData.makeDBRedaction({
      key: redactionKey,
      pageCount: 2,
    });
    createOpenAICompatibleCompletionMock.mockRejectedValue(
      new Error('vision unavailable')
    );

    await processRedaction(redaction, twoPagePDF);

    const updatedRedaction = (await Redaction.findOne({
      where: { key: redactionKey },
      attributes: ['status', 'errorMessage'],
    })) as PartialInstance<
      RedactionAttributes,
      'status' | 'errorMessage'
    > | null;

    expect(updatedRedaction?.status).toBe(RedactionStatus.error);
    expect(updatedRedaction?.errorMessage).toContain('vision unavailable');
  }, 120000);
});
