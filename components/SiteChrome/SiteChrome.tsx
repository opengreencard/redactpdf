import React from 'react';
import { Anchor, Box, Container, Group, Text } from '@mantine/core';
import LandingPageHeaderActions from '../LandingPage/LandingPageHeaderActions';
import { githubRepoUrl } from '../../lib/config/brand';

/** Mantine container size shared by the site header, footer, and marketing sections. */
export const siteContainerSize = 'lg';

export interface SiteChromeProps {
  isLoggedIn: boolean;
  children: React.ReactNode;
}

/**
 * Default site chrome: sticky header with wordmark and auth actions, plus footer
 * links. Wrapped around all pages in root layout.
 */
const SiteChrome: React.FunctionComponent<SiteChromeProps> = React.memo(
  function SiteChrome(props: SiteChromeProps) {
    const { isLoggedIn, children } = props;

    return (
      <Box>
        <SiteHeader isLoggedIn={isLoggedIn} />
        {children}
        <SiteFooter />
      </Box>
    );
  }
);

export default SiteChrome;

interface SiteHeaderProps {
  isLoggedIn: boolean;
}

const SiteHeader: React.FunctionComponent<SiteHeaderProps> = React.memo(
  function SiteHeader(props: SiteHeaderProps) {
    const { isLoggedIn } = props;

    return (
      <Box
        component="header"
        bg="white"
        py="sm"
        pos="sticky"
        top={0}
        style={{ zIndex: 100 }}
        bd="0 0 1px var(--mantine-color-gray-3)"
      >
        <Container size={siteContainerSize}>
          <Group justify="space-between" wrap="wrap" align="center">
            <SiteWordmark />
            <LandingPageHeaderActions isLoggedIn={isLoggedIn} />
          </Group>
        </Container>
      </Box>
    );
  }
);

const SiteFooter: React.FunctionComponent = React.memo(function SiteFooter() {
  return (
    <Box component="footer" py="xl" bd="1px 0 0 var(--mantine-color-gray-3)">
      <Container size={siteContainerSize}>
        <Group justify="center" gap="md">
          <Anchor href="/terms-of-use">Terms of Use</Anchor>
          <Anchor href="/privacy-policy">Privacy Policy</Anchor>
          <Anchor href={githubRepoUrl} target="_blank" rel="noreferrer">
            GitHub
          </Anchor>
        </Group>
      </Container>
    </Box>
  );
});

const SiteWordmark: React.FunctionComponent = React.memo(
  function SiteWordmark() {
    return (
      <Anchor href="/" underline="never" c="inherit">
        <Group gap="xs" wrap="nowrap">
          <Box
            bg="blue.6"
            c="white"
            px="sm"
            py="xs"
            bdrs="sm"
            fw="bold"
            lh={1.4}
          >
            redact
          </Box>
          <Text fw="bold" size="lg">
            pdf.ai
          </Text>
        </Group>
      </Anchor>
    );
  }
);
