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
export interface UploadFileForRedactionClientRequest {
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

/** Client input for drawing a manual redaction box. */
export interface AddRedactionBoundingBoxClientRequest {
  key: string;
  page: number;
  box: BoundingBox;
}

/** Persist a newly drawn box. */
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

/** Identity of an existing box. Delete and toggle both look up this way. */
export interface LocateRedactionBoundingBoxClientRequest {
  key: string;
  page: number;
  box: BoundingBox;
  type: RedactionBoundingBox['type'];
}

export type DeleteRedactionBoundingBoxClientRequest =
  LocateRedactionBoundingBoxClientRequest;

/** Persist a box deletion. */
export const deleteRedactionBoundingBoxClient = makeClientAPIRouteWithBody<
  Omit<DeleteRedactionBoundingBoxClientRequest, 'key'>,
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
    Omit<DeleteRedactionBoundingBoxClientRequest, 'key'>
  > => ({
    url: `/api/redaction/${key}/redacted`,
    body: { page, box, type },
  }),
});

export type ToggleRedactionBoundingBoxClientRequest =
  LocateRedactionBoundingBoxClientRequest;

/** Persist an enabled/hidden toggle. */
export const toggleRedactionBoundingBoxClient = makeClientAPIRouteWithBody<
  Omit<ToggleRedactionBoundingBoxClientRequest, 'key'>,
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
    Omit<ToggleRedactionBoundingBoxClientRequest, 'key'>
  > => ({
    url: `/api/redaction/${key}/redacted`,
    body: { page, box, type },
  }),
});
