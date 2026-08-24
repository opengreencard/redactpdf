'use client';

import React, { useState } from 'react';
import { Container, Stack, Text, Title } from '@mantine/core';
import LoginModal from '../Authentication/LoginModal';
import Button from '../designSystem/Button/Button';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';

export interface LandingPageProps {}

/** Minimal landing page that keeps authentication available during scaffolding. */
const LandingPage: React.FunctionComponent<LandingPageProps> = React.memo(
  function LandingPage() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const handleOpenLoginModal = useMemoizedCallback(() => {
      setIsLoginModalOpen(true);
    }, []);
    const handleCloseLoginModal = useMemoizedCallback(() => {
      setIsLoginModalOpen(false);
    }, []);

    return (
      <>
        <Container size="sm" py="xl">
          <Stack align="center" gap="md">
            <Title order={1}>RedactPDF.ai</Title>
            <Text ta="center">
              Free, open-source AI-powered PDF redaction is coming soon.
            </Text>
            <Button keyboardShortcut={null} onClick={handleOpenLoginModal}>
              Sign up or log in
            </Button>
          </Stack>
        </Container>
        <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseLoginModal} />
      </>
    );
  }
);

export default LandingPage;
