import { PDFDocument } from '@cantoo/pdf-lib';
import { redact, verify, type RedactionRegion } from 'scrubzero';
import { ApplicationError } from '../errors/applicationError';
import { PageSize, RedactionBoundingBox } from '../models/redactionTypes';
import { isNotNullOrUndefined } from '../typescript/isNotNullOrUndefined';

export interface GenerateRedactedPDFOptions {
  pdf: Buffer;
  redactionBoundingBoxes: RedactionBoundingBox[];
}

/** Burn enabled redaction boxes into a copy of the source PDF. */
export async function generateRedactedPDF({
  pdf,
  redactionBoundingBoxes,
}: GenerateRedactedPDFOptions): Promise<Buffer> {
  let pdfDocument: PDFDocument;
  try {
    pdfDocument = await PDFDocument.load(pdf, { ignoreEncryption: true });
    const pages = pdfDocument.getPages();
    const pageSizes = pages.map((sourcePage): PageSize => {
      const { width, height } = sourcePage.getSize();
      return { width, height };
    });
    const regions = redactionBoundingBoxes
      .filter(({ enabled }) => enabled)
      .map(({ box, page }): RedactionRegion | null => {
        const pageSize = pageSizes[page - 1];
        if (!pageSize) return null;

        const region: RedactionRegion = {
          page,
          x: box.minX * pageSize.width,
          y: (1 - box.maxY) * pageSize.height,
          width: (box.maxX - box.minX) * pageSize.width,
          height: (box.maxY - box.minY) * pageSize.height,
          color: [0, 0, 0],
        };
        return region;
      })
      .filter(isNotNullOrUndefined);

    const result = await redact(toArrayBuffer(pdf), regions);
    const verification = await verify(toArrayBuffer(result.pdf));
    if (!verification.clean) {
      const violations = verification.violations
        .map(({ page }) => `page ${page}`)
        .join('; ');
      throw new ApplicationError(
        `Could not verify PDF redaction (${violations}).`
      );
    }

    return Buffer.from(result.pdf);
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

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}
