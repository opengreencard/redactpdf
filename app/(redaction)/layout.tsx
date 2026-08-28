import React from 'react';
import { getAuthState } from '../../lib/auth/nextAuth';
import SiteChrome from '../../components/SiteChrome/SiteChrome';
import { redactionPageContainerSize } from '../../components/Redaction/redactionLayout';

export interface RedactionLayoutProps {
  children: React.ReactNode;
}

/** Site chrome for redaction review pages. */
// Next.js requires `export default function` for route layouts.
// eslint-disable-next-line no-restricted-syntax
export default async function RedactionLayout(
  props: RedactionLayoutProps
): Promise<React.ReactElement> {
  const { children } = props;
  const authState = await getAuthState();

  return (
    <SiteChrome
      isLoggedIn={Boolean(authState?.user)}
      containerSize={redactionPageContainerSize}
    >
      {children}
    </SiteChrome>
  );
}
