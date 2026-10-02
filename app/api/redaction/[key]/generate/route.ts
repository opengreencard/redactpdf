import {
  APIRouteResponseFormat,
  RawResponse,
} from '../../../../../lib/api/apiRouteCommon';
import { makeGETAPIRoute } from '../../../../../lib/api/makeGETAPIRoute';
import {
  GenerateRedactedPDFForKeyRequest,
  generateRedactedPDFForKey,
} from './generateRedactedPDFForKey';

/** Return the generated redacted PDF for download. */
export const GET = makeGETAPIRoute<
  GenerateRedactedPDFForKeyRequest,
  RawResponse,
  {},
  { key: string }
>({
  apiFunc: generateRedactedPDFForKey,
  responseFormat: APIRouteResponseFormat.raw,
  makeQueryAndPathParams: ({
    pathParams,
  }): GenerateRedactedPDFForKeyRequest => ({
    key: pathParams.key,
  }),
});
