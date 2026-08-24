/**
 * Parse a string as an integer, returning null if it's not a valid number.
 * Useful often for when we're parsing path or query parameters in an API.
 */
export function parseIntOrNull(
  value: string | undefined | null
): number | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  // Disable warning to use parseIntOrNull instead of parseInt: we are in
  // parseIntOrNull, so need to use it in this one case.
  // eslint-disable-next-line no-restricted-syntax
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}
