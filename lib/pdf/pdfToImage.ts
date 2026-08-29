import { PDFDocument } from '@cantoo/pdf-lib';
import { fromBuffer } from 'pdf2pic';
import sharp from 'sharp';
import { PageSize } from '../models/redactionTypes';
import { promiseAllThrottled } from '../utilities/promiseAllThrottled';

/** One rasterized PDF page and its image pixel size. */
interface PDFPagePNG {
  png: Uint8Array;
  pageSize: PageSize;
}

/** Convert a PDF into one uncompressed PNG per page. */
export async function pdfToPNGs(pdf: Uint8Array): Promise<PDFPagePNG[]> {
  const document = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const pages = document.getPages();
  if (pages.length === 0) {
    return [];
  }

  // pdf2pic needs an explicit canvas size; pages can differ, so rasterize onto
  // a shared 2048×2048 canvas and resize each page to its own 72 DPI size.
  const results = await fromBuffer(Buffer.from(pdf), {
    preserveAspectRatio: true,
    width: rasterSize,
    height: rasterSize,
    format: 'png',
    density: targetDPI,
  }).bulk(-1, { responseType: 'buffer' });

  return promiseAllThrottled(
    results.map((result, pageIndex) => async (): Promise<PDFPagePNG> => {
      const { width, height } = pages[pageIndex].getSize();
      const pageSize: PageSize = {
        width: Math.round((width * targetDPI) / 72),
        height: Math.round((height * targetDPI) / 72),
      };
      const png = await sharp(result.buffer)
        .resize(pageSize.width, pageSize.height, { fit: 'fill' })
        .png()
        .toBuffer();
      return { png, pageSize };
    }),
    4
  );
}

/** Compress a rasterized page PNG into a JPEG for storage and vision. */
export async function compressImage(
  pngBuffer: Uint8Array
): Promise<Uint8Array> {
  return sharp(pngBuffer)
    .jpeg({ quality: jpegQuality, progressive: false })
    .toBuffer();
}

/** Shared pdf2pic canvas so mixed page sizes still rasterize. */
const rasterSize = 2048;

/** Target DPI for PDF to image conversion. 72 DPI is 1 PDF point per pixel. */
const targetDPI = 72;

/** JPEG quality setting (0-100, lower = smaller file size) */
const jpegQuality = 85;
