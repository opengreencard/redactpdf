import React from 'react';
import { getAuthState } from '../../lib/auth/nextAuth';
import LandingPageInner from './LandingPageInner';

export interface LandingPageProps {}

/**
 * Server entry for `/`. Reads the session so the header can hide Log in /
 * Sign up when the visitor is already logged in.
 */
async function LandingPage(): Promise<React.ReactElement> {
  const authState = await getAuthState();

  return <LandingPageInner isLoggedIn={Boolean(authState?.user)} />;
}

export default LandingPage;
