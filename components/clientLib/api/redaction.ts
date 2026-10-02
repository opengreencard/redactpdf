import type { UploadFileForRedactionResponse } from '../../../app/api/redaction/uploadFileForRedaction';
import type { GetRedactionResponse } from '../../../lib/models/redactionTypes';
import type {
  MutateRedactionBoundingBoxesBody,
  MutateRedactionBoundingBoxesPathParams,
  MutateRedactionBoundingBoxesRequest,
} from '../../../app/api/redaction/[key]/redacted/mutateRedactionBoundingBoxes';
import {
  ClientAPIRouteWithBodyData,
  ClientAPIRouteWithoutBodyData,
  makeClientAPIRouteWithBody,
  makeClientAPIRouteWithoutBody,
} from './common';

/** Client input for uploading one PDF for redaction. */
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

/** Fetch the current state of one redaction document. */
export const getRedactionClient = makeClientAPIRouteWithoutBody<
  { key: string },
  GetRedactionResponse
>({
  method: 'GET',
  dataToUrlAndQueryString: ({ key }): ClientAPIRouteWithoutBodyData => ({
    url: `/api/redaction/${key}`,
  }),
});

/** Client input for downloading the finished redacted PDF. */
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

export type MutateRedactionBoundingBoxesClientRequest =
  MutateRedactionBoundingBoxesRequest;

/**
 * POST add / delete / setEnabled in one body. `key` is the path; the rest
 * is JSON so we can send a list of mutations.
 */
export const mutateRedactionBoundingBoxesClient = makeClientAPIRouteWithBody<
  MutateRedactionBoundingBoxesBody,
  MutateRedactionBoundingBoxesPathParams,
  GetRedactionResponse
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
