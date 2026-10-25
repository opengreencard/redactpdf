import axios, { AxiosError, AxiosResponse } from 'axios';
import { makeClientAPIRouteWithoutBody } from './common';

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

describe(makeClientAPIRouteWithoutBody, () => {
  it('explains the size limit when nginx returns its HTML 413 page', async () => {
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
    const getFile = makeClientAPIRouteWithoutBody<{}, {}>({
      method: 'GET',
      dataToUrlAndQueryString: () => ({ url: '/api/example' }),
    });

    await expect(getFile({})).rejects.toThrow(
      'The file is too large to upload. Please upload a PDF smaller than 50 MiB.'
    );
  });
});
