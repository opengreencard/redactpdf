import { ImageResponse } from 'next/og';
import { BrandMarkIcon } from '../lib/config/BrandMarkIcon';

// PNG fallback for the adaptive SVG favicon in app/icon1.svg. A 128×128 source
// gives browsers more pixels to downsample for sharp small-size rendering:
// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons#icon
export const size: { width: number; height: number } = {
  width: 128,
  height: 128,
};

export const contentType = 'image/png';

/** PNG fallback: green “R” square with “P” beside it. */
// Next.js requires `export default function` for app/icon.tsx.
// eslint-disable-next-line no-restricted-syntax
export default function Icon(): ImageResponse {
  // size=128 → _getBrandMarkLayout yields a high-resolution source that
  // remains clear when the browser displays it at favicon size.
  return new ImageResponse(<BrandMarkIcon size={size.width} />, size);
}
