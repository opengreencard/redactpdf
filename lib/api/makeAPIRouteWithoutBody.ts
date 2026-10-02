import { NextRequest } from 'next/server';
import {
  APIRouteResponseFormat,
  AppRouteHandlerFn,
  AppRouteHandlerFnContext,
  makeRequestParamsFromRequest,
  MakeRequestParamsFromRequestOptions,
  RawResponse,
  RedirectResponse,
  runFunctionAndHandleErrors,
} from './makeAPIRoute';

type MakeAPIRouteWithoutBodyAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT extends {} = {},
> = {
  /**
   * Next.js still routes from the export name (`GET`). We take `method` so the
   * call site documents the verb next to that export.
   */
  method: 'GET';
} & Partial<
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
 * Wrap an API function that has no request body (query and path params only).
 *
 * Overloads exist because TypeScript cannot express "when responseFormat is
 * raw, ResponseT must extend RawResponse" and "when responseFormat is
 * redirect, ResponseT must extend RedirectResponse" in a single generic
 * signature.
 *
 * @example
 * ```ts
 * export const GET = makeAPIRouteWithoutBody({
 *   method: 'GET',
 *   apiFunc: getBlah,
 *   makeQueryAndPathParams: ({ pathParams }) => ({
 *     id: parseInt(pathParams.id, 10),
 *   }),
 * });
 * ```
 */

// Start overloads

export function makeAPIRouteWithoutBody<
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
} & MakeAPIRouteWithoutBodyAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makeAPIRouteWithoutBody<
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
} & MakeAPIRouteWithoutBodyAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makeAPIRouteWithoutBody<
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
} & MakeAPIRouteWithoutBodyAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

// End overloads

export function makeAPIRouteWithoutBody<
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
} & MakeAPIRouteWithoutBodyAuthQueryPathOptions<
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
