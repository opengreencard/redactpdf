import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import React from 'react';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import type { Metadata } from 'next';
import {
  siteDescription,
  siteName,
  siteTitle,
  siteUrl,
} from '../lib/config/brand';
import { outfit } from '../lib/config/fonts';
import { theme } from '../theme';

config.autoAddCss = false;

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

/** Root App Router layout that provides Mantine and Font Awesome globally. */
export default function RootLayout(props: RootLayoutProps): React.ReactElement {
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
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </body>
    </html>
  );
}
