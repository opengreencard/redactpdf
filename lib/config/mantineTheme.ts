// This file is the allowed DEFAULT_THEME merge; callers use resolveMantineThemeColor().
// eslint-disable-next-line no-restricted-imports
import { DEFAULT_THEME, mergeMantineTheme } from '@mantine/core';
import { themeOverrides } from '../../themeOverrides';

/**
 * Full resolved Mantine theme — the same merge `MantineProvider` applies to
 * `themeOverrides` from `theme.ts`.
 */
export const mantineTheme = mergeMantineTheme(DEFAULT_THEME, themeOverrides);

type MantineNamedColorRef = `${string}.${number}`;

/**
 * Resolves a Mantine palette ref (e.g. `blue.6`, `gray.9`) to a hex string.
 * Use for non-Mantine renderers (OG images, canvas, PDF) that cannot use
 * Mantine component props like `c="blue.6"`.
 */
export function resolveMantineThemeColor(
  color: MantineNamedColorRef | 'white' | 'black'
): string {
  if (color === 'white') {
    return mantineTheme.white;
  }

  if (color === 'black') {
    return mantineTheme.black;
  }

  const [colorName, shadePart] = color.split('.');
  const shade = Number(shadePart);
  const palette = mantineTheme.colors[colorName];

  if (!palette || Number.isNaN(shade)) {
    throw new Error(`Unknown Mantine color ref: ${color}`);
  }

  return palette[shade];
}

/** Primary brand color at the theme's configured primary shade. */
export function resolvePrimaryThemeColor(
  colorScheme: 'light' | 'dark' = 'light'
): string {
  const { primaryColor, primaryShade, colors } = mantineTheme;
  const shade =
    typeof primaryShade === 'number' ? primaryShade : primaryShade[colorScheme];

  return colors[primaryColor][shade];
}
