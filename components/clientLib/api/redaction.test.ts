import axios, { AxiosError, AxiosResponse } from 'axios';
import { uploadFileForRedactionClient } from './redaction';

// Only the default axios call is replaced. `isAxiosError` and `AxiosError`
// stay real so the error handling sees a genuine Axios error.
jest.mock('axios', () => {
  const actual = jest.requireActual<typeof import('axios')>('axios');
  return {
    ...actual,
    __esModule: true,
    default: Object.assign(jest.fn(), {
      isAxiosError: actual.isAxiosError,
    }),
  };
});

describe(uploadFileForRedactionClient, () => {
  it('names the PDF size limit when nginx returns its HTML 413 page', async () => {
    jest.mocked(axios).mockRejectedValueOnce(
      new AxiosError(
        'Request failed',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          status: 413,
          data: '<html><body>413 Request Entity Too Large</body></html>',
        } as AxiosResponse
      )
    );
    const file = new File(['%PDF-1.4 test'], 'big.pdf', {
      type: 'application/pdf',
    });

    await expect(uploadFileForRedactionClient({ file })).rejects.toThrow(
      'The PDF is too large. Please upload a file smaller than 50 MiB.'
    );
  });
});
