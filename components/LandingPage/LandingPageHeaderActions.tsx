'use client';

import React, { useState } from 'react';
import { Box, Group } from '@mantine/core';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import LoginModal from '../Authentication/LoginModal';
import { LoginFormMode } from '../Authentication/LoginForm';
import Button from '../designSystem/Button/Button';
import { githubRepoUrl } from '../../lib/config/brand';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';

export interface LandingPageHeaderActionsProps {
  isLoggedIn: boolean;
}

/**
 * Tighter horizontal inset on borderless header buttons;
 * height stays default for larger tap targets.
 *
 * Useful so all buttons fit on an iPhone SE screen.
 */
const flatHeaderButtonPadding = { px: 'xs' } as const;

/**
 * Header actions: GitHub link plus Log in / Sign up when logged out.
 * Kept in one `Group` so fragment children do not become separate flex items
 * and spread across a wrapped mobile header row.
 */
const LandingPageHeaderActions: React.FunctionComponent<LandingPageHeaderActionsProps> =
  React.memo(function LandingPageHeaderActions(
    props: LandingPageHeaderActionsProps
  ) {
    const { isLoggedIn } = props;
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [initialMode, setInitialMode] = useState<LoginFormMode>(
      LoginFormMode.signUp
    );

    const handleCloseLoginModal = useMemoizedCallback(() => {
      setIsLoginModalOpen(false);
    }, []);
    const handleOpenLogIn = useMemoizedCallback(() => {
      setInitialMode(LoginFormMode.logIn);
      setIsLoginModalOpen(true);
    }, []);
    const handleOpenSignUp = useMemoizedCallback(() => {
      setInitialMode(LoginFormMode.signUp);
      setIsLoginModalOpen(true);
    }, []);

    return (
      <>
        <Box ml="auto">
          <Group gap={4} wrap="nowrap">
            <Button
              component="a"
              href={githubRepoUrl}
              target="_blank"
              rel="noreferrer"
              variant="subtle"
              keyboardShortcut={null}
              onClick={null}
              leftSection={{ type: 'icon', icon: faGithub }}
              aria-label="View the source on GitHub"
              {...flatHeaderButtonPadding}
            >
              <Box visibleFrom="sm">View the source</Box>
            </Button>
            {!isLoggedIn ? (
              <>
                <Button
                  keyboardShortcut={null}
                  variant="subtle"
                  onClick={handleOpenLogIn}
                  {...flatHeaderButtonPadding}
                >
                  Log in
                </Button>
                <Button
                  keyboardShortcut={null}
                  variant="default"
                  onClick={handleOpenSignUp}
                >
                  Sign up
                </Button>
              </>
            ) : null}
          </Group>
        </Box>
        {!isLoggedIn ? (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={handleCloseLoginModal}
            initialMode={initialMode}
          />
        ) : null}
      </>
    );
  });

export default LandingPageHeaderActions;
