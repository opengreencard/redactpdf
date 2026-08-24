export interface DoneState<ResultT> {
  status: 'done';
  result: ResultT;
}

/** State representing an in-progress API request */
export interface InProgressState<ResultT> {
  status: 'inProgress';
  /**
   * A tentative result or the result from the previous API call.
   * There are times when we don't want to zero out the result until
   * the next API call completes, for a less jarring experience.
   */
  result?: ResultT;
}

/** State representing an error API result */
export interface ErrorState {
  status: 'error';
  error: string;
}

/**
 * A union type representing common states an API call can be in.
 * Generally, an API call is either ongoing (loading), errored, or
 * completed with a result, or `null` (yet to be called)
 */
export type APICallState<ResultT> =
  DoneState<ResultT> | InProgressState<ResultT> | ErrorState;

export function makeDoneState<ResultT>(result: ResultT): DoneState<ResultT> {
  return { status: 'done', result };
}

export function makeInProgressState<ResultT>(
  result?: ResultT
): InProgressState<ResultT> {
  return { status: 'inProgress', result };
}

export function makeErrorState(errorMessage: string): ErrorState {
  return { status: 'error', error: errorMessage };
}
