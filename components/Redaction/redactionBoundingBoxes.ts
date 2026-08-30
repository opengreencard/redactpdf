import { getUnreachableError } from '../../lib/typescript/getUnreachableError';
import type {
  BoundingBox,
  ManualRedactionBoundingBox,
  RedactedGetRedactionResponse,
  RedactionBoundingBox,
} from '../../lib/models/redactionTypes';

/** Append newly drawn boxes to the current GET payload. */
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
 * Flip `enabled` on matching boxes in an array.
 * For example, toggling `[boxB]` in `[boxA, boxB]` changes only `boxB`.
 */
export function toggleBoundingBoxesInArray(
  current: RedactionBoundingBox[],
  boxes: RedactionBoundingBox[]
): RedactionBoundingBox[] {
  return current.map((existing): RedactionBoundingBox =>
    boxes.some((box) => isSameRedactionBoundingBox(existing, box))
      ? { ...existing, enabled: !existing.enabled }
      : existing
  );
}

/** Drop matching boxes from the current GET payload. */
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

/** Flip `enabled` on matching boxes in the current GET payload. */
export function toggleBoundingBoxesInResponse(
  current: RedactedGetRedactionResponse,
  boxes: RedactionBoundingBox[]
): RedactedGetRedactionResponse {
  const next: RedactedGetRedactionResponse = {
    ...current,
    redactionBoundingBoxes: toggleBoundingBoxesInArray(
      current.redactionBoundingBoxes,
      boxes
    ),
  };
  return next;
}

/** User-visible label for a suggestion row or preview highlight. */
export function getRedactionBoxLabel(box: RedactionBoundingBox): string {
  switch (box.type) {
    case 'automatic':
      return box.text;
    case 'manual':
      return 'Drawn region';
    default:
      throw getUnreachableError(box);
  }
}

function isSameRedactionBoundingBox(
  left: RedactionBoundingBox,
  right: RedactionBoundingBox
): boolean {
  return (
    left.type === right.type &&
    left.page === right.page &&
    areBoundingBoxesEqual(left.box, right.box)
  );
}

function areBoundingBoxesEqual(left: BoundingBox, right: BoundingBox): boolean {
  return (
    left.minX === right.minX &&
    left.minY === right.minY &&
    left.maxX === right.maxX &&
    left.maxY === right.maxY
  );
}
