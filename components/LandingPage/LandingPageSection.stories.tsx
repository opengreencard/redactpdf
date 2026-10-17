import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Text } from '@mantine/core';
import LandingPageSection, {
  LandingPageSectionBackgroundVariant,
  LandingPageSectionLayout,
  LandingPageSectionProps,
} from './LandingPageSection';

const defaultProps: LandingPageSectionProps = {
  title: 'How it works',
  description: 'Review the suggestions, adjust them, and download the result.',
  backgroundVariant: LandingPageSectionBackgroundVariant.default,
  layout: LandingPageSectionLayout.stacked,
};

const metadata: Meta = {
  title: 'LandingPageSection',
  component: LandingPageSection,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<LandingPageSectionProps> = (args) => (
  <LandingPageSection {...args}>
    <Text c="gray.7">Section content goes here.</Text>
  </LandingPageSection>
);

export const Default: StoryFn<LandingPageSectionProps> = Template.bind({});

export const Surface: StoryFn<LandingPageSectionProps> = Template.bind({});
Surface.args = {
  backgroundVariant: LandingPageSectionBackgroundVariant.surface,
};

export const Split: StoryFn<LandingPageSectionProps> = Template.bind({});
Split.args = {
  title: 'FAQ',
  description: undefined,
  layout: LandingPageSectionLayout.split,
};
