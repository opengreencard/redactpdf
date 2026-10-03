import '../../lib/allDatabaseModels';
import '../../lib/models/Associations';
import { runRedactionBackgroundWorker } from './redactionBackgroundWorker.lib';

async function main(): Promise<void> {
  try {
    // Kubernetes sends SIGTERM on shutdown. Abort the wait so we don't
    // sit on the hourly timer until the pod is killed.
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

// This file is executed, not imported.
// eslint-disable-next-line no-void
void main();
