import { makeAPIRouteWithBody } from '../../../../../lib/api/makeAPIRouteWithBody';
import {
  AddRedactionBoundingBoxRequest,
  addRedactionBoundingBox,
} from './addRedactionBoundingBox';
import {
  DeleteRedactionBoundingBoxRequest,
  deleteRedactionBoundingBox,
} from './deleteRedactionBoundingBox';
import {
  ToggleRedactionBoundingBoxRequest,
  toggleRedactionBoundingBox,
} from './toggleRedactionBoundingBox';
import type { GetRedactionResponse } from '../../../../../lib/models/redactionTypes';

function keyFromPath({ pathParams }: { pathParams: { key: string } }): {
  key: string;
} {
  const params: { key: string } = { key: pathParams.key };
  return params;
}

/** Draw a manual box. Body is `{ page, box }`. */
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
 * Remove a box. JSON body rather than query params so we can send the full
 * `{ page, box, type }` identity — Axios DELETE `data` is fine.
 */
export const DELETE = makeAPIRouteWithBody<
  Omit<DeleteRedactionBoundingBoxRequest, 'key'>,
  { key: string },
  GetRedactionResponse,
  {},
  { key: string }
>({
  method: 'DELETE',
  apiFunc: deleteRedactionBoundingBox,
  makeQueryAndPathParams: keyFromPath,
});

/** Flip `enabled` on an existing box. Body is `{ page, box, type }`. */
export const PATCH = makeAPIRouteWithBody<
  Omit<ToggleRedactionBoundingBoxRequest, 'key'>,
  { key: string },
  GetRedactionResponse,
  {},
  { key: string }
>({
  method: 'PATCH',
  apiFunc: toggleRedactionBoundingBox,
  makeQueryAndPathParams: keyFromPath,
});
