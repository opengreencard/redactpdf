import type {
  GetRedactionResponse,
  RedactionBoundingBox,
} from '../../../../../lib/models/redactionTypes';
import {
  findRedactionBoundingBoxIndexOrThrowApplicationError,
  loadRedactionForBoundingBoxMutation,
  saveRedactionBoundingBoxes,
} from './mutateRedactionBoundingBoxes';
import type { LocateRedactionBoundingBoxRequest } from './deleteRedactionBoundingBox';

/**
 * Flip `enabled` without changing the box identity. Hidden boxes stay in
 * the JSON so the user can undo.
 */
export async function toggleRedactionBoundingBox({
  key,
  page,
  box,
  type,
}: LocateRedactionBoundingBoxRequest): Promise<GetRedactionResponse> {
  const redaction = await loadRedactionForBoundingBoxMutation({
    key,
    page,
    box,
  });
  const index = findRedactionBoundingBoxIndexOrThrowApplicationError({
    boxes: redaction.redactionBoundingBoxes,
    page,
    box,
    type,
  });
  return saveRedactionBoundingBoxes({
    key,
    redaction,
    redactionBoundingBoxes: redaction.redactionBoundingBoxes.map(
      (existing, existingIndex): RedactionBoundingBox =>
        existingIndex === index
          ? { ...existing, enabled: !existing.enabled }
          : existing
    ),
  });
}
