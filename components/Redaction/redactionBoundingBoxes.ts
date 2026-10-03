import { getUnreachableError } from '../../lib/typescript/getUnreachableError';
import {
  RedactionBoundingBoxType,
  type ManualRedactionBoundingBox,
  type RedactedGetRedactionResponse,
  type RedactionBoundingBox,
} from '../../lib/models/redactionTypes';
import { isSameRedactionBoundingBox } from '../../lib/models/redactionBoundingBoxIdentity';

/**
 * Optimistic GET payload after the user draws a box, so the preview
 * updates before the POST returns.
 */
export function addBoundingBoxesToResponse(
  current: RedactedGetRedactionResponse,
  boxes: ManualRedactionBoundingBox[]
): RedactedGetRedactionResponse {
  const next: RedactedGetRedactionResponse = {
    ...current,
    redactionBoundingBoxes: [...current.redactionBoundingBoxes, ...boxes],
  };
  return next;
}

/**
 * Drop matching boxes from an array.
 * For example, removing `[boxB]` from `[boxA, boxB]` returns `[boxA]`.
 */
export function removeBoundingBoxesFromArray(
  current: RedactionBoundingBox[],
  boxes: RedactionBoundingBox[]
): RedactionBoundingBox[] {
  return current.filter(
    (existing) =>
      !boxes.some((box) => isSameRedactionBoundingBox(existing, box))
  );
}

/**
 * Write `enabled` on matching boxes in an array.
 * For example, disabling `[boxB]` in `[boxA, boxB]` changes only `boxB`.
 */
interface SetBoundingBoxesEnabledInArrayParams {
  current: RedactionBoundingBox[];
  boxes: RedactionBoundingBox[];
  enabled: boolean;
}

export function setBoundingBoxesEnabledInArray(
  params: SetBoundingBoxesEnabledInArrayParams
): RedactionBoundingBox[] {
  const { current, boxes, enabled } = params;
  return current.map((existing): RedactionBoundingBox =>
    boxes.some((box) => isSameRedactionBoundingBox(existing, box))
      ? { ...existing, enabled }
      : existing
  );
}

/**
 * Optimistic GET payload after a delete, so the list and preview drop
 * the box before the POST returns.
 */
export function removeBoundingBoxesFromResponse(
  current: RedactedGetRedactionResponse,
  boxes: RedactionBoundingBox[]
): RedactedGetRedactionResponse {
  const next: RedactedGetRedactionResponse = {
    ...current,
    redactionBoundingBoxes: removeBoundingBoxesFromArray(
      current.redactionBoundingBoxes,
      boxes
    ),
  };
  return next;
}

/**
 * Optimistic GET payload after a hide/show, so the overlay updates
 * before the POST returns.
 */
interface SetBoundingBoxesEnabledInResponseParams {
  current: RedactedGetRedactionResponse;
  boxes: RedactionBoundingBox[];
  enabled: boolean;
}

export function setBoundingBoxesEnabledInResponse(
  params: SetBoundingBoxesEnabledInResponseParams
): RedactedGetRedactionResponse {
  const { current, boxes, enabled } = params;
  const next: RedactedGetRedactionResponse = {
    ...current,
    redactionBoundingBoxes: setBoundingBoxesEnabledInArray({
      current: current.redactionBoundingBoxes,
      boxes,
      enabled,
    }),
  };
  return next;
}

/** User-visible label for a suggestion row or preview highlight. */
export function getRedactionBoxLabel(box: RedactionBoundingBox): string {
  switch (box.type) {
    case RedactionBoundingBoxType.automatic:
      return box.text;
    case RedactionBoundingBoxType.manual:
      return 'Drawn region';
    default:
      throw getUnreachableError(box);
  }
}
