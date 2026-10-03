import FakeData from '../../lib/testUtilities/FakeData';
import Redaction from '../../lib/models/Redaction';
import {
  getRedactionFile,
  putRedactionFile,
} from '../../lib/storage/storageFunctions/redactionFile';
import {
  getRedactionImage,
  putRedactionImage,
} from '../../lib/storage/storageFunctions/redactionImage';
import {
  _deleteOldRedactionHours,
  deleteOldRedactions,
} from './deleteOldRedactions.lib';

const staleHours = _deleteOldRedactionHours + 0.01;
const freshHours = _deleteOldRedactionHours - 0.01;
const olderThanMs = _deleteOldRedactionHours * 60 * 60 * 1000;

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function seedRedaction({
  openedAt,
  pageCount,
}: {
  openedAt: Date;
  pageCount: number;
}) {
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

describe(deleteOldRedactions, () => {
  afterEach(async () => {
    await Redaction.truncate();
  });

  it('deletes stale originals, page images, and rows, and leaves a fresh one', async () => {
    const [staleThreePage, staleOnePage, fresh] = await Promise.all([
      seedRedaction({ openedAt: hoursAgo(staleHours), pageCount: 3 }),
      seedRedaction({ openedAt: hoursAgo(staleHours), pageCount: 1 }),
      seedRedaction({ openedAt: hoursAgo(freshHours), pageCount: 1 }),
    ]);

    const result = await deleteOldRedactions({
      olderThanMs,
      makeChanges: true,
      // Two stale rows with a page size of 1 forces a second keyset page.
      pageSizeForTesting: 1,
    });

    expect(result).toEqual({ checked: 2, deleted: 2 });
    expect(await Redaction.count({ where: { key: staleThreePage.key } })).toBe(
      0
    );
    expect(await Redaction.count({ where: { key: staleOnePage.key } })).toBe(0);
    expect(await Redaction.count({ where: { key: fresh.key } })).toBe(1);

    await expect(getRedactionFile(staleThreePage.key)).rejects.toMatchObject({
      name: 'NotFound',
    });
    await expect(
      getRedactionImage({ key: staleThreePage.key, page: 1 })
    ).rejects.toMatchObject({ name: 'NotFound' });
    await expect(
      getRedactionImage({ key: staleThreePage.key, page: 2 })
    ).rejects.toMatchObject({ name: 'NotFound' });
    await expect(
      getRedactionImage({ key: staleThreePage.key, page: 3 })
    ).rejects.toMatchObject({ name: 'NotFound' });
    await expect(getRedactionFile(staleOnePage.key)).rejects.toMatchObject({
      name: 'NotFound',
    });
    await expect(getRedactionFile(fresh.key)).resolves.toBeInstanceOf(Buffer);
    await expect(
      getRedactionImage({ key: fresh.key, page: 1 })
    ).resolves.toBeInstanceOf(Buffer);
  });
});
