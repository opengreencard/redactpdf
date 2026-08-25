import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import SiteChrome from '../SiteChrome/SiteChrome';
import PrivacyPolicyPage from './PrivacyPolicyPage';

const metadata: Meta = {
  title: 'PrivacyPolicyPage',
  component: PrivacyPolicyPage,
};
export default metadata;

const Template: StoryFn = () => (
  <SiteChrome isLoggedIn={false}>
    <PrivacyPolicyPage />
  </SiteChrome>
);

export const Default: StoryFn = Template.bind({});
