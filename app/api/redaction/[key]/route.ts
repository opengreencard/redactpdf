import {
  makeAPIRouteWithoutBody,
  MakeAPIRouteWithoutBodyTypes,
} from '../../../../lib/api/makeAPIRouteWithoutBody';
import { GetRedactionRequest, getRedaction } from './getRedaction';
import type { GetRedactionResponse } from '../../../../lib/redaction/redactionAPI';

type GetRedactionRoute = MakeAPIRouteWithoutBodyTypes<
  GetRedactionRequest,
  GetRedactionResponse,
  {},
  GetRedactionRequest
>;

/** Return the current state of one redaction job for polling. */
export const GET = makeAPIRouteWithoutBody<
  GetRedactionRoute['queryAndPathParams'],
  GetRedactionRoute['response'],
  GetRedactionRoute['authParams'],
  GetRedactionRoute['pathParams']
>({
  method: 'GET',
  apiFunc: getRedaction,
  makeQueryAndPathParams: ({ pathParams }): GetRedactionRequest => ({
    key: pathParams.key,
  }),
  // The response changes during processing and after every review edit, so
  // polling must observe the current status and bounding boxes immediately.
  additionalHeaders: { 'Cache-Control': 'no-store' },
});
