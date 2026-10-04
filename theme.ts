'use client';

import { createTheme, type CSSVariablesResolver } from '@mantine/core';
import { themeOverrides } from './themeOverrides';

/** Shared Mantine theme for the public RedactPDF.ai application. */
export const theme = createTheme(themeOverrides);

/**
 * Keep secondary text readable on light backgrounds while retaining Mantine's
 * darker default for dark mode.
 */
export const cssVariablesResolver: CSSVariablesResolver =
  (): ReturnType<CSSVariablesResolver> => ({
    variables: {},
    light: {
      '--mantine-color-dimmed': 'var(--mantine-color-gray-7)',
    },
    dark: {},
  });
