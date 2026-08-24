import axios, { AxiosProgressEvent, AxiosResponse } from 'axios';
import { ApplicationError } from '../../../lib/errors/applicationError';

/** Return type for POST route data transformation functions */
export interface POSTRouteData<RequestBodyT> {
  url: string;
  queryParams?: Record<string, string | number | boolean | undefined | null>;
  /** Note: this might be a FormData type if we're uploading a file */
  body?: RequestBodyT | FormData;
}

/** Return type for GET route data transformation functions */
export interface GETRouteData {
  url: string;
  queryParams?: Record<string, string | number | boolean | undefined | null>;
}

/** Options for POST route client functions. */
export interface ClientPOSTRouteOptions {
  /** Called with upload progress as a value between 0 and 1. */
  onUploadProgress?: (progress: number) => void;
}

/**
 * Make a client function that would make a POST request.
 *
 * The returned function accepts an optional `options` object so callers that
 * need upload progress (e.g., file uploads) can provide `onUploadProgress`.
 */
export function makeClientPOSTRoute<
  RequestBodyT,
  RequestPathAndQueryParamsT,
  ResponseT,
>(
  dataToUrlQueryStringAndBody: (
    data: RequestBodyT & RequestPathAndQueryParamsT
  ) => POSTRouteData<RequestBodyT>
): (
  data: RequestBodyT & RequestPathAndQueryParamsT,
  options?: ClientPOSTRouteOptions
) => Promise<ResponseT> {
  return async (
    data: RequestBodyT & RequestPathAndQueryParamsT,
    options: ClientPOSTRouteOptions = {}
  ): Promise<ResponseT> => {
    const { url, queryParams, body } = dataToUrlQueryStringAndBody(data);
    const { onUploadProgress } = options;
    return makeRequestAndHandleErrors(() =>
      axios({
        method: 'POST',
        url,
        params: queryParams,
        data: body,
        onUploadProgress: onUploadProgress
          ? (progressEvent: AxiosProgressEvent): void => {
              const progress: number | undefined =
                progressEvent.progress ??
                (progressEvent.total
                  ? progressEvent.loaded / progressEvent.total
                  : undefined);
              onUploadProgress(progress ?? 0);
            }
          : undefined,
      })
    );
  };
}

/** Make a client function that would make a GET request */
export function makeClientGETRoute<RequestT, ResponseT>({
  dataToUrlAndQueryString,
}: {
  dataToUrlAndQueryString: (data: RequestT) => GETRouteData;
}): (data: RequestT) => Promise<ResponseT> {
  return async (data: RequestT): Promise<ResponseT> => {
    const { url, queryParams } = dataToUrlAndQueryString(data);
    return makeRequestAndHandleErrors(() =>
      axios({
        method: 'GET',
        url,
        params: queryParams,
      })
    );
  };
}

/**
 * Call a function that processes an API request.
 * Handles ApplicationErrors and makes sure we send a response with the
 * right status codes and JSON.
 */
async function makeRequestAndHandleErrors<ResponseT>(
  request: () => Promise<AxiosResponse<ResponseT>>
): Promise<ResponseT> {
  try {
    const response = await request();
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data;
      if (
        typeof errorData === 'object' &&
        errorData.success === false &&
        typeof errorData.message === 'string'
      ) {
        throw new ApplicationError(errorData.message);
      }
    }

    throw new ApplicationError(
      'We ran into an unexpected error; please try again later.'
    );
  }
}
