import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import PrivacyPolicyPage from './PrivacyPolicyPage';

const metadata: Meta = {
  title: 'PrivacyPolicyPage',
  component: PrivacyPolicyPage,
};
export default metadata;

const Template: StoryFn = () => <PrivacyPolicyPage />;

export const Default: StoryFn = Template.bind({});
