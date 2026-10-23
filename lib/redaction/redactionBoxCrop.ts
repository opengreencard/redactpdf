import type { BoxCoordinates } from '@typesafe-ai/sdk';
import type { BoundingBox } from './redactionTypes';

/**
 * A pixel rectangle on the page preview to crop one region from, plus the size
 * of the image sent to Box.
 */
export interface CropWindow {
  left: number;
  top: number;
  width: number;
  height: number;
  /**
   * Size of the image sent to Box. Equal to the window size unless it was
   * scaled up to the Box minimum. Very wide windows are scaled per side, which
   * changes their shape.
   */
  outputWidth: number;
  outputHeight: number;
}

/** Smallest side the Box API accepts for an image, in pixels. */
export const minCropSidePx = 280;

/** Largest side the Box API accepts for an image, in pixels. */
export const maxCropSidePx = 1568;

/**
 * Padding added on each side, as a fraction of the approximate box's size.
 * 0.25 is enough context for Jev in practice, based on the test runs.
 */
const paddingFraction = 0.25;

/**
 * Pick the crop around an approximate box on a page preview.
 *
 * Each side is padded by the same fraction of its own length, so the crop keeps
 * the box's shape. The image sent to Box is scaled so both sides are at least
 * `minCropSidePx`:
 * - Usually one factor on both sides, which keeps the shape.
 * - If that would exceed `maxCropSidePx` (very wide boxes), each side is scaled
 *   only as much as it needs, which stretches the crop.
 * Shifts the crop back inside the page when it hits an edge.
 * Returns null when the image is still larger than `maxCropSidePx`, so callers
 * can keep the approximate box.
 *
 * `paddingScale` multiplies the padding. Use 2 to retry when the first crop
 * cuts off the target.
 */
export function getRedactionCropWindow({
  box,
  pageWidth,
  pageHeight,
  paddingScale,
}: {
  box: BoundingBox;
  pageWidth: number;
  pageHeight: number;
  paddingScale: number;
}): CropWindow | null {
  const x = getPaddedRange({
    start: box.minX * pageWidth,
    end: box.maxX * pageWidth,
    pageSize: pageWidth,
    paddingScale,
  });
  const y = getPaddedRange({
    start: box.minY * pageHeight,
    end: box.maxY * pageHeight,
    pageSize: pageHeight,
    paddingScale,
  });

  const width = x.end - x.start;
  const height = y.end - y.start;
  if (width <= 0 || height <= 0) return null;

  const uniformScale = Math.max(
    1,
    minCropSidePx / width,
    minCropSidePx / height
  );
  let outputWidth = Math.round(width * uniformScale);
  let outputHeight = Math.round(height * uniformScale);
  if (Math.max(outputWidth, outputHeight) > maxCropSidePx) {
    outputWidth = Math.round(width * Math.max(1, minCropSidePx / width));
    outputHeight = Math.round(height * Math.max(1, minCropSidePx / height));
  }
  if (Math.max(outputWidth, outputHeight) > maxCropSidePx) return null;

  return {
    left: x.start,
    top: y.start,
    width,
    height,
    outputWidth,
    outputHeight,
  };
}

/**
 * Convert the Box answer, which is relative to the crop, into normalized
 * coordinates for the whole page.
 */
export function mapCropBoxToPage({
  cropBox,
  window,
  pageWidth,
  pageHeight,
}: {
  cropBox: BoxCoordinates;
  window: CropWindow;
  pageWidth: number;
  pageHeight: number;
}): BoundingBox {
  return {
    minX: (window.left + cropBox.left * window.width) / pageWidth,
    minY: (window.top + cropBox.top * window.height) / pageHeight,
    maxX: (window.left + cropBox.right * window.width) / pageWidth,
    maxY: (window.top + cropBox.bottom * window.height) / pageHeight,
  };
}

/**
 * Whether a Box touches a crop edge. If it does, the target may continue past
 * the crop, so the caller should retry with more padding.
 */
export function isCropBoxTouchingEdge(cropBox: BoxCoordinates): boolean {
  const edgeToleranceFraction = 0.02;
  return (
    cropBox.left < edgeToleranceFraction ||
    cropBox.top < edgeToleranceFraction ||
    cropBox.right > 1 - edgeToleranceFraction ||
    cropBox.bottom > 1 - edgeToleranceFraction
  );
}

/**
 * Pad one axis of a box, then keep the range inside the page. Shifts the range
 * back inside the page when it would cross an edge, so its length is kept.
 */
function getPaddedRange({
  start,
  end,
  pageSize,
  paddingScale,
}: {
  start: number;
  end: number;
  pageSize: number;
  paddingScale: number;
}): { start: number; end: number } {
  const padding = (end - start) * paddingFraction * paddingScale;
  let paddedStart = start - padding;
  let paddedEnd = end + padding;

  if (paddedStart < 0) {
    paddedEnd -= paddedStart;
    paddedStart = 0;
  }
  if (paddedEnd > pageSize) {
    paddedStart -= paddedEnd - pageSize;
    paddedEnd = pageSize;
  }

  const roundedStart = Math.max(0, Math.floor(paddedStart));
  const roundedEnd = Math.min(pageSize, Math.ceil(paddedEnd));
  return { start: roundedStart, end: roundedEnd };
}
