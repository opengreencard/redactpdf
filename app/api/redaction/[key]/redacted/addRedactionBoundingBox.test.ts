import ClientFakeData from '../../../../../lib/testUtilities/ClientFakeData';
import FakeData from '../../../../../lib/testUtilities/FakeData';
import type { RedactionInstance } from '../../../../../lib/models/Redaction';
import { RedactionStatus } from '../../../../../lib/models/redactionTypes';
import { addRedactionBoundingBox } from './addRedactionBoundingBox';

describe(addRedactionBoundingBox, () => {
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
      ClientFakeData.makeManualRedactionBoundingBox({ page: 2, box }),
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

  describe('input validation', () => {
    let redaction: RedactionInstance;

    beforeAll(async () => {
      redaction = await FakeData.makeDBRedaction({
        pageCount: 2,
        status: RedactionStatus.redacted,
      });
    });

    it.each([{ page: 0 }, { page: 3 }, { page: 1.5 }])(
      'rejects page $page',
      async ({ page }) => {
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
        box: ClientFakeData.makeBoundingBox({ minX: 0.5, maxX: 0.5 }),
      },
      {
        box: ClientFakeData.makeBoundingBox({ maxX: 1.1 }),
      },
      {
        box: ClientFakeData.makeBoundingBox({ minX: Number.NaN }),
      },
      {
        box: ClientFakeData.makeBoundingBox({
          maxX: Number.POSITIVE_INFINITY,
        }),
      },
    ])('rejects invalid box coordinates', async ({ box: invalidBox }) => {
      await expect(
        addRedactionBoundingBox({
          key: redaction.key,
          page: 1,
          box: invalidBox,
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  const box = ClientFakeData.makeBoundingBox();
});
