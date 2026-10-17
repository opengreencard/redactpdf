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
    // content to consume the remaining viewport height. The paper background
    // lives here so every page using the chrome shares it; white surfaces
    // (cards, panels) sit on top.
    return (
      <Stack
        h={fullHeight ? '100vh' : undefined}
        mih="100vh"
        gap={0}
        bg="gray.1"
      >
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
        bg="gray.1"
        pos="sticky"
        top={0}
      >
        {containerSize === 'none' ? (
          <Box px={{ base: 'md', sm: 'lg' }}>
            <Group
              justify="space-between"
              wrap="wrap"
              align="center"
              mih={headerHeight}
              // Keeps wrapped rows off the header edges on narrow phones.
              py="sm"
            >
              <SiteWordmark size="md" />
              <SiteHeaderActions isLoggedIn={isLoggedIn} />
            </Group>
          </Box>
        ) : (
          <Container size={containerSize}>
            <Group
              justify="space-between"
              wrap="wrap"
              align="center"
              mih={headerHeight}
              // Keeps wrapped rows off the header edges on narrow phones.
              py="sm"
            >
              <SiteWordmark size="md" />
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
    const content = <SiteFooterContent />;

    return (
      // One-sided border: see SiteChrome.module.css.
      <Box component="footer" className={classes.footer} pt={28} pb={40}>
        {containerSize === 'none' ? (
          <Box px="lg">{content}</Box>
        ) : (
          <Container size={containerSize}>{content}</Container>
        )}
      </Box>
    );
  }
);

const SiteFooterContent: React.FunctionComponent = React.memo(
  function SiteFooterContent() {
    return (
      <Group justify="space-between" align="center" gap="md">
        <SiteWordmark size="sm" />
        <Group gap={22} fz="xs">
          <Anchor href="/terms-of-use" c="dimmed">
            Terms of Use
          </Anchor>
          <Anchor href="/privacy-policy" c="dimmed">
            Privacy Policy
          </Anchor>
          <Anchor
            href={githubRepoUrl}
            target="_blank"
            rel="noreferrer"
            c="dimmed"
          >
            GitHub
          </Anchor>
        </Group>
      </Group>
    );
  }
);

/**
 * Header bar height from the design. A minimum so the actions can wrap
 * under the wordmark on very narrow phones instead of overflowing.
 */
const headerHeight = 64;

// eslint-disable-next-line no-restricted-syntax
type SiteWordmarkSize = 'sm' | 'md';

interface SiteWordmarkProps {
  /** `md` for the header, `sm` for the footer. */
  size: SiteWordmarkSize;
}

/** Chip and label metrics per wordmark size, from the design. */
const wordmarkSizes: Record<
  SiteWordmarkSize,
  {
    labelFontSize: number;
    chipFontSize: number;
    chipPaddingX: number;
    chipPaddingTop: number;
    chipPaddingBottom: number;
  }
> = {
  md: {
    labelFontSize: 17,
    chipFontSize: 16,
    chipPaddingX: 8,
    chipPaddingTop: 3,
    chipPaddingBottom: 4,
  },
  sm: {
    labelFontSize: 14,
    chipFontSize: 13,
    chipPaddingX: 6,
    chipPaddingTop: 2,
    chipPaddingBottom: 3,
  },
};

/** "redact" in a green chip followed by "pdf.ai" in ink. */
const SiteWordmark: React.FunctionComponent<SiteWordmarkProps> = React.memo(
  function SiteWordmark(props: SiteWordmarkProps) {
    const { size } = props;
    const metrics = wordmarkSizes[size];

    return (
      <Anchor href="/" underline="never" c="gray.9" fw="bold" lts="-0.01em">
        <Group gap={7} wrap="nowrap" align="center">
          <Box
            component="span"
            bg="green.7"
            c="white"
            bdrs="xs"
            px={metrics.chipPaddingX}
            pt={metrics.chipPaddingTop}
            pb={metrics.chipPaddingBottom}
            fz={metrics.chipFontSize}
            lh={1.2}
          >
            redact
          </Box>
          <Text component="span" inherit fz={metrics.labelFontSize}>
            pdf.ai
          </Text>
        </Group>
      </Anchor>
    );
  }
);
