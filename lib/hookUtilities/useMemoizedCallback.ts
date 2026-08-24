import { DependencyList, useCallback } from 'react';
import { useLatestValueRef } from './useLatestValueRef';

type Callback = (...args: any[]) => any;

/**
 * Changing a function causes the components it's being passed down into
 * to re-render even though it's the same function, but using different
 * props/arguments.
 *
 * For example, say there's a function
 * `incrementX = useMemo(() => props.x + 1, [props.x])`. Everytime the prop x
 * changes, incrementX will also change even though the function is just
 * incrementing. We use this hook to not re-render in these cases.
 *
 * Do not use this for `renderX` props that are used by a child component to
 * render React components. If you do that, the child component may not
 * rerender even when the render function changes, which could cause stale
 * data to show up.
 *
 * For more information, view this
 * [video](https://drive.google.com/file/d/1wjzoCf3yG7uVWQGQNvqJ7_X-VM3VqmRu/view)
 *
 * Linting: If you ever rename this, make sure to change eslintrc.es6.js to
 * rename the value in `additionalHooks`.
 */
export function useMemoizedCallback<T extends Callback>(
  callback: T,
  inputs: DependencyList
): T {
  const callbackRef = useLatestValueRef<T>(
    useCallback<T>(callback, [callback, ...inputs])
  );

  const memoizedCallback = useCallback(
    (...args: Parameters<T>) => callbackRef.current(...args),
    [callbackRef]
  ) as T;

  // Override the name to have better stacktraces. Based on
  // https://stackoverflow.com/a/33067824/319066
  Object.defineProperty(memoizedCallback, 'name', { value: callback.name });

  return memoizedCallback;
}
