import sharp from 'sharp';
import type { AutoRedactionBoundingBox } from '../models/redactionTypes';

/** Automatic box plus the numeric ID shown in inspection annotations. */
export interface RedactionBoxToAnnotate extends Omit<
  AutoRedactionBoundingBox,
  'page'
> {
  id: number;
}

/**
 * Draw red outlines around normalized automatic redaction boxes.
 *
 * The returned JPEG preserves the input dimensions and is intended for manual
 * inspection, not as the final redacted document. For example, a box with
 * `{ minX: 0.1, minY: 0.2, maxX: 0.3, maxY: 0.4 }` is drawn from 10% to 30%
 * of the image width and 20% to 40% of its height.
 */
export async function annotateJPEGWithRedactionBoxes(
  image: Uint8Array,
  boxes: RedactionBoxToAnnotate[]
): Promise<Uint8Array> {
  const imageProcessor = sharp(image);
  const metadata = await imageProcessor.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('The input JPEG does not have image dimensions.');
  }

  const { width, height } = metadata;
  const strokeWidth = Math.max(3, Math.round(Math.min(width, height) / 250));
  const rectangles = boxes
    .map(({ box, id }): string => {
      const x = box.minX * width;
      const y = box.minY * height;
      const boxWidth = (box.maxX - box.minX) * width;
      const boxHeight = (box.maxY - box.minY) * height;
      const fontSize = Math.min(36, Math.max(12, boxHeight * 0.75));
      const textStrokeWidth = Math.max(2, Math.round(fontSize / 8));
      return `<rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" fill="none" stroke="#ff0000" stroke-width="${strokeWidth}"/><text x="${x + 2}" y="${y + fontSize}" fill="#ffff00" stroke="#000000" stroke-width="${textStrokeWidth}" paint-order="stroke" font-family="sans-serif" font-size="${fontSize}" font-weight="bold">${id}</text>`;
    })
    .join('');
  const overlay: Buffer = Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${rectangles}</svg>`
  );

  const annotatedJPEG: Buffer = await imageProcessor
    .composite([{ input: overlay }])
    .jpeg()
    .toBuffer();
  return annotatedJPEG;
}
