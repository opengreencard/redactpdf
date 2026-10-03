import { Op } from 'sequelize';
import { PartialInstance } from '../../lib/db/types';
import Redaction, { RedactionAttributes } from '../../lib/models/Redaction';
import type { RedactionImageKeyOptions } from '../../lib/storage/redactionImageKey';
import { bulkDeleteRedactionImage } from '../../lib/storage/storageFunctions/redactionImage';
import { bulkDeleteRedactionFile } from '../../lib/storage/storageFunctions/redactionFile';

/**
 * How long a document can sit with no open review tab before we delete it.
 * Upload counts as the first "open", so files nobody ever reviews still
 * expire.
 *
 * Keep in sync with the "about an hour" copy in:
 * - LandingPageInner FAQ
 * - PrivacyPolicyPage
 * - TermsOfUsePage
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
 * We page with an `(openedAt, id)` keyset instead of OFFSET. Dry-run has to
 * visit every stale row once, because it doesn't delete rows.
 *
 * Spaces deletes use one bulk request for PDFs and one for page images per
 * batch, split into the 1,000-key limit accepted by S3.
 */
export async function deleteOldRedactions({
  olderThanMs,
  makeChanges,
}: DeleteOldRedactionsOptions): Promise<DeleteOldRedactionsResult> {
  const cutoffDate = new Date(Date.now() - olderThanMs);
  const counts: DeleteOldRedactionsResult = { checked: 0, deleted: 0 };
  let cursor: OpenedAtIdCursor | null = null;
  let rows: StaleRedaction[] = [];

  do {
    // The cursor must advance only after this page has been fetched.
    // eslint-disable-next-line no-await-in-loop
    rows = await fetchStaleRedactionBatch({ cutoffDate, cursor });
    if (rows.length === 0) break;

    counts.checked += rows.length;
    console.info(
      `${makeChanges ? 'Deleting' : 'Would delete'} ${rows.length} redactions`
    );

    if (makeChanges) {
      try {
        // Keep storage and database deletion ordered so failed storage cleanup
        // leaves the row available for the next hourly retry.
        // eslint-disable-next-line no-await-in-loop
        await deleteStorageForRedactions(rows);
        // Destroy only after Spaces cleanup succeeded.
        // eslint-disable-next-line no-await-in-loop
        await Redaction.destroy({ where: { id: rows.map((row) => row.id) } });
        counts.deleted += rows.length;
      } catch (error) {
        // Leave failed rows in the database so the next hourly pass retries
        // their storage and database cleanup.
        console.info(
          'Skipping DB destroy for this batch after a cleanup failure',
          error
        );
      }
    }

    const lastRow = rows[rows.length - 1];
    cursor = {
      openedAt: lastRow.openedAt,
      id: lastRow.id,
    };
  } while (rows.length > 0);

  return counts;
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
            // `(openedAt, id) < cursor` in descending order. Sequelize can't
            // compare tuples, so expand the comparison to keep both sort keys.
            [Op.or]: [
              { openedAt: { [Op.lt]: cursor.openedAt } },
              {
                openedAt: cursor.openedAt,
                id: { [Op.lt]: cursor.id },
              },
            ],
          }
        : {}),
      openedAt: { [Op.lt]: cutoffDate },
    },
    order: [
      ['openedAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: batchSize,
  })) as StaleRedaction[];
}

// Page images aren't listed on the row. We rebuild those Spaces keys
// from pageCount so a stale 3-page upload still loses all three JPEGs.
async function deleteStorageForRedactions(
  rows: StaleRedaction[]
): Promise<void> {
  await deleteInChunks(
    rows.map((row) => row.key),
    bulkDeleteRedactionFile
  );

  await deleteInChunks(
    rows.flatMap((row) =>
      Array.from(
        { length: row.pageCount },
        (_unused, index): RedactionImageKeyOptions => ({
          key: row.key,
          page: index + 1,
        })
      )
    ),
    bulkDeleteRedactionImage
  );
}

async function deleteInChunks<KeyT>(
  keys: KeyT[],
  deleteKeys: (keys: KeyT[]) => Promise<unknown>
): Promise<void> {
  for (let i = 0; i < keys.length; i += maxKeysPerDelete) {
    // Keep requests sequential so a failed chunk leaves a bounded retry set.
    // eslint-disable-next-line no-await-in-loop
    await deleteKeys(keys.slice(i, i + maxKeysPerDelete));
  }
}
