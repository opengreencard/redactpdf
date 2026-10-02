'use client';

import { useEffect, useRef } from 'react';
import { useScreenFocused } from './useScreenFocused';

/**
 * Makes using setInterval work well in a React Hooks environment; normally,
 * setInterval would reference stale variables on every run (since it relies
 * on the Javascript closure)
 *
 * Copy/pasted from React core developer Dan Abramov's blog, which also
 * explains why it's challenging, with small adjustments so that it
 * typechecks
 *
 * https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 *
 * On mobile, this also stops checking if the screen isn't focused. On web,
 * `useScreenFocused` always returns true, so a background tab still ticks.
 */
export function useInterval(
  callback: () => unknown,
  /** Delay between each invocation. If `null`, will stop the interval */
  delayMs: number | null
): void {
  const screenFocused = useScreenFocused();
  const savedCallback = useRef<(() => unknown) | null>(null);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    // If the screen isn't focused, clear interval
    if (!screenFocused) return undefined;
    if (delayMs === null) return undefined;

    const tick = (): void => {
      if (savedCallback.current) savedCallback.current();
    };
    const id = setInterval(tick, delayMs);
    return () => clearInterval(id);
  }, [delayMs, screenFocused]);
}
