import type { BoundingBox, RedactionBoundingBox } from './redactionTypes';

/**
 * Match by type, page, and exact coordinates — not `enabled` or automatic
 * text. Toggling a box should still find the same one.
 *
 * Keep in sync with `LocateRedactionBoundingBoxRequest` in
 * `redactionBoundingBoxMutation.ts`.
 */
export function isSameRedactionBoundingBox(
  left: Pick<RedactionBoundingBox, 'type' | 'page' | 'box'>,
  right: Pick<RedactionBoundingBox, 'type' | 'page' | 'box'>
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
