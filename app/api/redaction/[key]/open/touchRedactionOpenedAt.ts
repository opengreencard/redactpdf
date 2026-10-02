import { ApplicationError } from '../../../../../lib/errors/applicationError';
import Redaction from '../../../../../lib/models/Redaction';

/** Parameters used to refresh a redaction document's last-opened time. */
export interface TouchRedactionOpenedAtRequest {
  key: string;
}

/**
 * Record that a browser tab still has this redaction open.
 *
 * Cleanup deletes documents one hour after the last ping, so the review page
 * calls this on mount and about once a minute while the tab stays open.
 */
export async function touchRedactionOpenedAt({
  key,
}: TouchRedactionOpenedAtRequest): Promise<Record<string, never>> {
  const [affectedCount] = await Redaction.update(
    { openedAt: new Date() },
    { where: { key } }
  );

  if (affectedCount === 0) {
    throw new ApplicationError('We could not find this redaction.', 404);
  }

  const response: Record<string, never> = {};
  return response;
}
