import type { UploadFileForRedactionResponse } from '../../../app/api/redaction/uploadFileForRedaction';
import type {
  GetRedactionResponse,
  ManualRedactionBoundingBox,
  RedactionBoundingBox,
} from '../../../lib/models/redactionTypes';
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

/** Client input for downloading the finished redacted PDF. */
export interface GenerateRedactedPDFClientRequest {
  key: string;
}

/**
 * Download the redacted PDF.
 * Shim until task 2.16: succeeds without triggering a browser download.
 */
export async function generateRedactedPDFClient(
  _request: GenerateRedactedPDFClientRequest
): Promise<void> {
  // Task 2.16 replaces this with the arraybuffer download helper.
}

/** Client input for drawing a manual redaction box. */
export interface AddRedactionBoundingBoxClientRequest {
  key: string;
  boxes: ManualRedactionBoundingBox[];
}

/**
 * Persist a newly drawn box.
 * Shim until task 2.15: the page keeps its optimistic boxes on success.
 */
export async function addRedactionBoundingBoxClient(
  _request: AddRedactionBoundingBoxClientRequest
): Promise<void> {
  // Task 2.15 replaces this with POST /api/redaction/:key/redacted.
}

/** Client input for removing a redaction box. */
export interface DeleteRedactionBoundingBoxClientRequest {
  key: string;
  boxes: RedactionBoundingBox[];
}

/**
 * Persist a box deletion.
 * Shim until task 2.15: the page keeps its optimistic boxes on success.
 */
export async function deleteRedactionBoundingBoxClient(
  _request: DeleteRedactionBoundingBoxClientRequest
): Promise<void> {
  // Task 2.15 replaces this with DELETE /api/redaction/:key/redacted.
}

/** Client input for toggling a box's enabled flag. */
export interface ToggleRedactionBoundingBoxClientRequest {
  key: string;
  boxes: RedactionBoundingBox[];
}

/**
 * Persist an enabled/hidden toggle.
 * Shim until task 2.15: the page keeps its optimistic boxes on success.
 */
export async function toggleRedactionBoundingBoxClient(
  _request: ToggleRedactionBoundingBoxClientRequest
): Promise<void> {
  // Task 2.15 replaces this with PATCH /api/redaction/:key/redacted.
}
