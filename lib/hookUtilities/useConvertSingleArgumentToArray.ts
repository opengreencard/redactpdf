import { useMemoizedCallback } from './useMemoizedCallback';

/**
 * Adapt a callback that accepts an array for a caller that provides one value.
 * For example, `useConvertSingleArgumentToArray(saveItems)` calls
 * `saveItems([item])`.
 */
export function useConvertSingleArgumentToArray<ValueT>(
  callback: (values: ValueT[]) => unknown
): (value: ValueT) => unknown {
  return useMemoizedCallback(
    (value: ValueT): unknown => callback([value]),
    [callback]
  );
}
