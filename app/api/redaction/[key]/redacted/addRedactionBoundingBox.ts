import type {
  BoundingBox,
  GetRedactionResponse,
  ManualRedactionBoundingBox,
} from '../../../../../lib/models/redactionTypes';
import {
  loadRedactionForBoundingBoxMutation,
  saveRedactionBoundingBoxes,
} from './mutateRedactionBoundingBoxes';

/**
 * Callers don't send `type` — we always create a `manual` box.
 *
 * Keep in sync with `AddRedactionBoundingBoxClientRequest` in
 * `components/clientLib/api/redaction.ts`.
 */
export interface AddRedactionBoundingBoxRequest {
  key: string;
  page: number;
  box: BoundingBox;
}

/**
 * Draw a new box on a finished redaction. We always set `enabled: true` so
 * it shows up on the review page right away.
 */
export async function addRedactionBoundingBox({
  key,
  page,
  box,
}: AddRedactionBoundingBoxRequest): Promise<GetRedactionResponse> {
  const redaction = await loadRedactionForBoundingBoxMutation({
    key,
    page,
    box,
  });
  const manualBox: ManualRedactionBoundingBox = {
    type: 'manual',
    page,
    box,
    enabled: true,
  };
  return saveRedactionBoundingBoxes({
    key,
    redaction,
    redactionBoundingBoxes: [...redaction.redactionBoundingBoxes, manualBox],
  });
}
