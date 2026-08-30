import { PDFDocument } from '@cantoo/pdf-lib';
import { fromBuffer } from 'pdf2pic';
import sharp from 'sharp';
import { PageSize } from '../models/redactionTypes';
import { promiseAllThrottled } from '../utilities/promiseAllThrottled';

/** One rasterized PDF page and its image pixel size. */
export interface PDFPagePNG {
  png: Uint8Array;
  pageSize: PageSize;
}

/** One page delivered by the bounded PDF rasterization pipeline. */
export interface PDFPageImage extends PDFPagePNG {
  page: number;
}

/**
 * Rasterize and process PDF pages in bounded batches.
 *
 * `pdf2pic.bulk(-1)` retains every page buffer until the complete conversion
 * finishes. This callback-based pipeline instead renders 24 pages, processes
 * them with four concurrent workers, waits for the batch to finish, and only
 * then renders the next 24. For a 100-page document, at most 24 resized PNGs
 * are retained rather than all 100 pages.
 */
export async function processPDFPagesInBatches(
  pdf: Uint8Array,
  onPage: (image: PDFPageImage) => Promise<void>
): Promise<void> {
  const document = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const pages = document.getPages();
  if (pages.length === 0) {
    return;
  }

  // pdf2pic needs an explicit canvas size; pages can differ, so rasterize onto
  // a shared 2048×2048 canvas and resize each page to its own 72 DPI size.
  const converter = fromBuffer(Buffer.from(pdf), {
    preserveAspectRatio: true,
    width: rasterSize,
    height: rasterSize,
    format: 'png',
    density: targetDPI,
  });

  for (
    let batchStart = 0;
    batchStart < pages.length;
    batchStart += pdfPageProcessingBatchSize
  ) {
    const pageNumbers = Array.from(
      {
        length: Math.min(pdfPageProcessingBatchSize, pages.length - batchStart),
      },
      (_, batchIndex) => batchStart + batchIndex + 1
    );
    // pdf2pic returns results in the same order as the requested page numbers.
    // The batch is small so all rasterized buffers can be released together
    // before the next bulk conversion starts.
    // eslint-disable-next-line no-await-in-loop
    const results = await converter.bulk(pageNumbers, {
      responseType: 'buffer',
    });
    // Await the batch before rasterizing another one to bound retained buffers.
    // eslint-disable-next-line no-await-in-loop -- sequential batches provide the memory bound
    await promiseAllThrottled(
      results.map((result, resultIndex) => async (): Promise<void> => {
        const pageNumber = pageNumbers[resultIndex];
        const { width, height } = pages[pageNumber - 1].getSize();
        const pageSize: PageSize = {
          width: Math.round((width * targetDPI) / 72),
          height: Math.round((height * targetDPI) / 72),
        };
        const png = await sharp(result.buffer)
          .resize(pageSize.width, pageSize.height, { fit: 'fill' })
          .png()
          .toBuffer();
        await onPage({ page: pageNumber, png, pageSize });
      }),
      pdfPageBatchSize
    );
  }
}

/** Convert a PDF into one uncompressed PNG per page. */
export async function pdfToPNGs(pdf: Uint8Array): Promise<PDFPagePNG[]> {
  const results: PDFPagePNG[] = [];
  await processPDFPagesInBatches(pdf, async ({ page, png, pageSize }) => {
    results[page - 1] = { png, pageSize };
  });
  return results;
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

/** Keep rasterized buffers bounded before downstream processing releases them. */
const pdfPageBatchSize = 4;

/** Keep enough pages queued for the workers without retaining the whole PDF. */
const pdfPageProcessingBatchSize = 3 * pdfPageBatchSize;
