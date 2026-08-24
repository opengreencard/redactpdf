import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import React from 'react';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import type { Metadata } from 'next';
import { siteName } from '../lib/config/brand';
import { theme } from '../theme';

config.autoAddCss = false;

/** Metadata shared by pages until product-specific pages add their own. */
export const metadata: Metadata = {
  title: siteName,
  description: 'Free, open-source AI-powered PDF redaction.',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </body>
    </html>
  );
}
