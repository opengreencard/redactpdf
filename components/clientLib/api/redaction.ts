import type { UploadFileForRedactionResponse } from '../../../app/api/redaction/uploadFileForRedaction';
import { GetRedactionResponse } from '../../../lib/models/redactionTypes';
import {
  GETRouteData,
  makeClientGETRoute,
  makeClientPOSTRoute,
  POSTRouteData,
} from './common';

/** Client input for uploading one PDF for redaction. */
export interface UploadFileForRedactionClientRequest {
  file: File;
}

/** Upload a PDF and return the key for its redaction page. */
export const uploadFileForRedactionClient = makeClientPOSTRoute<
  UploadFileForRedactionClientRequest,
  {},
  UploadFileForRedactionResponse
>(({ file }): POSTRouteData<never> => {
  const formData = new FormData();
  formData.append('file', file);
  return { url: '/api/redaction', body: formData };
});

/** Fetch the current state of one redaction document. */
export const getRedactionClient = makeClientGETRoute<
  { key: string },
  GetRedactionResponse
>({
  dataToUrlAndQueryString: ({ key }): GETRouteData => ({
    url: `/api/redaction/${key}`,
  }),
});
