import { PDFDocument } from '@cantoo/pdf-lib';
import { ApplicationError } from '../errors/applicationError';
import { burnRedactionBoxesOnImage } from '../redaction/burnRedactionBoxesOnImage';
import type {
  BoundingBox,
  RedactionBoundingBox,
} from '../redaction/redactionTypes';
import { getPDFPageSizes } from './getPDFPageSizes';
import { rasterizePDFPages } from './pdfToImage';

export interface GenerateRedactedPDFOptions {
  pdf: Buffer;
  redactionBoundingBoxes: RedactionBoundingBox[];
}

/**
 * Burn enabled redaction boxes into a copy of the source PDF.
 *
 * Pages with an enabled box are rasterized and replaced with a JPEG that
 * has black rectangles painted in. That removes the pixels under the box
 * and the selectable text. Pages without enabled boxes are copied as-is
 * so leftover text stays selectable.
 *
 * We flatten instead of painting a PDF rectangle or editing the content
 * stream. Stream coordinates are easy to get wrong (`Td` after a `Tm`
 * scale is one example), and a painted box still leaves copyable text.
 */
export async function generateRedactedPDF({
  pdf,
  redactionBoundingBoxes,
}: GenerateRedactedPDFOptions): Promise<Buffer> {
  try {
    const pageSizes = await getPDFPageSizes(pdf);
    const enabledBoxesByPage = groupEnabledBoxesByPage(redactionBoundingBoxes);
    const sourcePDF = await PDFDocument.load(pdf);
    const outputPDF = await PDFDocument.create();

    const unboxedPageIndices = pageSizes.flatMap((_, pageIndex) =>
      enabledBoxesByPage.has(pageIndex + 1) ? [] : [pageIndex]
    );
    const copiedUnboxedPages =
      unboxedPageIndices.length > 0
        ? await outputPDF.copyPages(sourcePDF, unboxedPageIndices)
        : [];
    let nextCopiedPage = 0;

    for (
      let batchStart = 0;
      batchStart < pageSizes.length;
      batchStart += flattenedPageBatchSize
    ) {
      const batchEnd = Math.min(
        batchStart + flattenedPageBatchSize,
        pageSizes.length
      );
      const batchPageNumbers = Array.from(
        { length: batchEnd - batchStart },
        (_, index) => batchStart + index + 1
      ).filter((pageNumber) => enabledBoxesByPage.has(pageNumber));
      // Only this page batch keeps rasterized PNGs alive. Each page is burned
      // and embedded before the next batch is rasterized.
      // eslint-disable-next-line no-await-in-loop -- batches bound image memory
      const rasters = await rasterizePDFPages(pdf, {
        pageNumbers: batchPageNumbers,
        dpi: flattenedPageDPI,
      });

      for (let pageIndex = batchStart; pageIndex < batchEnd; pageIndex++) {
        const pageNumber = pageIndex + 1;
        const boxes = enabledBoxesByPage.get(pageNumber);
        if (!boxes) {
          outputPDF.addPage(copiedUnboxedPages[nextCopiedPage]);
          nextCopiedPage += 1;
          continue;
        }

        const raster = rasters.get(pageNumber);
        if (!raster) {
          throw new ApplicationError(
            `Could not rasterize PDF page ${pageNumber} for redaction.`
          );
        }
        // Burn and embed one page before moving on so image buffers can be
        // released instead of accumulating across the whole document.
        // eslint-disable-next-line no-await-in-loop -- pages are processed in order
        const burnedJPEG = await burnRedactionBoxesOnImage(raster.png, boxes);
        // embedJpg writes into this document, so pages stay sequential.
        // eslint-disable-next-line no-await-in-loop -- pages must stay ordered
        const embeddedJPEG = await outputPDF.embedJpg(burnedJPEG);
        const pageSize = pageSizes[pageIndex];
        const page = outputPDF.addPage([pageSize.width, pageSize.height]);
        page.drawImage(embeddedJPEG, {
          x: 0,
          y: 0,
          width: pageSize.width,
          height: pageSize.height,
        });
      }
    }

    return Buffer.from(await outputPDF.save());
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new ApplicationError(
      `Could not generate the redacted PDF (${message}).`
    );
  }
}

function groupEnabledBoxesByPage(
  redactionBoundingBoxes: RedactionBoundingBox[]
): Map<number, BoundingBox[]> {
  const boxesByPage = new Map<number, BoundingBox[]>();
  for (const { enabled, page, box } of redactionBoundingBoxes) {
    if (!enabled) {
      continue;
    }
    const boxes = boxesByPage.get(page) ?? [];
    boxes.push(box);
    boxesByPage.set(page, boxes);
  }
  return boxesByPage;
}

// 300 DPI so a printed flattened page still looks sharp. The vision
// pipeline uses 72 DPI; that's too soft once we replace the PDF page
// with a JPEG.
const flattenedPageDPI = 300;

/** Keep rasterized image data bounded while pages are burned and embedded. */
const flattenedPageBatchSize = 10;
