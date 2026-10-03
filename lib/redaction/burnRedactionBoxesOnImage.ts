import sharp from 'sharp';
import type { BoundingBox } from './redactionTypes';

/**
 * Paint filled black rectangles onto an image using the same 0–1 top-left
 * boxes we store on a redaction. A rasterized page with burned pixels
 * removes the covered bits instead of hiding them under a PDF rectangle.
 *
 * Keep in sync with `annotateJPEGWithRedactionBoxes`: same coordinate space,
 * but that helper draws red outlines for inspection instead of filling.
 */
export async function burnRedactionBoxesOnImage(
  image: Uint8Array,
  boxes: BoundingBox[]
): Promise<Uint8Array> {
  const imageProcessor = sharp(image);
  const metadata = await imageProcessor.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('The input image does not have image dimensions.');
  }

  const { width, height } = metadata;
  if (boxes.length === 0) {
    return imageProcessor.jpeg({ quality: 85, progressive: false }).toBuffer();
  }

  const rectangles = boxes
    .map((box): string => {
      const x = box.minX * width;
      const y = box.minY * height;
      const boxWidth = (box.maxX - box.minX) * width;
      const boxHeight = (box.maxY - box.minY) * height;
      return `<rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" fill="#000000"/>`;
    })
    .join('');
  const overlay: Buffer = Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${rectangles}</svg>`
  );

  return imageProcessor
    .composite([{ input: overlay }])
    .jpeg({ quality: 85, progressive: false })
    .toBuffer();
}
