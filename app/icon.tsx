import { ImageResponse } from 'next/og';
import { BrandMarkIcon } from '../lib/config/BrandMarkIcon';

// Tab favicon canvas — 32×32 is a common default for generated app icons:
// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons#icon
export const size: { width: number; height: number } = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

/** Tab favicon: green “R” square with “P” beside it. */
// Next.js requires `export default function` for app/icon.tsx.
// eslint-disable-next-line no-restricted-syntax
export default function Icon(): ImageResponse {
  // size=32 → _getBrandMarkLayout yields a ~15px green square (was a hard-coded 20
  // with less padding; the smaller tile leaves more breathing room at the edges).
  return new ImageResponse(<BrandMarkIcon size={size.width} />, size);
}
