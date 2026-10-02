import '../../lib/allDatabaseModels';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  _deleteOldRedactionHours,
  deleteOldRedactions,
} from './deleteOldRedactions.lib';

const defaultOlderThanMs = _deleteOldRedactionHours * 60 * 60 * 1000;

const { makeChanges, olderThanMs } = yargs(hideBin(process.argv))
  .command(
    '$0',
    `Hourly cleanup: delete redaction originals, page images, and DB rows
whose openedAt is older than the configured threshold.

Run with --makeChanges to actually delete. Without it, the script performs a
dry run and logs the Spaces keys it would remove.

Example:
  yarn swc-node scripts/cron/deleteOldRedactions.ts
  yarn swc-node scripts/cron/deleteOldRedactions.ts --makeChanges`
  )
  .option('makeChanges', {
    type: 'boolean',
    default: false,
    description: 'Actually delete files and rows; default is a dry run.',
  })
  .option('olderThanMs', {
    type: 'number',
    default: defaultOlderThanMs,
    description:
      'Only consider redactions whose openedAt is older than this many milliseconds.',
  })
  .strict()
  .parseSync();

async function main(): Promise<void> {
  try {
    const result = await deleteOldRedactions({
      olderThanMs,
      makeChanges,
    });

    console.info(
      `${result.checked} redactions checked, ${result.deleted} deleted (makeChanges=${makeChanges})`
    );
  } catch (error: unknown) {
    // Operational CLI failure; keep the process non-zero.
    // eslint-disable-next-line no-console -- CLI failures need stderr
    console.error(error);
    process.exitCode = 1;
  }
}

// CLI entry: this file is executed, not imported.
// eslint-disable-next-line no-void
void main();
