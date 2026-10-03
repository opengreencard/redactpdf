import ClientFakeData from '../../../../../lib/testUtilities/ClientFakeData';
import FakeData from '../../../../../lib/testUtilities/FakeData';
import type { RedactionInstance } from '../../../../../lib/models/Redaction';
import {
  BoundingBox,
  GetRedactionResponse,
  RedactionBoundingBox,
  RedactionStatus,
} from '../../../../../lib/models/redactionTypes';
import { isSameRedactionBoundingBox } from '../../../../../lib/models/redactionBoundingBoxIdentity';
import { getRedaction } from '../getRedaction';
import { mutateRedactionBoundingBoxes } from './mutateRedactionBoundingBoxes';

describe(mutateRedactionBoundingBoxes, () => {
  it('appends a manual box', async () => {
    const autoBox = ClientFakeData.makeAutoRedactionBoundingBox({ page: 1 });
    const redaction = await FakeData.makeDBRedaction({
      pageCount: 2,
      status: RedactionStatus.redacted,
      redactionBoundingBoxes: [autoBox],
    });

    const result = await mutateRedactionBoundingBoxes({
      key: redaction.key,
      mutations: [{ op: 'add', page: 2, box }],
    });

    expect(result.createdAt).toEqual(expect.any(String));
    expect(result.createdAt).not.toBeInstanceOf(Date);
    expect(redactedBoxes(result)).toEqual([
      autoBox,
      ClientFakeData.makeManualRedactionBoundingBox({ page: 2, box }),
    ]);
  });

  it.each([
    { status: RedactionStatus.redacting },
    { status: RedactionStatus.error },
  ])('rejects mutations while status is $status', async ({ status }) => {
    const redaction = await FakeData.makeDBRedaction({ status });

    await expect(
      mutateRedactionBoundingBoxes({
        key: redaction.key,
        mutations: [{ op: 'add', page: 1, box }],
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws a 404 ApplicationError for an unknown key', async () => {
    await expect(
      mutateRedactionBoundingBoxes({
        key: 'unknown-redaction-key',
        mutations: [{ op: 'add', page: 1, box }],
      })
    ).rejects.toMatchObject({ statusCode: 404 });
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
          mutateRedactionBoundingBoxes({
            key: redaction.key,
            mutations: [{ op: 'add', page, box }],
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
        mutateRedactionBoundingBoxes({
          key: redaction.key,
          mutations: [{ op: 'add', page: 1, box: invalidBox }],
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  it.each([
    { label: 'manual', deleted: 'manual' as const },
    { label: 'automatic', deleted: 'automatic' as const },
  ])('removes a $label box and leaves the other', async ({ deleted }) => {
    const { redaction, autoBox, manualBox } =
      await makeMixedRedactedRedaction();
    const target = deleted === 'manual' ? manualBox : autoBox;

    const result = await mutateRedactionBoundingBoxes({
      key: redaction.key,
      mutations: [
        {
          op: 'delete',
          page: target.page,
          box: target.box,
          type: deleted,
        },
      ],
    });

    expect(redactedBoxes(result)).toEqual(
      deleted === 'manual' ? [autoBox] : [manualBox]
    );
  });

  it('throws a 404 ApplicationError for an unknown box', async () => {
    const { redaction } = await makeMixedRedactedRedaction();

    await expect(
      mutateRedactionBoundingBoxes({
        key: redaction.key,
        mutations: [
          {
            op: 'delete',
            page: 1,
            box: ClientFakeData.makeBoundingBox({ minX: 0.9, maxX: 1 }),
            type: 'automatic',
          },
        ],
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it.each([{ boxKind: 'automatic' as const }, { boxKind: 'manual' as const }])(
    'sets $boxKind enabled to false then true',
    async ({ boxKind }) => {
      const { redaction, autoBox, manualBox } =
        await makeMixedRedactedRedaction();
      const target = boxKind === 'automatic' ? autoBox : manualBox;

      const first = await mutateRedactionBoundingBoxes({
        key: redaction.key,
        mutations: [
          {
            op: 'setEnabled',
            page: target.page,
            box: target.box,
            type: boxKind,
            enabled: false,
          },
        ],
      });
      const second = await mutateRedactionBoundingBoxes({
        key: redaction.key,
        mutations: [
          {
            op: 'setEnabled',
            page: target.page,
            box: target.box,
            type: boxKind,
            enabled: true,
          },
        ],
      });

      expect(enabledOf(first, target)).toBe(false);
      expect(
        enabledOf(first, boxKind === 'automatic' ? manualBox : autoBox)
      ).toBe(true);
      expect(enabledOf(second, target)).toBe(true);
    }
  );

  it('applies add, delete, and setEnabled in one save', async () => {
    const { redaction, autoBox, manualBox } =
      await makeMixedRedactedRedaction();

    const result = await mutateRedactionBoundingBoxes({
      key: redaction.key,
      mutations: [
        { op: 'add', page: 2, box },
        {
          op: 'delete',
          page: manualBox.page,
          box: manualBox.box,
          type: 'manual',
        },
        {
          op: 'setEnabled',
          page: autoBox.page,
          box: autoBox.box,
          type: 'automatic',
          enabled: false,
        },
      ],
    });

    expect(redactedBoxes(result)).toEqual([
      { ...autoBox, enabled: false },
      ClientFakeData.makeManualRedactionBoundingBox({ page: 2, box }),
    ]);
  });

  it('does not save if a later mutation fails', async () => {
    const { redaction, autoBox, manualBox } =
      await makeMixedRedactedRedaction();

    await expect(
      mutateRedactionBoundingBoxes({
        key: redaction.key,
        mutations: [
          { op: 'add', page: 2, box },
          {
            op: 'delete',
            page: 1,
            box: ClientFakeData.makeBoundingBox({ minX: 0.9, maxX: 1 }),
            type: 'automatic',
          },
        ],
      })
    ).rejects.toMatchObject({ statusCode: 404 });

    const after = await getRedaction({ key: redaction.key });
    expect(redactedBoxes(after)).toEqual([autoBox, manualBox]);
  });

  const box: BoundingBox = ClientFakeData.makeBoundingBox();
});

async function makeMixedRedactedRedaction(): Promise<{
  redaction: RedactionInstance;
  autoBox: Extract<RedactionBoundingBox, { type: 'automatic' }>;
  manualBox: Extract<RedactionBoundingBox, { type: 'manual' }>;
}> {
  const autoBox = ClientFakeData.makeAutoRedactionBoundingBox({ page: 1 });
  const manualBox = ClientFakeData.makeManualRedactionBoundingBox({ page: 2 });
  const redaction = await FakeData.makeDBRedaction({
    pageCount: 2,
    status: RedactionStatus.redacted,
    redactionBoundingBoxes: [autoBox, manualBox],
  });
  return { redaction, autoBox, manualBox };
}

function redactedBoxes(result: GetRedactionResponse): RedactionBoundingBox[] {
  if (result.status !== RedactionStatus.redacted) {
    throw new Error('Expected a redacted response');
  }
  return result.redactionBoundingBoxes;
}

function enabledOf(
  result: GetRedactionResponse,
  box: RedactionBoundingBox
): boolean | undefined {
  if (result.status !== RedactionStatus.redacted) {
    throw new Error('Expected a redacted response');
  }
  return result.redactionBoundingBoxes.find((existing) =>
    isSameRedactionBoundingBox(existing, box)
  )?.enabled;
}
