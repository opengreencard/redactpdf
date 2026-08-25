import React from 'react';
import {
  resolveMantineThemeColor,
  resolvePrimaryThemeColor,
} from './mantineTheme';

// ImageResponse (Satori) uses inline `style` objects, so we need resolved hex
// strings here — Mantine props like `bg="blue.6"` only work on Mantine
// components inside MantineProvider.
const brandMarkBlue = resolvePrimaryThemeColor();
const brandMarkText = resolveMantineThemeColor('gray.9');
const brandMarkOnBlue = resolveMantineThemeColor('white');

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
 * Sizes the blue “r” tile, lowercase “p”, and inset from the canvas edge.
 * Exported for tests.
 */
export function _getBrandMarkLayout(size: number): BrandMarkLayout {
  // ~18% inset on each side so the mark does not touch the favicon / tile edge.
  const paddingPx = Math.round(size * 0.18);
  const contentWidth = size - paddingPx * 2;
  // Blue square + gap + “p” ≈ 1.32× the square width at this font size.
  const squarePx = Math.round(contentWidth / 1.32);
  const fontPx = Math.round(squarePx * 0.65);
  const gapPx = Math.max(1, Math.round(squarePx * 0.1));

  return { paddingPx, squarePx, fontPx, gapPx };
}

/**
 * Favicon / apple-touch graphic: a blue square with “r” and a “p” to the
 * right, a compact version of the redact / pdf.ai wordmark.
 *
 * Transparent PNG background — browsers and iOS supply their own tile/backdrop.
 * Inline styles only — rendered by `next/og` ImageResponse (Satori).
 */
export function BrandMarkIcon(props: BrandMarkIconProps): React.ReactElement {
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
            background: brandMarkBlue,
            color: brandMarkOnBlue,
            fontSize: fontPx,
            fontWeight: 700,
            fontFamily: 'Arial, Helvetica, sans-serif',
            textTransform: 'lowercase',
          }}
        >
          r
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: brandMarkText,
            fontSize: fontPx,
            fontWeight: 700,
            fontFamily: 'Arial, Helvetica, sans-serif',
            textTransform: 'lowercase',
          }}
        >
          p
        </div>
      </div>
    </div>
  );
}
