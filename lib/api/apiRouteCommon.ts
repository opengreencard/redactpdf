import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth';
import { ApplicationError } from '../errors/applicationError';
import { FailureResponse } from '../types/response';
import { getAuthState } from '../auth/nextAuth';
import { getUnreachableError } from '../typescript/getUnreachableError';
import { UserAttributes } from '../models/User';

/** Minimal route-handler types used by both GET and POST route factories. */
export interface AppRouteHandlerFnContext {
  params: Promise<Record<string, string | string[] | undefined>>;
}

export type AppRouteHandlerFn = (
  request: NextRequest,
  context: AppRouteHandlerFnContext
) => Promise<Response>;

/**
 * Run a function that powers an API, and return its response as JSON or an error
 * if it fails
 */
export async function runFunctionAndHandleErrorsJSON<ResponseT>(
  func: () => Promise<ResponseT>
): Promise<NextResponse> {
  const result = await runFunctionAndHandleErrorsBase(func);

  if (result.success) {
    // We can't serialize undefined, so we return null instead
    return NextResponse.json(result.data ?? null);
  } else {
    return NextResponse.json(
      { success: false, message: result.message } satisfies FailureResponse,
      { status: result.statusCode }
    );
  }
}

/**
 * A response that can be returned from an API route that will be sent as-is
 * to the user (e.g., for a PDF or file download).
 */
export interface RawResponse {
  contentType: string;
  response: Buffer | string;
  additionalHeaders?: Record<string, string>;
}

/**
 * Run a function that powers an API, and return its raw response or an error
 * if it fails. The response will be returned directly without JSON serialization.
 */
export async function runFunctionAndHandleErrorsRaw<
  ResponseT extends RawResponse,
>(func: () => Promise<ResponseT>): Promise<NextResponse> {
  const result = await runFunctionAndHandleErrorsBase(func);

  if (result.success) {
    const responseBody =
      typeof result.data.response === 'string'
        ? result.data.response
        : new Uint8Array(result.data.response);
    return new NextResponse(responseBody, {
      headers: {
        'Content-Type': result.data.contentType,
        // Merge order: primary Content-Type first, then additionalHeaders may
        // override any key (including Content-Type)
        // eslint-disable-next-line no-restricted-syntax
        ...result.data.additionalHeaders,
      },
    });
  } else {
    return NextResponse.json(
      { success: false, message: result.message } satisfies FailureResponse,
      { status: result.statusCode }
    );
  }
}

/**
 * A response that can be returned from an API route that will redirect
 * the user to another URL.
 */
export interface RedirectResponse {
  redirectUrl: string;
  statusCode?: number;
}

/**
 * Run a function that powers an API, and return a redirect response or an error
 * if it fails. The response will redirect the user to the specified URL.
 */
export async function runFunctionAndHandleErrorsRedirect<
  ResponseT extends RedirectResponse,
>(func: () => Promise<ResponseT>): Promise<NextResponse> {
  const result = await runFunctionAndHandleErrorsBase(func);

  if (result.success) {
    return NextResponse.redirect(
      result.data.redirectUrl,
      result.data.statusCode
    );
  } else {
    return NextResponse.json(
      { success: false, message: result.message } satisfies FailureResponse,
      { status: result.statusCode }
    );
  }
}

/**
 * Supported formats for parsing the body of an API request.
 */
export enum APIRouteBodyFormat {
  json = 'json',
  formData = 'formData',
}

/**
 * Supported formats for serializing the response from an API route.
 */
export enum APIRouteResponseFormat {
  json = 'json',
  raw = 'raw',
  redirect = 'redirect',
}

/**
 * Run a function that powers an API and serialize its response according to
 * the requested response format.
 */
export async function runFunctionAndHandleErrors<ResponseT>(
  responseFormat: APIRouteResponseFormat,
  func: () => Promise<ResponseT>
): Promise<NextResponse> {
  switch (responseFormat) {
    case APIRouteResponseFormat.raw:
      return runFunctionAndHandleErrorsRaw(func as () => Promise<RawResponse>);
    case APIRouteResponseFormat.redirect:
      return runFunctionAndHandleErrorsRedirect(
        func as () => Promise<RedirectResponse>
      );
    case APIRouteResponseFormat.json:
      return runFunctionAndHandleErrorsJSON(func);
    default:
      throw getUnreachableError(responseFormat);
  }
}

type ResponseResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
      statusCode: number;
    };

/**
 * Base function that handles running a function and catching errors, returning a standardized result
 */
async function runFunctionAndHandleErrorsBase<ResponseT>(
  func: () => Promise<ResponseT>
): Promise<ResponseResult<ResponseT>> {
  try {
    const result = await func();
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ApplicationError) {
      return {
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      };
    } else {
      // eslint-disable-next-line no-console
      console.error(error);
      return {
        success: false,
        message: 'We ran into an unexpected error: please try again later',
        statusCode: 500,
      };
    }
  }
}

/**
 * Function that can be passed into an API route that will map from
 * the Next.js Session object to parameters to pass into the API function that
 * depend on the logged-in user.
 *
 * @example
 * ```ts
 * async function echoUserName(userName: string | null) {
 *   return userName;
 * }
 *
 * export const GET = makeGETAPIRoute({
 *   apiFunc: echoUserName,
 *   injectAuth: async (session) => ({
 *     userName: session?.user.name,
 *   }),
 * });
 * ```
 */
export type InjectAuthFunction<AuthParamsT> = (
  session: Session | null
) => Promise<AuthParamsT>;

export interface MakeRequestParamsFromRequestOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT = {},
  PathParamsT extends {} = {},
> {
  request: NextRequest;
  context: AppRouteHandlerFnContext;

  makeQueryAndPathParams:
    | MakeQueryAndPathParamsFunction<
        TransformedQueryAndPathParamsT,
        PathParamsT
      >
    | undefined;

  /**
   * If passed in, we'll get the active logged-in user's session whenever
   * this API is called and inject it into the function call
   */
  makeAuthParams: ((session: Session | null) => AuthParamsT) | undefined;

  /**
   * If passed in, we'll get the active logged-in user's session, and also
   * throw an ApplicationError if the user is not logged in
   */
  makeRequiredAuthParams: ((user: UserAttributes) => AuthParamsT) | undefined;
}

/**
 * Take the request and context from Next.js and turn them into a set of
 * parameters that can be passed into an API function. Used primarily by
 * makeGETAPIRoute and makePOSTAPIRoute
 */
export async function makeRequestParamsFromRequest<
  TransformedQueryAndPathParamsT,
  AuthParamsT = {},
  PathParamsT extends {} = {},
>({
  makeQueryAndPathParams,
  request,
  context,
  makeAuthParams,
  makeRequiredAuthParams,
}: MakeRequestParamsFromRequestOptions<
  TransformedQueryAndPathParamsT,
  AuthParamsT,
  PathParamsT
>): Promise<TransformedQueryAndPathParamsT & AuthParamsT> {
  // context.params contains the path parameters, while
  // request.nextUrl.searchParams contains the query-string parameters.
  //
  // We prioritize path parameters over query parameters so someone doesn't
  // do e.g., `/api/user/1?id=2` and get the wrong user.

  // TODO: add request validation to make sure it's the right type
  return {
    ...(makeQueryAndPathParams
      ? makeQueryAndPathParams({
          queryParams: Object.fromEntries(request.nextUrl.searchParams),
          pathParams: (await context.params) as PathParamsT,
        })
      : {}),
    ...(makeAuthParams ? makeAuthParams(await getAuthState()) : {}),
    ...(makeRequiredAuthParams
      ? makeRequiredAuthParams(await getLoggedInUserOrError())
      : {}),
  } as TransformedQueryAndPathParamsT & AuthParamsT;
}

/**
 * Get the current session's logged-in user, or throw an error if not logged
 * in
 */
export async function getLoggedInUserOrError(): Promise<UserAttributes> {
  const authState = await getAuthState();
  if (!authState || !authState.user) {
    throw new ApplicationError(
      "You're not currently logged in. Please log in to access this page",
      401
    );
  }
  return authState.user;
}

export type MakeQueryAndPathParamsFunction<
  TransformedQueryAndPathParamsT,
  PathParamsT extends {} = {},
> = (options: {
  queryParams: Record<string, string>;
  pathParams: PathParamsT;
}) => TransformedQueryAndPathParamsT;
