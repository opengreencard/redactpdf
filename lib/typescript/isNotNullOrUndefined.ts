/**
 * Quick shortcut to filter an array that could be nullable to only the
 * non-nullable types.
 *
 * Use with `array.filter(isNotNullOrUndefined)`
 */
export function isNotNullOrUndefined<T>(
  value: T | null | undefined
): value is T {
  return value !== null && value !== undefined;
}
