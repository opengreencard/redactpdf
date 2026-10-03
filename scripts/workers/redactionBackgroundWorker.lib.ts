import {
  _deleteOldRedactionHours,
  deleteOldRedactions,
} from '../cron/deleteOldRedactions.lib';

const defaultIntervalMs = 60 * 60 * 1000;
const olderThanMs = _deleteOldRedactionHours * 60 * 60 * 1000;

/**
 * Run redaction cleanup until the worker receives an abort signal.
 *
 * The first cleanup runs immediately so a newly started pod does useful work
 * without waiting an hour. Shutdown interrupts the timer, which lets
 * Kubernetes terminate the pod promptly.
 */
export async function runRedactionBackgroundWorker({
  signal,
  intervalMs = defaultIntervalMs,
}: {
  signal: AbortSignal;
  intervalMs?: number;
}): Promise<void> {
  while (!signal.aborted) {
    // Each cleanup must finish before the worker starts its next interval.
    // eslint-disable-next-line no-await-in-loop
    await deleteOldRedactions({ olderThanMs, makeChanges: true });
    if (signal.aborted) return;
    // eslint-disable-next-line no-await-in-loop
    await waitForNextRun(signal, intervalMs);
  }
}

function waitForNextRun(
  signal: AbortSignal,
  intervalMs: number
): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const finish = (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      signal.removeEventListener('abort', finish);
      resolve();
    };

    timeoutId = setTimeout(finish, intervalMs);
    if (signal.aborted) {
      finish();
    } else {
      signal.addEventListener('abort', finish, { once: true });
    }
  });
}
