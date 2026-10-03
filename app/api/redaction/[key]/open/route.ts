import {
  makeAPIRouteWithBody,
  MakeAPIRouteWithBodyTypes,
} from '../../../../../lib/api/makeAPIRouteWithBody';
import {
  TouchRedactionOpenedAtRequest,
  touchRedactionOpenedAt,
} from './touchRedactionOpenedAt';

type TouchRedactionOpenedAtRoute = MakeAPIRouteWithBodyTypes<
  Record<string, never>,
  TouchRedactionOpenedAtRequest,
  Record<string, never>,
  {},
  { key: string }
>;

/** Ping this while a tab is open so we don't treat the document as idle. */
export const POST = makeAPIRouteWithBody<
  TouchRedactionOpenedAtRoute['requestBody'],
  TouchRedactionOpenedAtRoute['queryAndPathParams'],
  TouchRedactionOpenedAtRoute['response'],
  TouchRedactionOpenedAtRoute['authParams'],
  TouchRedactionOpenedAtRoute['pathParams']
>({
  method: 'POST',
  apiFunc: touchRedactionOpenedAt,
  makeQueryAndPathParams: ({ pathParams }): TouchRedactionOpenedAtRequest => ({
    key: pathParams.key,
  }),
});
