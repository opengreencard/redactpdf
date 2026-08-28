import React from 'react';
import { getAuthState } from '../../lib/auth/nextAuth';
import SiteChrome from '../../components/SiteChrome/SiteChrome';

export interface MarketingLayoutProps {
  children: React.ReactNode;
}

/** Site chrome for the landing and legal pages. */
// Next.js requires `export default function` for route layouts.
// eslint-disable-next-line no-restricted-syntax
export default async function MarketingLayout(
  props: MarketingLayoutProps
): Promise<React.ReactElement> {
  const { children } = props;
  const authState = await getAuthState();

  return (
    <SiteChrome isLoggedIn={Boolean(authState?.user)}>{children}</SiteChrome>
  );
}
