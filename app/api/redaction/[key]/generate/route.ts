import {
  APIRouteResponseFormat,
  RawResponse,
} from '../../../../../lib/api/makeAPIRoute';
import { makeAPIRouteWithoutBody } from '../../../../../lib/api/makeAPIRouteWithoutBody';
import {
  GenerateRedactedPDFForKeyRequest,
  generateRedactedPDFForKey,
} from './generateRedactedPDFForKey';

/** Return the generated redacted PDF for download. */
export const GET = makeAPIRouteWithoutBody<
  GenerateRedactedPDFForKeyRequest,
  RawResponse,
  {},
  { key: string }
>({
  method: 'GET',
  apiFunc: generateRedactedPDFForKey,
  responseFormat: APIRouteResponseFormat.raw,
  makeQueryAndPathParams: ({
    pathParams,
  }): GenerateRedactedPDFForKeyRequest => ({
    key: pathParams.key,
  }),
});
