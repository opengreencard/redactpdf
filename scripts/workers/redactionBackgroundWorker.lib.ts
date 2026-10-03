import { Cron } from 'croner';
import {
  _deleteOldRedactionHours,
  deleteOldRedactions,
} from '../cron/deleteOldRedactions.lib';

const hourlyCronExpression = '0 * * * *';
const olderThanMs = _deleteOldRedactionHours * 60 * 60 * 1000;

/**
 * Run redaction cleanup on the hour until the worker is asked to stop.
 */
export async function runRedactionBackgroundWorker({
  signal,
}: {
  signal: AbortSignal;
}): Promise<void> {
  const job = new Cron(hourlyCronExpression, async () => {
    await deleteOldRedactions({ olderThanMs, makeChanges: true });
  });

  await new Promise<void>((resolve) => {
    const stop = (): void => {
      job.stop();
      resolve();
    };
    if (signal.aborted) {
      stop();
    } else {
      signal.addEventListener('abort', stop, { once: true });
    }
  });
}
