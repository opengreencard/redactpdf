import PQueue from 'p-queue';
import type { RedactionInstance } from '../../../../lib/models/Redaction';
import {
  RedactionBoundingBox,
  RedactionStatus,
} from '../../../../lib/redaction/redactionTypes';
import type { PageSize } from '../../../../lib/pdf/pdfTypes';
import {
  compressImage,
  processPDFPagesInBatches,
} from '../../../../lib/pdf/pdfToImage';
import { getRedactionBoundingBoxes } from '../../../../lib/redaction/getRedactionBoundingBoxes';
import { putRedactionImage } from '../../../../lib/storage/storageFunctions/redactionImage';

/**
 * Vision requests in flight at once, per server process. Each pod has its
 * own queue, so the total across pods is this number times the pod count.
 *
 * Gemini doesn't publish a concurrency limit for these calls. What applies:
 *
 * - Requests per minute for the project, 20,000 (AI Studio shows it:
 *   https://aistudio.google.com/rate-limit)
 * - Tokens per minute for the project, 20 million (same page)
 *
 * One pod sends about `concurrency × 60 / seconds per request` requests a
 * minute. At 32 in flight and roughly 15 seconds per request, a pod sends
 * about 130 requests a minute, and each request is a few thousand tokens. With
 * two pods that stays well under both limits. Check that total against the
 * limits before raising this.
 */
const visionQueue = new PQueue({ concurrency: 32 });

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
    const pageSizes: PageSize[] = [];
    const pageRequests: Promise<ProcessImageResult>[] = [];
    const { rasterizationTimeMs } = await processPDFPagesInBatches(
      buffer,
      async ({ page, png, previewSize, pageSize }) => {
        pageSizes[page - 1] = pageSize;
        // Encode before queueing so waiting requests hold small JPEGs, not
        // raw page PNGs. The two encodes read the same PNG, so run them
        // together.
        const [previewJPEG, visionJPEG] = await Promise.all([
          compressImage({ pngBuffer: png, size: previewSize }),
          compressImage({ pngBuffer: png, size: pageSize }),
        ]);
        // Don't await the request: rasterization moves on to the next pages
        // while the queue runs vision requests.
        pageRequests[page - 1] = visionQueue.add(() =>
          processImage({
            previewJPEG,
            visionJPEG,
            page,
            key: redaction.key,
          })
        );
      }
    );
    const pages = await Promise.all(pageRequests);

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
        : truncateErrorMessage(
            pages
              .map((page) => page.errorMessage)
              .filter((message): message is string => message !== null)
              .join('\n') || 'Every page failed.'
          ),
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
  /** Stored preview at full preview resolution. */
  previewJPEG: Uint8Array;
  /** Page size in points (72 DPI), which keeps the model input small. */
  visionJPEG: Uint8Array;
  page: number;
  key: string;
}

interface ProcessImageResult {
  boundingBoxes: RedactionBoundingBox[];
  timing: ProcessRedactionPageTiming;
  errorMessage: string | null;
}

/**
 * Upload the preview and run vision concurrently.
 */
async function processImage({
  previewJPEG,
  visionJPEG,
  page,
  key,
}: ProcessImageOptions): Promise<ProcessImageResult> {
  const visionStartedAt = Date.now();
  const [visionResult] = await Promise.all([
    (async (): Promise<ProcessImageResult> => {
      try {
        const result = await getRedactionBoundingBoxes(visionJPEG);
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
        await putRedactionImage(previewJPEG, 'image/jpeg', { key, page });
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
}

/**
 * Stored error messages go in a TEXT column. Vision errors can include request
 * payloads such as base64 images, which overflow that column and fail the row
 * update. Keep the start of the message for diagnosis.
 */
const maxStoredErrorMessageLength = 2000;

function truncateErrorMessage(message: string): string {
  if (message.length <= maxStoredErrorMessageLength) {
    return message;
  }
  return `${message.slice(0, maxStoredErrorMessageLength - 1)}…`;
}

async function markRedactionAsError(
  redaction: RedactionInstance,
  error: Error
): Promise<void> {
  const errorMessage = truncateErrorMessage(error.message);

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
