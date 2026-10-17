import type { Response } from 'express';
import { ApplicationError } from '../lib/errors/applicationError';

/**
 * Send an error as JSON. Expected errors (`ApplicationError`) keep their
 * status. Body-parser errors, such as a too-large body, carry their own
 * `status`. Anything else is a 500.
 */
export function sendError(res: Response, err: Error): void {
  const status =
    err instanceof ApplicationError
      ? err.statusCode
      : ((err as Error & { status?: number }).status ?? 500);
  if (status >= 500) {
    // eslint-disable-next-line no-console -- renderer failures need operational diagnostics
    console.error('PDF renderer request failed.', err);
  }
  res.status(status).json({ success: false, error: err.message });
}
