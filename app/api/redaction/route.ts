import { APIRouteBodyFormat } from '../../../lib/api/apiRouteCommon';
import { makePOSTAPIRoute } from '../../../lib/api/makePOSTAPIRoute';
import { ApplicationError } from '../../../lib/errors/applicationError';
import {
  UploadFileForRedactionRequest,
  UploadFileForRedactionResponse,
  uploadFileForRedaction,
} from './uploadFileForRedaction';

/** Accept one uploaded PDF and start its redaction job. */
export const POST = makePOSTAPIRoute<
  { body: FormData },
  {},
  UploadFileForRedactionResponse
>({
  bodyFormat: APIRouteBodyFormat.formData,
  apiFunc: async (request): Promise<UploadFileForRedactionResponse> => {
    const file = request.body.get('file');

    if (!file || !(file instanceof File)) {
      throw new ApplicationError('There is no uploaded file.');
    }

    const uploadRequest: UploadFileForRedactionRequest = {
      buffer: Buffer.from(await file.arrayBuffer()),
    };
    return uploadFileForRedaction(uploadRequest);
  },
});
