import { Op } from 'sequelize';
import { PartialInstance } from '../db/types';
import Redaction, { RedactionAttributes } from '../models/Redaction';
import type { RedactionImageKeyOptions } from '../storage/redactionImageKey';
import { bulkDeleteRedactionImage } from '../storage/storageFunctions/redactionImage';
import { bulkDeleteRedactionFile } from '../storage/storageFunctions/redactionFile';
import { _deleteOldRedactionHours } from './deleteOldRedactionHours';

// S3 DeleteObjects accepts at most 1000 keys. We also fetch this many rows
// per page so one PDF bulk-delete covers the batch.
// https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjects.html
const defaultPageSize = 1000;

/**
 * Delete originals, page images, and DB rows that nobody has had open for
 * `_deleteOldRedactionHours`.
 *
 * The redaction background worker calls this every 15 minutes. This is not
 * a standalone cron script.
 *
 * We page with an `(openedAt, id)` keyset instead of OFFSET so large
 * batches stay cheap.
 */
export async function deleteOldRedactions({
  pageSizeForTesting,
}: {
  /** Override the 1000-row page size. Pass only from tests. */
  pageSizeForTesting?: number;
} = {}): Promise<{ deleted: number }> {
  const cutoffDate = new Date(
    Date.now() - _deleteOldRedactionHours * 60 * 60 * 1000
  );
  const pageSize = pageSizeForTesting ?? defaultPageSize;
  let deleted = 0;
  let cursor: { openedAt: Date; id: number } | null = null;

  // Each page advances the keyset cursor; we stop when a fetch is empty.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop -- each page needs the last row
    const rows = (await Redaction.findAll({
      attributes: ['id', 'key', 'pageCount', 'openedAt'],
      where: {
        ...(cursor
          ? {
              // `(openedAt, id) < cursor`. Sequelize can't compare tuples.
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
      limit: pageSize,
    })) as PartialInstance<
      RedactionAttributes,
      'id' | 'key' | 'pageCount' | 'openedAt'
    >[];
    if (rows.length === 0) break;

    console.info(`Deleting ${rows.length} redactions`);

    // Delete Spaces objects first. If we deleted DB rows first and Spaces
    // failed, we'd have files we no longer know about. If Spaces succeeds
    // and destroy fails, the next pass sees the same rows and retries.
    // Deleting a missing Spaces key is fine.
    // eslint-disable-next-line no-await-in-loop -- Spaces before DB rows
    await deleteStorageForRedactions(rows);
    // eslint-disable-next-line no-await-in-loop -- keyset page must finish first
    await Redaction.destroy({ where: { id: rows.map((row) => row.id) } });
    deleted += rows.length;

    const lastRow = rows[rows.length - 1];
    cursor = { openedAt: lastRow.openedAt, id: lastRow.id };
  }

  return { deleted };
}

async function deleteStorageForRedactions(
  rows: PartialInstance<
    RedactionAttributes,
    'id' | 'key' | 'pageCount' | 'openedAt'
  >[]
): Promise<void> {
  const fileResult = await bulkDeleteRedactionFile(rows.map((row) => row.key));
  // DeleteObjects treats missing unversioned keys as successful deletions, so
  // only an explicit error means the row should be kept for a later retry.
  if (fileResult.Errors?.length) {
    throw new Error('Failed to delete redaction files');
  }

  const imageKeys = rows.flatMap((row) =>
    Array.from(
      { length: row.pageCount },
      (_unused, index): RedactionImageKeyOptions => ({
        key: row.key,
        page: index + 1,
      })
    )
  );
  for (let i = 0; i < imageKeys.length; i += defaultPageSize) {
    // eslint-disable-next-line no-await-in-loop -- stay under the 1000-key cap
    const imageResult = await bulkDeleteRedactionImage(
      imageKeys.slice(i, i + defaultPageSize)
    );
    if (imageResult.Errors?.length) {
      throw new Error('Failed to delete redaction images');
    }
  }
}
