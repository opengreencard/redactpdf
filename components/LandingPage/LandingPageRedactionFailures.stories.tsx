import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import LandingPageRedactionFailures from './LandingPageRedactionFailures';

interface LandingPageRedactionFailuresProps {}

const defaultProps: LandingPageRedactionFailuresProps = {};

const metadata: Meta = {
  title: 'LandingPageRedactionFailures',
  component: LandingPageRedactionFailures,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<LandingPageRedactionFailuresProps> = (args) => (
  <LandingPageRedactionFailures {...args} />
);

export const Default: StoryFn<LandingPageRedactionFailuresProps> =
  Template.bind({});
