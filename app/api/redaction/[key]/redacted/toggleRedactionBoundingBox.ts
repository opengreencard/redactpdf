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

export type ToggleRedactionBoundingBoxRequest =
  LocateRedactionBoundingBoxRequest;

/** Flip `enabled` on one box and return the updated review payload. */
export async function toggleRedactionBoundingBox({
  key,
  page,
  box,
  type,
}: ToggleRedactionBoundingBoxRequest): Promise<GetRedactionResponse> {
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
