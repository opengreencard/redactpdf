import { useCallback } from 'react';

/** Stop an event from bubbling to an ancestor handler. */
export function stopPropagation(event: {
  stopPropagation: () => unknown;
}): void {
  event.stopPropagation();
}

/**
 * Wrap a onXXX handler with stopPropagation so that clicks, etc. get
 * stopped from bubbling up. Useful if we have a button that's contained
 * by another element with a click handler
 *
 * Example:
 * ```tsx
 * <div onClick={doSomething}>
 *   <button onClick={useStopPropagation(doSomethingElse)} />
 * </div>
 * ```
 */
export function useStopPropagation<
  EventT extends { stopPropagation: () => unknown },
>(handler: (() => unknown) | null) {
  return useCallback(
    (event?: EventT | null | undefined) => {
      // Be extra super-duper safe and permissive in our typings
      if (event) event.stopPropagation();
      if (handler) handler();
    },
    [handler]
  );
}
