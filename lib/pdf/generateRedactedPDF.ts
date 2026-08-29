import { PDFDocument, rgb } from '@cantoo/pdf-lib';
import { ApplicationError } from '../errors/applicationError';
import { RedactionBoundingBox } from '../models/redactionTypes';

export interface GenerateRedactedPDFOptions {
  pdf: Buffer;
  redactionBoundingBoxes: RedactionBoundingBox[];
}

/**
 * Burn enabled redaction boxes into a copy of the source PDF.
 *
 * TODO: Switch to scrubzero (or another real redaction library) so the
 * underlying text and content streams are removed rather than just covered
 * with black rectangles.
 */
export async function generateRedactedPDF({
  pdf,
  redactionBoundingBoxes,
}: GenerateRedactedPDFOptions): Promise<Buffer> {
  let document: PDFDocument;
  try {
    document = await PDFDocument.load(pdf, { ignoreEncryption: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ApplicationError(
      `Could not load the PDF for redaction (${message}).`
    );
  }

  const pages = document.getPages();
  for (const { box, enabled, page } of redactionBoundingBoxes) {
    if (!enabled) continue;

    const outputPage = pages[page - 1];
    if (!outputPage) continue;

    const { width, height } = outputPage.getSize();
    outputPage.drawRectangle({
      x: box.minX * width,
      y: (1 - box.maxY) * height,
      width: (box.maxX - box.minX) * width,
      height: (box.maxY - box.minY) * height,
      color: rgb(0, 0, 0),
    });
  }

  return Buffer.from(await document.save());
}
