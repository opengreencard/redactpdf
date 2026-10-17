import React from 'react';
import {
  resolveMantineThemeColor,
  resolvePrimaryThemeColor,
} from './mantineTheme';

// ImageResponse (Satori) uses inline `style` objects, so we need resolved hex
// strings here — Mantine props like `bg="green.7"` only work on Mantine
// components inside MantineProvider.
const brandMarkFill = resolvePrimaryThemeColor();
const brandMarkText = resolveMantineThemeColor('gray.9');
const brandMarkOnFill = resolveMantineThemeColor('white');

export interface BrandMarkIconProps {
  /**
   * Canvas edge length in px. Must match the `ImageResponse` width and height
   * passed from `app/icon.tsx` or `app/apple-icon.tsx`.
   */
  size: number;
}

interface BrandMarkLayout {
  paddingPx: number;
  squarePx: number;
  fontPx: number;
  gapPx: number;
}

/**
 * Sizes the green “R” tile, “P”, and inset from the canvas edge.
 * Exported for tests.
 */
export function _getBrandMarkLayout(size: number): BrandMarkLayout {
  // ~9% inset leaves about 3px around the 32px favicon while preserving a
  // balanced amount of breathing room on the 180px home-screen icon.
  const paddingPx = Math.round(size * 0.09);
  const contentWidth = size - paddingPx * 2;
  // Keep the tile and “P” inside the canvas after accounting for the font.
  const squarePx = Math.round(contentWidth / 1.5);
  const fontPx = Math.round(squarePx * 0.78);
  // Keep a visible gap at 32px; the proportional value already gives enough
  // space at the larger apple-touch icon size.
  const gapPx = Math.max(2, Math.round(squarePx * 0.1));

  return { paddingPx, squarePx, fontPx, gapPx };
}

/**
 * Favicon / apple-touch graphic: a green square with “R” and a “P” to the
 * right, a compact version of the redact / pdf.ai wordmark.
 *
 * Transparent PNG background — browsers and iOS supply their own tile/backdrop.
 * Inline styles only — rendered by `next/og` ImageResponse (Satori).
 * The adaptive SVG favicon in `app/icon1.svg` mirrors this layout.
 */
// Satori does not render this component when it is wrapped in React.memo,
// which would make the generated favicon fully transparent.
export const BrandMarkIcon: React.FunctionComponent<BrandMarkIconProps> =
  // eslint-disable-next-line no-restricted-syntax -- Satori needs this plain function
  function BrandMarkIcon(props: BrandMarkIconProps) {
    const { size } = props;
    const { paddingPx, squarePx, fontPx, gapPx } = _getBrandMarkLayout(size);

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          padding: paddingPx,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: gapPx,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: squarePx,
              height: squarePx,
              borderRadius: Math.round(squarePx * 0.2),
              background: brandMarkFill,
              color: brandMarkOnFill,
              fontSize: fontPx,
              fontWeight: 800,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            R
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: Math.round(fontPx * 0.75),
              height: squarePx,
              color: brandMarkText,
              fontSize: fontPx,
              fontWeight: 800,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            P
          </div>
        </div>
      </div>
    );
  };
