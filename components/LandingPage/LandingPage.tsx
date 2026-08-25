import React from 'react';
import LandingPageInner from './LandingPageInner';

export interface LandingPageProps {}

/** Server entry for `/`. Site chrome comes from root layout. */
const LandingPage: React.FunctionComponent<LandingPageProps> = React.memo(
  function LandingPage() {
    return <LandingPageInner />;
  }
);

export default LandingPage;
