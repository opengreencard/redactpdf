import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import LandingPage, { LandingPageProps } from './LandingPage';

const defaultProps: LandingPageProps = {};

const metadata: Meta = {
  title: 'LandingPage',
  component: LandingPage,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<LandingPageProps> = (args) => <LandingPage {...args} />;

export const Default: StoryFn<LandingPageProps> = Template.bind({});
