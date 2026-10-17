import type { MantineColorsTuple, MantineThemeOverride } from '@mantine/core';

// The palette tuples are the one place hex colors are defined; everything
// else references them through Mantine color names.
/* eslint-disable no-restricted-syntax */

/**
 * Warm "paper and ink" neutrals. Replacing Mantine's gray scale means
 * borders, dimmed text, and light backgrounds pick these up everywhere
 * without per-component overrides.
 */
const gray: MantineColorsTuple = [
  '#faf9f6',
  '#f6f4ef', // paper: page background
  '#efece4', // paper-2: tags, subtle fills, document canvas
  '#e2ddd2', // rule: card borders, dividers
  '#d3cdbf', // rule-2: input borders
  '#a3a69f',
  '#6b726d', // muted: small meta text
  '#3c4540', // ink-2: secondary body text (light-mode dimmed, see theme.ts)
  '#2a322e',
  '#18201c', // ink: primary text
];

/** Forest green brand color; index 7 is the primary filled shade. */
const green: MantineColorsTuple = [
  '#e5efe8', // green tint
  '#cfe0d5',
  '#a9cbb5',
  '#7fb393',
  '#579b73',
  '#3a8659',
  '#287650',
  '#1d6b47', // green: buttons, links, wordmark chip
  '#185a3c',
  '#134a31', // green dark: emphasis text
];
/* eslint-enable no-restricted-syntax */

/**
 * Surfaces that sit directly against each other. Keep them together so a
 * change to one is checked against the other.
 *
 * `segmentedControlTrack` must stay one step darker than `header`, or the
 * segmented control disappears into the header it sits under.
 */
export const surfaces = {
  /** Page background and site header. */
  header: 'var(--mantine-color-gray-1)',
  /** Track behind every SegmentedControl. */
  segmentedControlTrack: 'var(--mantine-color-gray-2)',
} as const;

/**
 * Mantine theme overrides shared by `theme.ts` and `lib/config/mantineTheme.ts`.
 *
 * Component overrides are plain objects rather than `Anchor.extend(...)`
 * because `lib/config/mantineTheme.ts` also merges this on the server (for
 * favicons), where importing Mantine's client components is unnecessary.
 */
export const themeOverrides: MantineThemeOverride = {
  // Switches, checkboxes, and other interactive inputs use pointer cursor.
  cursorType: 'pointer',
  // next/font registers each family under a hashed name, so reference the
  // CSS variables set on <html> by `lib/config/fonts.ts`.
  fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'var(--font-source-serif-4), "Source Serif 4", Georgia, serif',
    fontWeight: '600',
    sizes: {
      h1: {
        fontSize: 'clamp(2.25rem, 1.6rem + 2.4vw, 3.25rem)',
        lineHeight: '1.08',
      },
      h2: {
        fontSize: 'clamp(1.75rem, 1.5rem + 1vw, 2.125rem)',
        lineHeight: '1.15',
      },
      h3: { fontSize: '1.5rem', lineHeight: '1.25' },
    },
  },
  colors: { gray, green },
  primaryColor: 'green',
  primaryShade: { light: 7, dark: 8 },
  black: gray[9],
  defaultRadius: 'sm',
  radius: {
    xs: '4px',
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '32px',
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
    Anchor: {
      styles: {
        root: { textUnderlineOffset: '3px', textDecorationThickness: '1px' },
      },
    },
    Button: {
      styles: {
        root: { fontWeight: 500 },
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        withBorder: true,
        padding: 'lg',
      },
    },
    SegmentedControl: {
      styles: {
        root: { backgroundColor: surfaces.segmentedControlTrack },
      },
    },
    Modal: {
      styles: {
        // Modal titles use the serif heading face like page titles. Plain
        // object (not `Modal.extend`) so this file stays server-safe.
        title: {
          fontFamily: 'var(--mantine-font-family-headings)',
          fontSize: 'var(--mantine-h3-font-size)',
          fontWeight: 'var(--mantine-h3-font-weight)',
          lineHeight: 'var(--mantine-h3-line-height)',
          letterSpacing: '-0.015em',
        },
      },
    },
    Title: {
      styles: {
        root: { letterSpacing: '-0.015em', textWrap: 'balance' },
      },
    },
  },
};
