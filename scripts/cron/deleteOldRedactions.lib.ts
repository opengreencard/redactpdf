import { Op } from 'sequelize';
import { PartialInstance } from '../../lib/db/types';
import Redaction, { RedactionAttributes } from '../../lib/models/Redaction';
import { S3Bucket } from '../../lib/storage/buckets';
import { makeRedactionImageStorageKey } from '../../lib/storage/redactionImageKey';
import { getStorageKeyForRedactionFile } from '../../lib/storage/storageFunctions/redactionFile';
import { deleteObjects } from '../../lib/storage/storageAPI';
import { promiseAllThrottled } from '../../lib/utilities/promiseAllThrottled';

/** Idle TTL in hours. Tests age rows with ±0.01 around this value. */
export const _deleteOldRedactionHours = 1;

/** Options for one cleanup pass. */
export interface DeleteOldRedactionsOptions {
  olderThanMs: number;
  makeChanges: boolean;
}

/** How many stale rows we inspected and how many we actually deleted. */
export interface DeleteOldRedactionsResult {
  checked: number;
  deleted: number;
}

/**
 * Delete redaction originals, page images, and DB rows that have not been
 * opened for `olderThanMs`.
 *
 * Uses an ascending `(openedAt, id)` keyset so dry-run can walk every stale
 * row once. Spaces deletes go through batched `deleteObjects`.
 */
export async function deleteOldRedactions({
  olderThanMs,
  makeChanges,
}: DeleteOldRedactionsOptions): Promise<DeleteOldRedactionsResult> {
  const cutoffDate = new Date(Date.now() - olderThanMs);
  const counts: DeleteOldRedactionsResult = { checked: 0, deleted: 0 };
  return deleteOldRedactionsRecursive({
    cutoffDate,
    makeChanges,
    cursor: null,
    counts,
  });
}

const batchSize = 100;

// S3 DeleteObjects accepts at most 1000 keys.
// https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjects.html
const maxKeysPerDelete = 1000;

interface OpenedAtIdCursor {
  openedAt: Date;
  id: number;
}

interface DeleteOldRedactionsRecursiveOptions {
  cutoffDate: Date;
  makeChanges: boolean;
  cursor: OpenedAtIdCursor | null;
  counts: DeleteOldRedactionsResult;
}

const staleRedactionAttributes = [
  'id',
  'key',
  'pageCount',
  'openedAt',
] as const;

type StaleRedaction = PartialInstance<
  RedactionAttributes,
  (typeof staleRedactionAttributes)[number]
>;

async function deleteOldRedactionsRecursive({
  cutoffDate,
  makeChanges,
  cursor,
  counts,
}: DeleteOldRedactionsRecursiveOptions): Promise<DeleteOldRedactionsResult> {
  const rows = await fetchStaleRedactionBatch({ cutoffDate, cursor });
  if (rows.length === 0) {
    return counts;
  }

  const keys = storageKeysForRedactions(rows);
  console.info(
    `${makeChanges ? 'Deleting' : 'Would delete'} ${rows.length} redactions`,
    keys
  );

  const nextCounts: DeleteOldRedactionsResult = {
    checked: counts.checked + rows.length,
    deleted: counts.deleted,
  };

  if (makeChanges) {
    try {
      await deleteStorageKeys(keys);
      await promiseAllThrottled(
        rows.map((row) => async () => row.destroy()),
        10
      );
      nextCounts.deleted += rows.length;
    } catch (error) {
      // Skip destroy so the next hourly pass retries this batch. Recurse with
      // the cursor anyway so later rows in this run can still be cleaned.
      console.info(
        'Skipping DB destroy for this batch after a Spaces delete failed',
        error
      );
    }
  }

  return deleteOldRedactionsRecursive({
    cutoffDate,
    makeChanges,
    cursor: cursorFromLastRow(rows),
    counts: nextCounts,
  });
}

async function fetchStaleRedactionBatch({
  cutoffDate,
  cursor,
}: {
  cutoffDate: Date;
  cursor: OpenedAtIdCursor | null;
}): Promise<StaleRedaction[]> {
  return (await Redaction.findAll({
    attributes: [...staleRedactionAttributes],
    where: {
      ...(cursor
        ? {
            [Op.or]: [
              { openedAt: { [Op.gt]: cursor.openedAt } },
              {
                openedAt: cursor.openedAt,
                id: { [Op.gt]: cursor.id },
              },
            ],
          }
        : {}),
      openedAt: { [Op.lt]: cutoffDate },
    },
    order: [
      ['openedAt', 'ASC'],
      ['id', 'ASC'],
    ],
    limit: batchSize,
  })) as StaleRedaction[];
}

function storageKeysForRedactions(rows: StaleRedaction[]): string[] {
  return rows.flatMap((row) => {
    const imageKeys = Array.from(
      { length: row.pageCount },
      (_unused, index): string =>
        makeRedactionImageStorageKey({ key: row.key, page: index + 1 })
    );
    return [getStorageKeyForRedactionFile(row.key), ...imageKeys];
  });
}

async function deleteStorageKeys(keys: string[]): Promise<void> {
  const chunks: string[][] = [];
  for (let i = 0; i < keys.length; i += maxKeysPerDelete) {
    chunks.push(keys.slice(i, i + maxKeysPerDelete));
  }

  // One chunk at a time so a failed DeleteObjects call fails the whole batch
  // instead of racing other chunks.
  await promiseAllThrottled(
    chunks.map((chunk) => async () => {
      await deleteObjects(chunk, { bucket: S3Bucket.files });
    }),
    1
  );
}

function cursorFromLastRow(rows: StaleRedaction[]): OpenedAtIdCursor {
  const lastRow = rows[rows.length - 1];
  const cursor: OpenedAtIdCursor = {
    openedAt: lastRow.openedAt,
    id: lastRow.id,
  };
  return cursor;
}
