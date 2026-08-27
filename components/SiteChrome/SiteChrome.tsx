import React from 'react';
import { Anchor, Box, Container, Group, Stack, Text } from '@mantine/core';
import { githubRepoUrl } from '../../lib/config/brand';
import SiteHeaderActions from './SiteHeaderActions';
import classes from './SiteChrome.module.css';

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

    // Keep the footer at the bottom of short pages while allowing the main
    // content to consume the remaining viewport height.
    return (
      <Stack mih="100vh" gap={0}>
        <SiteHeader isLoggedIn={isLoggedIn} />
        {
          // flex={1} fills the space between header and footer. mih={0} lets
          // nested page regions shrink and manage their own scrolling.
        }
        <Stack component="main" flex={1} mih={0} gap={0}>
          {children}
        </Stack>
        <SiteFooter />
      </Stack>
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
      // One-sided border and z-index: see SiteChrome.module.css.
      <Box
        component="header"
        className={classes.header}
        bg="white"
        py="sm"
        pos="sticky"
        top={0}
      >
        <Container size={siteContainerSize}>
          <Group justify="space-between" wrap="wrap" align="center">
            <SiteWordmark />
            <SiteHeaderActions isLoggedIn={isLoggedIn} />
          </Group>
        </Container>
      </Box>
    );
  }
);

const SiteFooter: React.FunctionComponent = React.memo(function SiteFooter() {
  return (
    // One-sided border: see SiteChrome.module.css.
    <Box component="footer" className={classes.footer} py="xl">
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
            bg="green.8"
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
