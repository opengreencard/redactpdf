import { Dispatch, SetStateAction, useEffect, useState } from 'react';

/**
 * Utility hook that creates a state variable based on an `initialValue` prop,
 * and updates it whenever the `initialValue` changes.
 */
export function useStateFromProp<T>(
  initialValue: T,
  extraDependency?: unknown
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialValue);
  useEffect(() => {
    // Skip the update when the prop is referentially equal to current state.
    setState((prevState) =>
      initialValue !== prevState ? initialValue : prevState
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue, extraDependency]);
  return [state, setState];
}
