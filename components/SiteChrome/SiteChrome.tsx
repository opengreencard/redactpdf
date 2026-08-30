import React from 'react';
import { Anchor, Box, Container, Group, Stack, Text } from '@mantine/core';
import { githubRepoUrl } from '../../lib/config/brand';
import SiteHeaderActions from './SiteHeaderActions';
import classes from './SiteChrome.module.css';

/** Mantine container size shared by the site header, footer, and marketing sections. */
// eslint-disable-next-line no-restricted-syntax
export type ContainerSize = 'lg' | 'none';

export const siteContainerSize: ContainerSize = 'lg';

export interface SiteChromeProps {
  isLoggedIn: boolean;
  containerSize?: ContainerSize;
  /** Fill the viewport so nested panes can own their scrolling. */
  fullHeight?: boolean;
  /** Hide the footer for full-screen workflows that need all available height. */
  showFooter?: boolean;
  children: React.ReactNode;
}

/**
 * Default site chrome: sticky header with wordmark and auth actions, plus footer
 * links. Route-group layouts choose the container width for their pages.
 */
const SiteChrome: React.FunctionComponent<SiteChromeProps> = React.memo(
  function SiteChrome(props: SiteChromeProps) {
    const {
      isLoggedIn,
      containerSize = siteContainerSize,
      fullHeight = false,
      showFooter = true,
      children,
    } = props;

    // Keep the footer at the bottom of short pages while allowing the main
    // content to consume the remaining viewport height.
    return (
      <Stack h={fullHeight ? '100vh' : undefined} mih="100vh" gap={0}>
        <SiteHeader isLoggedIn={isLoggedIn} containerSize={containerSize} />
        {
          // flex={1} fills the space between header and footer. mih={0} lets
          // nested page regions shrink and manage their own scrolling.
        }
        <Stack component="main" flex={1} mih={0} gap={0}>
          {children}
        </Stack>
        {showFooter ? <SiteFooter containerSize={containerSize} /> : null}
      </Stack>
    );
  }
);

export default SiteChrome;

interface SiteHeaderProps {
  isLoggedIn: boolean;
  containerSize: ContainerSize;
}

const SiteHeader: React.FunctionComponent<SiteHeaderProps> = React.memo(
  function SiteHeader(props: SiteHeaderProps) {
    const { isLoggedIn, containerSize } = props;

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
        {containerSize === 'none' ? (
          <Box px="md">
            <Group justify="space-between" wrap="wrap" align="center">
              <SiteWordmark />
              <SiteHeaderActions isLoggedIn={isLoggedIn} />
            </Group>
          </Box>
        ) : (
          <Container size={containerSize}>
            <Group justify="space-between" wrap="wrap" align="center">
              <SiteWordmark />
              <SiteHeaderActions isLoggedIn={isLoggedIn} />
            </Group>
          </Container>
        )}
      </Box>
    );
  }
);

interface SiteFooterProps {
  containerSize: ContainerSize;
}

const SiteFooter: React.FunctionComponent<SiteFooterProps> = React.memo(
  function SiteFooter(props: SiteFooterProps) {
    const { containerSize } = props;

    return (
      // One-sided border: see SiteChrome.module.css.
      <Box component="footer" className={classes.footer} py="xl">
        {containerSize === 'none' ? (
          <Box px="md">
            <Group justify="center" gap="md">
              <Anchor href="/terms-of-use">Terms of Use</Anchor>
              <Anchor href="/privacy-policy">Privacy Policy</Anchor>
              <Anchor href={githubRepoUrl} target="_blank" rel="noreferrer">
                GitHub
              </Anchor>
            </Group>
          </Box>
        ) : (
          <Container size={containerSize}>
            <Group justify="center" gap="md">
              <Anchor href="/terms-of-use">Terms of Use</Anchor>
              <Anchor href="/privacy-policy">Privacy Policy</Anchor>
              <Anchor href={githubRepoUrl} target="_blank" rel="noreferrer">
                GitHub
              </Anchor>
            </Group>
          </Container>
        )}
      </Box>
    );
  }
);

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
