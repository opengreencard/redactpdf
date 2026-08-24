'use client';

import { useRef } from 'react';

/**
 * Hook that returns a ref with the latest value of some variable
 * useful for dealing with async functions which can change state
 */
export function useLatestValueRef<T>(value: T) {
  const ref = useRef<T>(value);
  ref.current = value;
  return ref;
}
