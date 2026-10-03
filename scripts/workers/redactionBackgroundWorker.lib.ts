import { Cron } from 'croner';
import { deleteOldRedactions } from '../../lib/redaction/deleteOldRedactions';

// Every 15 minutes so idle files are gone closer to one hour, not up to
// two (one hour idle, then up to another hour until the next tick).
const cleanupCronExpression = '*/15 * * * *';

/**
 * Run redaction cleanup every 15 minutes until the worker is asked to stop.
 */
export async function runRedactionBackgroundWorker({
  signal,
}: {
  signal: AbortSignal;
}): Promise<void> {
  const job = new Cron(cleanupCronExpression, async () => {
    await deleteOldRedactions();
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
