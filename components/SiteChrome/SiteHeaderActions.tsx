'use client';

import React, { useState } from 'react';
import { Box, Group } from '@mantine/core';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import LoginModal from '../Authentication/LoginModal';
import { LoginFormMode } from '../Authentication/LoginForm';
import Button, { ButtonProps } from '../designSystem/Button/Button';
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';
import { githubRepoUrl } from '../../lib/config/brand';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { useSetState } from '../../lib/hookUtilities/useSetState';

export interface SiteHeaderActionsProps {
  isLoggedIn: boolean;
}

/**
 * Header actions: GitHub link plus Log in / Sign up when logged out.
 * Kept in one `Group` so fragment children do not become separate flex items
 * and spread across a wrapped mobile header row.
 */
const SiteHeaderActions: React.FunctionComponent<SiteHeaderActionsProps> =
  React.memo(function SiteHeaderActions(props: SiteHeaderActionsProps) {
    const { isLoggedIn } = props;
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [initialMode, setInitialMode] = useState<LoginFormMode>(
      LoginFormMode.signUp
    );

    const handleCloseLoginModal = useSetState(setIsLoginModalOpen, false);
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
              {...viewSourceButtonProps}
              visibleFrom="sm"
              leftSection={{ type: 'icon', icon: faGithub }}
              {...flatHeaderButtonPadding}
            >
              View the source
            </Button>
            {
              // The icon-only mobile control does not need the horizontal
              // padding reserved for a text label.
            }
            <Button {...viewSourceButtonProps} hiddenFrom="sm" p={0}>
              <FontAwesomeIcon icon={faGithub} />
            </Button>
            {!isLoggedIn ? (
              <>
                <Group visibleFrom="sm" gap={4} wrap="nowrap">
                  <Button
                    {...commonButtonProps}
                    variant="subtle"
                    onClick={handleOpenLogIn}
                    {...flatHeaderButtonPadding}
                  >
                    Log in
                  </Button>
                  <Button
                    {...commonButtonProps}
                    variant="default"
                    onClick={handleOpenSignUp}
                  >
                    Sign up
                  </Button>
                </Group>
                {
                  // A single action keeps the authentication controls from
                  // forcing the mobile header onto a second row.
                }
                <Button
                  {...commonButtonProps}
                  hiddenFrom="sm"
                  variant="default"
                  onClick={handleOpenSignUp}
                  px="xs"
                >
                  Log in or sign up
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

export default SiteHeaderActions;

/** Tighter horizontal inset for borderless header buttons. */
const flatHeaderButtonPadding = { px: 'xs' } as const;

/**
 * The design-system Button requires these values to distinguish ordinary
 * buttons from tracked actions and keyboard-shortcut buttons.
 */
const commonButtonProps: Pick<ButtonProps, 'keyboardShortcut'> = {
  keyboardShortcut: null,
};

/**
 * Shared link props for the desktop text button and the compact mobile icon
 * button. They are separate controls because hiding the label alone leaves
 * the desktop button's text spacing around the mobile icon.
 */
const viewSourceButtonProps: Pick<
  ButtonProps,
  | 'component'
  | 'href'
  | 'target'
  | 'rel'
  | 'variant'
  | 'onClick'
  | 'keyboardShortcut'
> & { 'aria-label': string } = {
  ...commonButtonProps,
  component: 'a',
  href: githubRepoUrl,
  target: '_blank',
  rel: 'noreferrer',
  variant: 'subtle',
  onClick: null,
  'aria-label': 'View the source on GitHub',
};
