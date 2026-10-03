import axios, {
  AxiosProgressEvent,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { ApplicationError } from '../../../lib/errors/applicationError';

/** URL, query, and body for a client request that sends a payload. */
export interface ClientAPIRouteWithBodyData<RequestBodyT> {
  url: string;
  queryParams?: Record<string, string | number | boolean | undefined | null>;
  /** Note: this might be a FormData type if we're uploading a file */
  body?: RequestBodyT | FormData;
}

/** URL and query for a client request with no body. */
export interface ClientAPIRouteWithoutBodyData {
  url: string;
  queryParams?: Record<string, string | number | boolean | undefined | null>;
}

/** Options shared by all client route factories. */
interface ClientRouteOptions {
  /** Axios response format, such as `arraybuffer` for file downloads. */
  responseType?: AxiosRequestConfig['responseType'];
}

/** Extra options for body routes that upload files. */
interface ClientAPIRouteWithBodyCallOptions {
  /** Called with upload progress as a value between 0 and 1. */
  onUploadProgress?: (progress: number) => void;
}

/**
 * Make a client function for POST, DELETE, or PATCH.
 *
 * Axios still sends a JSON body on DELETE via `data`. That's useful when
 * the request needs a nested object instead of query params.
 */
export function makeClientAPIRouteWithBody<
  RequestBodyT,
  RequestPathAndQueryParamsT,
  ResponseT,
>({
  method,
  dataToUrlQueryStringAndBody,
  responseType,
}: {
  method: 'POST' | 'DELETE' | 'PATCH';
  dataToUrlQueryStringAndBody: (
    data: RequestBodyT & RequestPathAndQueryParamsT
  ) => ClientAPIRouteWithBodyData<RequestBodyT>;
} & ClientRouteOptions): (
  data: RequestBodyT & RequestPathAndQueryParamsT,
  options?: ClientAPIRouteWithBodyCallOptions
) => Promise<ResponseT> {
  return async (
    data: RequestBodyT & RequestPathAndQueryParamsT,
    options: ClientAPIRouteWithBodyCallOptions = {}
  ): Promise<ResponseT> => {
    const { url, queryParams, body } = dataToUrlQueryStringAndBody(data);
    const { onUploadProgress } = options;
    return makeRequestAndHandleErrors(() =>
      axios({
        method,
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

/**
 * Make a client GET function. GET has no body, so we only turn the request
 * into a URL and query string.
 */
export function makeClientAPIRouteWithoutBody<RequestT, ResponseT>({
  method,
  dataToUrlAndQueryString,
  responseType,
}: {
  method: 'GET';
  dataToUrlAndQueryString: (data: RequestT) => ClientAPIRouteWithoutBodyData;
} & ClientRouteOptions): (data: RequestT) => Promise<ResponseT> {
  return async (data: RequestT): Promise<ResponseT> => {
    const { url, queryParams } = dataToUrlAndQueryString(data);
    return makeRequestAndHandleErrors(() =>
      axios({
        method,
        url,
        params: queryParams,
        responseType,
      })
    );
  };
}

/**
 * Run an Axios call and turn a failed JSON envelope into an
 * ApplicationError so UI code can show the server's message.
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

function getApplicationErrorMessage(error: Error): string | null {
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
