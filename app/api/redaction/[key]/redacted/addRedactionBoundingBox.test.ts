import ClientFakeData from '../../../../../lib/testUtilities/ClientFakeData';
import FakeData from '../../../../../lib/testUtilities/FakeData';
import {
  BoundingBox,
  RedactionStatus,
} from '../../../../../lib/models/redactionTypes';
import { addRedactionBoundingBox } from './addRedactionBoundingBox';

describe(addRedactionBoundingBox, () => {
  const box: BoundingBox = {
    minX: 0.1,
    minY: 0.2,
    maxX: 0.3,
    maxY: 0.4,
  };

  it('appends a manual box', async () => {
    const autoBox = ClientFakeData.makeAutoRedactionBoundingBox({ page: 1 });
    const redaction = await FakeData.makeDBRedaction({
      pageCount: 2,
      status: RedactionStatus.redacted,
      redactionBoundingBoxes: [autoBox],
    });

    const result = await addRedactionBoundingBox({
      key: redaction.key,
      page: 2,
      box,
    });

    expect(result.status).toBe(RedactionStatus.redacted);
    expect(result.createdAt).toEqual(expect.any(String));
    expect(result.createdAt).not.toBeInstanceOf(Date);
    if (result.status !== RedactionStatus.redacted) {
      throw new Error('Expected a redacted response');
    }
    expect(result.redactionBoundingBoxes).toEqual([
      autoBox,
      { type: 'manual', page: 2, box, enabled: true },
    ]);
  });

  it('throws a 404 ApplicationError for an unknown key', async () => {
    await expect(
      addRedactionBoundingBox({
        key: 'unknown-redaction-key',
        page: 1,
        box,
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects add while redacting', async () => {
    const redaction = await FakeData.makeDBRedaction({
      status: RedactionStatus.redacting,
    });

    await expect(
      addRedactionBoundingBox({
        key: redaction.key,
        page: 1,
        box,
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects add after processing failed', async () => {
    const redaction = await FakeData.makeDBRedaction({
      status: RedactionStatus.error,
    });

    await expect(
      addRedactionBoundingBox({
        key: redaction.key,
        page: 1,
        box,
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it.each([{ page: 0 }, { page: 3 }, { page: 1.5 }])(
    'rejects page $page',
    async ({ page }) => {
      const redaction = await FakeData.makeDBRedaction({
        pageCount: 2,
        status: RedactionStatus.redacted,
      });

      await expect(
        addRedactionBoundingBox({
          key: redaction.key,
          page,
          box,
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    }
  );

  it.each([
    {
      box: { minX: 0.5, minY: 0.1, maxX: 0.5, maxY: 0.2 },
    },
    {
      box: { minX: 0, minY: 0, maxX: 1.1, maxY: 1 },
    },
    {
      box: { minX: Number.NaN, minY: 0, maxX: 1, maxY: 1 },
    },
    {
      box: { minX: 0, minY: 0, maxX: Number.POSITIVE_INFINITY, maxY: 1 },
    },
  ])('rejects invalid box coordinates', async ({ box: invalidBox }) => {
    const redaction = await FakeData.makeDBRedaction({
      status: RedactionStatus.redacted,
    });

    await expect(
      addRedactionBoundingBox({
        key: redaction.key,
        page: 1,
        box: invalidBox,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
