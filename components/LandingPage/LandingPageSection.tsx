import React from 'react';
import {
  Box,
  Container,
  Grid,
  GridCol,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { headerHeight, siteContainerSize } from '../SiteChrome/SiteChrome';
import rules from '../designSystem/Rule.module.css';
import { landingSpacing } from './landingLayout';

/**
 * Breathing room between a section's top edge and the sticky header when an
 * in-page link scrolls to it.
 */
const sectionAnchorOffset = 8;

export enum LandingPageSectionBackgroundVariant {
  /** The page's paper background, inherited from SiteChrome. */
  default = 'default',
  /** White, to set a section apart from its paper neighbors. */
  surface = 'surface',
}

export enum LandingPageSectionLayout {
  /** Heading and description above full-width content. */
  stacked = 'stacked',
  /** Heading in a narrow left column, content beside it on wider screens. */
  split = 'split',
}

export interface LandingPageSectionProps {
  title: string;
  /** Optional lede shown under the title. */
  description?: React.ReactNode;
  /** Optional call to action shown under the heading. */
  action?: React.ReactNode;
  backgroundVariant?: LandingPageSectionBackgroundVariant;
  layout?: LandingPageSectionLayout;
  /** Anchor target, e.g. for in-page links to this section. */
  id?: string;
  children?: React.ReactNode;
}

/**
 * One marketing section: left-aligned serif heading, optional lede, and
 * content. Sections alternate paper and white and are separated by a rule
 * line so the page reads as a stack of distinct bands.
 */
const LandingPageSection: React.FunctionComponent<LandingPageSectionProps> =
  React.memo(function LandingPageSection(props: LandingPageSectionProps) {
    const {
      title,
      description,
      action,
      backgroundVariant = LandingPageSectionBackgroundVariant.default,
      layout = LandingPageSectionLayout.stacked,
      id,
      children,
    } = props;

    const heading = (
      <Stack gap="lg" align="flex-start">
        <Stack gap="sm" maw={620}>
          <Title order={2}>{title}</Title>
          {description != null && (
            <Text size="lg" c="gray.7">
              {description}
            </Text>
          )}
        </Stack>
        {action}
      </Stack>
    );

    return (
      <Box
        component="section"
        id={id}
        className={rules.top}
        bg={backgroundColors[backgroundVariant]}
        // Land in-page anchors below the sticky header, with a little air.
        style={{ scrollMarginTop: headerHeight + sectionAnchorOffset }}
      >
        <Container size={siteContainerSize} py={landingSpacing.sectionPaddingY}>
          {layout === LandingPageSectionLayout.split ? (
            <Grid rowGap="lg" columnGap={landingSpacing.splitColumnGap}>
              <GridCol span={{ base: 12, md: 4 }}>{heading}</GridCol>
              <GridCol span={{ base: 12, md: 8 }}>{children}</GridCol>
            </Grid>
          ) : (
            <Stack gap="xl">
              {heading}
              {children}
            </Stack>
          )}
        </Container>
      </Box>
    );
  });

export default LandingPageSection;

const backgroundColors: Record<
  LandingPageSectionBackgroundVariant,
  string | undefined
> = {
  [LandingPageSectionBackgroundVariant.default]: undefined,
  [LandingPageSectionBackgroundVariant.surface]: 'white',
};
