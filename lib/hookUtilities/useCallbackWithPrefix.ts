import { useRef } from 'react';
import stableStringify from 'fast-json-stable-stringify';
import { useMemoizedCallback } from './useMemoizedCallback';

/**
 * A hook that can be used to wrap a callback to call the callback with a
 * prefix. This ensures that the returned callback doesn't change across
 * renders, to ensure that it's compatible with PureComponents.
 *
 * @example
 *
 * Here's an example component that uses the hook. If the `Option` children
 * are memoized components, they won't rerender unless the `onClick` handler
 * changes.
 *
 * ```tsx
 * interface Props {
 *   someOtherProp: string;
 *   options: string[];
 *   onClick: (value: string) => unknown;
 * }
 *
 * const Dropdown: React.FunctionComponent<Props> = React.memo(function Dropdown(
 *   props,
 * ) {
 *   const { options, onClick } = props;
 *   const onClickWithPrefix = useCallbackWithPrefix<[string]>(onClick);
 *   return options.map((option) => (
 *     <Option key={option} onClick={onClickWithPrefix(option)} label={option} />
 *   ));
 * });
 * ```
 *
 * @example
 *
 * To prefix only some of the args, put the rest of the args in the second type
 * parameter `RestArgs`. This will return a callback that takes as input the
 * rest of the args.
 *
 * ```tsx
 * interface Props {
 *     onQuestionAnswer: (title: string, question: string, answer: string) => unknown;
 * }
 *
 * const Survey = (props: Props) => {
 *     const onQuestionAnswerWithPrefix = useCallbackWithPrefix<[string, string], [string]>(onQuestionAnswer);
 *     ...
 *     <QuestionSlide onClickAnswer={onContinueClickWithPrefix('Survey Title', 'Question')} />
 * }
 * ```
 *
 * @note Avoid passing the result of the function directly into another
 * component: e.g., never do:
 * ```ts
 * const onClickWithPrefix = useCallbackWithPrefix<[string]>(onClick);
 * return (
 *   <ItemsList onItemClick={onClickWithPrefix} />
 * );
 * ```
 *
 * In the above case, `onItemClick` would have the somewhat convoluted
 * function signature of `(item: XXX) => () => unknown`. Instead, we should
 * use useCallbackWithPrefix within <ItemList /> and just have it take
 * `onItemClick: (item: XXX) => unknown`
 */
export function useCallbackWithPrefix<
  PrefixArgs extends unknown[],
  RestArgs extends unknown[] = [],
  ReturnT = unknown,
>(callback: (...args: [...PrefixArgs, ...RestArgs]) => ReturnT) {
  return useNullableCallbackWithPrefix<PrefixArgs, RestArgs, ReturnT>(
    callback
  )!;
}

/**
 * A nullable version of useCallbackWithPrefix. If passed a `null` callback,
 * will still make sure we call the same number of React hooks so that
 * we don't violate the rules of hooks, but will return `null`
 * so that we can do:
 *
 * ```tsx
 * // In render() function:
 * // onClick is nullable
 * const onClickWithPrefix = useCallbackWithPrefix<[string]>(onClick);
 *
 * return onClickWithPrefix && options.map((option) => (
 *   <Option key={option} onClick={onClickWithPrefix(option)} label={option} />
 * ));
 * ```
 */
export function useNullableCallbackWithPrefix<
  PrefixArgs extends unknown[],
  RestArgs extends unknown[] = [],
  ReturnT = unknown,
>(
  /**
   * If the callback is null, this function will also return null, while
   * taking care to still do the same number of hooks calls (i.e. useRef, etc.)
   */
  callback: ((...args: [...PrefixArgs, ...RestArgs]) => ReturnT) | null
) {
  type OriginalCallback = (...args: [...PrefixArgs, ...RestArgs]) => ReturnT;
  type ReturnedCallback = (...restArgs: [...RestArgs]) => ReturnT;

  interface CachedData {
    /**
     * The `callback` argument that was passed into this hook when
     * all the callbacks in `returnedCallbacks` were created. If it ever
     * changes, the cache of `returnedCallbacks` need to be cleared so none
     * of them call the old callback.
     */
    originalCallback: OriginalCallback | null;
    /**
     * Cached callbacks for every set of prefixes that the component called
     * `getCallbackWithPrefix` with.
     */
    cachedCallbacks: { [stringifiedPrefix: string]: ReturnedCallback };
  }

  const cachedDataRef = useRef<CachedData>({
    originalCallback: callback,
    cachedCallbacks: {},
  });

  const getCallbackWithPrefix = useMemoizedCallback(
    (...prefixArgs: PrefixArgs): ReturnedCallback => {
      // Clear the cached callbacks if the original function they call changed
      if (callback !== cachedDataRef.current.originalCallback) {
        cachedDataRef.current = {
          originalCallback: callback,
          cachedCallbacks: {},
        };
      }

      const functionsInPrefix = new Set<string>();
      const visitNode = (node: unknown) => {
        if (typeof node === 'function') {
          functionsInPrefix.add(node.name);
        }
      };

      const stringifiedPrefix = (stableStringify as any)(
        prefixArgs,
        process.env.NODE_ENV === 'production'
          ? undefined
          : { onVisitNode: visitNode }
      );

      if (functionsInPrefix.size) {
        // eslint-disable-next-line no-console
        console.warn(
          'Caching a callback that is prefixed with an object that contains a function can cause stale data to be rendered. Functions cannot be serialized, and therefore any updates to the function will not trigger an update to the cache.\n' +
            `Functions: ${stableStringify([...functionsInPrefix])}\n` +
            `Prefix: ${stringifiedPrefix}`
        );
      }

      const { originalCallback, cachedCallbacks } = cachedDataRef.current;
      // Return the cached callback if it exists, otherwise create and cache it
      if (originalCallback && !(stringifiedPrefix in cachedCallbacks)) {
        const newCallback = (...restArgs: [...RestArgs]): ReturnT =>
          originalCallback(...prefixArgs, ...restArgs);
        Object.defineProperty(newCallback, 'name', {
          value: `useCallbackWithPrefix(${originalCallback.name})`,
        });
        cachedCallbacks[stringifiedPrefix] = newCallback;
      }

      // Create a new callback that calls the original callback, with prefixed
      // arguments
      return cachedCallbacks[stringifiedPrefix];
    },
    [callback]
  );

  if (!callback) {
    return null;
  } else {
    return getCallbackWithPrefix;
  }
}
