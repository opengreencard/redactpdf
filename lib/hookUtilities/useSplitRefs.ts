import { useMemo } from 'react';

/**
 * A hook to allow saving a ref to a React component in multiple places.
 * Example:
 *
 * ```tsx
 * <div
 *   ref={useSplitRefs(someRef, props.someRef)}
 * >
 * ```
 */
export function useSplitRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => assignRefs(...refs), [...refs]);
}

/**
 * Sometimes, we want to store a ref both locally and in parent objects.
 * This lets us do so by passing two refs.
 *
 * @note For function components, use `useSplitRefs`
 *
 * ```tsx
 * interface Props {
 *   innerRef?: React.Ref<InnerComponent>;
 * }
 *
 * class Component extends React.PureComponent<...> {
 *   ref = React.createRef<InnerComponent>();
 *
 *   handleRef = (component: InnerComponent | null) => {
 *     assignRefs(this.ref, this.props.innerRef)(component);
 *   }
 *
 *   render() {
 *     return <InnerComponent ref={this.handleRef} />
 *   }
 * }
 * ```
 */
function assignRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): (component: T | null) => void {
  return (obj: T | null) => {
    for (const ref of refs) {
      if (ref) {
        // Handle ref={(obj) => {}}
        if (typeof ref === 'function') ref(obj);
        // Handle ref={React.createRef()}
        else if ('current' in ref) (ref as any).current = obj;
      }
    }
  };
}
