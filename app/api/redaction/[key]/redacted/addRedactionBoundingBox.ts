import type {
  BoundingBox,
  GetRedactionResponse,
  ManualRedactionBoundingBox,
} from '../../../../../lib/models/redactionTypes';
import {
  loadRedactionForBoundingBoxMutation,
  saveRedactionBoundingBoxes,
} from './mutateRedactionBoundingBoxes';

/** Draw one manual box onto a finished redaction. */
export interface AddRedactionBoundingBoxRequest {
  key: string;
  page: number;
  box: BoundingBox;
}

/** Append a manual box and return the updated review payload. */
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
