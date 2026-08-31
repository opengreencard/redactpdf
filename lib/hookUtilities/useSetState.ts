import { useMemoizedCallback } from './useMemoizedCallback';

/**
 * Stable handler that calls `setState` with a fixed value.
 * Prefer this over `useMemoizedCallback(() => setX(value), [value])`.
 */
export function useSetState<T>(setState: (val: T) => unknown, newValue: T) {
  return useMemoizedCallback(() => {
    // This wrapper is the form the set-state lint rule prefers.
    // eslint-disable-next-line no-restricted-syntax
    setState(newValue);
  }, [newValue, setState]);
}
