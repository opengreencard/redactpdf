import {
  makeAPIRouteWithBody,
  MakeAPIRouteWithBodyTypes,
} from '../../../../../lib/api/makeAPIRouteWithBody';
import type {
  MutateRedactionBoundingBoxesBody,
  MutateRedactionBoundingBoxesPathParams,
} from '../../../../../lib/redaction/redactionAPI';
import { mutateRedactionBoundingBoxes } from './mutateRedactionBoundingBoxes';

type MutateRedactionBoundingBoxesRoute = MakeAPIRouteWithBodyTypes<
  MutateRedactionBoundingBoxesBody,
  MutateRedactionBoundingBoxesPathParams,
  void,
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
