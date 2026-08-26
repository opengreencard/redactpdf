import { getUnreachableError } from '../../lib/typescript/getUnreachableError';
import type {
  BoundingBox,
  GetRedactionResponse,
  ManualRedactionBoundingBox,
  RedactionBoundingBox,
} from '../../lib/models/redactionTypes';

/** Append a newly drawn box to the current GET payload. */
export function addBoundingBoxToResponse(
  current: GetRedactionResponse,
  box: ManualRedactionBoundingBox
): GetRedactionResponse {
  const next: GetRedactionResponse = {
    ...current,
    redactionBoundingBoxes: [...current.redactionBoundingBoxes, box],
  };
  return next;
}

/** Drop the matching box from the current GET payload. */
export function removeBoundingBoxFromResponse(
  current: GetRedactionResponse,
  box: RedactionBoundingBox
): GetRedactionResponse {
  const next: GetRedactionResponse = {
    ...current,
    redactionBoundingBoxes: current.redactionBoundingBoxes.filter(
      (existing) => !isSameRedactionBoundingBox(existing, box)
    ),
  };
  return next;
}

/** Flip `enabled` on the matching box in the current GET payload. */
export function toggleBoundingBoxInResponse(
  current: GetRedactionResponse,
  box: RedactionBoundingBox
): GetRedactionResponse {
  const next: GetRedactionResponse = {
    ...current,
    redactionBoundingBoxes: current.redactionBoundingBoxes.map(
      (existing): RedactionBoundingBox =>
        isSameRedactionBoundingBox(existing, box)
          ? { ...existing, enabled: !existing.enabled }
          : existing
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
