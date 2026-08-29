import type { RedactionInstance } from '../../../../lib/models/Redaction';
import {
  PageSize,
  RedactionBoundingBox,
  RedactionStatus,
} from '../../../../lib/models/redactionTypes';
import {
  compressImage,
  processPDFPagesInBatches,
} from '../../../../lib/pdf/pdfToImage';
import { getRedactionBoundingBoxes } from '../../../../lib/redaction/getRedactionBoundingBoxes';
import { putRedactionImage } from '../../../../lib/storage/storageFunctions/redactionImage';

/** Timing and success information for one page's vision request. */
export interface ProcessRedactionPageTiming {
  page: number;
  visionTimeMs: number;
  succeeded: boolean;
}

/** Processing timings returned after the background job finishes. */
export interface ProcessRedactionResult {
  rasterizationTimeMs: number | null;
  averageRasterizationTimeMs: number | null;
  pageTimings: ProcessRedactionPageTiming[];
}

/**
 * Rasterize a PDF, publish its page images, and persist automatic redactions.
 *
 * Image uploads are best effort because a missing page should not prevent
 * other pages from being analyzed. Vision failures are also isolated per page;
 * the document is marked `redacted` when at least one page is analyzed
 * successfully and `error` only when every page fails.
 */
export async function processRedaction(
  redaction: RedactionInstance,
  buffer: Buffer
): Promise<ProcessRedactionResult> {
  try {
    const rasterizationStartedAt = Date.now();
    const pageSizes: PageSize[] = [];
    const pages: ProcessImageResult[] = [];
    await processPDFPagesInBatches(buffer, async ({ page, png, pageSize }) => {
      pageSizes[page - 1] = pageSize;
      pages[page - 1] = await processImage({
        png,
        page,
        key: redaction.key,
      });
    });
    const rasterizationTimeMs = Date.now() - rasterizationStartedAt;

    const boundingBoxes = pages.flatMap((page) => page.boundingBoxes);
    const pageTimings = pages.map((page) => page.timing);
    const succeeded = pageTimings.some((pageTiming) => pageTiming.succeeded);
    await redaction.update({
      pageSizes,
      redactionBoundingBoxes: [
        ...redaction.redactionBoundingBoxes,
        ...boundingBoxes,
      ],
      status: succeeded ? RedactionStatus.redacted : RedactionStatus.error,
      errorMessage: succeeded
        ? null
        : pages
            .map((page) => page.errorMessage)
            .filter((message): message is string => message !== null)
            .join('\n') || 'Every page failed.',
    });

    const averageRasterizationTimeMs =
      pageSizes.length === 0 ? 0 : rasterizationTimeMs / pageSizes.length;
    const result: ProcessRedactionResult = {
      rasterizationTimeMs,
      averageRasterizationTimeMs,
      pageTimings,
    };
    return result;
  } catch (error) {
    await markRedactionAsError(redaction, error);
    const result: ProcessRedactionResult = {
      rasterizationTimeMs: null,
      averageRasterizationTimeMs: null,
      pageTimings: [],
    };
    return result;
  }
}

interface ProcessImageOptions {
  png: Uint8Array;
  page: number;
  key: string;
}

interface ProcessImageResult {
  boundingBoxes: RedactionBoundingBox[];
  timing: ProcessRedactionPageTiming;
  errorMessage: string | null;
}

/**
 * Compress one page PNG, then upload and run vision concurrently.
 */
async function processImage({
  png,
  page,
  key,
}: ProcessImageOptions): Promise<ProcessImageResult> {
  try {
    const jpeg = await compressImage(png);
    const visionStartedAt = Date.now();
    const [visionResult] = await Promise.all([
      (async (): Promise<ProcessImageResult> => {
        try {
          const result = await getRedactionBoundingBoxes(jpeg);
          const processResult: ProcessImageResult = {
            boundingBoxes: result.boxes.map((box): RedactionBoundingBox => ({
              ...box,
              page,
            })),
            timing: {
              page,
              visionTimeMs: Date.now() - visionStartedAt,
              succeeded: true,
            },
            errorMessage: null,
          };
          return processResult;
        } catch (error) {
          // eslint-disable-next-line no-console -- page failures are useful operational diagnostics
          console.error(
            `Could not process redaction ${key}, page ${page}.`,
            error
          );
          const processResult: ProcessImageResult = {
            boundingBoxes: [],
            timing: {
              page,
              visionTimeMs: Date.now() - visionStartedAt,
              succeeded: false,
            },
            errorMessage: error.message,
          };
          return processResult;
        }
      })(),
      (async (): Promise<void> => {
        try {
          await putRedactionImage(jpeg, 'image/jpeg', { key, page });
        } catch (error) {
          // eslint-disable-next-line no-console -- page failures are useful operational diagnostics
          console.error(
            `Could not store redaction image for ${key}, page ${page}.`,
            error.stack
          );
        }
      })(),
    ]);
    return visionResult;
  } catch (error) {
    // eslint-disable-next-line no-console -- page failures are useful operational diagnostics
    console.error(`Could not process redaction ${key}, page ${page}.`, error);
    const processResult: ProcessImageResult = {
      boundingBoxes: [],
      timing: {
        page,
        visionTimeMs: 0,
        succeeded: false,
      },
      errorMessage: error instanceof Error ? error.message : String(error),
    };
    return processResult;
  }
}

async function markRedactionAsError(
  redaction: RedactionInstance,
  error: unknown
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);

  try {
    await redaction.update({
      status: RedactionStatus.error,
      errorMessage,
    });
  } catch (statusError) {
    // eslint-disable-next-line no-console -- processing errors need operational diagnostics
    console.error(
      `Could not mark redaction ${redaction.key} as errored.`,
      statusError
    );
  }

  // eslint-disable-next-line no-console -- processing errors need operational diagnostics
  console.error(`Could not process redaction ${redaction.key}.`, error);
}
