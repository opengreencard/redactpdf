'use client';

import React, { useState } from 'react';
import LoginModal from '../Authentication/LoginModal';
import Button from '../designSystem/Button/Button';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';

/** Owns the interactive authentication CTA while the landing page stays an RSC. */
const LandingPageCTA: React.FunctionComponent = React.memo(
  function LandingPageCTA() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const handleOpenLoginModal = useMemoizedCallback(() => {
      setIsLoginModalOpen(true);
    }, []);
    const handleCloseLoginModal = useMemoizedCallback(() => {
      setIsLoginModalOpen(false);
    }, []);

    return (
      <>
        <Button keyboardShortcut={null} onClick={handleOpenLoginModal}>
          Sign up or log in
        </Button>
        <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseLoginModal} />
      </>
    );
  }
);

export default LandingPageCTA;
