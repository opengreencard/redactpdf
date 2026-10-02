import type { UploadFileForRedactionResponse } from '../../../app/api/redaction/uploadFileForRedaction';
import type {
  BoundingBox,
  GetRedactionResponse,
  RedactionBoundingBox,
} from '../../../lib/models/redactionTypes';
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

/**
 * Client input for drawing a manual redaction box. We don't send `type` —
 * the server always creates a `manual` box.
 *
 * Keep in sync with `AddRedactionBoundingBoxRequest` in
 * `app/api/redaction/[key]/redacted/addRedactionBoundingBox.ts`.
 */
interface AddRedactionBoundingBoxClientRequest {
  key: string;
  page: number;
  box: BoundingBox;
}

/** POST one newly drawn box. The server always stores it as `manual`. */
export const addRedactionBoundingBoxClient = makeClientAPIRouteWithBody<
  Omit<AddRedactionBoundingBoxClientRequest, 'key'>,
  { key: string },
  GetRedactionResponse
>({
  method: 'POST',
  dataToUrlQueryStringAndBody: ({
    key,
    page,
    box,
  }): ClientAPIRouteWithBodyData<
    Omit<AddRedactionBoundingBoxClientRequest, 'key'>
  > => ({
    url: `/api/redaction/${key}/redacted`,
    body: { page, box },
  }),
});

/**
 * Identity of an existing box. Delete and toggle both look up this way.
 *
 * Keep in sync with `LocateRedactionBoundingBoxRequest` in
 * `app/api/redaction/[key]/redacted/deleteRedactionBoundingBox.ts`.
 */
interface LocateRedactionBoundingBoxClientRequest {
  key: string;
  page: number;
  box: BoundingBox;
  type: RedactionBoundingBox['type'];
}

/** DELETE with a JSON body so we can send `{ page, box, type }`. */
export const deleteRedactionBoundingBoxClient = makeClientAPIRouteWithBody<
  Omit<LocateRedactionBoundingBoxClientRequest, 'key'>,
  { key: string },
  GetRedactionResponse
>({
  method: 'DELETE',
  dataToUrlQueryStringAndBody: ({
    key,
    page,
    box,
    type,
  }): ClientAPIRouteWithBodyData<
    Omit<LocateRedactionBoundingBoxClientRequest, 'key'>
  > => ({
    url: `/api/redaction/${key}/redacted`,
    body: { page, box, type },
  }),
});

/** PATCH `enabled` on one box. Identity matches delete. */
export const toggleRedactionBoundingBoxClient = makeClientAPIRouteWithBody<
  Omit<LocateRedactionBoundingBoxClientRequest, 'key'>,
  { key: string },
  GetRedactionResponse
>({
  method: 'PATCH',
  dataToUrlQueryStringAndBody: ({
    key,
    page,
    box,
    type,
  }): ClientAPIRouteWithBodyData<
    Omit<LocateRedactionBoundingBoxClientRequest, 'key'>
  > => ({
    url: `/api/redaction/${key}/redacted`,
    body: { page, box, type },
  }),
});
