import '../../lib/allDatabaseModels';
import '../../lib/models/Associations';
import { runRedactionBackgroundWorker } from './redactionBackgroundWorker.lib';

async function main(): Promise<void> {
  try {
    const controller = new AbortController();
    process.once('SIGTERM', () => controller.abort());
    process.once('SIGINT', () => controller.abort());

    await runRedactionBackgroundWorker({ signal: controller.signal });
  } catch (error: unknown) {
    // Worker failures need operational diagnostics.
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  }
}

// eslint-disable-next-line no-void
void main();
