import type {
  GetRedactionResponse,
  UploadFileForRedactionResponse,
  MutateRedactionBoundingBoxesBody,
  MutateRedactionBoundingBoxesPathParams,
} from '../../../lib/redaction/redactionAPI';
import type {
  ClientAPIRouteWithBodyData,
  ClientAPIRouteWithoutBodyData,
} from './common';
import {
  makeClientAPIRouteWithBody,
  makeClientAPIRouteWithoutBody,
} from './common';

interface UploadFileForRedactionClientRequest {
  file: File;
}

/** Upload a PDF and return the key for its redaction page. */
export const uploadFileForRedactionClient = makeClientAPIRouteWithBody<
  UploadFileForRedactionClientRequest,
  {},
  UploadFileForRedactionResponse
>({
  method: 'POST',
  dataToUrlQueryStringAndBody: ({
    file,
  }): ClientAPIRouteWithBodyData<never> => {
    const formData = new FormData();
    formData.append('file', file);
    return { url: '/api/redaction', body: formData };
  },
});

/** Poll one document until processing finishes or fails. */
export const getRedactionClient = makeClientAPIRouteWithoutBody<
  { key: string },
  GetRedactionResponse
>({
  method: 'GET',
  dataToUrlAndQueryString: ({ key }): ClientAPIRouteWithoutBodyData => ({
    url: `/api/redaction/${key}`,
  }),
});

/** Public key for the generate route. The server loads boxes itself. */
export interface GenerateRedactedPDFClientRequest {
  key: string;
}

/** Fetch the finished redacted PDF as bytes for a caller to download. */
export const generateRedactedPDFClient = makeClientAPIRouteWithoutBody<
  GenerateRedactedPDFClientRequest,
  ArrayBuffer
>({
  method: 'GET',
  dataToUrlAndQueryString: ({ key }): ClientAPIRouteWithoutBodyData => ({
    url: `/api/redaction/${key}/generate`,
  }),
  responseType: 'arraybuffer',
});

/**
 * Persist a batch of box edits in one POST. A later failure can then roll
 * the optimistic UI back to the last saved boxes.
 */
export const mutateRedactionBoundingBoxesClient = makeClientAPIRouteWithBody<
  MutateRedactionBoundingBoxesBody,
  MutateRedactionBoundingBoxesPathParams,
  void
>({
  method: 'POST',
  dataToUrlQueryStringAndBody: ({
    key,
    mutations,
  }): ClientAPIRouteWithBodyData<MutateRedactionBoundingBoxesBody> => ({
    url: `/api/redaction/${key}/redacted`,
    body: { mutations },
  }),
});
