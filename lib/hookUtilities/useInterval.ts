'use client';

import { useEffect, useRef } from 'react';

/**
 * Call `callback` on a delay, always using the latest callback. A plain
 * `setInterval` would keep the first render's closure, so it'd see stale
 * props and state.
 *
 * Copied from Dan Abramov's writeup, with small changes so it typechecks:
 * https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 *
 * A background tab still ticks. We want that: an open-but-unfocused tab
 * should keep its interval running.
 *
 * The first tick waits a full delay. Call the callback yourself if you
 * need something to happen on mount.
 */
export function useInterval(
  callback: () => unknown,
  /** Ms between ticks. Pass `null` to pause without unmounting. */
  delayMs: number | null
): void {
  const savedCallback = useRef<(() => unknown) | null>(null);

  // Separate effect so a new callback doesn't reset the interval.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // Returning undefined skips creating an interval. The previous effect's
    // cleanup already cleared the old one, so this pauses when delayMs is
    // null.
    if (delayMs === null) return undefined;

    const tick = (): void => {
      if (savedCallback.current) savedCallback.current();
    };
    const id = setInterval(tick, delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
