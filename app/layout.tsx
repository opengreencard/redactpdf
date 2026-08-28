import '../components/TopLevelLayout/topLevelLayoutStyles';
import React from 'react';
import { ColorSchemeScript } from '@mantine/core';
import type { Metadata } from 'next';
import {
  siteDescription,
  siteName,
  siteTitle,
  siteUrl,
} from '../lib/config/brand';
import { outfit } from '../lib/config/fonts';
import TopLevelLayoutComponents from '../components/TopLevelLayout/TopLevelLayoutComponents';

/**
 * Default metadata for `/` and a title template for inner pages.
 * Title and description put “redact a PDF” / “free” in the first clause,
 * which is what competitors (redactpdf.io, Smallpdf) do. Google ignores
 * `<meta name="keywords">`, so we do not set it.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: siteTitle,
    description: siteDescription,
  },
};

export interface RootLayoutProps {
  children: React.ReactNode;
}

/** Root App Router layout: Mantine and Font Awesome providers globally. */
// Next.js requires `export default function` for app/layout.tsx.
// eslint-disable-next-line no-restricted-syntax
export default async function RootLayout(
  props: RootLayoutProps
): Promise<React.ReactElement> {
  const { children } = props;

  // Mantine's ColorSchemeScript sets data-mantine-color-scheme on <html> in
  // the browser based on the stored color-scheme preference. That client-side
  // attribute can differ from the server-rendered markup during hydration.
  return (
    // Keep any extra theme-related classes in sync with storybook/preview.tsx
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <TopLevelLayoutComponents>{children}</TopLevelLayoutComponents>
      </body>
    </html>
  );
}
