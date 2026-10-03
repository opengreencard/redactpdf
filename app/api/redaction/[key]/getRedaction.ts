import { ApplicationError } from '../../../../lib/errors/applicationError';
import type { PageSize } from '../../../../lib/pdf/pdfTypes';
import type { RedactionBoundingBox } from '../../../../lib/redaction/redactionTypes';
import { RedactionStatus } from '../../../../lib/redaction/redactionTypes';
import { getUnreachableError } from '../../../../lib/typescript/getUnreachableError';
import { findRedactionByKeyOrError } from '../lib/findRedactionByKeyOrError';

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

/** Parameters used to look up one redaction document. */
export interface GetRedactionRequest {
  key: string;
}

/**
 * Return the browser-safe state for a redaction document.
 *
 * The original PDF and working page images remain in storage and are
 * intentionally excluded from this polling response.
 */
export async function getRedaction({
  key,
}: GetRedactionRequest): Promise<GetRedactionResponse> {
  const redaction = await findRedactionByKeyOrError({
    key,
    attributes: [
      'status',
      'pageCount',
      'pageSizes',
      'redactionBoundingBoxes',
      'createdAt',
    ],
  });

  const commonResponse: Omit<GenericGetRedactionResponse, 'status'> = {
    pageCount: redaction.pageCount,
    createdAt: redaction.createdAt.toISOString(),
  };

  switch (redaction.status) {
    case RedactionStatus.redacting:
    case RedactionStatus.error: {
      const response: GenericGetRedactionResponse = {
        ...commonResponse,
        status: redaction.status,
      };
      return response;
    }
    case RedactionStatus.redacted: {
      if (redaction.pageSizes === null) {
        throw new ApplicationError(
          'The redaction is complete but page sizes are unavailable.'
        );
      }
      const response: RedactedGetRedactionResponse = {
        ...commonResponse,
        status: RedactionStatus.redacted,
        pageSizes: redaction.pageSizes,
        redactionBoundingBoxes: redaction.redactionBoundingBoxes,
      };
      return response;
    }
    default:
      throw getUnreachableError(redaction.status);
  }
}
