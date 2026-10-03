'use client';

import { useEffect, useRef } from 'react';

interface UseIntervalOptions {
  /** Ms between ticks. Pass `null` to pause without unmounting. */
  delayMs: number | null;
  /** Invoke once as soon as the hook mounts, then on each delay. */
  runOnMount?: boolean;
}

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
 * Pass `{ runOnMount: true }` to also invoke once immediately. That is
 * handy when the first tick should not wait a full delay, such as pinging
 * `openedAt` as soon as a review tab opens.
 */
export function useInterval(
  callback: () => unknown,
  options: UseIntervalOptions
): void {
  const { delayMs, runOnMount = false } = options;
  const savedCallback = useRef<(() => unknown) | null>(null);

  // Separate effect so a new callback doesn't reset the interval.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!runOnMount || delayMs === null) return;

    if (savedCallback.current) savedCallback.current();
  }, [callback, delayMs, runOnMount]);

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
