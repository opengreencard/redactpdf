import { ApplicationError } from '../../../../lib/errors/applicationError';
import type {
  GenericGetRedactionResponse,
  GetRedactionResponse,
  RedactedGetRedactionResponse,
} from '../../../../lib/redaction/redactionAPI';
import { RedactionStatus } from '../../../../lib/redaction/redactionTypes';
import { getUnreachableError } from '../../../../lib/typescript/getUnreachableError';
import { findRedactionByKeyOrError } from '../lib/findRedactionByKeyOrError';

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
