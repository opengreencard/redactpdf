import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import LandingPageRedactionFailures from './LandingPageRedactionFailures';

const metadata: Meta = {
  title: 'LandingPageRedactionFailures',
  component: LandingPageRedactionFailures,
};
export default metadata;

const Template: StoryFn = () => <LandingPageRedactionFailures />;

export const Default: StoryFn = Template.bind({});
