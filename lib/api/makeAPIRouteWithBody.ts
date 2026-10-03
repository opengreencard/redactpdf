import { NextRequest, NextResponse } from 'next/server';
import {
  APIRouteBodyFormat,
  APIRouteResponseFormat,
  AppRouteHandlerFn,
  AppRouteHandlerFnContext,
  makeRequestParamsFromRequest,
  MakeRequestParamsFromRequestOptions,
  RawResponse,
  RedirectResponse,
  runFunctionAndHandleErrors,
} from './makeAPIRoute';
import { getUnreachableError } from '../typescript/getUnreachableError';
import { FailureResponse } from '../types/response';

/**
 * Named slots for `makeAPIRouteWithBody` type parameters so call sites can
 * write `Route['requestBody']` instead of remembering the generic order.
 *
 * Without this helper:
 * `makeAPIRouteWithBody<Body, Params, Response, Auth, Path>(...)`
 *
 * With it:
 * `makeAPIRouteWithBody<Route['requestBody'], Route['queryAndPathParams'],`
 * `Route['response'], Route['authParams'], Route['pathParams']>(...)`
 */
export interface MakeAPIRouteWithBodyTypes<
  RequestBodyT,
  QueryAndPathParamsT,
  ResponseT,
  AuthParamsT = {},
  PathParamsT extends {} = {},
> {
  requestBody: RequestBodyT;
  queryAndPathParams: QueryAndPathParamsT;
  response: ResponseT;
  authParams: AuthParamsT;
  pathParams: PathParamsT;
}

type MakeAPIRouteWithBodyAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT extends {} = {},
> = {
  /**
   * Next.js still routes from the export name (`POST` / `DELETE` / `PATCH`).
   * We take `method` so the call site documents the verb next to that export.
   */
  method: 'POST' | 'DELETE' | 'PATCH';
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
 * Wrap an API function that reads a JSON or FormData body.
 *
 * Overloads exist because TypeScript cannot express the constraints we need
 * in a single generic signature:
 *
 * - When `bodyFormat` is `formData`, the request body type must contain a
 *   `body: FormData` field so callers can access `request.body.get(...)`.
 * - When `responseFormat` is `raw`, the response type must extend
 *   `RawResponse`.
 * - When `responseFormat` is `redirect`, the response type must extend
 *   `RedirectResponse`.
 */

export function makeAPIRouteWithBody<
  RequestBodyT,
  TransformedQueryAndPathParamsT,
  ResponseT,
  AuthParamsT = {},
  PathParamsT extends {} = {},
>({
  apiFunc,
  makeAuthParams,
  makeQueryAndPathParams,
  makeRequiredAuthParams,
  bodyFormat,
  responseFormat,
}: {
  bodyFormat?: APIRouteBodyFormat.json;
  responseFormat?: APIRouteResponseFormat.json;
  apiFunc: (
    request: RequestBodyT & TransformedQueryAndPathParamsT & AuthParamsT
  ) => Promise<ResponseT>;
} & MakeAPIRouteWithBodyAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makeAPIRouteWithBody<
  RequestBodyT,
  TransformedQueryAndPathParamsT,
  ResponseT extends RawResponse,
  AuthParamsT = {},
  PathParamsT extends {} = {},
>({
  apiFunc,
  makeAuthParams,
  makeQueryAndPathParams,
  makeRequiredAuthParams,
  bodyFormat,
  responseFormat,
}: {
  bodyFormat?: APIRouteBodyFormat.json;
  responseFormat: APIRouteResponseFormat.raw;
  apiFunc: (
    request: RequestBodyT & TransformedQueryAndPathParamsT & AuthParamsT
  ) => Promise<ResponseT>;
} & MakeAPIRouteWithBodyAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makeAPIRouteWithBody<
  RequestBodyT,
  TransformedQueryAndPathParamsT,
  ResponseT extends RedirectResponse,
  AuthParamsT = {},
  PathParamsT extends {} = {},
>({
  apiFunc,
  makeAuthParams,
  makeQueryAndPathParams,
  makeRequiredAuthParams,
  bodyFormat,
  responseFormat,
}: {
  bodyFormat?: APIRouteBodyFormat.json;
  responseFormat: APIRouteResponseFormat.redirect;
  apiFunc: (
    request: RequestBodyT & TransformedQueryAndPathParamsT & AuthParamsT
  ) => Promise<ResponseT>;
} & MakeAPIRouteWithBodyAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makeAPIRouteWithBody<
  RequestBodyT extends { body: FormData },
  TransformedQueryAndPathParamsT,
  ResponseT,
  AuthParamsT = {},
  PathParamsT extends {} = {},
>({
  apiFunc,
  makeAuthParams,
  makeQueryAndPathParams,
  makeRequiredAuthParams,
  bodyFormat,
  responseFormat,
}: {
  bodyFormat: APIRouteBodyFormat.formData;
  responseFormat?: APIRouteResponseFormat.json;
  apiFunc: (
    request: RequestBodyT & TransformedQueryAndPathParamsT & AuthParamsT
  ) => Promise<ResponseT>;
} & MakeAPIRouteWithBodyAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makeAPIRouteWithBody<
  RequestBodyT extends { body: FormData },
  TransformedQueryAndPathParamsT,
  ResponseT extends RawResponse,
  AuthParamsT = {},
  PathParamsT extends {} = {},
>({
  apiFunc,
  makeAuthParams,
  makeQueryAndPathParams,
  makeRequiredAuthParams,
  bodyFormat,
  responseFormat,
}: {
  bodyFormat: APIRouteBodyFormat.formData;
  responseFormat: APIRouteResponseFormat.raw;
  apiFunc: (
    request: RequestBodyT & TransformedQueryAndPathParamsT & AuthParamsT
  ) => Promise<ResponseT>;
} & MakeAPIRouteWithBodyAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makeAPIRouteWithBody<
  RequestBodyT extends { body: FormData },
  TransformedQueryAndPathParamsT,
  ResponseT extends RedirectResponse,
  AuthParamsT = {},
  PathParamsT extends {} = {},
>({
  apiFunc,
  makeAuthParams,
  makeQueryAndPathParams,
  makeRequiredAuthParams,
  bodyFormat,
  responseFormat,
}: {
  bodyFormat: APIRouteBodyFormat.formData;
  responseFormat: APIRouteResponseFormat.redirect;
  apiFunc: (
    request: RequestBodyT & TransformedQueryAndPathParamsT & AuthParamsT
  ) => Promise<ResponseT>;
} & MakeAPIRouteWithBodyAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makeAPIRouteWithBody<
  RequestBodyT,
  TransformedQueryAndPathParamsT,
  ResponseT,
  AuthParamsT = {},
  PathParamsT extends {} = {},
>({
  apiFunc,
  makeAuthParams,
  makeQueryAndPathParams,
  makeRequiredAuthParams,
  bodyFormat = APIRouteBodyFormat.json,
  responseFormat = APIRouteResponseFormat.json,
}: {
  apiFunc: (request: any) => Promise<ResponseT>;
  bodyFormat?: APIRouteBodyFormat;
  responseFormat?: APIRouteResponseFormat;
} & MakeAPIRouteWithBodyAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn {
  return async (request: NextRequest, context: AppRouteHandlerFnContext) => {
    try {
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

      let requestArg: any;

      if (bodyFormat === APIRouteBodyFormat.formData) {
        const body = await request.formData();
        requestArg = { ...requestParams, body };
      } else if (bodyFormat === APIRouteBodyFormat.json) {
        const body = (await request.json()) as RequestBodyT;
        requestArg = { ...requestParams, ...body };
      } else {
        throw getUnreachableError(bodyFormat);
      }

      return await runFunctionAndHandleErrors(responseFormat, () =>
        apiFunc(requestArg)
      );
    } catch (error) {
      // Log the parse failure; the client only gets "Invalid request body".
      // eslint-disable-next-line no-console
      console.error(error);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body',
        } satisfies FailureResponse,
        { status: 400 }
      );
    }
  };
}
