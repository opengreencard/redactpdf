import FakeData from '../testUtilities/FakeData';
import { PartialInstance } from '../db/types';
import Redaction, {
  RedactionAttributes,
  RedactionInstance,
} from '../models/Redaction';
import {
  getRedactionFile,
  putRedactionFile,
} from '../storage/storageFunctions/redactionFile';
import {
  getRedactionImage,
  putRedactionImage,
} from '../storage/storageFunctions/redactionImage';
import { _deleteOldRedactionHours } from './deleteOldRedactionHours';
import { deleteOldRedactions } from './deleteOldRedactions';

describe(deleteOldRedactions, () => {
  afterEach(async () => {
    await Redaction.truncate();
  });

  it('deletes stale originals, page images, and rows, and leaves a fresh one', async () => {
    const [staleOlder, staleThreePage, staleOnePage, fresh] = await Promise.all(
      [
        makeDBRedactionWithFileAndImages({
          openedAt: hoursAgo(earlierStaleHours),
          pageCount: 1,
        }),
        makeDBRedactionWithFileAndImages({
          openedAt: hoursAgo(staleHours),
          pageCount: 3,
        }),
        makeDBRedactionWithFileAndImages({
          openedAt: hoursAgo(staleHours),
          pageCount: 1,
        }),
        makeDBRedactionWithFileAndImages({
          openedAt: hoursAgo(freshHours),
          pageCount: 1,
        }),
      ]
    );

    const result = await deleteOldRedactions({
      // Three stale rows with a page size of 1 forces later keyset pages,
      // including two that share the same openedAt and differ only by id.
      pageSizeForTesting: 1,
    });

    expect(result).toEqual({ deleted: 3 });

    const [remaining] = await Promise.all([
      // Idle rows should be gone. Only the still-fresh ID should come back.
      Redaction.findAll({
        attributes: ['id'],
        where: {
          id: [staleOlder.id, staleThreePage.id, staleOnePage.id, fresh.id],
        },
      }) as Promise<PartialInstance<RedactionAttributes, 'id'>[]>,
      // Idle originals and page images should be gone from Spaces.
      expect(getRedactionFile(staleOlder.key)).rejects.toMatchObject({
        name: 'NotFound',
      }),
      expect(getRedactionFile(staleThreePage.key)).rejects.toMatchObject({
        name: 'NotFound',
      }),
      expect(getRedactionFile(staleOnePage.key)).rejects.toMatchObject({
        name: 'NotFound',
      }),
      expect(
        getRedactionImage({ key: staleThreePage.key, page: 1 })
      ).rejects.toMatchObject({ name: 'NotFound' }),
      expect(
        getRedactionImage({ key: staleThreePage.key, page: 2 })
      ).rejects.toMatchObject({ name: 'NotFound' }),
      expect(
        getRedactionImage({ key: staleThreePage.key, page: 3 })
      ).rejects.toMatchObject({ name: 'NotFound' }),
      // The fresh PDF and page image should still be in Spaces.
      expect(getRedactionFile(fresh.key)).resolves.toBeInstanceOf(Buffer),
      expect(
        getRedactionImage({ key: fresh.key, page: 1 })
      ).resolves.toBeInstanceOf(Buffer),
    ]);

    expect(remaining.map((row) => row.id)).toEqual([fresh.id]);
  });
});

const staleHours = _deleteOldRedactionHours + 0.01;
const earlierStaleHours = staleHours + 0.5;
const freshHours = _deleteOldRedactionHours - 0.01;

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function makeDBRedactionWithFileAndImages({
  openedAt,
  pageCount,
}: {
  openedAt: Date;
  pageCount: number;
}): Promise<RedactionInstance> {
  const redaction = await FakeData.makeDBRedaction({ openedAt, pageCount });
  await Promise.all([
    putRedactionFile(
      Buffer.from(`original-${redaction.key}`),
      'application/pdf',
      redaction.key
    ),
    ...Array.from({ length: pageCount }, (_unused, index) =>
      putRedactionImage(
        Buffer.from(`page-${redaction.key}-${index + 1}`),
        'image/jpeg',
        {
          key: redaction.key,
          page: index + 1,
        }
      )
    ),
  ]);
  return redaction;
}
