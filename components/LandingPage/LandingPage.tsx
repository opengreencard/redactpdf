import React from 'react';
import { Anchor, Container, Group, Stack, Text, Title } from '@mantine/core';
import LandingPageCTA from './LandingPageCTA';

export interface LandingPageProps {}

/** Minimal landing page that keeps authentication available during scaffolding. */
const LandingPage: React.FunctionComponent<LandingPageProps> = React.memo(
  function LandingPage() {
    return (
      <Container size="sm" py="xl">
        <Stack align="center" gap="md">
          <Title order={1}>RedactPDF.ai</Title>
          <Text ta="center">
            Free, open-source AI-powered PDF redaction is coming soon.
          </Text>
          <LandingPageCTA />
          <Group gap="md">
            <Anchor href="/terms-of-use">Terms of Use</Anchor>
            <Anchor href="/privacy-policy">Privacy Policy</Anchor>
          </Group>
        </Stack>
      </Container>
    );
  }
);

export default LandingPage;
