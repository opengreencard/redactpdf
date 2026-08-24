'use client';

import { createTheme } from '@mantine/core';

/** Shared Mantine theme for the public RedactPDF.ai application. */
export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '600',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  components: {
    ActionIcon: {
      defaultProps: {
        size: 'lg',
      },
    },
  },
});
