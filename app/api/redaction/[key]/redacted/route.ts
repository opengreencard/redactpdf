import { makeAPIRouteWithBody } from '../../../../../lib/api/makeAPIRouteWithBody';
import {
  AddRedactionBoundingBoxRequest,
  addRedactionBoundingBox,
} from './addRedactionBoundingBox';
import {
  LocateRedactionBoundingBoxRequest,
  deleteRedactionBoundingBox,
} from './deleteRedactionBoundingBox';
import { toggleRedactionBoundingBox } from './toggleRedactionBoundingBox';
import type { GetRedactionResponse } from '../../../../../lib/models/redactionTypes';

/** One box per request so two saves don't overwrite the JSON column. */
export const POST = makeAPIRouteWithBody<
  Omit<AddRedactionBoundingBoxRequest, 'key'>,
  { key: string },
  GetRedactionResponse,
  {},
  { key: string }
>({
  method: 'POST',
  apiFunc: addRedactionBoundingBox,
  makeQueryAndPathParams: keyFromPath,
});

/**
 * JSON body rather than query params so we can send the full
 * `{ page, box, type }` identity — Axios DELETE `data` is fine.
 */
export const DELETE = makeAPIRouteWithBody<
  Omit<LocateRedactionBoundingBoxRequest, 'key'>,
  { key: string },
  GetRedactionResponse,
  {},
  { key: string }
>({
  method: 'DELETE',
  apiFunc: deleteRedactionBoundingBox,
  makeQueryAndPathParams: keyFromPath,
});

/** Flip `enabled` on one existing box. Same identity body as DELETE. */
export const PATCH = makeAPIRouteWithBody<
  Omit<LocateRedactionBoundingBoxRequest, 'key'>,
  { key: string },
  GetRedactionResponse,
  {},
  { key: string }
>({
  method: 'PATCH',
  apiFunc: toggleRedactionBoundingBox,
  makeQueryAndPathParams: keyFromPath,
});

function keyFromPath({ pathParams }: { pathParams: { key: string } }): {
  key: string;
} {
  return { key: pathParams.key };
}
