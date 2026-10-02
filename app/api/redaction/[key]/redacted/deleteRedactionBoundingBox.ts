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

/**
 * Identity of an existing box. Delete and toggle both look up this way.
 *
 * Keep in sync with `LocateRedactionBoundingBoxClientRequest` in
 * `components/clientLib/api/redaction.ts`.
 */
export interface LocateRedactionBoundingBoxRequest {
  key: string;
  page: number;
  box: BoundingBox;
  type: RedactionBoundingBox['type'];
}

/**
 * Remove a box from the document. Toggle hides; this actually drops the
 * row so it won't come back on refresh.
 */
export async function deleteRedactionBoundingBox({
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
    redactionBoundingBoxes: redaction.redactionBoundingBoxes.filter(
      (_existing, existingIndex) => existingIndex !== index
    ),
  });
}
