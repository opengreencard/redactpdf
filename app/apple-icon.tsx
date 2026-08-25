import { ImageResponse } from 'next/og';
import { BrandMarkIcon } from '../lib/config/brandMarkIcon';

// Home-screen tile — Apple documents 180×180 for apple-touch-icon:
// https://developer.apple.com/design/human-interface-guidelines/app-icons
export const size: { width: number; height: number } = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

/** Home-screen icon: the same r+p mark on a transparent tile. */
export default function AppleIcon(): ImageResponse {
  return new ImageResponse(<BrandMarkIcon size={size.width} />, size);
}
