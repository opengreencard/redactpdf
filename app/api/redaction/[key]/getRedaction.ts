import { ApplicationError } from '../../../../lib/errors/applicationError';
import Redaction, {
  RedactionAttributes,
} from '../../../../lib/models/Redaction';
import { PartialInstance } from '../../../../lib/db/types';
import {
  GenericGetRedactionResponse,
  GetRedactionResponse,
  RedactedGetRedactionResponse,
  RedactionStatus,
} from '../../../../lib/models/redactionTypes';
import { getUnreachableError } from '../../../../lib/typescript/getUnreachableError';

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
  const redaction = (await Redaction.findOne({
    where: { key },
    attributes: [
      'status',
      'pageCount',
      'pageSizes',
      'redactionBoundingBoxes',
      'createdAt',
    ],
  })) as PartialInstance<
    RedactionAttributes,
    | 'status'
    | 'pageCount'
    | 'pageSizes'
    | 'redactionBoundingBoxes'
    | 'createdAt'
  > | null;

  if (!redaction) {
    throw new ApplicationError('We could not find this redaction.', 404);
  }

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
