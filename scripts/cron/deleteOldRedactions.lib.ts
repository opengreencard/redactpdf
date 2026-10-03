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

// S3 DeleteObjects accepts at most 1000 keys. We also fetch this many rows
// per page so one PDF bulk-delete covers the batch.
// https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjects.html
const defaultPageSize = 1000;

/**
 * Delete originals, page images, and DB rows that nobody has had open for
 * `olderThanMs`.
 *
 * We page with an `(openedAt, id)` keyset instead of OFFSET so dry-run can
 * visit every stale row once.
 */
export async function deleteOldRedactions({
  olderThanMs,
  makeChanges,
  pageSizeForTesting,
}: {
  olderThanMs: number;
  makeChanges: boolean;
  /** Override the 1000-row page size. Pass only from tests. */
  pageSizeForTesting?: number;
}): Promise<{ checked: number; deleted: number }> {
  const cutoffDate = new Date(Date.now() - olderThanMs);
  const pageSize = pageSizeForTesting ?? defaultPageSize;
  const counts: { checked: number; deleted: number } = {
    checked: 0,
    deleted: 0,
  };
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

    counts.checked += rows.length;
    console.info(
      `${makeChanges ? 'Deleting' : 'Would delete'} ${rows.length} redactions`
    );

    if (makeChanges) {
      // eslint-disable-next-line no-await-in-loop -- Spaces before DB rows
      await deleteStorageForRedactions(rows);
      // eslint-disable-next-line no-await-in-loop
      await Redaction.destroy({ where: { id: rows.map((row) => row.id) } });
      counts.deleted += rows.length;
    }

    const lastRow = rows[rows.length - 1];
    cursor = { openedAt: lastRow.openedAt, id: lastRow.id };
  }

  return counts;
}

async function deleteStorageForRedactions(
  rows: PartialInstance<
    RedactionAttributes,
    'id' | 'key' | 'pageCount' | 'openedAt'
  >[]
): Promise<void> {
  await bulkDeleteRedactionFile(rows.map((row) => row.key));

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
    await bulkDeleteRedactionImage(imageKeys.slice(i, i + defaultPageSize));
  }
}
