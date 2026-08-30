import { PDFDocument } from '@cantoo/pdf-lib';
import { ApplicationError } from '../../../lib/errors/applicationError';
import Redaction, { generateRedactionKey } from '../../../lib/models/Redaction';
import { RedactionStatus } from '../../../lib/models/redactionTypes';
import {
  deleteRedactionFile,
  putRedactionFile,
} from '../../../lib/storage/storageFunctions/redactionFile';
import { processRedaction } from './lib/processRedaction';

/** Maximum upload size. Exported for use in tests. */
export const _maxRedactionFileSizeBytes = 50 * 1024 * 1024;

/** Maximum page count. Exported for use in tests. */
export const _maxRedactionPageCount = 100;

/** The server input for creating a redaction document. */
export interface UploadFileForRedactionRequest {
  buffer: Buffer;
}

/** The key and page count needed to open the redaction page. */
export interface UploadFileForRedactionResponse {
  key: string;
  pageCount: number;
}

/**
 * Validate, store, and start processing an uploaded PDF.
 *
 * The storage object and database row are created together from the caller's
 * perspective. If either initial write fails, successful side effects are
 * compensated before the original error is rethrown.
 */
export async function uploadFileForRedaction({
  buffer,
}: UploadFileForRedactionRequest): Promise<UploadFileForRedactionResponse> {
  if (buffer.length > _maxRedactionFileSizeBytes) {
    throw new ApplicationError(
      'The PDF is too large. Please upload a file smaller than 50 MiB.',
      413
    );
  }

  const key = generateRedactionKey();
  const pageCount = await getPDFPageCount(buffer);

  const putFilePromise = putRedactionFile(buffer, 'application/pdf', key);
  const createRedactionPromise = Redaction.create({
    key,
    pageCount,
    pageSizes: null,
    redactionBoundingBoxes: [],
    status: RedactionStatus.redacting,
    errorMessage: null,
  });

  try {
    const [, redaction] = await Promise.all([
      putFilePromise,
      createRedactionPromise,
    ]);

    // Processing is intentionally fire-and-forget because the upload response
    // must not wait for the vision pipeline to finish.
    // eslint-disable-next-line no-void
    void processRedaction(redaction, buffer);

    const response: UploadFileForRedactionResponse = { key, pageCount };
    return response;
  } catch (error) {
    const [putResult, createResult] = await Promise.allSettled([
      putFilePromise,
      createRedactionPromise,
    ]);
    const cleanupPromises: Promise<unknown>[] = [];

    if (putResult.status === 'fulfilled') {
      cleanupPromises.push(deleteRedactionFile(key));
    }
    if (createResult.status === 'fulfilled') {
      cleanupPromises.push(createResult.value.destroy());
    }

    await Promise.allSettled(cleanupPromises);
    throw error;
  }
}

async function getPDFPageCount(buffer: Buffer): Promise<number> {
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  } catch (error) {
    throw new ApplicationError(
      `Invalid PDF file (${error.message}). Please upload a valid PDF.`
    );
  }

  const pageCount = pdf.getPageCount();
  if (pageCount === 0) {
    throw new ApplicationError('The uploaded PDF does not contain any pages.');
  }
  if (pageCount > _maxRedactionPageCount) {
    throw new ApplicationError(
      `The PDF contains too many pages. Please upload a file with ${_maxRedactionPageCount} pages or fewer.`,
      413
    );
  }

  return pageCount;
}
