import { fromBuffer } from 'pdf2pic';
import sharp from 'sharp';
import { promiseAllThrottled } from '../utilities/promiseAllThrottled';

/** Convert a PDF into a series of images, one for each page in the PDF */
export async function pdfToJPEGs(pdf: Uint8Array): Promise<Uint8Array[]> {
  const results = await fromBuffer(Buffer.from(pdf), {
    preserveAspectRatio: true,
    // Despite specifying targetDPI, without specifying width/height the output
    // image has dimensions of 768x1086 by default
    width: 4096,
    height: 4096,
    format: 'png', // Start with PNG uncompressed so we don't double-compress
    density: targetDPI,
  }).bulk(-1, { responseType: 'buffer' });

  // Compress each image to reduce file size
  const compressedBuffers = await promiseAllThrottled(
    results.map((r) => async () => compressJPEG(r.buffer!)),
    4
  );

  return compressedBuffers;
}

/** Target DPI for PDF to image conversion (reduces file size vs higher DPI) */
const targetDPI = 300;

/** Maximum width for output images in pixels (8.5 inches at target DPI) */
const maxWidth = 8.5 * targetDPI;

/** Maximum height for output images in pixels (11 inches at target DPI) */
const maxHeight = 11 * targetDPI;

/** JPEG quality setting (0-100, lower = smaller file size) */
const jpegQuality = 85;

/**
 * Compress a JPEG buffer using sharp to reduce file size.
 * Resizes if dimensions exceed max and applies quality compression.
 */
async function compressJPEG(jpegBuffer: Uint8Array): Promise<Uint8Array> {
  const image = sharp(jpegBuffer);
  const metadata = await image.metadata();

  // Check if resizing is needed
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const needsResize = width > maxWidth || height > maxHeight;

  let ret = image;
  if (needsResize) {
    // Resize to fit within maxWidth/maxHeight while maintaining aspect ratio
    ret = ret.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  return ret.jpeg({ quality: jpegQuality, progressive: false }).toBuffer();
}
