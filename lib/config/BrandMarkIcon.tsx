import React from 'react';
import {
  resolveMantineThemeColor,
  resolvePrimaryThemeColor,
} from './mantineTheme';

// ImageResponse (Satori) uses inline `style` objects, so we need resolved hex
// strings here — Mantine props like `bg="green.6"` only work on Mantine
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
  // ~18% inset on each side so the mark does not touch the favicon / tile edge.
  const paddingPx = Math.round(size * 0.18);
  const contentWidth = size - paddingPx * 2;
  // Green square + gap + “P” ≈ 1.32× the square width at this font size.
  const squarePx = Math.round(contentWidth / 1.32);
  const fontPx = Math.round(squarePx * 0.65);
  const gapPx = Math.max(1, Math.round(squarePx * 0.1));

  return { paddingPx, squarePx, fontPx, gapPx };
}

/**
 * Favicon / apple-touch graphic: a green square with “R” and a “P” to the
 * right, a compact version of the redact / pdf.ai wordmark.
 *
 * Transparent PNG background — browsers and iOS supply their own tile/backdrop.
 * Inline styles only — rendered by `next/og` ImageResponse (Satori).
 */
export const BrandMarkIcon: React.FunctionComponent<BrandMarkIconProps> =
  React.memo(function BrandMarkIcon(props: BrandMarkIconProps) {
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
              fontWeight: 700,
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
              color: brandMarkText,
              fontSize: fontPx,
              fontWeight: 700,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            P
          </div>
        </div>
      </div>
    );
  });
