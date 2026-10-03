import { deleteOldRedactions } from '../../lib/redaction/deleteOldRedactions';
import { runRedactionBackgroundWorker } from './redactionBackgroundWorker.lib';

jest.mock('../../lib/redaction/deleteOldRedactions', () => ({
  deleteOldRedactions: jest.fn(),
}));

const deleteOldRedactionsMock = deleteOldRedactions as jest.MockedFunction<
  typeof deleteOldRedactions
>;

describe(runRedactionBackgroundWorker, () => {
  beforeEach(() => {
    deleteOldRedactionsMock.mockReset();
    deleteOldRedactionsMock.mockResolvedValue({ deleted: 0 });
  });

  it('runs cleanup on startup when runImmediately is true', async () => {
    const controller = new AbortController();
    deleteOldRedactionsMock.mockImplementation(async () => {
      controller.abort();
      const result: { deleted: number } = { deleted: 0 };
      return result;
    });

    await runRedactionBackgroundWorker({
      signal: controller.signal,
      runImmediately: true,
    });

    expect(deleteOldRedactionsMock).toHaveBeenCalledTimes(1);
  });

  it('does not run cleanup on startup when runImmediately is false', async () => {
    const controller = new AbortController();
    controller.abort();

    await runRedactionBackgroundWorker({
      signal: controller.signal,
      runImmediately: false,
    });

    expect(deleteOldRedactionsMock).not.toHaveBeenCalled();
  });
});
