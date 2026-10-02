/**
 * Whether this screen is currently focused.
 *
 * On web, this always returns true, which allows us to use the hook without
 * distinguishing between platforms.
 */
export function useScreenFocused(): boolean {
  return true;
}
