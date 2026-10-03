import { Cron } from 'croner';
import { deleteOldRedactions } from '../cron/deleteOldRedactions.lib';
import { runRedactionBackgroundWorker } from './redactionBackgroundWorker.lib';

jest.mock('croner', () => ({
  Cron: jest.fn(() => ({ stop: jest.fn() })),
}));

jest.mock('../cron/deleteOldRedactions.lib', () => ({
  deleteOldRedactions: jest.fn(),
  _deleteOldRedactionHours: 1,
}));

const CronMock = Cron as jest.MockedClass<typeof Cron>;
const deleteOldRedactionsMock = deleteOldRedactions as jest.MockedFunction<
  typeof deleteOldRedactions
>;

describe(runRedactionBackgroundWorker, () => {
  it('schedules hourly cleanup and stops on abort', async () => {
    deleteOldRedactionsMock.mockResolvedValue({ checked: 0, deleted: 0 });
    const controller = new AbortController();
    const workerPromise = runRedactionBackgroundWorker({
      signal: controller.signal,
    });

    expect(CronMock).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
    const callback = CronMock.mock.calls[0][1] as () => Promise<void>;
    await callback();
    expect(deleteOldRedactionsMock).toHaveBeenCalledWith({
      olderThanMs: 60 * 60 * 1000,
      makeChanges: true,
    });

    const job = CronMock.mock.results[0].value as { stop: jest.Mock };
    controller.abort();
    await workerPromise;
    expect(job.stop).toHaveBeenCalled();
  });
});
