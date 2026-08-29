import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ProcessRedactionResult, processRedaction } from './processRedaction';
import { maybeDeleteUnusedOpenAICompatibleCompletionCacheFiles } from '../../../../lib/ai/createOpenAICompatibleCompletion.mock.delete';
import FakeData from '../../../../lib/testUtilities/FakeData';
import Redaction, {
  RedactionAttributes,
  generateRedactionKey,
} from '../../../../lib/models/Redaction';
import { PartialInstance } from '../../../../lib/db/types';
import {
  PageSize,
  RedactionBoundingBox,
  RedactionStatus,
} from '../../../../lib/models/redactionTypes';
import { getUrlForRedactionImage } from '../../../../lib/storage/redactionImageUrl';
import { getRedactionImage } from '../../../../lib/storage/storageFunctions/redactionImage';
import { putRedactionFile } from '../../../../lib/storage/storageFunctions/redactionFile';
import { promiseAllThrottled } from '../../../../lib/utilities/promiseAllThrottled';

afterAll(async () => {
  await maybeDeleteUnusedOpenAICompatibleCompletionCacheFiles(__filename);
});

describe(processRedaction, () => {
  let processingRan = false;
  let redactionKey: string;
  let processResult: ProcessRedactionResult | null = null;
  let redactionStatus: RedactionStatus | null = null;
  let redactionErrorMessage: string | null = null;
  let redactionBoundingBoxes: RedactionBoundingBox[] = [];
  let redactionPageSizes: PageSize[] | null = null;

  beforeAll(async () => {
    const twoPagePDF = await readTwoPageIRS1040();
    redactionKey = generateRedactionKey();
    const [redaction] = await Promise.all([
      FakeData.makeDBRedaction({
        key: redactionKey,
        pageCount: 2,
      }),
      putRedactionFile(twoPagePDF, 'application/pdf', redactionKey),
    ]);

    processResult = await processRedaction(redaction, twoPagePDF);

    const updatedRedaction = (await Redaction.findOne({
      where: { key: redactionKey },
      attributes: [
        'status',
        'redactionBoundingBoxes',
        'errorMessage',
        'pageSizes',
      ],
    })) as PartialInstance<
      RedactionAttributes,
      'status' | 'redactionBoundingBoxes' | 'errorMessage' | 'pageSizes'
    > | null;
    redactionStatus = updatedRedaction?.status ?? null;
    redactionErrorMessage = updatedRedaction?.errorMessage ?? null;
    redactionBoundingBoxes = updatedRedaction?.redactionBoundingBoxes ?? [];
    redactionPageSizes = updatedRedaction?.pageSizes ?? null;
    processingRan = true;
  }, 240000);

  it('stores images and page-tagged boxes for the live two-page run', async () => {
    if (!processingRan) return;

    const images = await promiseAllThrottled(
      [1, 2].map(
        (page) => async () => getRedactionImage({ key: redactionKey, page })
      ),
      2
    );

    expect(redactionStatus).toBe(RedactionStatus.redacted);
    expect(redactionErrorMessage).toBeNull();
    expect(images.every((image) => image.length > 0)).toBe(true);
    expect(redactionBoundingBoxes.length).toBeGreaterThan(0);
    expect(
      redactionBoundingBoxes.every(
        (box) =>
          box.type === 'automatic' &&
          box.enabled &&
          (box.page === 1 || box.page === 2)
      )
    ).toBe(true);
    expect(processResult?.rasterizationTimeMs).toEqual(expect.any(Number));
    expect(processResult?.averageRasterizationTimeMs).toEqual(
      expect.any(Number)
    );
    expect(processResult?.pageTimings).toHaveLength(2);
    expect(redactionPageSizes).toHaveLength(2);
    expect(
      redactionPageSizes?.every(
        (pageSize) => pageSize.width > 0 && pageSize.height > 0
      )
    ).toBe(true);
  }, 30000);
});

describe(getUrlForRedactionImage, () => {
  it('returns the public virtual-hosted URL for a page image', () => {
    expect(getUrlForRedactionImage({ key: 'abc', page: 2 })).toBe(
      'https://redaction-test-files.sfo3.digitaloceanspaces.com/redactions/abc-2.jpg'
    );
  });
});

async function readTwoPageIRS1040(): Promise<Buffer> {
  return fs.readFile(
    path.join(
      process.cwd(),
      'lib/redaction/__testData__/irs1040Scenario2First2Pages.pdf'
    )
  );
}
