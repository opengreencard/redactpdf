import { useEffect, useRef } from 'react';
import { useMemoizedCallback } from './useMemoizedCallback';

/**
 * Wrap a function so that if we call it multiple times in short succession,
 * we'll only end up triggering the final call after no other calls have been
 * made for a while.
 *
 * Note: for usability, you should use useThrottle() for places where the user
 * can notice responsiveness.
 *
 * Examples:
 * - If we want to save text typing only after users stop editing, we should use
 *   useDebounce(), since the saves aren't visible to the user, and we only
 *   really need to save once.
 * - If we want to change which place the map is centered on as a user scrolls
 *   the page, we should use useThrottle(), since otherwise, the UI wouldn't
 *   update until after the user stops scrolling.
 *
 * Simulate _.debounce in a React Hooks environment; normally, using
 * _.debounce would create a new instance on every render in a hook.
 * This ensures that:
 * - When the debounced function gets called, it uses the latest state,
 *   etc. variables it references
 * - We cancel pending calls on each debounce
 *
 * Based on the `useInterval` implementation
 *
 * https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 */
export function useDebounce<T extends unknown[]>(
  callback: (...args: T) => unknown,
  /**
   * Delay between each invocation, in milliseconds. If `null`, will stop
   * the interval.
   */
  delay: number | null
) {
  return useDebounceWithCancel<T>(callback, delay).debouncedCallback;
}

/**
 * The same as the `useDebounce` hook, except that it also returns a callback
 * that can be used to cancel the pending debounced operation (if any). This is
 * useful in cases where setting `delay` to `null` is not feasible, for example,
 * on unmount
 */
export function useDebounceWithCancel<T extends unknown[]>(
  callback: (...args: T) => unknown,
  /**
   * Delay between each invocation, in milliseconds. If `null`, will stop
   * the interval.
   */
  delay: number | null
) {
  return useExtractedDebounceWithCancel<T, T>(
    callback,
    (...args) => args,
    delay
  );
}

/**
 * This implements `useDebounce` to solve the arguments being mutated before a
 * debounced call by extracting primitive or non-mutated values.
 * The following would cause an error:
 * ```
 * const myObj = { data: 10 };
 * const debouncedCall = useDebounce((obj) => 2 * obj.data, 100);
 * const value = debouncedCall(myObj);
 * myObj.data = null
 * // ~100ms later, debouncedCall fails
 * ```
 * This is solved with `useExtractedDebounce` like so:
 * ```
 * const myObj = { data: 10 };
 * const extractedDebounceCall = useExtractedDebounce(
 *  (data) => 2 * data,
 *  (obj) => obj.data,
 *  100
 * );
 * const value = debouncedCall(myObj);
 * myObj.data = null
 * // ~100ms later, value = 20
 * ```
 */
export function useExtractedDebounce<T extends unknown[], K extends unknown[]>(
  callback: (...args: T) => unknown,
  extract: (...args: K) => T,
  /**
   * Delay between each invocation, in milliseconds. If `null`, will stop
   * the interval.
   */
  delay: number | null
) {
  return useExtractedDebounceWithCancel<T, K>(callback, extract, delay)
    .debouncedCallback;
}

/**
 * The same as the `useExtractedDebounce` hook, except that it also returns a
 * callback that can be used to cancel the pending debounced operation (if any).
 * This is useful in cases where setting `delay` to `null` is not feasible, for
 * example, on unmount
 */
export function useExtractedDebounceWithCancel<
  T extends unknown[],
  K extends unknown[],
>(
  callback: (...args: T) => unknown,
  extract: (...args: K) => T,
  /**
   * Delay between each invocation, in milliseconds. If `null`, will stop
   * the interval.
   */
  delay: number | null
): {
  debouncedCallback: (...args: K) => unknown;
  cancelDebouncedCallback: () => unknown;
} {
  const savedCallback = useRef<(...args: T) => unknown>(() => {});
  const pendingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const cancelDebouncedCallback = useMemoizedCallback(() => {
    if (pendingTimeout.current) {
      clearTimeout(pendingTimeout.current);
      pendingTimeout.current = null;
    }
  }, []);

  // Return a function that will call the callback after a delay, as well as a
  // function that allows callers to cancel pending timeouts
  return {
    debouncedCallback: useMemoizedCallback(
      (...args: K) => {
        cancelDebouncedCallback();
        const saved = extract(...args);

        if (delay != null) {
          pendingTimeout.current = setTimeout(() => {
            pendingTimeout.current = null;
            savedCallback.current(...saved);
          }, delay);
        }
      },
      [cancelDebouncedCallback, delay, extract]
    ),
    cancelDebouncedCallback,
  };
}
