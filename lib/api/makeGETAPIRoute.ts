import { NextRequest } from 'next/server';
import {
  AppRouteHandlerFn,
  AppRouteHandlerFnContext,
  APIRouteResponseFormat,
  makeRequestParamsFromRequest,
  MakeRequestParamsFromRequestOptions,
  RawResponse,
  RedirectResponse,
  runFunctionAndHandleErrors,
} from './apiRouteCommon';

type MakeGETAPIRouteAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT extends {} = {},
> = Partial<
  Pick<
    MakeRequestParamsFromRequestOptions<
      TransformedQueryAndPathParamsT,
      AuthParamsT,
      PathParamsT
    >,
    'makeQueryAndPathParams' | 'makeAuthParams' | 'makeRequiredAuthParams'
  >
>;

/**
 * Wrap an API function so that it takes GET requests from Next.js and
 * responds according to the chosen response format.
 *
 * We use function overloads because TypeScript cannot express "when
 * responseFormat is raw, ResponseT must extend RawResponse" and "when
 * responseFormat is redirect, ResponseT must extend RedirectResponse" in a
 * single generic signature. Each overload below represents one valid response
 * format, and the implementation signature that follows accepts the union of
 * all of them and delegates to the runtime handler.
 *
 * @example
 * ```ts
 * interface GetBlahQueryParams {
 *   id: number;
 * }
 *
 * interface GetBlahAuthParams {
 *   userId: number | null;
 * }
 *
 * async function getBlah({ id, userId }: GetBlahQueryParams & GetBlahAuthParams) {
 *   return await Blah.findOne({ where: { id, userId }, raw: true });
 * }
 *
 * export const GET = makeGETAPIRoute({
 *   apiFunc: getBlah,
 *   makeQueryAndPathParams: ({ pathParams }) => ({
 *     id: parseInt(pathParams.id, 10),
 *   }),
 *   makeAuthParams: ({ session }) => ({
 *     userId: session?.user?.id ?? null,
 *   }),
 * });
 * ```
 */

// Start overloads

export function makeGETAPIRoute<
  TransformedQueryAndPathParamsT,
  ResponseT,
  AuthParamsT = {},
  PathParamsT extends {} = {},
>({
  apiFunc,
  makeAuthParams,
  makeQueryAndPathParams,
  makeRequiredAuthParams,
  responseFormat,
}: {
  responseFormat?: APIRouteResponseFormat.json;
  additionalHeaders?: Record<string, string>;
  apiFunc: (
    request: TransformedQueryAndPathParamsT & AuthParamsT
  ) => Promise<ResponseT>;
} & MakeGETAPIRouteAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makeGETAPIRoute<
  TransformedQueryAndPathParamsT,
  ResponseT extends RawResponse,
  AuthParamsT = {},
  PathParamsT extends {} = {},
>({
  apiFunc,
  makeAuthParams,
  makeQueryAndPathParams,
  makeRequiredAuthParams,
  responseFormat,
}: {
  responseFormat: APIRouteResponseFormat.raw;
  additionalHeaders?: Record<string, string>;
  apiFunc: (
    request: TransformedQueryAndPathParamsT & AuthParamsT
  ) => Promise<ResponseT>;
} & MakeGETAPIRouteAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makeGETAPIRoute<
  TransformedQueryAndPathParamsT,
  ResponseT extends RedirectResponse,
  AuthParamsT = {},
  PathParamsT extends {} = {},
>({
  apiFunc,
  makeAuthParams,
  makeQueryAndPathParams,
  makeRequiredAuthParams,
  responseFormat,
}: {
  responseFormat: APIRouteResponseFormat.redirect;
  additionalHeaders?: Record<string, string>;
  apiFunc: (
    request: TransformedQueryAndPathParamsT & AuthParamsT
  ) => Promise<ResponseT>;
} & MakeGETAPIRouteAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

// End overloads

export function makeGETAPIRoute<
  TransformedQueryAndPathParamsT,
  ResponseT,
  AuthParamsT = {},
  PathParamsT extends {} = {},
>({
  apiFunc,
  makeAuthParams,
  makeQueryAndPathParams,
  makeRequiredAuthParams,
  responseFormat = APIRouteResponseFormat.json,
  additionalHeaders = {},
}: {
  apiFunc: (request: any) => Promise<ResponseT>;
  responseFormat?: APIRouteResponseFormat;
  additionalHeaders?: Record<string, string>;
} & MakeGETAPIRouteAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn {
  return async (request: NextRequest, context: AppRouteHandlerFnContext) => {
    const requestParams = await makeRequestParamsFromRequest<
      TransformedQueryAndPathParamsT,
      AuthParamsT,
      PathParamsT
    >({
      makeAuthParams,
      makeQueryAndPathParams,
      makeRequiredAuthParams,
      request,
      context,
    });

    return runFunctionAndHandleErrors(
      responseFormat,
      () => apiFunc(requestParams),
      additionalHeaders
    );
  };
}
