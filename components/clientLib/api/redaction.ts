import { ApplicationError } from '../../../lib/errors/applicationError';
import { maxRedactionFileSizeMB } from '../../../lib/redaction/redactionFileLimits';
import type { GetRedactionResponse } from '../../../app/api/redaction/[key]/getRedaction';
import type { UploadFileForRedactionResponse } from '../../../app/api/redaction/uploadFileForRedaction';
import type {
  MutateRedactionBoundingBoxesBody,
  MutateRedactionBoundingBoxesPathParams,
} from '../../../app/api/redaction/[key]/redacted/mutateRedactionBoundingBoxes';
import type {
  ClientAPIRouteWithBodyData,
  ClientAPIRouteWithoutBodyData,
} from './common';
import {
  makeClientAPIRouteWithBody,
  makeClientAPIRouteWithoutBody,
} from './common';

interface UploadFileForRedactionClientRequest {
  file: File;
}

const uploadFileForRedactionRequest = makeClientAPIRouteWithBody<
  UploadFileForRedactionClientRequest,
  {},
  UploadFileForRedactionResponse
>({
  method: 'POST',
  dataToUrlQueryStringAndBody: ({
    file,
  }): ClientAPIRouteWithBodyData<never> => {
    const formData = new FormData();
    formData.append('file', file);
    return { url: '/api/redaction', body: formData };
  },
});

/**
 * Upload a PDF and return the key for its redaction page. A 413 here means
 * the file is over the PDF limit, so the message names that limit. The
 * shared client handles 413 for every route and doesn't know about PDFs.
 */
export async function uploadFileForRedactionClient(
  request: UploadFileForRedactionClientRequest
): Promise<UploadFileForRedactionResponse> {
  try {
    return await uploadFileForRedactionRequest(request);
  } catch (error) {
    if (error instanceof ApplicationError && error.statusCode === 413) {
      throw new ApplicationError(
        `The PDF is too large. Please upload a file smaller than ${maxRedactionFileSizeMB} MiB.`,
        413
      );
    }
    throw error;
  }
}

/** Poll one document until processing finishes or fails. */
export const getRedactionClient = makeClientAPIRouteWithoutBody<
  { key: string },
  GetRedactionResponse
>({
  method: 'GET',
  dataToUrlAndQueryString: ({ key }): ClientAPIRouteWithoutBodyData => ({
    url: `/api/redaction/${key}`,
  }),
});

/** Ping openedAt so cleanup leaves a still-open review tab alone. */
export const touchRedactionOpenedAtClient = makeClientAPIRouteWithBody<
  {},
  { key: string },
  Record<string, never>
>({
  method: 'POST',
  dataToUrlQueryStringAndBody: ({ key }): ClientAPIRouteWithBodyData<{}> => ({
    url: `/api/redaction/${key}/open`,
    body: {},
  }),
});

/** Public key for the generate route. The server loads boxes itself. */
export interface GenerateRedactedPDFClientRequest {
  key: string;
}

/** Fetch the finished redacted PDF as bytes for a caller to download. */
export const generateRedactedPDFClient = makeClientAPIRouteWithoutBody<
  GenerateRedactedPDFClientRequest,
  ArrayBuffer
>({
  method: 'GET',
  dataToUrlAndQueryString: ({ key }): ClientAPIRouteWithoutBodyData => ({
    url: `/api/redaction/${key}/generate`,
  }),
  responseType: 'arraybuffer',
});

/**
 * Persist a batch of box edits in one POST. A later failure can then roll
 * the optimistic UI back to the last saved boxes.
 */
export const mutateRedactionBoundingBoxesClient = makeClientAPIRouteWithBody<
  MutateRedactionBoundingBoxesBody,
  MutateRedactionBoundingBoxesPathParams,
  void
>({
  method: 'POST',
  dataToUrlQueryStringAndBody: ({
    key,
    mutations,
  }): ClientAPIRouteWithBodyData<MutateRedactionBoundingBoxesBody> => ({
    url: `/api/redaction/${key}/redacted`,
    body: { mutations },
  }),
});
