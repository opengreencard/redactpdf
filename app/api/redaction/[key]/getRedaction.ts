import { ApplicationError } from '../../../../lib/errors/applicationError';
import Redaction, {
  RedactionAttributes,
} from '../../../../lib/models/Redaction';
import { PartialInstance } from '../../../../lib/db/types';
import { GetRedactionResponse } from '../../../../lib/models/redactionTypes';

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
    attributes: ['status', 'pageCount', 'redactionBoundingBoxes', 'createdAt'],
  })) as PartialInstance<
    RedactionAttributes,
    'status' | 'pageCount' | 'redactionBoundingBoxes' | 'createdAt'
  > | null;

  if (!redaction) {
    throw new ApplicationError('We could not find this redaction.', 404);
  }

  const response: GetRedactionResponse = {
    status: redaction.status,
    pageCount: redaction.pageCount,
    redactionBoundingBoxes: redaction.redactionBoundingBoxes,
    createdAt: redaction.createdAt.toISOString(),
  };
  return response;
}
