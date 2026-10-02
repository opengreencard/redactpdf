import FakeData from '../../lib/testUtilities/FakeData';
import Redaction, {
  RedactionAttributes,
  RedactionInstance,
} from '../../lib/models/Redaction';
import { PartialInstance } from '../../lib/db/types';
import {
  getRedactionFile,
  putRedactionFile,
} from '../../lib/storage/storageFunctions/redactionFile';
import {
  getRedactionImage,
  putRedactionImage,
} from '../../lib/storage/storageFunctions/redactionImage';
import { promiseAllThrottled } from '../../lib/utilities/promiseAllThrottled';
import { touchRedactionOpenedAt } from '../../app/api/redaction/[key]/open/touchRedactionOpenedAt';
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
  pageCount = 1,
}: {
  openedAt: Date;
  pageCount?: number;
}): Promise<RedactionInstance> {
  const redaction = await FakeData.makeDBRedaction({ openedAt, pageCount });
  await Promise.all([
    putRedactionFile(
      Buffer.from(`original-${redaction.key}`),
      'application/pdf',
      redaction.key
    ),
    ...Array.from({ length: pageCount }, (_unused, index) => {
      const page = index + 1;
      return putRedactionImage(
        Buffer.from(`page-${redaction.key}-${page}`),
        'image/jpeg',
        { key: redaction.key, page }
      );
    }),
  ]);
  return redaction;
}

async function expectObjectsReadable(
  key: string,
  pageCount: number
): Promise<void> {
  await expect(getRedactionFile(key)).resolves.toBeInstanceOf(Buffer);
  await Promise.all(
    Array.from({ length: pageCount }, async (_unused, index) => {
      const page = index + 1;
      await expect(getRedactionImage({ key, page })).resolves.toBeInstanceOf(
        Buffer
      );
    })
  );
}

async function expectObjectsMissing(
  key: string,
  pageCount: number
): Promise<void> {
  await expect(getRedactionFile(key)).rejects.toMatchObject({
    name: 'NotFound',
  });
  await Promise.all(
    Array.from({ length: pageCount }, async (_unused, index) => {
      const page = index + 1;
      await expect(getRedactionImage({ key, page })).rejects.toMatchObject({
        name: 'NotFound',
      });
    })
  );
}

async function findRedactionByKey(key: string) {
  return (await Redaction.findOne({
    where: { key },
    attributes: ['id'],
  })) as PartialInstance<RedactionAttributes, 'id'> | null;
}

describe(deleteOldRedactions, () => {
  describe('a stale three-page redaction', () => {
    let redactionKey: string;

    beforeAll(async () => {
      await Redaction.truncate();
      const redaction = await seedRedaction({
        openedAt: hoursAgo(staleHours),
        pageCount: 3,
      });
      redactionKey = redaction.key;
    });

    afterAll(async () => {
      await Redaction.truncate();
    });

    it('dry-run checks the row and leaves objects in place', async () => {
      const result = await deleteOldRedactions({
        olderThanMs,
        makeChanges: false,
      });

      expect(result).toEqual({ checked: 1, deleted: 0 });
      expect(await findRedactionByKey(redactionKey)).not.toBeNull();
      await expectObjectsReadable(redactionKey, 3);
    });

    it('makeChanges deletes the original, every page image, and the row', async () => {
      const result = await deleteOldRedactions({
        olderThanMs,
        makeChanges: true,
      });

      expect(result).toEqual({ checked: 1, deleted: 1 });
      expect(await findRedactionByKey(redactionKey)).toBeNull();
      await expectObjectsMissing(redactionKey, 3);
    });
  });

  describe('a fresh redaction', () => {
    let redactionKey: string;

    beforeAll(async () => {
      await Redaction.truncate();
      const redaction = await seedRedaction({
        openedAt: hoursAgo(freshHours),
      });
      redactionKey = redaction.key;
    });

    afterAll(async () => {
      await Redaction.truncate();
    });

    it('is not selected even with makeChanges', async () => {
      const result = await deleteOldRedactions({
        olderThanMs,
        makeChanges: true,
      });

      expect(result).toEqual({ checked: 0, deleted: 0 });
      expect(await findRedactionByKey(redactionKey)).not.toBeNull();
      await expectObjectsReadable(redactionKey, 1);
    });
  });

  describe('more than 100 stale rows', () => {
    const staleRowCount = 101;
    let redactionKeys: string[];

    beforeAll(async () => {
      await Redaction.truncate();
      const openedAt = hoursAgo(staleHours);
      const redactions = await Promise.all(
        Array.from({ length: staleRowCount }, () => seedRedaction({ openedAt }))
      );
      redactionKeys = redactions.map((redaction) => redaction.key);
    }, 30000);

    afterAll(async () => {
      await Redaction.truncate();
    });

    it('visits every row once in dry-run', async () => {
      const result = await deleteOldRedactions({
        olderThanMs,
        makeChanges: false,
      });

      expect(result).toEqual({
        checked: staleRowCount,
        deleted: 0,
      });
      expect(await Redaction.count()).toBe(staleRowCount);
    });

    it('visits every row once when making changes', async () => {
      const result = await deleteOldRedactions({
        olderThanMs,
        makeChanges: true,
      });

      expect(result).toEqual({
        checked: staleRowCount,
        deleted: staleRowCount,
      });
      expect(await Redaction.count()).toBe(0);
      await promiseAllThrottled(
        redactionKeys.map((key) => async () => expectObjectsMissing(key, 1)),
        10
      );
    });
  });

  describe('an open-tab ping', () => {
    afterEach(async () => {
      await Redaction.truncate();
    });

    it('keeps a previously stale row from being selected', async () => {
      const redaction = await seedRedaction({
        openedAt: hoursAgo(staleHours),
      });
      await touchRedactionOpenedAt({ key: redaction.key });

      const result = await deleteOldRedactions({
        olderThanMs,
        makeChanges: true,
      });

      expect(result).toEqual({ checked: 0, deleted: 0 });
      expect(await findRedactionByKey(redaction.key)).not.toBeNull();
      await expectObjectsReadable(redaction.key, 1);
    });
  });
});
