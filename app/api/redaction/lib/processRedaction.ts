import { RedactionInstance } from '../../../../lib/models/Redaction';

/**
 * Placeholder for the asynchronous PDF processing pipeline.
 *
 * Task 2.4 replaces this no-op with page rasterization, image storage, and
 * vision-model detection. Keeping it asynchronous lets uploads return before
 * that work completes.
 */
export async function processRedaction(
  _redaction: RedactionInstance,
  _buffer: Buffer
): Promise<void> {
  return undefined;
}
