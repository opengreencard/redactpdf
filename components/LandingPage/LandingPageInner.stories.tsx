import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import LandingPageInner, { LandingPageInnerProps } from './LandingPageInner';

const defaultProps: LandingPageInnerProps = {
  isLoggedIn: false,
};

const metadata: Meta = {
  title: 'LandingPageInner',
  component: LandingPageInner,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<LandingPageInnerProps> = (args) => (
  <LandingPageInner {...args} />
);

export const Default: StoryFn<LandingPageInnerProps> = Template.bind({});

export const LoggedIn: StoryFn<LandingPageInnerProps> = Template.bind({});
LoggedIn.args = { isLoggedIn: true };
