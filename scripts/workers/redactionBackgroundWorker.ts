import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import '../../lib/allDatabaseModels';
import { runRedactionBackgroundWorker } from './redactionBackgroundWorker.lib';

const { runImmediately } = yargs(hideBin(process.argv))
  .scriptName('redaction-background-worker')
  .usage(
    '$0\n\nDelete idle redactions every 15 minutes. Pass --runImmediately to also delete on startup.'
  )
  .option('runImmediately', {
    type: 'boolean',
    default: false,
    describe:
      'Run the same cleanup function once now, then keep the 15-minute schedule',
  })
  .strict()
  .parseSync();

async function main(): Promise<void> {
  try {
    // Kubernetes sends SIGTERM on shutdown. Abort the wait so we don't
    // sit on the cleanup timer until the pod is killed.
    const controller = new AbortController();
    process.once('SIGTERM', () => controller.abort());
    process.once('SIGINT', () => controller.abort());

    await runRedactionBackgroundWorker({
      signal: controller.signal,
      runImmediately,
    });
  } catch (error) {
    // Worker failures need operational diagnostics.
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  }
}

// This file is executed, not imported.
// eslint-disable-next-line no-void
void main();
