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
import { siteContainerSize } from '../SiteChrome/SiteChrome';
import classes from './LandingPageSection.module.css';

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
        className={classes.section}
        bg={backgroundColors[backgroundVariant]}
        // Keep in-page anchors from landing under the sticky header.
        style={{ scrollMarginTop: 72 }}
      >
        <Container size={siteContainerSize} py={{ base: 56, sm: 80 }}>
          {layout === LandingPageSectionLayout.split ? (
            <Grid rowGap={28} columnGap={72}>
              <GridCol span={{ base: 12, md: 4 }}>{heading}</GridCol>
              <GridCol span={{ base: 12, md: 8 }}>{children}</GridCol>
            </Grid>
          ) : (
            <Stack gap={36}>
              {heading}
              {children}
            </Stack>
          )}
        </Container>
      </Box>
    );
  });

const backgroundColors: Record<
  LandingPageSectionBackgroundVariant,
  string | undefined
> = {
  [LandingPageSectionBackgroundVariant.default]: undefined,
  [LandingPageSectionBackgroundVariant.surface]: 'white',
};

export default LandingPageSection;
