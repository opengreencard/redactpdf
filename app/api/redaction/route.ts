import { APIRouteBodyFormat } from '../../../lib/api/makeAPIRoute';
import {
  makeAPIRouteWithBody,
  MakeAPIRouteWithBodyTypes,
} from '../../../lib/api/makeAPIRouteWithBody';
import { ApplicationError } from '../../../lib/errors/applicationError';
import type { UploadFileForRedactionResponse } from '../../../lib/redaction/redactionAPI';
import {
  UploadFileForRedactionRequest,
  uploadFileForRedaction,
} from './uploadFileForRedaction';

interface UploadFileForRedactionRouteBody {
  body: FormData;
}

type UploadFileForRedactionRoute = MakeAPIRouteWithBodyTypes<
  UploadFileForRedactionRouteBody,
  {},
  UploadFileForRedactionResponse
>;

/** Accept one uploaded PDF and start its redaction job. */
export const POST = makeAPIRouteWithBody<
  UploadFileForRedactionRoute['requestBody'],
  UploadFileForRedactionRoute['queryAndPathParams'],
  UploadFileForRedactionRoute['response']
>({
  method: 'POST',
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
