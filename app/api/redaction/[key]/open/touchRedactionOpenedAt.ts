import { ApplicationError } from '../../../../../lib/errors/applicationError';
import Redaction from '../../../../../lib/models/Redaction';

/** Which redaction the open review tab is pinging. */
export interface TouchRedactionOpenedAtRequest {
  key: string;
}

/**
 * Record that a browser tab still has this redaction open.
 *
 * Call this on mount and about once a minute while the tab is open, so
 * cleanup doesn't treat an active review as idle.
 *
 * Keep in sync with the `60 * 1000` interval in `RedactionPage`.
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
