import {
  makeAPIRouteWithBody,
  MakeAPIRouteWithBodyTypes,
} from '../../../../../lib/api/makeAPIRouteWithBody';
import {
  MutateRedactionBoundingBoxesBody,
  MutateRedactionBoundingBoxesPathParams,
  mutateRedactionBoundingBoxes,
} from './mutateRedactionBoundingBoxes';
import type { GetRedactionResponse } from '../../../../../lib/models/redactionTypes';

type MutateRedactionBoundingBoxesRoute = MakeAPIRouteWithBodyTypes<
  MutateRedactionBoundingBoxesBody,
  MutateRedactionBoundingBoxesPathParams,
  GetRedactionResponse,
  {},
  MutateRedactionBoundingBoxesPathParams
>;

/**
 * Apply add / delete / setEnabled in one save so two JSON writes cannot
 * clobber each other.
 */
export const POST = makeAPIRouteWithBody<
  MutateRedactionBoundingBoxesRoute['requestBody'],
  MutateRedactionBoundingBoxesRoute['queryAndPathParams'],
  MutateRedactionBoundingBoxesRoute['response'],
  MutateRedactionBoundingBoxesRoute['authParams'],
  MutateRedactionBoundingBoxesRoute['pathParams']
>({
  method: 'POST',
  apiFunc: mutateRedactionBoundingBoxes,
  makeQueryAndPathParams: ({
    pathParams,
  }): MutateRedactionBoundingBoxesPathParams => ({
    key: pathParams.key,
  }),
});
