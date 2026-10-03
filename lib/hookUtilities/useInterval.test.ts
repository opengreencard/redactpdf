/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useInterval } from './useInterval';

describe(useInterval, () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('invokes the latest callback on each tick', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook<
      void,
      {
        callback: () => void;
        delayMs: number | null;
      }
    >(({ callback, delayMs }) => useInterval(callback, delayMs), {
      initialProps: { callback: first, delayMs: 1000 },
    });

    jest.advanceTimersByTime(1000);
    expect(first).toHaveBeenCalledTimes(1);

    rerender({ callback: second, delayMs: 1000 });
    jest.advanceTimersByTime(1000);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops when delayMs is null', () => {
    const callback = jest.fn();
    const { rerender } = renderHook<
      void,
      {
        callback: () => void;
        delayMs: number | null;
      }
    >(({ callback: cb, delayMs }) => useInterval(cb, delayMs), {
      initialProps: { callback, delayMs: 1000 as number | null },
    });

    rerender({ callback, delayMs: null });
    jest.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });
});
