import { deleteOldRedactions } from '../cron/deleteOldRedactions.lib';
import { runRedactionBackgroundWorker } from './redactionBackgroundWorker.lib';

jest.mock('../cron/deleteOldRedactions.lib', () => ({
  deleteOldRedactions: jest.fn(),
  _deleteOldRedactionHours: 1,
}));

const deleteOldRedactionsMock = deleteOldRedactions as jest.MockedFunction<
  typeof deleteOldRedactions
>;

describe(runRedactionBackgroundWorker, () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    deleteOldRedactionsMock.mockClear();
    deleteOldRedactionsMock.mockResolvedValue({ checked: 0, deleted: 0 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs cleanup immediately and again after the interval', async () => {
    const controller = new AbortController();
    const workerPromise = runRedactionBackgroundWorker({
      signal: controller.signal,
      intervalMs: 1000,
    });

    await Promise.resolve();
    expect(deleteOldRedactionsMock).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1000);
    expect(deleteOldRedactionsMock).toHaveBeenCalledTimes(2);

    controller.abort();
    await workerPromise;
  });

  it('stops waiting when aborted', async () => {
    const controller = new AbortController();
    const workerPromise = runRedactionBackgroundWorker({
      signal: controller.signal,
      intervalMs: 1000,
    });

    await Promise.resolve();
    controller.abort();
    await workerPromise;

    expect(deleteOldRedactionsMock).toHaveBeenCalledTimes(1);
  });
});
