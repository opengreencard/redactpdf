import { sortBy } from 'lodash';
import { fromBuffer } from 'pdf2pic';
import sharp from 'sharp';
import type { PageSize } from './pdfTypes';
import { promiseAllThrottled } from '../utilities/promiseAllThrottled';
import { getPDFPageSizes } from './getPDFPageSizes';

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
): Promise<{ rasterizationTimeMs: number }> {
  const pageSizes = await getPDFPageSizes(pdf);
  if (pageSizes.length === 0) {
    return { rasterizationTimeMs: 0 };
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
  let rasterizationTimeMs = 0;

  for (
    let batchStart = 0;
    batchStart < pageSizes.length;
    batchStart += pdfPageProcessingBatchSize
  ) {
    const pageNumbers = Array.from(
      {
        length: Math.min(
          pdfPageProcessingBatchSize,
          pageSizes.length - batchStart
        ),
      },
      (_, batchIndex) => batchStart + batchIndex + 1
    );
    // pdf2pic returns results in the same order as the requested page numbers.
    // The batch is small so all rasterized buffers can be released together
    // before the next bulk conversion starts.
    const rasterizationStartedAt = Date.now();
    // eslint-disable-next-line no-await-in-loop -- batches must rasterize sequentially to bound memory
    const results = await converter.bulk(pageNumbers, {
      responseType: 'buffer',
    });
    rasterizationTimeMs += Date.now() - rasterizationStartedAt;
    // Await the batch before rasterizing another one to bound retained buffers.
    // eslint-disable-next-line no-await-in-loop -- sequential batches provide the memory bound
    await promiseAllThrottled(
      results.map((result, resultIndex) => async (): Promise<void> => {
        const pageNumber = pageNumbers[resultIndex];
        const { width, height } = pageSizes[pageNumber - 1];
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

  return { rasterizationTimeMs };
}

/** Convert a PDF into one uncompressed PNG per page. */
export async function pdfToPNGs(pdf: Uint8Array): Promise<PDFPagePNG[]> {
  const results: PDFPagePNG[] = [];
  await processPDFPagesInBatches(pdf, async ({ page, png, pageSize }) => {
    results[page - 1] = { png, pageSize };
  });
  return results;
}

/**
 * Rasterize a subset of 1-indexed pages so we skip pages that do not need
 * a flattened image. `dpi` defaults to the vision pipeline's 72 DPI.
 */
export async function rasterizePDFPages(
  pdf: Uint8Array,
  options: { pageNumbers: number[]; dpi?: number }
): Promise<Map<number, PDFPagePNG>> {
  const { pageNumbers } = options;
  const rasters = new Map<number, PDFPagePNG>();
  const uniquePageNumbers = sortBy([...new Set(pageNumbers)]);
  if (uniquePageNumbers.length === 0) {
    return rasters;
  }

  const dpi = options.dpi ?? targetDPI;
  const pageSizes = await getPDFPageSizes(pdf);
  const requestedPageSizes = uniquePageNumbers.map(
    (pageNumber) => pageSizes[pageNumber - 1]
  );
  // Flatten at 300 DPI needs a canvas larger than the vision 2048 square.
  // Otherwise a letter page would be rasterized at 2048 and then upscaled.
  const canvasSize = getRasterCanvasSize(requestedPageSizes, dpi);
  const converter = fromBuffer(Buffer.from(pdf), {
    preserveAspectRatio: true,
    width: canvasSize,
    height: canvasSize,
    format: 'png',
    density: dpi,
  });
  for (
    let batchStart = 0;
    batchStart < uniquePageNumbers.length;
    batchStart += pdf2picBulkBatchSize
  ) {
    const batchPageNumbers = uniquePageNumbers.slice(
      batchStart,
      batchStart + pdf2picBulkBatchSize
    );
    // pdf2pic already converts up to 10 pages concurrently inside bulk().
    // Process one matching-sized batch at a time so completed buffers don't
    // accumulate for every flattened page.
    // eslint-disable-next-line no-await-in-loop -- sequential batches bound memory
    const results = await converter.bulk(batchPageNumbers, {
      responseType: 'buffer',
    });

    // Release each batch's raw buffers before asking pdf2pic to convert more
    // pages. The returned rasters still retain each processed PNG, but raw
    // pdf2pic buffers are limited to this batch.
    // eslint-disable-next-line no-await-in-loop -- finish this batch before the next
    await promiseAllThrottled(
      results.map((result, resultIndex) => async (): Promise<void> => {
        const pageNumber = batchPageNumbers[resultIndex];
        const pageSizeInPoints = pageSizes[pageNumber - 1];
        const pageSize: PageSize = {
          width: Math.round((pageSizeInPoints.width * dpi) / 72),
          height: Math.round((pageSizeInPoints.height * dpi) / 72),
        };
        const png = await sharp(result.buffer)
          .resize(pageSize.width, pageSize.height, { fit: 'fill' })
          .png()
          .toBuffer();
        rasters.set(pageNumber, { png, pageSize });
      }),
      pdfPageBatchSize
    );
  }

  return rasters;
}

/** Compress a rasterized page PNG into a JPEG for storage and vision. */
export async function compressImage(
  pngBuffer: Uint8Array
): Promise<Uint8Array> {
  return sharp(pngBuffer)
    .jpeg({ quality: jpegQuality, progressive: false })
    .toBuffer();
}

/**
 * Smallest square canvas that can hold every requested page at `dpi`
 * without upscaling. Vision stays on 2048; flatten at 300 DPI grows this.
 */
function getRasterCanvasSize(pageSizes: PageSize[], dpi: number): number {
  const maxEdge = Math.max(
    rasterSize,
    ...pageSizes.flatMap((pageSize) => [
      Math.round((pageSize.width * dpi) / 72),
      Math.round((pageSize.height * dpi) / 72),
    ])
  );
  return maxEdge;
}

/** Shared pdf2pic canvas so mixed page sizes still rasterize. */
const rasterSize = 2048;

/** Target DPI for PDF to image conversion. 72 DPI is 1 PDF point per pixel. */
const targetDPI = 72;

/** JPEG quality setting (0-100, lower = smaller file size) */
const jpegQuality = 85;

/**
 * Keep rasterized buffers bounded before downstream processing releases
 * them.
 */
const pdfPageBatchSize = 4;

/** Keep enough pages queued for the workers without retaining the whole PDF. */
const pdfPageProcessingBatchSize = 3 * pdfPageBatchSize;

/**
 * Keep each flattening call aligned with pdf2pic's internal ten-page batch.
 *
 * pdf2pic 3.2.0 doesn't expose its internal `batchSize` as an option:
 * https://github.com/yakovmeister/pdf2image/blob/v3.2.0/src/pdf2picCore.ts
 */
const pdf2picBulkBatchSize = 10;
