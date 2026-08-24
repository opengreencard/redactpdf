import { NextRequest, NextResponse } from 'next/server';
import {
  AppRouteHandlerFn,
  AppRouteHandlerFnContext,
  APIRouteBodyFormat,
  APIRouteResponseFormat,
  makeRequestParamsFromRequest,
  MakeRequestParamsFromRequestOptions,
  RawResponse,
  RedirectResponse,
  runFunctionAndHandleErrors,
} from './apiRouteCommon';
import { getUnreachableError } from '../typescript/getUnreachableError';

type MakePOSTAPIRouteAuthQueryPathOptions<
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
 * Wrap an API function so that it takes requests from Next.js and responds
 * according to the chosen body and response formats.
 *
 * We use function overloads because TypeScript cannot express the constraints
 * we need in a single generic signature:
 *
 * - When `bodyFormat` is `formData`, the request body type must contain a
 *   `body: FormData` field so callers can access `request.body.get(...)`.
 * - When `responseFormat` is `raw`, the response type must extend `RawResponse`.
 * - When `responseFormat` is `redirect`, the response type must extend
 *   `RedirectResponse`.
 *
 * Each overload below represents one valid (bodyFormat, responseFormat)
 * combination. The implementation signature that follows accepts the union of
 * all of them and delegates to the runtime handler.
 */

// Start overloads

export function makePOSTAPIRoute<
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
} & MakePOSTAPIRouteAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makePOSTAPIRoute<
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
} & MakePOSTAPIRouteAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makePOSTAPIRoute<
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
} & MakePOSTAPIRouteAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makePOSTAPIRoute<
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
} & MakePOSTAPIRouteAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makePOSTAPIRoute<
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
} & MakePOSTAPIRouteAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

export function makePOSTAPIRoute<
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
} & MakePOSTAPIRouteAuthQueryPathOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): AppRouteHandlerFn;

// End overloads

export function makePOSTAPIRoute<
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
} & MakePOSTAPIRouteAuthQueryPathOptions<
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
      // eslint-disable-next-line no-console
      console.error(error);
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }
  };
}
