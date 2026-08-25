'use client';

import React, { useState } from 'react';
import UploadModal from '../Upload/UploadModal';
import Button from '../designSystem/Button/Button';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';

export interface LandingPageUploadCTAProps {
  fullWidth: boolean;
}

/** Opens the shared upload modal from hero, pricing, and other CTAs. */
const LandingPageUploadCTA: React.FunctionComponent<LandingPageUploadCTAProps> =
  React.memo(function LandingPageUploadCTA(props: LandingPageUploadCTAProps) {
    const { fullWidth } = props;
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = useMemoizedCallback(() => {
      setIsOpen(true);
    }, []);
    const handleClose = useMemoizedCallback(() => {
      setIsOpen(false);
    }, []);

    return (
      <>
        <Button
          keyboardShortcut={null}
          onClick={handleOpen}
          fullWidth={fullWidth}
        >
          Upload your PDF
        </Button>
        <UploadModal isOpen={isOpen} onClose={handleClose} />
      </>
    );
  });

export default LandingPageUploadCTA;
