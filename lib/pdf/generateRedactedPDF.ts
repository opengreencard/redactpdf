import { PDFDocument } from '@cantoo/pdf-lib';
import { redact, verify, type RedactionRegion } from 'scrubzero';
import { ApplicationError } from '../errors/applicationError';
import { RedactionBoundingBox } from '../models/redactionTypes';
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
    const regions = redactionBoundingBoxes
      .filter(({ enabled }) => enabled)
      .map(({ box, page }): RedactionRegion | null => {
        const sourcePage = pages[page - 1];
        if (!sourcePage) return null;

        const { width, height } = sourcePage.getSize();
        const region: RedactionRegion = {
          page,
          x: box.minX * width,
          y: (1 - box.maxY) * height,
          width: (box.maxX - box.minX) * width,
          height: (box.maxY - box.minY) * height,
          color: [0, 0, 0],
        };
        return region;
      })
      .filter(isNotNullOrUndefined);

    const result = await redact(toArrayBuffer(pdf), regions);
    const verification = await verify(toArrayBuffer(result.pdf));
    if (!verification.clean) {
      const violations = verification.violations
        .map(({ page, recoveredText }) => `page ${page}: ${recoveredText}`)
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
