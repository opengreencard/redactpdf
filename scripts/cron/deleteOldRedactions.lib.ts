import { Op } from 'sequelize';
import { PartialInstance } from '../../lib/db/types';
import Redaction, { RedactionAttributes } from '../../lib/models/Redaction';
import { S3Bucket } from '../../lib/storage/buckets';
import { makeRedactionImageStorageKey } from '../../lib/storage/redactionImageKey';
import { getStorageKeyForRedactionFile } from '../../lib/storage/storageFunctions/redactionFile';
import { deleteObjects } from '../../lib/storage/storageAPI';
import { promiseAllThrottled } from '../../lib/utilities/promiseAllThrottled';

/**
 * How long a document can sit with no open review tab before we delete it.
 * Upload counts as the first "open", so files nobody ever reviews still
 * expire. FAQ, privacy, and terms say "about an hour" to match this.
 *
 * Keep in sync with `openedAt` on `RedactionAttributes` in
 * `lib/models/Redaction.ts`.
 */
export const _deleteOldRedactionHours = 1;

interface DeleteOldRedactionsOptions {
  /** How idle a row must be before we consider it. */
  olderThanMs: number;
  /** True when we should delete files and rows; false is a dry run. */
  makeChanges: boolean;
}

interface DeleteOldRedactionsResult {
  /** Rows whose openedAt was past the cutoff, including dry-run. */
  checked: number;
  /** Rows we actually destroyed. Stays 0 on a dry run. */
  deleted: number;
}

/**
 * Delete originals, page images, and DB rows that nobody has had open for
 * `olderThanMs`.
 *
 * We page with an `(openedAt, id)` keyset instead of OFFSET:
 * - Dry-run has to visit every stale row once
 * - OFFSET would keep returning the same first page, because we aren't
 *   deleting those rows
 *
 * Spaces deletes go through batched `deleteObjects`.
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

// How many stale rows we handle per query. Small enough that a failed
// Spaces delete only leaves a limited batch for the next hourly retry.
// Keep in sync with `staleRowCount` in deleteOldRedactions.lib.test.ts.
const batchSize = 100;

// S3 DeleteObjects accepts at most 1000 keys.
// https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjects.html
const maxKeysPerDelete = 1000;

// Last `(openedAt, id)` we already visited, so the next page starts after it.
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

// Enough to delete Spaces objects and walk the keyset. We skip heavy
// columns like bounding boxes.
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

/**
 * One keyset page: optionally delete, then continue after the last row.
 *
 * If Spaces delete fails, we leave the DB rows in place so the next hourly
 * run retries them. We still continue this run so one bad batch doesn't
 * block later rows.
 */
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
      // Cap concurrent row deletes so we don't stampede the DB.
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

  const lastRow = rows[rows.length - 1];
  const nextCursor: OpenedAtIdCursor = {
    openedAt: lastRow.openedAt,
    id: lastRow.id,
  };
  return deleteOldRedactionsRecursive({
    cutoffDate,
    makeChanges,
    cursor: nextCursor,
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
            // `(openedAt, id) > cursor`. Sequelize can't compare tuples, so
            // we expand it: a later openedAt, or the same openedAt with a
            // higher id. That way we never revisit a row we already saw.
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
