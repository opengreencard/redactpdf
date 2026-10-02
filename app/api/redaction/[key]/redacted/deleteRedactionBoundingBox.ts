import type {
  BoundingBox,
  GetRedactionResponse,
  RedactionBoundingBox,
} from '../../../../../lib/models/redactionTypes';
import {
  findRedactionBoundingBoxIndexOrThrowApplicationError,
  loadRedactionForBoundingBoxMutation,
  saveRedactionBoundingBoxes,
} from './mutateRedactionBoundingBoxes';

/** Identity of an existing box. Delete and toggle both look up this way. */
export interface LocateRedactionBoundingBoxRequest {
  key: string;
  page: number;
  box: BoundingBox;
  type: RedactionBoundingBox['type'];
}

export type DeleteRedactionBoundingBoxRequest =
  LocateRedactionBoundingBoxRequest;

/** Remove one automatic or manual box and return the updated review payload. */
export async function deleteRedactionBoundingBox({
  key,
  page,
  box,
  type,
}: DeleteRedactionBoundingBoxRequest): Promise<GetRedactionResponse> {
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
    redactionBoundingBoxes: redaction.redactionBoundingBoxes.filter(
      (_existing, existingIndex) => existingIndex !== index
    ),
  });
}
