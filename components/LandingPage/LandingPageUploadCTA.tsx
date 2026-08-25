'use client';

import React from 'react';
import Button from '../designSystem/Button/Button';
import { useLandingPageUploadModalState } from './LandingPageUploadModalProvider';

export interface LandingPageUploadCTAProps {
  fullWidth: boolean;
}

/** Opens the shared upload modal from hero, pricing, and other CTAs. */
const LandingPageUploadCTA: React.FunctionComponent<LandingPageUploadCTAProps> =
  React.memo(function LandingPageUploadCTA(props: LandingPageUploadCTAProps) {
    const { fullWidth } = props;
    const { openUploadModal } = useLandingPageUploadModalState();

    return (
      <Button
        keyboardShortcut={null}
        onClick={openUploadModal}
        fullWidth={fullWidth}
      >
        Upload your PDF
      </Button>
    );
  });

export default LandingPageUploadCTA;
