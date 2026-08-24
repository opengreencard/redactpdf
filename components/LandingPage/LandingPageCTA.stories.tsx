import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import LandingPageCTA from './LandingPageCTA';

const metadata: Meta = {
  title: 'LandingPageCTA',
  component: LandingPageCTA,
};
export default metadata;

const Template: StoryFn = () => <LandingPageCTA />;

export const Default: StoryFn = Template.bind({});
