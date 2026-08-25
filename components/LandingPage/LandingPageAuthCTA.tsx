'use client';

import React, { useState } from 'react';
import { Group } from '@mantine/core';
import LoginModal from '../Authentication/LoginModal';
import { LoginFormMode } from '../Authentication/LoginForm';
import Button from '../designSystem/Button/Button';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';

export interface LandingPageAuthCTAProps {
  isLoggedIn: boolean;
}

/** Header Sign in / Sign up controls. Hidden once a session already exists. */
const LandingPageAuthCTA: React.FunctionComponent<LandingPageAuthCTAProps> =
  React.memo(function LandingPageAuthCTA(props: LandingPageAuthCTAProps) {
    const { isLoggedIn } = props;
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [initialMode, setInitialMode] = useState<LoginFormMode>(
      LoginFormMode.signUp
    );

    const handleCloseLoginModal = useMemoizedCallback(() => {
      setIsLoginModalOpen(false);
    }, []);
    const handleOpenSignIn = useMemoizedCallback(() => {
      setInitialMode(LoginFormMode.logIn);
      setIsLoginModalOpen(true);
    }, []);
    const handleOpenSignUp = useMemoizedCallback(() => {
      setInitialMode(LoginFormMode.signUp);
      setIsLoginModalOpen(true);
    }, []);

    if (isLoggedIn) {
      return null;
    }

    return (
      <>
        <Group gap="xs">
          <Button
            keyboardShortcut={null}
            variant="subtle"
            onClick={handleOpenSignIn}
          >
            Sign in
          </Button>
          <Button
            keyboardShortcut={null}
            variant="default"
            onClick={handleOpenSignUp}
          >
            Sign up
          </Button>
        </Group>
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={handleCloseLoginModal}
          initialMode={initialMode}
        />
      </>
    );
  });

export default LandingPageAuthCTA;
