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
  /** Override in tests so we don't wait a real hour. */
  intervalMs?: number;
}): Promise<void> {
  while (!signal.aborted) {
    // Each cleanup must finish before the worker starts its next interval.
    // eslint-disable-next-line no-await-in-loop
    await deleteOldRedactions({ olderThanMs, makeChanges: true });
    if (signal.aborted) return;
    // Wait here so the loop doesn't spin and start another cleanup.
    // eslint-disable-next-line no-await-in-loop
    await waitForNextRun(signal, intervalMs);
  }
}

/**
 * Sleep until the next tick, or until shutdown asks us to stop.
 *
 * Abort and the timer can fire at the same time, so we resolve only once.
 */
function waitForNextRun(
  signal: AbortSignal,
  intervalMs: number
): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const finish = (): void => {
      // Timeout and SIGTERM can race; only resolve the waiter once.
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      signal.removeEventListener('abort', finish);
      resolve();
    };

    timeoutId = setTimeout(finish, intervalMs);
    // Abort can arrive between the while-check and now. Finish immediately
    // so we don't wait the full interval after shutdown.
    if (signal.aborted) {
      finish();
    } else {
      signal.addEventListener('abort', finish, { once: true });
    }
  });
}
