import { Inter, Source_Serif_4 } from 'next/font/google';

// next/font registers each family under a hashed name (e.g.
// `__Inter_d8ebd1`), so the theme must reference these CSS variables rather
// than the literal family names, or the browser falls back to system fonts.

/** UI and body copy — forms, labels, buttons, paragraphs. */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

/** Headings — hero titles, section headings. */
export const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  variable: '--font-source-serif-4',
});

/**
 * Apply to `<html>` to define the font CSS variables that `themeOverrides.ts`
 * selects. They must be on the root element because Mantine declares
 * `--mantine-font-family` on `:root`, where `var(--font-inter)` is resolved.
 */
export const fontClassNames = [inter.variable, sourceSerif4.variable].join(' ');
