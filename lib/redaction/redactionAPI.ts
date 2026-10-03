import type { PageSize } from '../pdf/pdfTypes';
import type { RedactionBoundingBox, RedactionStatus } from './redactionTypes';
import type { RedactionBoundingBoxMutation } from './redactionBoundingBoxMutation';

/** The key and page count needed to open the redaction page after upload. */
export interface UploadFileForRedactionResponse {
  key: string;
  pageCount: number;
}

/** Fields shared by every browser-safe redaction response. */
interface GetRedactionResponseCommon {
  pageCount: number;
  createdAt: string;
}

/**
 * Response while processing is still running or after it failed.
 * Boxes are omitted so the review UI cannot render a half-built list.
 */
export interface GenericGetRedactionResponse extends GetRedactionResponseCommon {
  status: RedactionStatus.redacting | RedactionStatus.error;
}

/** Response after page images and redaction suggestions are available. */
export interface RedactedGetRedactionResponse extends GetRedactionResponseCommon {
  status: RedactionStatus.redacted;
  pageSizes: PageSize[];
  redactionBoundingBoxes: RedactionBoundingBox[];
}

/**
 * Browser-safe polling payload. Incomplete and failed jobs share
 * `GenericGetRedactionResponse`; only a finished job includes page image
 * sizes.
 */
export type GetRedactionResponse =
  GenericGetRedactionResponse | RedactedGetRedactionResponse;

/** Public URL key used to address one redaction document. */
export interface MutateRedactionBoundingBoxesPathParams {
  key: string;
}

/**
 * Box edits to apply in order. Kept off the path so the client can send a
 * list, not one query parameter per field.
 */
export interface MutateRedactionBoundingBoxesBody {
  mutations: RedactionBoundingBoxMutation[];
}
