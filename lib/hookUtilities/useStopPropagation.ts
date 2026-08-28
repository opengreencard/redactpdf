import { useCallback } from 'react';

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
  // TODO: Rename generic to end in T (e.g., BlahT)
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Event extends { stopPropagation: () => unknown },
>(handler: (() => unknown) | null) {
  return useCallback(
    (event?: Event | null | undefined) => {
      // Be extra super-duper safe and permissive in our typings
      if (event) event.stopPropagation();
      if (handler) handler();
    },
    [handler]
  );
}
