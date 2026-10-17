import { sortBy } from 'lodash';
import sharp from 'sharp';
import type { PageSize } from './pdfTypes';
import { promiseAllThrottled } from '../utilities/promiseAllThrottled';
import { getPDFPageSizes } from './getPDFPageSizes';
import { renderPDFPages } from './pdfRenderer';

/**
 * One rendered PDF page. `png` is at the requested DPI. `pageSize` is the page
 * size in PDF points, which is how the review UI lays out each page.
 */
export interface PDFPageImage {
  page: number;
  png: Uint8Array;
  /** Pixel size of `png`: the page size in points times `previewDPI` / 72. */
  previewSize: PageSize;
  pageSize: PageSize;
}

/**
 * Render PDF pages at preview resolution in bounded batches.
 *
 * Each batch of pages is rendered by the PDF renderer, then `onPage` runs for
 * each page. The next batch starts once `onPage` returns, so `onPage` should
 * only encode the page and queue slower work. That keeps at most one batch of
 * PNGs in memory at a time.
 */
export async function processPDFPagesInBatches(
  pdf: Uint8Array,
  onPage: (image: PDFPageImage) => Promise<void>
): Promise<{ rasterizationTimeMs: number }> {
  const pageSizes = await getPDFPageSizes(pdf);
  let rasterizationTimeMs = 0;

  for (
    let batchStart = 0;
    batchStart < pageSizes.length;
    batchStart += renderBatchSize
  ) {
    const pageNumbers = Array.from(
      {
        length: Math.min(renderBatchSize, pageSizes.length - batchStart),
      },
      (_, batchIndex) => batchStart + batchIndex + 1
    );
    const rasterizationStartedAt = Date.now();
    // eslint-disable-next-line no-await-in-loop -- batches must render sequentially to bound memory
    const rendered = await renderPDFPages({
      pdf,
      pages: pageNumbers,
      dpi: previewDPI,
    });
    rasterizationTimeMs += Date.now() - rasterizationStartedAt;

    // eslint-disable-next-line no-await-in-loop -- finish this batch before the next
    await promiseAllThrottled(
      pageNumbers.map((pageNumber) => async (): Promise<void> => {
        const png = rendered.get(pageNumber);
        if (!png) {
          throw new Error(`PDF renderer did not return page ${pageNumber}.`);
        }
        const { width, height } = pageSizes[pageNumber - 1];
        await onPage({
          page: pageNumber,
          png,
          previewSize: {
            width: Math.round((width * previewDPI) / 72),
            height: Math.round((height * previewDPI) / 72),
          },
          pageSize: { width: Math.round(width), height: Math.round(height) },
        });
      }),
      onPageConcurrency
    );
  }

  return { rasterizationTimeMs };
}

/**
 * Render a subset of 1-indexed pages at `dpi`, for flattening. Returns PNGs
 * keyed by page number.
 */
export async function rasterizePDFPages(
  pdf: Uint8Array,
  options: { pageNumbers: number[]; dpi: number }
): Promise<Map<number, Uint8Array>> {
  const rasters = new Map<number, Uint8Array>();
  const uniquePageNumbers = sortBy([...new Set(options.pageNumbers)]);

  for (
    let batchStart = 0;
    batchStart < uniquePageNumbers.length;
    batchStart += renderBatchSize
  ) {
    const batchPageNumbers = uniquePageNumbers.slice(
      batchStart,
      batchStart + renderBatchSize
    );
    // eslint-disable-next-line no-await-in-loop -- sequential batches bound memory
    const rendered = await renderPDFPages({
      pdf,
      pages: batchPageNumbers,
      dpi: options.dpi,
    });
    rendered.forEach((png, page) => rasters.set(page, png));
  }

  return rasters;
}

/** Input for `compressImage`. */
export interface CompressImageOptions {
  /** A PNG from a page render. */
  pngBuffer: Uint8Array;
  /** Pixel size of the JPEG. The PNG is resized to fit it. */
  size: PageSize;
}

/**
 * Compress a rasterized page PNG into a JPEG at `size`. The stored preview and
 * the vision input are different sizes, so each call names its own.
 */
export async function compressImage({
  pngBuffer,
  size,
}: CompressImageOptions): Promise<Uint8Array> {
  return sharp(pngBuffer)
    .resize(size.width, size.height, { fit: 'fill' })
    .jpeg({ quality: jpegQuality, progressive: false })
    .toBuffer();
}

/**
 * Resolution of the stored page previews. 72 DPI looked soft in the review
 * UI. Vision requests are downscaled from this raster, so detection input
 * and its latency do not change.
 */
const previewDPI = 150;

/** JPEG quality setting (0-100, lower = smaller file size) */
const jpegQuality = 85;

/** Pages per renderer request. Bounds the PNGs held in memory at once. */
const renderBatchSize = 12;

/** Concurrent `onPage` calls within one batch. */
const onPageConcurrency = 4;
