/**
 * A successful response, returned when a file is successfully uplaoded
 */
export interface SuccessResponse<DataT> {
  success: true;
  data: DataT;
}

/**
 * A failed response, returned when there's an error while uploading a file
 */
export interface FailureResponse {
  success: false;
  message: string;
}

export type JSONResponse<DataT> = SuccessResponse<DataT> | FailureResponse;
