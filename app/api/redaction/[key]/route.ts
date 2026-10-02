import { makeAPIRouteWithoutBody } from '../../../../lib/api/makeAPIRouteWithoutBody';
import { GetRedactionRequest, getRedaction } from './getRedaction';
import { GetRedactionResponse } from '../../../../lib/models/redactionTypes';

/** Return the current state of one redaction job for polling. */
export const GET = makeAPIRouteWithoutBody<
  GetRedactionRequest,
  GetRedactionResponse,
  {},
  { key: string }
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
