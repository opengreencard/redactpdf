import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import SiteChrome from '../SiteChrome/SiteChrome';
import LandingPageInner from './LandingPageInner';

interface LandingPageInnerStoryProps {
  isLoggedIn: boolean;
}

const defaultProps: LandingPageInnerStoryProps = {
  isLoggedIn: false,
};

const metadata: Meta = {
  title: 'LandingPageInner',
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<LandingPageInnerStoryProps> = (args) => {
  const { isLoggedIn } = args;

  return (
    <SiteChrome isLoggedIn={isLoggedIn}>
      <LandingPageInner />
    </SiteChrome>
  );
};

export const Default: StoryFn<LandingPageInnerStoryProps> = Template.bind({});

export const LoggedIn: StoryFn<LandingPageInnerStoryProps> = Template.bind({});
LoggedIn.args = { isLoggedIn: true };
