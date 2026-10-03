import { Cron } from 'croner';
import { deleteOldRedactions } from '../../lib/redaction/deleteOldRedactions';

// Every 15 minutes so idle files are gone closer to one hour, not up to
// two (one hour idle, then up to another hour until the next tick).
const cleanupCronExpression = '*/15 * * * *';

/**
 * Run redaction cleanup every 15 minutes until the worker is asked to stop.
 *
 * Pass `runImmediately` so the same cleanup function also runs once on
 * startup. That is useful when we want to try a delete without waiting
 * for the next cron tick.
 */
export async function runRedactionBackgroundWorker({
  signal,
  runImmediately,
}: {
  signal: AbortSignal;
  runImmediately: boolean;
}): Promise<void> {
  const runCleanup = async (): Promise<void> => {
    await deleteOldRedactions();
  };

  const job = new Cron(
    cleanupCronExpression,
    {
      catch: (error) => {
        // Scheduled failures need an explicit handler so they don't become
        // unhandled rejections outside the worker's startup error boundary.
        // eslint-disable-next-line no-console -- report scheduled cleanup errors
        console.error(error);
      },
    },
    runCleanup
  );
  if (runImmediately) {
    await runCleanup();
  }

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
