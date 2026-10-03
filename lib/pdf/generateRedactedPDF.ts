import { redact, verify, type RedactionRegion } from 'scrubzero';
import { ApplicationError } from '../errors/applicationError';
import { RedactionBoundingBox } from '../redaction/redactionTypes';
import { isNotNullOrUndefined } from '../typescript/isNotNullOrUndefined';
import { getPDFPageSizes } from './getPDFPageSizes';

export interface GenerateRedactedPDFOptions {
  pdf: Buffer;
  redactionBoundingBoxes: RedactionBoundingBox[];
}

/** Burn enabled redaction boxes into a copy of the source PDF. */
export async function generateRedactedPDF({
  pdf,
  redactionBoundingBoxes,
}: GenerateRedactedPDFOptions): Promise<Buffer> {
  try {
    const pageSizes = await getPDFPageSizes(pdf);
    const regions = redactionBoundingBoxes
      .filter(({ enabled }) => enabled)
      .map(({ box, page }): RedactionRegion | null => {
        const pageSize = pageSizes[page - 1];
        if (!pageSize) return null;

        const region: RedactionRegion = {
          page,
          x: box.minX * pageSize.width,
          // Both our normalized boxes and scrubzero measure y from the
          // top-left. For example, minY=0.1 on a 792-point page means
          // y=79.2, not 0.9*792 as it would in a bottom-left coordinate
          // system. See https://github.com/Liiift-Studio/scrubzero#redactionregion.
          y: box.minY * pageSize.height,
          width: (box.maxX - box.minX) * pageSize.width,
          height: (box.maxY - box.minY) * pageSize.height,
          color: [0, 0, 0],
        };
        return region;
      })
      .filter(isNotNullOrUndefined);

    const result = await redact(toArrayBuffer(pdf), regions);
    const verification = await verify(toArrayBuffer(result.pdf));
    if (!verification.clean || verification.warnings.length > 0) {
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
