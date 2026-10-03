import {
  APIRouteResponseFormat,
  RawResponse,
} from '../../../../../lib/api/makeAPIRoute';
import {
  makeAPIRouteWithoutBody,
  MakeAPIRouteWithoutBodyTypes,
} from '../../../../../lib/api/makeAPIRouteWithoutBody';
import {
  GenerateRedactedPDFForKeyRequest,
  generateRedactedPDFForKey,
} from './generateRedactedPDFForKey';

type GenerateRedactedPDFRoute = MakeAPIRouteWithoutBodyTypes<
  GenerateRedactedPDFForKeyRequest,
  RawResponse,
  {},
  GenerateRedactedPDFForKeyRequest
>;

/** Return the generated redacted PDF for download. */
export const GET = makeAPIRouteWithoutBody<
  GenerateRedactedPDFRoute['queryAndPathParams'],
  GenerateRedactedPDFRoute['response'],
  GenerateRedactedPDFRoute['authParams'],
  GenerateRedactedPDFRoute['pathParams']
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
