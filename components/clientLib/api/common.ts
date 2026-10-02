import axios, {
  AxiosProgressEvent,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
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

/** Options shared by all client route factories. */
interface ClientRouteOptions {
  /** Axios response format, such as `arraybuffer` for file downloads. */
  responseType?: AxiosRequestConfig['responseType'];
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
  ) => POSTRouteData<RequestBodyT>,
  { responseType }: ClientRouteOptions = {}
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
        responseType,
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
  responseType,
}: {
  dataToUrlAndQueryString: (data: RequestT) => GETRouteData;
} & ClientRouteOptions): (data: RequestT) => Promise<ResponseT> {
  return async (data: RequestT): Promise<ResponseT> => {
    const { url, queryParams } = dataToUrlAndQueryString(data);
    return makeRequestAndHandleErrors(() =>
      axios({
        method: 'GET',
        url,
        params: queryParams,
        responseType,
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
    const errorMessage = getApplicationErrorMessage(error);
    if (errorMessage) {
      throw new ApplicationError(errorMessage);
    }

    throw new ApplicationError(
      'We ran into an unexpected error; please try again later.'
    );
  }
}

function getApplicationErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error) || !error.response?.data) {
    return null;
  }

  const responseData: unknown = error.response.data;
  let errorData: unknown = responseData;

  // Axios normally exposes an ArrayBuffer in the browser for an
  // `arraybuffer` request. Node adapters and test doubles may expose the same
  // bytes as a Uint8Array instead; both need to be decoded before parsing the
  // JSON error envelope.
  if (
    responseData instanceof ArrayBuffer ||
    responseData instanceof Uint8Array
  ) {
    try {
      errorData = JSON.parse(new TextDecoder().decode(responseData));
    } catch {
      return null;
    }
  } else if (typeof responseData === 'string') {
    try {
      errorData = JSON.parse(responseData);
    } catch {
      return null;
    }
  }

  if (
    typeof errorData === 'object' &&
    errorData !== null &&
    'success' in errorData &&
    'message' in errorData &&
    errorData.success === false &&
    typeof errorData.message === 'string'
  ) {
    return errorData.message;
  }

  return null;
}
