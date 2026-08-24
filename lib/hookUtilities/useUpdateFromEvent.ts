import { useMemoizedCallback } from './useMemoizedCallback';

/**
 * Utility hook that returns a callback to set an input's value from
 * what gets passed from a HTML input's ChangeEvent.
 *
 * @example
 * ```tsx
 * const [name, setName] = useState('');
 * const handleNameChange = useUpdateFromEvent(setName);
 * return <input value={name} onChange={handleNameChange} />;
 * ```
 */
export function useUpdateFromEvent(setValue: (value: string) => unknown) {
  return useMemoizedCallback(
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLSelectElement>
    ) => {
      setValue(event.target.value);
    },
    [setValue]
  );
}
