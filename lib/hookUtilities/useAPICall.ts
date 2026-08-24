import { useCallback, useRef, useState } from 'react';
import { useMemoizedCallback } from './useMemoizedCallback';
import {
  APICallState,
  DoneState,
  ErrorState,
  makeDoneState,
  makeErrorState,
  makeInProgressState,
} from '../typescript/apiCallState';
import { delay } from '../utilities/delay';

/**
 * Create a hook for making an API call and storing the state of the call
 * in a state variable.
 *
 * @example
 * ```tsx
 * const { call: onSubmit, state: submitState } = useAPICall(useCallback(
 *   () => submit(formData),
 *   [formData],
 * ));
 *
 * return <SomeComponent onSubmit={onSubmit} submitState={submitState} />;
 * ```
 */
export function useAPICall<ResultT, ArgsT extends any[]>(
  apiCallMaker: (...args: ArgsT) => Promise<ResultT>,
  options: {
    /**
     * Whether to keep the previous result while the API is being called again.
     *
     * Sometimes, for a page, we might e.g., have a "Refresh" button that,
     * on click, we don't want to clear the previous result. If that's the
     * case, we'll keep the previous result on the new LoadingState.
     */
    keepResultWhileLoading?: boolean;

    /**
     * If passed, will repeat the API call until we get a result that causes
     * this function to return true. Often useful for APIs that we need to
     * poll repeatedly until something is ready.
     */
    repeatUntil?: (result: ResultT) => boolean;

    /**
     * If repeatUntil is specified, the time to wait between repeat requests.
     * Defaults to 1000 (1 second)
     */
    repeatIntervalMs?: number;

    /**
     * If passed in, will initialize with a certain state. Useful for
     * testing in Storybook
     */
    initialState?: APICallState<ResultT> | null;
  } = {}
): {
  call: (...args: ArgsT) => Promise<ErrorState | DoneState<ResultT>>;
  state: APICallState<ResultT> | null;
  setStateResult: (result: ResultT) => void;
  clearState: () => void;
} {
  /** Used to ensure only the latest API call can affect the state */
  const latestAPICallIdRef = useRef<number>(0);
  const [state, setState] = useState<APICallState<ResultT> | null>(
    options.initialState ?? null
  );

  const result = state && state.status !== 'error' ? state.result : undefined;

  const apiCallIdCounterRef = useRef(1);

  const handleCallAPI = useMemoizedCallback(
    async (...args: ArgsT) => {
      // Create a wrapped setState so only the latest call actually sets the
      // state
      const apiCallId = apiCallIdCounterRef.current++;
      latestAPICallIdRef.current = apiCallId;
      const wrappedSetState = (newState: APICallState<ResultT> | null) => {
        if (latestAPICallIdRef.current === apiCallId) setState(newState);
      };

      // Call the function, passing in the setState so state can be updated
      // during the call
      let isComplete = false;
      let updatedState: DoneState<ResultT> | ErrorState | null = null;

      let resultToKeepWhileLoading = options.keepResultWhileLoading
        ? result
        : undefined;

      // !updatedState in theory is redundant (we'll set isComplete to true
      // whenever updatedState is set), but helps the typechecker make
      // sure that we never return null
      while (!isComplete || !updatedState) {
        // eslint-disable-next-line no-await-in-loop
        const thisCallState = await callAPI(
          apiCallMaker(...args),
          wrappedSetState,
          { resultToKeepWhileLoading }
        );
        updatedState = thisCallState;

        isComplete =
          thisCallState.status === 'error' || // Stop if we got an error
          !options.repeatUntil || // Repeat only if `repeatUntil` passed in
          options.repeatUntil(thisCallState.result);

        // If we call the API call again, we want to keep the result during
        // loading state
        resultToKeepWhileLoading =
          thisCallState.status === 'done' ? thisCallState.result : undefined;

        // eslint-disable-next-line no-await-in-loop
        if (!isComplete) await delay(options.repeatIntervalMs ?? 1000);
      }

      return updatedState;
    },
    [apiCallMaker, options, result]
  );

  /**
   * Sometimes, we want an API call to fetch some data, but we then want
   * to update it in state without an extra API call. This function helps
   * do so more easily
   */
  const setStateResult = useCallback((newResult: ResultT) => {
    latestAPICallIdRef.current = apiCallIdCounterRef.current++;

    setState((curState) =>
      curState?.status === 'done'
        ? { ...curState, result: newResult }
        : curState
    );
  }, []);

  /**
   * Sometimes, after an API call has been made, we want to discard the results
   * (including errors). For example, if we want to reset a user interaction to
   * a point before an API call was made, we'd want to set the state back to
   * its default value, null.
   */
  const clearState = useCallback(() => {
    // Ensure the reset doesn't get clobbered by a late result
    latestAPICallIdRef.current = apiCallIdCounterRef.current++;

    setState(null);
  }, []);

  return { call: handleCallAPI, state, setStateResult, clearState };
}

/**
 * Make an API call, setting the state on some variable.
 *
 * In general, you only need to use this for advanced cases; in most cases,
 * prefer using useAPICall()
 *
 * @example If we're making a bunch of API calls, and need to save the
 *          results keyed into an array, `useAPICall()` wouldn't work.
 *          Instead, use `callAPI` directly
 *
 * ```tsx
 * const [responsesById, setResponsesById] = useState<{
 *   [id: number]: APICallState<void>;
 * }>({});
 *
 * const handleSaveAllEntries = useMemoizedCallback(async () => {
 *   await Promise.all(ids.map(async (id) => {
 *     await callAPI(fetchFromServer, (state) => {
 *       setResponsesById(responses => ({ ...responses, [id]: state }));
 *     });
 *   }))
 * });
 *
 * return <SomeComponent responses={responsesById} onSave={handleSaveAll} />;
 * ```
 */
export async function callAPI<ResultT>(
  apiCall: Promise<ResultT>,
  setState: (state: APICallState<ResultT>) => unknown,
  options: {
    /**
     * The previous result while the API is being called again.
     *
     * Sometimes, for a page, we might e.g., have a "Refresh" button that,
     * on click, we don't want to clear the previous result. If that's the
     * case, we'll keep the previous result on the new LoadingState.
     */
    resultToKeepWhileLoading?: ResultT;
  } = {}
) {
  setState(makeInProgressState(options.resultToKeepWhileLoading));
  return callAPIWithoutInProgressState(apiCall, setState);
}

/**
 * Like `callAPI`, but does not set the state to loading initially. This
 * should only be used by rare use-cases that may want to call the API to
 * replace cached or existing data without flickering to a loading state
 * first.
 */
export async function callAPIWithoutInProgressState<ResultT>(
  apiCall: Promise<ResultT>,
  setState: (state: APICallState<ResultT>) => unknown
) {
  try {
    const result = await apiCall;
    const doneState = makeDoneState(result);
    setState(doneState);
    return doneState;
  } catch (err) {
    const errorState = makeErrorState(err.message);
    setState(errorState);
    return errorState;
  }
}
