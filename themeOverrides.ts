import type { MantineThemeOverride } from '@mantine/core';

/** Mantine theme overrides shared by `theme.ts` and `lib/config/mantineTheme.ts`. */
export const themeOverrides: MantineThemeOverride = {
  primaryColor: 'green',
  // 7 is the default shade, but green is a little lighter than blue (the
  // default primaryColor), so use 8.
  primaryShade: 8,
  headings: {
    fontFamily:
      'var(--font-outfit), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '500',
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
    Card: {
      defaultProps: {
        shadow: 'none',
        withBorder: true,
        radius: 'md',
        padding: 'lg',
      },
    },
  },
};
